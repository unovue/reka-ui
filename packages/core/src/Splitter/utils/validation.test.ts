import { afterEach, describe, expect, it, vi } from 'vitest'
import { validatePanelGroupLayout } from './validation'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('validatePanelGroupLayout', () => {
  it('should validate an empty group silently', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = validatePanelGroupLayout({ layout: [], panelConstraints: [] })
    expect(result).toEqual([])
    expect(warn).not.toHaveBeenCalled()
  })
})
