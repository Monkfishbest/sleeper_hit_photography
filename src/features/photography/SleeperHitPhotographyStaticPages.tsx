import type { LoadedGallerySection } from './SleeperHitPhotographyDrive.server'
import { SleeperHitPhotographyHomeClient } from './SleeperHitPhotographyHomeClient'
import styles from './css/SleeperHitPhotography.module.css'

export function SleeperHitPhotographyHome({
  covers,
}: Readonly<{
  covers: LoadedGallerySection[]
}>) {
  return <SleeperHitPhotographyHomeClient covers={covers} />
}

export function SleeperHitPhotographyAbout() {
  return (
    <section className={styles.aboutSection}>
      <p className={styles.sectionIndex}>About</p>
      <p className={styles.aboutCopy}>
        This is a placeholder build for now, set up so you can swap in real galleries later
        without rebuilding the whole layout. The broad idea is a clean side menu, roomy image
        presentation, and simple category browsing, but now with separate routes for each section.
      </p>
    </section>
  )
}

export function SleeperHitPhotographyContact() {
  return (
    <section className={styles.contactSection}>
      <div className={styles.contactIntro}>
        <p className={styles.sectionIndex}>Contact</p>
        <h2 className={styles.contactHeading}>Book Casper</h2>
        <p className={styles.aboutCopy}>
          For events, portraits, street work, or anything that needs a camera and a bit of taste,
          send a short note over. This form opens your email app with everything ready to send.
        </p>
        <a className={styles.contactEmail} href="mailto:k.bleidelis@gmail.com">
          k.bleidelis@gmail.com
        </a>
      </div>

      <form
        className={styles.contactForm}
        action="mailto:k.bleidelis@gmail.com?subject=Photography%20enquiry"
        method="post"
        encType="text/plain"
      >
        <label>
          <span>Name</span>
          <input name="name" type="text" autoComplete="name" required />
        </label>

        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>

        <label>
          <span>What do you need photographed?</span>
          <textarea name="message" rows={7} required />
        </label>

        <button type="submit">Open email</button>
      </form>
    </section>
  )
}
