import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'
import { afterEach, beforeAll, vi } from 'vitest'
import { MockAudio, MockImage } from './mediaMocks'

vi.mock('next/image', async () => {
  const React = await import('react')

  function MockNextImage({
    alt = '',
    src,
    ...rest
  }: Record<string, unknown>) {
    const imageProps = { ...rest }
    const resolvedSrc =
      typeof src === 'string'
        ? src
        : typeof src === 'object' && src !== null && 'src' in src
          ? String(src.src)
          : ''

    delete imageProps.fill
    delete imageProps.priority
    delete imageProps.quality
    delete imageProps.sizes

    return React.createElement('img', {
      alt,
      src: resolvedSrc,
      ...imageProps,
    })
  }

  return { default: MockNextImage }
})

vi.mock('next/link', async () => {
  const React = await import('react')

  function MockNextLink({
    children,
    href,
    ...rest
  }: {
    children: ReactNode
    href: string | { pathname?: string }
  }) {
    const resolvedHref =
      typeof href === 'string'
        ? href
        : typeof href?.pathname === 'string'
          ? href.pathname
          : ''

    return React.createElement('a', { href: resolvedHref, ...rest }, children)
  }

  return { default: MockNextLink }
})

beforeAll(() => {
  Object.defineProperty(globalThis, 'Audio', {
    configurable: true,
    writable: true,
    value: MockAudio,
  })

  Object.defineProperty(globalThis, 'Image', {
    configurable: true,
    writable: true,
    value: MockImage,
  })
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  MockAudio.reset()
  MockImage.reset()
  vi.restoreAllMocks()
  vi.useRealTimers()
})
