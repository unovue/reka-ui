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
})
