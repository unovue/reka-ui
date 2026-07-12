import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import * as Reka from '../index'
import { useSwitch } from './useSwitch'

describe('useSwitch — state', () => {
  it('defaults to unchecked with falseValue', () => {
    const s = useSwitch()
    expect(s.modelValue.value).toBe(false)
    expect(s.checked.value).toBe(false)
  })
  it('toggle() flips between trueValue and falseValue', () => {
    const s = useSwitch({ trueValue: 'on', falseValue: 'off', defaultValue: 'off' })
    s.toggle()
    expect(s.modelValue.value).toBe('on')
    expect(s.checked.value).toBe(true)
  })
  it('does not toggle when disabled', () => {
    const s = useSwitch({ disabled: true })
    s.toggle()
    expect(s.checked.value).toBe(false)
  })
  it('writes through an externally-owned ref', () => {
    const model = ref(false)
    const s = useSwitch({ modelValue: model })
    s.toggle()
    expect(model.value).toBe(true)
  })
})

describe('useSwitch — part surfaces', () => {
  it('root.props exposes role/aria/value/handlers but NO data-*', () => {
    const s = useSwitch({ required: true })
    expect(s.root.props.value).toMatchObject({ 'role': 'switch', 'aria-checked': false, 'aria-required': true })
    expect(Object.keys(s.root.props.value).some(k => k.startsWith('data-'))).toBe(false)
    expect(typeof s.root.props.value.onClick).toBe('function')
  })
  it('root.state carries the semantic state', () => {
    const s = useSwitch()
    expect(s.root.state.value).toEqual({ state: 'unchecked', disabled: false })
    s.toggle()
    expect(s.root.state.value.state).toBe('checked')
  })
  it('root.props.onKeydown toggles on Enter and ignores other keys', () => {
    const s = useSwitch()
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    s.root.props.value.onKeydown(enter)
    expect(enter.defaultPrevented).toBe(true)
    expect(s.checked.value).toBe(true)
    const other = new KeyboardEvent('keydown', { key: 'a', cancelable: true })
    s.root.props.value.onKeydown(other)
    expect(s.checked.value).toBe(true) // unchanged
  })
  it('thumb.state mirrors checked/disabled', () => {
    const s = useSwitch()
    expect(s.thumb.state.value.state).toBe('unchecked')
    s.toggle()
    expect(s.thumb.state.value.state).toBe('checked')
  })
})

describe('useSwitch — public export', () => {
  it('is exported from the package barrel path', () => {
    expect(typeof Reka.useSwitch).toBe('function')
  })
})
