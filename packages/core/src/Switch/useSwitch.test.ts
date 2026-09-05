import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import * as Reka from '../index'
import { useSwitch } from './useSwitch'

describe('useSwitch — state', () => {
  it('defaults to unchecked with falseValue', () => {
    const s = useSwitch()
    expect(s.modelValue.value).toBe(false)
    expect(s.checked.value).toBe(false)
    expect(s.isControlled.value).toBe(false)
  })
  it('toggle() flips between trueValue and falseValue', () => {
    const s = useSwitch({ trueValue: 'on', falseValue: 'off', defaultValue: 'off' })
    s.toggle()
    expect(s.modelValue.value).toBe('on')
    expect(s.checked.value).toBe(true)
  })
  it('setChecked() sets the value explicitly', () => {
    const s = useSwitch()
    s.setChecked(true)
    expect(s.checked.value).toBe(true)
    s.setChecked(true)
    expect(s.checked.value).toBe(true)
    s.setChecked(false)
    expect(s.checked.value).toBe(false)
  })
  it('does not toggle when disabled', () => {
    const s = useSwitch({ disabled: true })
    s.toggle()
    expect(s.checked.value).toBe(false)
  })
  it('ref-owned mode writes through the passed ref', () => {
    const model = ref(false)
    const s = useSwitch({ modelValue: model })
    s.toggle()
    expect(model.value).toBe(true)
    expect(s.checked.value).toBe(true)
  })
  it('onUpdate mode does not write the ref and receives (value, details)', () => {
    const model = ref(false)
    const onUpdate = vi.fn()
    const s = useSwitch({ modelValue: model, onUpdate })
    s.root.props.value.onClick(new MouseEvent('click'))
    expect(model.value).toBe(false)
    expect(s.checked.value).toBe(false)
    expect(s.isControlled.value).toBe(true)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const [value, details] = onUpdate.mock.calls[0]
    expect(value).toBe(true)
    expect(details.reason).toBe('trigger-press')
    expect(details.event).toBeInstanceOf(MouseEvent)
  })
  it('cancel() in onBeforeUpdate vetoes the change', () => {
    const onUpdate = vi.fn()
    const s = useSwitch({ onBeforeUpdate: (_value, details) => details.cancel(), onUpdate })
    s.toggle()
    expect(s.checked.value).toBe(false)
    expect(s.lastChangeDetails.value.isCanceled).toBe(true)
    expect(onUpdate).not.toHaveBeenCalled()
  })
  it('imperative toggle() reports reason "imperative-action"', () => {
    const onUpdate = vi.fn()
    const s = useSwitch({ onUpdate })
    s.toggle()
    expect(onUpdate.mock.calls[0][1].reason).toBe('imperative-action')
    expect(s.lastChangeDetails.value.reason).toBe('imperative-action')
  })
})

describe('useSwitch — part surfaces', () => {
  it('root.props exposes role/aria/value/handlers but NO data-*', () => {
    const s = useSwitch({ required: true })
    expect(s.root.props.value).toMatchObject({ 'role': 'switch', 'aria-checked': false, 'aria-required': true })
    expect(Object.keys(s.root.props.value).some(k => k.startsWith('data-'))).toBe(false)
    expect(typeof s.root.props.value.onClick).toBe('function')
  })
  it('root.attrs merges props with data-* derived from state', () => {
    const s = useSwitch()
    expect(s.root.attrs.value).toMatchObject({ 'role': 'switch', 'data-state': 'unchecked' })
    expect(s.root.attrs.value).not.toHaveProperty('data-disabled')
    const d = useSwitch({ disabled: true })
    expect(d.root.attrs.value['data-disabled']).toBe('')
    expect(d.root.attrs.value.disabled).toBe(true)
  })
  it('root.state carries the semantic state', () => {
    const s = useSwitch()
    expect(s.root.state.value).toEqual({ state: 'unchecked', disabled: false })
    s.toggle()
    expect(s.root.state.value.state).toBe('checked')
  })
  it('root.props.onKeydown toggles on Enter with reason "trigger-keydown" and ignores other keys', () => {
    const onUpdate = vi.fn()
    const s = useSwitch({ onUpdate })
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    s.root.props.value.onKeydown(enter)
    expect(enter.defaultPrevented).toBe(true)
    expect(s.checked.value).toBe(true)
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ reason: 'trigger-keydown', event: enter })
    const other = new KeyboardEvent('keydown', { key: 'a', cancelable: true })
    s.root.props.value.onKeydown(other)
    expect(s.checked.value).toBe(true) // unchanged
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })
  it('thumb.state mirrors checked/disabled', () => {
    const s = useSwitch()
    expect(s.thumb.state.value.state).toBe('unchecked')
    expect(s.thumb.attrs.value).toEqual({ 'data-state': 'unchecked' })
    s.toggle()
    expect(s.thumb.state.value.state).toBe('checked')
    expect(s.thumb.attrs.value).toEqual({ 'data-state': 'checked' })
  })
})

describe('useSwitch — public export', () => {
  it('is exported from the package barrel path', () => {
    expect(typeof Reka.useSwitch).toBe('function')
  })
})
