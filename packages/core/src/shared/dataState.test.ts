import { describe, expect, it } from 'vitest'
import { disclosureState, selectionState } from './dataState'

describe('dataState', () => {
  it('disclosureState maps a boolean to open/closed', () => {
    expect(disclosureState(true)).toBe('open')
    expect(disclosureState(false)).toBe('closed')
  })
  it('selectionState maps a boolean to checked/unchecked', () => {
    expect(selectionState(true)).toBe('checked')
    expect(selectionState(false)).toBe('unchecked')
  })
  it('selectionState passes indeterminate through', () => {
    expect(selectionState('indeterminate')).toBe('indeterminate')
  })
})
