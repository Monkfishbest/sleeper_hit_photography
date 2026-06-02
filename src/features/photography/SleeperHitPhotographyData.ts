export type GallerySectionId = 'events' | 'landscapes' | 'street' | 'portraits'

export type GalleryPhoto = {
  alt: string
  caption: string
  description?: string
  height: number
  id: string
  src: string
  width: number
}

export type GallerySection = {
  fallbackPhotos: GalleryPhoto[]
  folderEnvVar: string
  id: GallerySectionId
  title: string
  intro: string
}

export const gallerySections: GallerySection[] = [
  {
    fallbackPhotos: [
      {
        alt: 'Placeholder photo for events one',
        caption: 'Room warming up',
        description: 'A fallback event image while Drive is not connected yet.',
        height: 960,
        id: 'events-1',
        src: '/cat.webp',
        width: 1280,
      },
      {
        alt: 'Placeholder photo for events two',
        caption: 'Catching the side glance',
        description: 'Another placeholder that will be replaced by Drive-managed photos later.',
        height: 960,
        id: 'events-2',
        src: '/cat.webp',
        width: 1280,
      },
      {
        alt: 'Placeholder photo for events three',
        caption: 'Noise, light, movement',
        description: 'This slot is ready for a real gallery image once the folder is connected.',
        height: 960,
        id: 'events-3',
        src: '/cat.webp',
        width: 1280,
      },
    ],
    folderEnvVar: 'PHOTOGRAPHY_EVENTS_FOLDER_ID',
    id: 'events',
    title: 'Events',
    intro:
      'Low-fuss coverage, bright moments, people mid-conversation, and the sort of shots you only get when nobody is posing too hard.',
  },
  {
    fallbackPhotos: [
      {
        alt: 'Placeholder photo for landscapes one',
        caption: 'Grey sky doing its thing',
        description: 'Fallback landscape photo using the alternate cat chaos placeholder.',
        height: 960,
        id: 'landscapes-1',
        src: '/cat chaos mode.webp',
        width: 1280,
      },
      {
        alt: 'Placeholder photo for landscapes two',
        caption: 'A quieter horizon',
        description: 'This section is set up to swap directly to Drive images later.',
        height: 960,
        id: 'landscapes-2',
        src: '/cat chaos mode.webp',
        width: 1280,
      },
      {
        alt: 'Placeholder photo for landscapes three',
        caption: 'Windy and worth stopping for',
        description: 'Real files can replace these by just changing the Drive folder contents.',
        height: 960,
        id: 'landscapes-3',
        src: '/cat chaos mode.webp',
        width: 1280,
      },
    ],
    folderEnvVar: 'PHOTOGRAPHY_LANDSCAPES_FOLDER_ID',
    id: 'landscapes',
    title: 'Landscapes',
    intro:
      'Open space, weather doing most of the work, and images that feel a bit patient rather than too polished.',
  },
  {
    fallbackPhotos: [
      {
        alt: 'Placeholder photo for street one',
        caption: 'Between errands',
        description: 'Street placeholder image while the folder integration is still empty.',
        height: 960,
        id: 'street-1',
        src: '/cat.webp',
        width: 1280,
      },
      {
        alt: 'Placeholder photo for street two',
        caption: 'Sharp shadow, soft chaos',
        description: 'The panel view can show a short abstract or description per image.',
        height: 960,
        id: 'street-2',
        src: '/cat.webp',
        width: 1280,
      },
      {
        alt: 'Placeholder photo for street three',
        caption: 'Something half-noticed',
        description: 'This is standing in for a real Drive asset.',
        height: 960,
        id: 'street-3',
        src: '/cat.webp',
        width: 1280,
      },
    ],
    folderEnvVar: 'PHOTOGRAPHY_STREET_FOLDER_ID',
    id: 'street',
    title: 'Street',
    intro:
      'Fragments of passing life, odd little compositions, and the kind of scenes that make a place feel lived in.',
  },
  {
    fallbackPhotos: [
      {
        alt: 'Placeholder photo for portraits one',
        caption: 'Looking straight back',
        description: 'Portrait placeholder image with room for a caption and abstract.',
        height: 960,
        id: 'portraits-1',
        src: '/cat.webp',
        width: 1280,
      },
      {
        alt: 'Placeholder photo for portraits two',
        caption: 'A softer frame',
        description: 'Later on this can come from the matching Google Drive folder.',
        height: 960,
        id: 'portraits-2',
        src: '/cat.webp',
        width: 1280,
      },
      {
        alt: 'Placeholder photo for portraits three',
        caption: 'Unforced and direct',
        description: 'Keeping the layout in place so the real work can just be dropped in.',
        height: 960,
        id: 'portraits-3',
        src: '/cat.webp',
        width: 1280,
      },
    ],
    folderEnvVar: 'PHOTOGRAPHY_PORTRAITS_FOLDER_ID',
    id: 'portraits',
    title: 'Portraits',
    intro:
      'Simple portraits with room for expression, without trying to iron every bit of character out of the person in front of the lens.',
  },
]

export const photographyMenuItems = [
  { href: '/', label: 'Home' },
  ...gallerySections.map((section) => ({
    href: `/${section.id}`,
    label: section.title,
  })),
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function getGallerySection(sectionId: GallerySectionId) {
  return gallerySections.find((section) => section.id === sectionId)!
}
