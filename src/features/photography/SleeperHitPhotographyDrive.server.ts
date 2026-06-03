import { unstable_cache } from 'next/cache'
import { type GalleryPhoto, type GallerySection, getGallerySection, type GallerySectionId } from './SleeperHitPhotographyData'

export type LoadedGallerySection = {
  photos: GalleryPhoto[]
  section: GallerySection
  source: 'cloudfront' | 'fallback'
}

const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN || ''
const manifestCacheSeconds = 300

function getCloudfrontUrl(s3Key: string): string {
  if (!cloudfrontDomain) {
    return ''
  }
  return `https://${cloudfrontDomain}/${s3Key}`
}

async function fetchManifestUncached(sectionId: GallerySectionId): Promise<GalleryPhoto[] | null> {
  if (!cloudfrontDomain) {
    console.warn('CLOUDFRONT_DOMAIN not configured')
    return null
  }

  const manifestUrl = getCloudfrontUrl(`${sectionId}/manifest.json`)

  try {
    const response = await fetch(manifestUrl, {
      // Don't cache the fetch itself, let CloudFront handle it
      next: { revalidate: manifestCacheSeconds },
    })

    if (!response.ok) {
      console.warn(`Manifest not found for ${sectionId}: ${response.status}`)
      return null
    }

    const manifestData = await response.json() as Array<{
      alt: string
      caption: string
      description?: string
      height: number
      width: number
      id: string
      s3Key: string
    }>

    // Transform manifest data to GalleryPhoto format with CloudFront URLs
    const photos: GalleryPhoto[] = manifestData.map((item) => ({
      alt: item.alt,
      caption: item.caption,
      description: item.description || 'No description available.',
      height: item.height,
      width: item.width,
      id: item.id,
      src: getCloudfrontUrl(item.s3Key),
    }))

    return photos
  } catch (error) {
    console.warn(
      `[Sleeper Hit Photography] Manifest fetch failed for ${sectionId}:`,
      error instanceof Error ? error.message : String(error),
    )
    return null
  }
}

const fetchManifest = unstable_cache(
  fetchManifestUncached,
  ['sleeper-hit-photography-manifest'],
  {
    revalidate: manifestCacheSeconds,
  },
)

export async function loadGallerySection(sectionId: GallerySectionId): Promise<LoadedGallerySection> {
  const section = getGallerySection(sectionId)

  try {
    const cloudfrontPhotos = await fetchManifest(sectionId)

    if (cloudfrontPhotos && cloudfrontPhotos.length > 0) {
      return {
        photos: cloudfrontPhotos,
        section,
        source: 'cloudfront',
      }
    }
  } catch (error) {
    console.warn(
      `[Sleeper Hit Photography] CloudFront fetch failed for ${section.id}`,
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
