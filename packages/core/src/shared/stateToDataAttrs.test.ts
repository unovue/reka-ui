import { describe, expect, it } from 'vitest'
import { stateToDataAttrs } from './stateToDataAttrs'

describe('stateToDataAttrs', () => {
  it('maps boolean true to an empty-string data attribute', () => {
    expect(stateToDataAttrs({ disabled: true })).toEqual({ 'data-disabled': '' })
  })
  it('omits false/null/undefined', () => {
    expect(stateToDataAttrs({ disabled: false, open: undefined, x: null })).toEqual({})
  })
  it('maps string/number and kebab-cases the key', () => {
    expect(stateToDataAttrs({ state: 'checked', someFlag: 2 }))
      .toEqual({ 'data-state': 'checked', 'data-some-flag': '2' })
  })
  it('returns an empty record for undefined state', () => {
    expect(stateToDataAttrs(undefined)).toEqual({})
  })

  describe('mapping overrides (moved from useRender.getStateAttributes)', () => {
    it('replaces the default data-* for a mapped key', () => {
      expect(stateToDataAttrs({ checked: true }, { checked: v => ({ 'aria-checked': String(v) }) }))
        .toEqual({ 'aria-checked': 'true' })
    })
    it('emits nothing for a mapped key whose mapper returns undefined', () => {
      expect(stateToDataAttrs({ checked: true, open: true }, { checked: () => undefined }))
        .toEqual({ 'data-open': '' })
    })
    it('leaves unmapped keys on the default path', () => {
      expect(stateToDataAttrs(
        { checked: false, orientation: 'horizontal' },
        { checked: v => ({ 'data-checked': v ? 'yes' : 'no' }) },
      )).toEqual({ 'data-checked': 'no', 'data-orientation': 'horizontal' })
    })
  })
})
