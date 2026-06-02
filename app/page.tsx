import { SleeperHitPhotographyHome } from '../src/features/photography/SleeperHitPhotographyStaticPages'
import { loadGalleryCovers } from '../src/features/photography/SleeperHitPhotographyDrive.server'

export const dynamic = 'force-dynamic'

export default async function SleeperHitPhotographyPage() {
  const covers = await loadGalleryCovers()

  return <SleeperHitPhotographyHome covers={covers} />
}
