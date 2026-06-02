import type { GallerySectionId } from './SleeperHitPhotographyData'
import { loadGallerySection } from './SleeperHitPhotographyDrive.server'
import { SleeperHitPhotographyGalleryClient } from './SleeperHitPhotographyGalleryClient'

export async function SleeperHitPhotographyGalleryPage({
  sectionId,
}: Readonly<{
  sectionId: GallerySectionId
}>) {
  const { photos, section, source } = await loadGallerySection(sectionId)

  return <SleeperHitPhotographyGalleryClient photos={photos} section={section} source={source} />
}
