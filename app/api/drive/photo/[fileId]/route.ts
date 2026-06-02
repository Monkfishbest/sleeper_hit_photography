import { google } from 'googleapis'
import type { NextRequest } from 'next/server'
import { Readable } from 'node:stream'

function getDriveClient() {
  const clientEmail =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? process.env.GOOGLE_DRIVE_CLIENT_EMAIL
  const privateKey =
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') ??
    process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    return null
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

const drivePhotoTimeoutMs = 10000

function getDriveErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown Google Drive error'
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> },
) {
  const drive = getDriveClient()

  if (!drive) {
    return new Response('Google Drive is not configured.', { status: 503 })
  }

  const { fileId } = await context.params
  const mimeType = request.nextUrl.searchParams.get('mimeType') || 'application/octet-stream'

  try {
    const response = await drive.files.get(
      {
        alt: 'media',
        fileId,
        supportsAllDrives: true,
      },
      {
        responseType: 'stream',
        timeout: drivePhotoTimeoutMs,
      },
    )

    return new Response(Readable.toWeb(response.data as Readable) as ReadableStream, {
      headers: {
        'Cache-Control': 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=2592000',
        'Content-Type': mimeType,
      },
    })
  } catch (error) {
    console.warn(
      `[Sleeper Hit Photography] Google Drive photo failed for ${fileId}: ${getDriveErrorMessage(error)}`,
    )

    return new Response('Unable to load photo from Google Drive.', { status: 404 })
  }
}
