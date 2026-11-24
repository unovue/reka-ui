import { describe, expect, it } from 'vitest'
import { distTag } from './npm-dist-tag.mjs'

describe('distTag', () => {
  it('tags a stable release as latest while it is the newest major', () => {
    expect(distTag('2.12.0')).toBe('latest')
    expect(distTag('2.12.0', '2.11.0')).toBe('latest')
  })

  it('keeps v2 releases off latest once a newer major is latest', () => {
    expect(distTag('2.12.1', '3.0.0')).toBe('v2-latest')
  })

  it('tags a prerelease with its id, never latest', () => {
    expect(distTag('2.12.0-beta.1', '2.11.0')).toBe('beta')
    expect(distTag('3.0.0-alpha.0')).toBe('alpha')
    expect(distTag('2.12.0-rc.1+build.5')).toBe('rc')
  })

  it('falls back to next for ids npm would read as a range', () => {
    expect(distTag('2.12.0-0')).toBe('next')
    expect(distTag('2.12.0-x.1')).toBe('next')
    expect(distTag('2.12.0-latest.1')).toBe('next')
  })
})
