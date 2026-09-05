import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import * as Reka from '../index'
import { useCheckbox } from './useCheckbox'
import { useCheckboxGroup } from './useCheckboxGroup'

describe('useCheckboxGroup — state', () => {
  it('defaults to an empty value, roving focus on, enabled', () => {
    const g = useCheckboxGroup()
    expect(g.modelValue.value).toEqual([])
    expect(g.rovingFocus.value).toBe(true)
    expect(g.disabled.value).toBe(false)
    expect(g.isControlled.value).toBe(false)
    expect(g.lastChangeDetails.value.reason).toBe('none')
  })
  it('honours defaultValue, disabled and rovingFocus', () => {
    const g = useCheckboxGroup<string>({ defaultValue: ['a'], disabled: true, rovingFocus: () => false })
    expect(g.modelValue.value).toEqual(['a'])
    expect(g.disabled.value).toBe(true)
    expect(g.rovingFocus.value).toBe(false)
  })
  it('changeModelValue() replaces the value and reports imperative-action', () => {
    const g = useCheckboxGroup<string>()
    expect(g.changeModelValue(['a', 'b'])).toBe(true)
    expect(g.modelValue.value).toEqual(['a', 'b'])
    expect(g.lastChangeDetails.value.reason).toBe('imperative-action')
  })
  it('toggleValue() adds an absent value and removes a present one (ohash isEqual)', () => {
    const g = useCheckboxGroup<Record<string, any>>()
    g.toggleValue({ name: 'jack' })
    expect(g.modelValue.value).toEqual([{ name: 'jack' }])
    g.toggleValue({ name: 'john' })
    expect(g.modelValue.value).toEqual([{ name: 'jack' }, { name: 'john' }])
    g.toggleValue({ name: 'jack' })
    expect(g.modelValue.value).toEqual([{ name: 'john' }])
  })
  it('ref-owned mode writes through the passed ref', () => {
    const model = ref<string[]>([])
    const g = useCheckboxGroup<string>({ modelValue: model })
    expect(g.isControlled.value).toBe(true)
    g.toggleValue('a')
    expect(model.value).toEqual(['a'])
    expect(g.modelValue.value).toEqual(['a'])
  })
  it('controlled getter + emit: emits beforeUpdate/update with details and does not write locally', () => {
    const emit = vi.fn()
    const g = useCheckboxGroup<string>({ modelValue: () => ['a'], emit })
    const event = new MouseEvent('click')
    g.toggleValue('b', 'item-press', event)
    expect(g.modelValue.value).toEqual(['a'])
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:modelValue', ['a', 'b'], expect.objectContaining({ reason: 'item-press', event }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:modelValue', ['a', 'b'], expect.objectContaining({ reason: 'item-press', event }))
  })
  it('onUpdate receives (value, details) without writing', () => {
    const onUpdate = vi.fn()
    const g = useCheckboxGroup<string>({ modelValue: () => [], onUpdate })
    g.changeModelValue(['a'], 'item-press')
    expect(g.modelValue.value).toEqual([])
    expect(onUpdate).toHaveBeenCalledWith(['a'], expect.objectContaining({ reason: 'item-press', isCanceled: false }))
  })
  it('cancel() in onBeforeUpdate vetoes the change', () => {
    const onUpdate = vi.fn()
    const g = useCheckboxGroup<string>({ onBeforeUpdate: (_value, details) => details.cancel(), onUpdate })
    expect(g.toggleValue('a')).toBe(false)
    expect(g.modelValue.value).toEqual([])
    expect(g.lastChangeDetails.value.isCanceled).toBe(true)
    expect(onUpdate).not.toHaveBeenCalled()
  })
})

describe('useCheckboxGroup — context', () => {
  it('keeps modelValue/rovingFocus/disabled and routes writes through changeModelValue', () => {
    const g = useCheckboxGroup<string>({ defaultValue: ['a'] })
    expect(g.context.modelValue.value).toEqual(['a'])
    expect(g.context.rovingFocus.value).toBe(true)
    expect(g.context.disabled.value).toBe(false)
    expect(g.context.changeModelValue(['b'], 'item-press')).toBe(true)
    expect(g.modelValue.value).toEqual(['b'])
    expect(g.lastChangeDetails.value.reason).toBe('item-press')
  })
  it('drives grouped useCheckbox() items', () => {
    const g = useCheckboxGroup<string>()
    const a = useCheckbox({ value: 'a', group: g.context })
    const b = useCheckbox({ value: 'b', group: g.context })
    a.root.props.value.onClick(new MouseEvent('click'))
    b.root.props.value.onClick(new MouseEvent('click'))
    expect(g.modelValue.value).toEqual(['a', 'b'])
    expect(a.checkedState.value).toBe(true)
    expect(b.checkedState.value).toBe(true)
    g.changeModelValue([])
    expect(a.checkedState.value).toBe(false)
    expect(b.checkedState.value).toBe(false)
  })
})

describe('useCheckboxGroup — rendered', () => {
  const Fixture = defineComponent({
    props: { disabled: Boolean },
    setup(props) {
      const g = useCheckboxGroup<string>({ disabled: () => props.disabled })
      const items = ['jack', 'john'].map(value => ({ value, checkbox: useCheckbox({ value, group: g.context }) }))
      return () => {
        const children = items.map(({ value, checkbox }) => h('button', { ...checkbox.root.attrs.value, 'type': 'button', 'aria-label': value }, [
          h('span', checkbox.indicator.attrs.value, checkbox.checkedState.value === true ? 'x' : ''),
        ]))
        return h('div', { 'role': 'group', 'aria-label': 'People' }, children)
      }
    },
  })

  it('binds attrs onto real elements, toggles membership and passes axe', async () => {
    const { container } = render(Fixture)
    const buttons = container.querySelectorAll('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].getAttribute('role')).toBe('checkbox')
    expect(buttons[0].getAttribute('aria-checked')).toBe('false')
    buttons[0].click()
    await nextTick()
    expect(buttons[0].getAttribute('aria-checked')).toBe('true')
    expect(buttons[0].getAttribute('data-state')).toBe('checked')
    expect(buttons[1].getAttribute('data-state')).toBe('unchecked')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('a disabled group disables every member', async () => {
    const { container } = render(Fixture, { props: { disabled: true } })
    const buttons = container.querySelectorAll('button')
    expect(buttons[0].hasAttribute('disabled')).toBe(true)
    expect(buttons[1].getAttribute('data-disabled')).toBe('')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('useCheckboxGroup — public export', () => {
  it('is exported from the package barrel', () => {
    expect(typeof Reka.useCheckboxGroup).toBe('function')
  })
})
