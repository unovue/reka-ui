import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, ref } from 'vue'
import * as Reka from '../index'
import { useTogglePressed } from './useTogglePressed'

describe('useTogglePressed — state', () => {
  it('defaults to an unpressed, uncontrolled toggle with no defaultValue', () => {
    const t = useTogglePressed()
    // `aria-pressed` passes the raw model through: `undefined` omits the attribute (Toggle.vue parity).
    expect(t.modelValue.value).toBeUndefined()
    expect(t.pressed.value).toBe(false)
    expect(t.disabled.value).toBe(false)
    expect(t.isControlled.value).toBe(false)
    expect(t.lastChangeDetails.value.reason).toBe('none')
  })
  it('honours defaultValue', () => {
    const t = useTogglePressed({ defaultValue: true })
    expect(t.modelValue.value).toBe(true)
    expect(t.pressed.value).toBe(true)
  })
  it('toggle() flips the pressed state', () => {
    const t = useTogglePressed()
    t.toggle()
    expect(t.modelValue.value).toBe(true)
    expect(t.pressed.value).toBe(true)
    t.toggle()
    expect(t.modelValue.value).toBe(false)
    expect(t.pressed.value).toBe(false)
  })
  it('setPressed() sets the value explicitly and ignores an unchanged value', () => {
    const onUpdate = vi.fn()
    const t = useTogglePressed({ defaultValue: false, onUpdate })
    t.setPressed(true)
    expect(t.pressed.value).toBe(true)
    t.setPressed(true)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    t.setPressed(false)
    expect(t.pressed.value).toBe(false)
  })
  it('a controlled null reads through (renders no aria-pressed) and toggles to true', () => {
    const onUpdate = vi.fn()
    const t = useTogglePressed({ modelValue: () => null, onUpdate })
    expect(t.isControlled.value).toBe(true)
    expect(t.modelValue.value).toBeNull()
    expect(t.pressed.value).toBe(false)
    expect(t.root.props.value['aria-pressed']).toBeNull()
    expect(t.root.state.value.state).toBe('unchecked')
    t.toggle()
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'imperative-action' }))
  })
  it('ref-owned mode writes through the passed ref', () => {
    const model = ref(false)
    const t = useTogglePressed({ modelValue: model })
    t.toggle()
    expect(model.value).toBe(true)
    expect(t.pressed.value).toBe(true)
  })
  it('onUpdate mode does not write the ref and receives (value, details)', () => {
    const model = ref(false)
    const onUpdate = vi.fn()
    const t = useTogglePressed({ modelValue: model, onUpdate })
    const event = new MouseEvent('click')
    t.root.props.value.onClick(event)
    expect(model.value).toBe(false)
    expect(t.pressed.value).toBe(false)
    expect(t.isControlled.value).toBe(true)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press', event, isCanceled: false }))
  })
  it('controlled getter + emit: emits beforeUpdate then update with details and does not write locally', () => {
    const emit = vi.fn()
    const t = useTogglePressed({ modelValue: () => false, emit })
    t.toggle()
    expect(t.pressed.value).toBe(false)
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:modelValue', true, expect.objectContaining({ reason: 'imperative-action' }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:modelValue', true, expect.objectContaining({ reason: 'imperative-action' }))
  })
  it('cancel() in onBeforeUpdate vetoes the change', () => {
    const onUpdate = vi.fn()
    const t = useTogglePressed({ onBeforeUpdate: (_value, details) => details.cancel(), onUpdate })
    t.toggle()
    expect(t.pressed.value).toBe(false)
    expect(t.lastChangeDetails.value.isCanceled).toBe(true)
    expect(onUpdate).not.toHaveBeenCalled()
  })
  it('imperative toggle() reports reason "imperative-action"', () => {
    const onUpdate = vi.fn()
    const t = useTogglePressed({ onUpdate })
    t.toggle()
    expect(onUpdate.mock.calls[0][1].reason).toBe('imperative-action')
    expect(t.lastChangeDetails.value.reason).toBe('imperative-action')
  })
  it('disabled is reactive through a ref', () => {
    const disabled = ref(false)
    const t = useTogglePressed({ disabled })
    expect(t.disabled.value).toBe(false)
    disabled.value = true
    expect(t.disabled.value).toBe(true)
    expect(t.root.props.value.disabled).toBe(true)
  })
})

describe('useTogglePressed — root surface', () => {
  it('props exposes aria-pressed/disabled/onClick but NO data-*', () => {
    const t = useTogglePressed({ defaultValue: false })
    expect(t.root.props.value).toMatchObject({ 'aria-pressed': false, 'disabled': false })
    expect(Object.keys(t.root.props.value).some(k => k.startsWith('data-'))).toBe(false)
    expect(typeof t.root.props.value.onClick).toBe('function')
  })
  it('attrs merges props with data-* derived from state', () => {
    const t = useTogglePressed({ defaultValue: false })
    expect(t.root.attrs.value).toMatchObject({ 'aria-pressed': false, 'data-state': 'unchecked' })
    expect(t.root.attrs.value).not.toHaveProperty('data-disabled')
    const d = useTogglePressed({ disabled: true })
    expect(d.root.attrs.value['data-disabled']).toBe('')
    expect(d.root.attrs.value.disabled).toBe(true)
  })
  it('state carries the semantic state', () => {
    const t = useTogglePressed()
    expect(t.root.state.value).toEqual({ state: 'unchecked', disabled: false })
    t.toggle()
    expect(t.root.state.value.state).toBe('checked')
    expect(t.root.attrs.value['aria-pressed']).toBe(true)
    expect(t.root.attrs.value['data-state']).toBe('checked')
  })
  it('onClick is ignored while disabled; the imperative toggle() is not', () => {
    const onUpdate = vi.fn()
    const t = useTogglePressed({ disabled: true, onUpdate })
    t.root.props.value.onClick(new MouseEvent('click'))
    expect(t.pressed.value).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()
    t.toggle()
    expect(t.pressed.value).toBe(true)
  })
  it('onClick toggles with reason "trigger-press" and the native event', () => {
    const onUpdate = vi.fn()
    const t = useTogglePressed({ onUpdate })
    const event = new MouseEvent('click')
    t.root.props.value.onClick(event)
    expect(t.pressed.value).toBe(true)
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ reason: 'trigger-press', event })
    expect(t.lastChangeDetails.value.reason).toBe('trigger-press')
  })
})

describe('useTogglePressed — rendered surface', () => {
  // A standalone consumer binding the surface to a plain button.
  const Fixture = defineComponent({
    setup() {
      const t = useTogglePressed({ defaultValue: false })
      return { t }
    },
    template: `<button v-bind="t.root.attrs.value" aria-label="Toggle bold">B</button>`,
  })

  it('renders aria-pressed + data-state, toggles on click and passes axe', async () => {
    const { container, getByRole } = render(Fixture)
    const button = getByRole('button')
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(button.getAttribute('data-state')).toBe('unchecked')
    expect(button.hasAttribute('data-disabled')).toBe(false)
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.click(button)
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.getAttribute('data-state')).toBe('checked')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('useTogglePressed — public export', () => {
  it('is exported from the package barrel under a name that does not clash with @vueuse/core', () => {
    expect(typeof Reka.useTogglePressed).toBe('function')
    expect('useToggle' in Reka).toBe(false)
  })
})
