'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import type { GalleryPhoto, GallerySection } from './SleeperHitPhotographyData'
import styles from './css/SleeperHitPhotography.module.css'

export function SleeperHitPhotographyGalleryClient({
  photos,
  section,
  source,
}: Readonly<{
  photos: GalleryPhoto[]
  section: GallerySection
  source: 'drive' | 'fallback'
}>) {
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set(photos.map((p) => p.id)))
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showCaption, setShowCaption] = useState(true)

  const currentPhoto = photos[lightboxIndex]

  const handleImageLoad = (photoId: string) => {
    setLoadingImages((prev) => {
      const next = new Set(prev)
      next.delete(photoId)
      return next
    })
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
  }, [])

  const nextPhoto = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % photos.length)
  }, [photos.length])

  const prevPhoto = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }, [photos.length])

  useEffect(() => {
    if (!lightboxOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [lightboxOpen])

  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextPhoto()
      if (e.key === 'ArrowLeft') prevPhoto()
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'c' || e.key === 'C') setShowCaption((prev) => !prev)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeLightbox, lightboxOpen, nextPhoto, prevPhoto])

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.visuallyHidden}>{section.title}</h2>
        {source === 'fallback' ? (
          <p className={styles.fallbackNote}>
            Woups! there was a problem connecting to the server that holds the images! this isn't
            Caspers fault but his friend who built him this website, here are some cats looking
            dissapointed at instead of Caspers bueatiful photographs
          </p>
        ) : null}

        <div className={styles.photoList}>
          {photos.map((photo, index) => (
            <figure className={styles.photoFigure} key={photo.id}>
              <button
                className={styles.imageButton}
                onClick={() => openLightbox(index)}
                aria-label={`Open ${photo.caption} in lightbox`}
              >
                <div className={styles.imageWrapper}>
                  {loadingImages.has(photo.id) && (
                    <div className={styles.imageLoading}>
                      <div className={styles.photoSpinner} />
                    </div>
                  )}
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    sizes="(max-width: 700px) 100vw, (max-width: 1200px) 42vw, 28vw"
                    className={styles.image}
                    style={{ opacity: loadingImages.has(photo.id) ? 0 : 1 }}
                    priority={index < 3}
                    unoptimized
                    onLoad={() => handleImageLoad(photo.id)}
                  />
                </div>
              </button>
            </figure>
          ))}
        </div>
      </section>

      {lightboxOpen && currentPhoto && (
        <div className={styles.lightboxBackdrop} onClick={closeLightbox}>
          <div className={styles.lightboxContainer} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.lightboxClose}
              onClick={closeLightbox}
              aria-label="Close lightbox"
            >
              ✕
            </button>

            <div className={styles.lightboxContent}>
              <button
                className={styles.lightboxNav}
                onClick={prevPhoto}
                aria-label="Previous image"
              >
                ‹
              </button>

              <div className={styles.lightboxImageWrapper}>
                <Image
                  src={currentPhoto.src}
                  alt={currentPhoto.alt}
                  width={currentPhoto.width}
                  height={currentPhoto.height}
                  className={styles.lightboxImage}
                  priority
                  unoptimized
                />
              </div>

              <button
                className={styles.lightboxNav}
                onClick={nextPhoto}
                aria-label="Next image"
              >
                ›
              </button>
            </div>

            {showCaption && (
              <div className={styles.lightboxInfo}>
                <div className={styles.lightboxMeta}>
                  <h3>{currentPhoto.caption}</h3>
                  <p className={styles.lightboxIndex}>
                    {lightboxIndex + 1} / {photos.length}
                  </p>
                </div>
                {currentPhoto.description && (
                  <p className={styles.lightboxDescription}>{currentPhoto.description}</p>
                )}
                <button
                  className={styles.lightboxToggleCaption}
                  onClick={() => setShowCaption((prev) => !prev)}
                >
                  Hide caption
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
