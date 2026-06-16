import { google } from 'googleapis'
import {
    DeleteObjectsCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3'

const FOLDER_MAPPING = {
    events: "1m13viGXlQ488nZT1NXD0_jJBIZo_rMf5",
    landscapes: "1PF4r98RDKcQu8hwZYr7-XiMc3bEKJTMs",
    street: "18UpLqTaCGD9BQbYX8cqZeU1aTFqJ_JyE",
    portraits: "162NlwBD3DKcvstEyfqoKTfqUFXY3QJ5f",
}

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'sleeper-hit-photography-images'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'
const DELETE_BATCH_SIZE = 1000

const s3Client = new S3Client({
    region: AWS_REGION,
    requestStreamBufferSize: 65_536,
})

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
    const files = []
    let pageToken

    try {
        do {
            const response = await drive.files.list({
                q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
                fields: 'nextPageToken, files(id,name,mimeType,size,description,createdTime,imageMediaMetadata(width,height))',
                pageSize: 1000,
                pageToken,
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
            })

            files.push(...(response.data.files || []))
            pageToken = response.data.nextPageToken || undefined
        } while (pageToken)

        return files
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
            { responseType: 'stream' }
        )

        return response.data
    } catch (error) {
        console.error(`Error downloading file ${fileId}:`, {
            message: error.message,
            mimeType,
        })
        throw error
    }
}

function resolveContentLength(fileBody, explicitContentLength) {
    if (explicitContentLength !== undefined && explicitContentLength !== null && explicitContentLength !== '') {
        const parsedLength = Number(explicitContentLength)

        if (Number.isFinite(parsedLength) && parsedLength >= 0) {
            return parsedLength
        }
    }

    if (Buffer.isBuffer(fileBody)) {
        return fileBody.length
    }

    if (typeof fileBody === 'string') {
        return Buffer.byteLength(fileBody)
    }

    return undefined
}

async function uploadFileToS3(
    fileBody,
    s3Key,
    mimeType,
    cacheControl = 'public, max-age=31536000, immutable',
    contentLength,
) {
    try {
        const resolvedContentLength = resolveContentLength(fileBody, contentLength)

        console.log(`Preparing S3 upload`, {
            bucket: S3_BUCKET_NAME,
            key: s3Key,
            mimeType,
            bodyExists: Boolean(fileBody),
            bodyType: fileBody?.constructor?.name,
            providedContentLength: contentLength,
            resolvedContentLength,
        })

        const putObjectParams = {
            Bucket: S3_BUCKET_NAME,
            Key: s3Key,
            Body: fileBody,
            ContentType: mimeType,
            CacheControl: cacheControl,
        }

        if (resolvedContentLength !== undefined) {
            putObjectParams.ContentLength = resolvedContentLength
        }

        const command = new PutObjectCommand(putObjectParams)

        await s3Client.send(command)
        console.log(`Uploaded ${s3Key} to S3`)
        return true
    } catch (error) {
        console.error(`Error uploading ${s3Key} to S3:`, {
            message: error.message,
            bucket: S3_BUCKET_NAME,
            mimeType,
            bodyExists: Boolean(fileBody),
            bodyType: fileBody?.constructor?.name,
            providedContentLength: contentLength,
            resolvedContentLength: resolveContentLength(fileBody, contentLength),
        })

        return false
    }
}

async function listS3Keys(prefix) {
    const keys = []
    let continuationToken

    do {
        const response = await s3Client.send(new ListObjectsV2Command({
            Bucket: S3_BUCKET_NAME,
            Prefix: prefix,
            ContinuationToken: continuationToken,
        }))

        keys.push(...(response.Contents || []).map((item) => item.Key).filter(Boolean))
        continuationToken = response.NextContinuationToken
    } while (continuationToken)

    return keys
}

async function deleteS3Keys(keys) {
    if (keys.length === 0) {
        return 0
    }

    let deletedCount = 0

    for (let index = 0; index < keys.length; index += DELETE_BATCH_SIZE) {
        const batch = keys.slice(index, index + DELETE_BATCH_SIZE)
        const response = await s3Client.send(new DeleteObjectsCommand({
            Bucket: S3_BUCKET_NAME,
            Delete: {
                Objects: batch.map((Key) => ({ Key })),
                Quiet: false,
            },
        }))

        deletedCount += response.Deleted?.length || 0

        if (response.Errors?.length) {
            throw new Error(`Failed to delete ${response.Errors.length} S3 objects`)
        }
    }

    return deletedCount
}

async function removeDeletedFilesFromS3(sectionId, expectedKeys) {
    const prefix = `${sectionId}/`
    const currentKeys = await listS3Keys(prefix)
    const expectedKeySet = new Set(expectedKeys)
    const keysToDelete = currentKeys.filter((key) => !expectedKeySet.has(key))

    const deletedCount = await deleteS3Keys(keysToDelete)

    if (deletedCount > 0) {
        console.log(`Deleted ${deletedCount} removed files from S3 for ${sectionId}`)
    }

    return deletedCount
}

async function syncFolderToS3(sectionId, folderId) {
    console.log(`Starting sync for ${sectionId} from folder ${folderId}`)

    const files = await listDriveFiles(folderId)
    console.log(`Found ${files.length} images in ${sectionId}`)

    let successCount = 0
    let failCount = 0
    let deletedCount = 0
    const photoMetadata = []

    for (const file of files) {
        try {
            const s3Key = `${sectionId}/${file.id}-${file.name}`

            console.log(`Starting file sync`, {
                sectionId,
                fileId: file.id,
                name: file.name,
                mimeType: file.mimeType,
                driveSize: file.size,
                s3Key,
            })

            const fileStream = await downloadFileFromDrive(file.id, file.mimeType)

            const uploadSuccess = await uploadFileToS3(
                fileStream,
                s3Key,
                file.mimeType,
                undefined,
                file.size,
            )

            if (uploadSuccess) {
                successCount++

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
            console.error(`Failed to sync file ${file.id}:`, {
                message: error.message,
                sectionId,
                fileId: file.id,
                name: file.name,
                mimeType: file.mimeType,
                driveSize: file.size,
            })

            failCount++
        }
    }

    const manifestKey = `${sectionId}/manifest.json`
    const manifestData = JSON.stringify(photoMetadata, null, 2)
    const manifestBuffer = Buffer.from(manifestData)

    const manifestUploaded = await uploadFileToS3(
        manifestBuffer,
        manifestKey,
        'application/json',
        'public, max-age=300, stale-while-revalidate=300',
        manifestBuffer.length,
    )

    if (!manifestUploaded) {
        throw new Error(`Failed to upload manifest for ${sectionId}`)
    }

    deletedCount = await removeDeletedFilesFromS3(
        sectionId,
        new Set([...photoMetadata.map((photo) => photo.s3Key), manifestKey]),
    )

    console.log(`${sectionId} sync complete: ${successCount} succeeded, ${failCount} failed, ${deletedCount} deleted`)

    return {
        sectionId,
        successCount,
        failCount,
        deletedCount,
        totalPhotos: photoMetadata.length,
    }
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