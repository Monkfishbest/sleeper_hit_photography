'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { photographyMenuItems } from './SleeperHitPhotographyData'
import styles from './css/SleeperHitPhotography.module.css'

export function SleeperHitPhotographyLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const pathname = usePathname()

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarInner}>
          <div className={styles.brandBlock}>
            <h1>Sleeper Hit Photography</h1>
          </div>

          <nav aria-label="Photography sections">
            <ul className={styles.menu}>
              {photographyMenuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    className={`${styles.menuLink} ${pathname === item.href ? styles.menuLinkActive : ''}`}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      <div className={styles.content}>{children}</div>
    </main>
  )
}
