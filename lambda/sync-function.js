import { google } from 'googleapis'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
const FOLDER_MAPPING = {
    events: "1m13viGXlQ488nZT1NXD0_jJBIZo_rMf5",
    landscapes: "1PF4r98RDKcQu8hwZYr7-XiMc3bEKJTMs",
    street: "18UpLqTaCGD9BQbYX8cqZeU1aTFqJ_JyE",
    portraits: "162NlwBD3DKcvstEyfqoKTfqUFXY3QJ5",
}

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'sleeper-hit-photography-images'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'

const s3Client = new S3Client({ region: AWS_REGION })

function getDriveClient() {
    const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (!clientEmail || !privateKey) {
        throw new Error('Missing Google Drive credentials in environment variables')
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    })

    return google.drive({ version: 'v3', auth })
}

async function listDriveFiles(folderId) {
    const drive = getDriveClient()

    try {
        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
            fields: 'files(id,name,mimeType,description,createdTime,imageMediaMetadata(width,height))',
            pageSize: 1000,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        })

        return response.data.files || []
    } catch (error) {
        console.error(`Error listing files from folder ${folderId}:`, error.message)
        return []
    }
}

async function downloadFileFromDrive(fileId, mimeType) {
    const drive = getDriveClient()

    try {
        const response = await drive.files.get(
            {
                fileId,
                alt: 'media',
                supportsAllDrives: true,
            },
            { responseType: 'arraybuffer' }
        )

        return response.data
    } catch (error) {
        console.error(`Error downloading file ${fileId}:`, error.message)
        throw error
    }
}

async function uploadFileToS3(fileBuffer, s3Key, mimeType) {
    try {
        const command = new PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: s3Key,
            Body: fileBuffer,
            ContentType: mimeType,
            CacheControl: 'public, max-age=31536000, immutable', // 1 year cache
        })

        await s3Client.send(command)
        console.log(`Uploaded ${s3Key} to S3`)
        return true
    } catch (error) {
        console.error(`Error uploading to S3:`, error.message)
        return false
    }
}

async function syncFolderToS3(sectionId, folderId) {
    console.log(`Starting sync for ${sectionId} from folder ${folderId}`)

    const files = await listDriveFiles(folderId)
    console.log(`Found ${files.length} images in ${sectionId}`)

    let successCount = 0
    let failCount = 0
    const photoMetadata = []

    for (const file of files) {
        try {
            const fileBuffer = await downloadFileFromDrive(file.id, file.mimeType)
            const s3Key = `${sectionId}/${file.id}-${file.name}`

            const uploadSuccess = await uploadFileToS3(fileBuffer, s3Key, file.mimeType)

            if (uploadSuccess) {
                successCount++
                // Store metadata for manifest
                photoMetadata.push({
                    alt: file.name,
                    caption: file.name.replace(/\.[^.]+$/, ''),
                    description: file.description?.trim() || 'No description available.',
                    height: file.imageMediaMetadata?.height || 1200,
                    width: file.imageMediaMetadata?.width || 1600,
                    id: file.id,
                    s3Key: s3Key,
                    createdTime: file.createdTime,
                })
            } else {
                failCount++
            }
        } catch (error) {
            console.error(`Failed to sync file ${file.id}:`, error.message)
            failCount++
        }
    }

    // Upload metadata manifest for this section
    if (photoMetadata.length > 0) {
        const manifestKey = `${sectionId}/manifest.json`
        const manifestData = JSON.stringify(photoMetadata, null, 2)
        await uploadFileToS3(Buffer.from(manifestData), manifestKey, 'application/json')
    }

    console.log(`${sectionId} sync complete: ${successCount} succeeded, ${failCount} failed`)
    return { sectionId, successCount, failCount, totalPhotos: photoMetadata.length }
}

export const handler = async (event) => {
    console.log('Starting Google Drive to S3 sync')

    const results = []

    for (const [sectionId, folderId] of Object.entries(FOLDER_MAPPING)) {
        if (!folderId) {
            console.warn(`Skipping ${sectionId}: no folder ID configured`)
            continue
        }

        try {
            const result = await syncFolderToS3(sectionId, folderId)
            results.push(result)
        } catch (error) {
            console.error(`Error syncing ${sectionId}:`, error.message)
            results.push({
                sectionId,
                error: error.message,
            })
        }
    }

    console.log('Sync completed', JSON.stringify(results))

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Sync completed',
            results,
        }),
    }
}
