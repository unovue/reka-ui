import { describe, expect, it, vi } from 'vitest'
import { mergeProps } from 'vue'
import { mergeStateAttrs, stateToDataAttrs } from './stateToDataAttrs'

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

describe('mergeStateAttrs', () => {
  const cases: [string, Record<string, any> | undefined, Record<string, any> | undefined][] = [
    ['plain props', { open: true, side: 'top' }, { 'role': 'dialog', 'aria-modal': 'true', 'onClick': () => {} }],
    ['a prop overriding a state attribute', { open: true }, { 'data-open': 'false', 'id': 'x' }],
    ['class and style', { open: true }, { class: ['a', { b: true }], style: 'color: red' }],
    ['a falsy listener and the empty key', { open: true }, { 'onClick': undefined, '': 'drop', 'title': 't' }],
    ['no state', undefined, { id: 'x' }],
    ['no props', { open: true }, undefined],
  ]
  for (const [name, state, props] of cases) {
    it(`matches mergeProps(stateToDataAttrs(state), props): ${name}`, () => {
      const out = mergeStateAttrs(state, undefined, props)
      const expected = mergeProps(stateToDataAttrs(state), props ?? {})
      expect(out).toEqual(expected)
      expect(Object.keys(out)).toEqual(Object.keys(expected))
    })
  }

  it('matches mergeProps when a mapping emits a class or a listener', () => {
    const onX = vi.fn()
    const state = { open: true }
    const mapping = { open: () => ({ class: 'is-open', onClick: onX } as any) }
    const props = { class: 'base', onClick: vi.fn() }
    expect(mergeStateAttrs(state, mapping, props)).toEqual(mergeProps(stateToDataAttrs(state, mapping), props))
  })

  it('returns a fresh object, never the props object', () => {
    const props = { id: 'x' }
    const out = mergeStateAttrs({}, undefined, props)
    expect(out).not.toBe(props)
    expect(out).toEqual(props)
  })
})
