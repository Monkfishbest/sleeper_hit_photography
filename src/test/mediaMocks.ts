import { vi } from 'vitest'

export class MockAudio {
  static instances: MockAudio[] = []

  src: string
  preload = ''
  currentTime = 0

  constructor(src = '') {
    this.src = src
    MockAudio.instances.push(this)
  }

  load = vi.fn()
  play = vi.fn(async () => undefined)

  static reset(): void {
    MockAudio.instances = []
  }
}

export class MockImage {
  static sources: string[] = []

  private currentSrc = ''

  get src(): string {
    return this.currentSrc
  }

  set src(value: string) {
    this.currentSrc = value
    MockImage.sources.push(value)
  }

  static reset(): void {
    MockImage.sources = []
  }
}
