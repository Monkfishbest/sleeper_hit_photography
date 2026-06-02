import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { SleeperHitPhotographyLayout } from '../src/features/photography/SleeperHitPhotographyLayout'
import './globals.css'

export const metadata: Metadata = {
  title: { absolute: 'Sleeper Hit Photography' },
  description: 'A minimal photography gallery with side navigation and placeholder collections.',
  icons: {
    icon: `data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="white"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-size="42">📷</text></svg>',
    )}`,
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <SleeperHitPhotographyLayout>{children}</SleeperHitPhotographyLayout>
      </body>
    </html>
  )
}
