import { google } from 'googleapis'
import { unstable_cache } from 'next/cache'
import { type GalleryPhoto, type GallerySection, getGallerySection, type GallerySectionId } from './SleeperHitPhotographyData'

type DriveFile = {
  createdTime?: string | null
  description?: string | null
  id?: string | null
  imageMediaMetadata?: {
    height?: number | null
    width?: number | null
  } | null
  mimeType?: string | null
  name?: string | null
}

export type LoadedGallerySection = {
  photos: GalleryPhoto[]
  section: GallerySection
  source: 'drive' | 'fallback'
}

const driveTimeoutMs = 10000
const drivePhotoListCacheSeconds = 300

function getDriveErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown Google Drive error'
}

const sectionDriveFolderIds: Record<GallerySection['id'], string> = {
  events: '1m13viGXlQ488nZT1NXD0_jJBIZo_rMf5',
  landscapes: '1PF4r98RDKcQu8hwZYr7-XiMc3bEKJTMs',
  portraits: '162NlwBD3DKcvstEyfqoKTfqUFXY3QJ5f',
  street: '18UpLqTaCGD9BQbYX8cqZeU1aTFqJ_JyE',
}

function getDriveCredentials() {
  const clientEmail =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? process.env.GOOGLE_DRIVE_CLIENT_EMAIL
  const privateKey =
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') ??
    process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    return null
  }

  return { clientEmail, privateKey }
}

function getDriveFolderId(section: GallerySection) {
  return (
    process.env[section.folderEnvVar] ??
    sectionDriveFolderIds[section.id] ??
    process.env.GOOGLE_DRIVE_FOLDER_ID
  )
}

async function getDriveClient() {
  const credentials = getDriveCredentials()

  if (!credentials) {
    return null
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.clientEmail,
      private_key: credentials.privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })

  return google.drive({ version: 'v3', auth })
}

function toDrivePhoto(file: DriveFile): GalleryPhoto | null {
  if (!file.id || !file.name || !file.mimeType?.startsWith('image/')) {
    return null
  }

  const encodedMimeType = encodeURIComponent(file.mimeType)

  return {
    alt: file.name,
    caption: file.name.replace(/\.[^.]+$/, ''),
    description:
      file.description?.trim() ||
      'No abstract yet. You can add one later through the file description metadata if you want richer panel text.',
    height: file.imageMediaMetadata?.height ?? 1200,
    id: file.id,
    src: `/api/drive/photo/${file.id}?mimeType=${encodedMimeType}`,
    width: file.imageMediaMetadata?.width ?? 1600,
  }
}

async function listDrivePhotosUncached(sectionId: GallerySectionId): Promise<GalleryPhoto[] | null> {
  const section = getGallerySection(sectionId)
  const folderId = getDriveFolderId(section)

  if (!folderId) {
    return null
  }

  const drive = await getDriveClient()

  if (!drive) {
    return null
  }

  const response = await drive.files.list(
    {
      fields: 'files(id,name,mimeType,description,createdTime,imageMediaMetadata(width,height))',
      includeItemsFromAllDrives: true,
      orderBy: 'createdTime desc',
      q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
      supportsAllDrives: true,
    },
    {
      timeout: driveTimeoutMs,
    },
  )

  const photos =
    response.data.files
      ?.map((file) => toDrivePhoto(file as DriveFile))
      .filter((photo): photo is GalleryPhoto => photo !== null) ?? []

  return photos.length > 0 ? photos : null
}

const listDrivePhotos = unstable_cache(
  listDrivePhotosUncached,
  ['sleeper-hit-photography-drive-photos'],
  {
    revalidate: drivePhotoListCacheSeconds,
  },
)

export async function loadGallerySection(sectionId: GallerySectionId): Promise<LoadedGallerySection> {
  const section = getGallerySection(sectionId)

  try {
    const drivePhotos = await listDrivePhotos(sectionId)

    if (drivePhotos) {
      return {
        photos: drivePhotos,
        section,
        source: 'drive',
      }
    }
  } catch (error) {
    console.warn(
      `[Sleeper Hit Photography] Google Drive failed for ${section.id}: ${getDriveErrorMessage(error)}`,
    )
  }

  return {
    photos: section.fallbackPhotos,
    section,
    source: 'fallback',
  }
}

export async function loadGalleryCovers(): Promise<LoadedGallerySection[]> {
  const sections: GallerySectionId[] = ['events', 'landscapes', 'street', 'portraits']

  return Promise.all(
    sections.map(async (sectionId) => {
      const loadedSection = await loadGallerySection(sectionId)

      return {
        ...loadedSection,
        photos: loadedSection.photos.slice(0, 1),
      }
    }),
  )
}
