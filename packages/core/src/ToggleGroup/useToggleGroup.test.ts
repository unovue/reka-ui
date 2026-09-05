import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, ref } from 'vue'
import * as Reka from '../index'
import { useToggleGroup } from './useToggleGroup'

function noDataAttrs(props: Record<string, any>) {
  return Object.keys(props).every(k => !k.startsWith('data-'))
}

describe('useToggleGroup — type inference & defaults', () => {
  it('with neither type nor values: single mode, but the default value is [] (useSingleOrMultipleValue parity)', () => {
    const g = useToggleGroup()
    expect(g.isSingle.value).toBe(true)
    expect(g.modelValue.value).toEqual([])
    expect(g.isControlled.value).toBe(false)
    expect(g.lastChangeDetails.value.reason).toBe('none')
  })
  it('type "single" without a defaultValue starts undefined', () => {
    const g = useToggleGroup({ type: 'single' })
    expect(g.isSingle.value).toBe(true)
    expect(g.modelValue.value).toBeUndefined()
  })
  it('type "multiple" without a defaultValue starts as []', () => {
    const g = useToggleGroup({ type: 'multiple' })
    expect(g.isSingle.value).toBe(false)
    expect(g.modelValue.value).toEqual([])
  })
  it('infers multiple from an array defaultValue / modelValue, single from a scalar', () => {
    expect(useToggleGroup({ defaultValue: ['a'] }).isSingle.value).toBe(false)
    expect(useToggleGroup({ defaultValue: 'a' }).isSingle.value).toBe(true)
    expect(useToggleGroup({ modelValue: () => ['a'] }).isSingle.value).toBe(false)
    expect(useToggleGroup({ modelValue: () => 'a' }).isSingle.value).toBe(true)
  })
  it('an explicit type wins over the inferred one', () => {
    expect(useToggleGroup({ type: 'single', defaultValue: ['a'] }).isSingle.value).toBe(true)
    expect(useToggleGroup({ type: 'multiple', defaultValue: 'a' }).isSingle.value).toBe(false)
  })
  it('type is reactive through a getter', () => {
    const type = ref<'single' | 'multiple' | undefined>('single')
    const g = useToggleGroup({ type: () => type.value })
    expect(g.isSingle.value).toBe(true)
    type.value = 'multiple'
    expect(g.isSingle.value).toBe(false)
  })
})

describe('useToggleGroup — single mode', () => {
  it('selects a value and toggles it off when pressed again', () => {
    const g = useToggleGroup({ type: 'single' })
    expect(g.changeModelValue('a')).toBe(true)
    expect(g.modelValue.value).toBe('a')
    expect(g.changeModelValue('b')).toBe(true)
    expect(g.modelValue.value).toBe('b')
    expect(g.changeModelValue('b')).toBe(true)
    expect(g.modelValue.value).toBeUndefined()
    expect(g.lastChangeDetails.value.reason).toBe('imperative-action')
  })
  it('toggle-off uses deep equality (ohash isEqual)', () => {
    const g = useToggleGroup({ type: 'single', defaultValue: { id: 1 } })
    g.changeModelValue({ id: 1 })
    expect(g.modelValue.value).toBeUndefined()
  })
  it('ref-owned mode writes through the passed ref', () => {
    const model = ref<string | undefined>('a')
    const g = useToggleGroup({ modelValue: model })
    expect(g.isControlled.value).toBe(true)
    g.changeModelValue('b')
    expect(model.value).toBe('b')
    g.changeModelValue('b')
    expect(model.value).toBeUndefined()
  })
  it('controlled getter + emit: emits beforeUpdate then update with details and does not write locally', () => {
    const emit = vi.fn()
    const g = useToggleGroup({ modelValue: () => 'a', emit })
    const event = new MouseEvent('click')
    g.changeModelValue('b', 'item-press', event)
    expect(g.modelValue.value).toBe('a')
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:modelValue', 'b', expect.objectContaining({ reason: 'item-press', event }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:modelValue', 'b', expect.objectContaining({ reason: 'item-press', event }))
  })
  it('cancel in onBeforeUpdate keeps the current value', () => {
    const onUpdate = vi.fn()
    const g = useToggleGroup({
      defaultValue: 'a',
      onBeforeUpdate: (_value, details) => details.cancel(),
      onUpdate,
    })
    expect(g.changeModelValue('b')).toBe(false)
    expect(g.modelValue.value).toBe('a')
    expect(onUpdate).not.toHaveBeenCalled()
    expect(g.lastChangeDetails.value.isCanceled).toBe(true)
  })
})

describe('useToggleGroup — multiple mode', () => {
  it('adds and removes values, emitting a new array each time', () => {
    const onUpdate = vi.fn()
    const g = useToggleGroup({ type: 'multiple', onUpdate })
    g.changeModelValue('a')
    expect(g.modelValue.value).toEqual(['a'])
    g.changeModelValue('b')
    expect(g.modelValue.value).toEqual(['a', 'b'])
    g.changeModelValue('a')
    expect(g.modelValue.value).toEqual(['b'])
    expect(onUpdate).toHaveBeenCalledTimes(3)
    expect(onUpdate.mock.calls[2][0]).toEqual(['b'])
    expect(onUpdate.mock.calls[2][1].reason).toBe('imperative-action')
  })
  it('removes by deep equality', () => {
    const g = useToggleGroup({ type: 'multiple', defaultValue: [{ id: 1 }, { id: 2 }] })
    g.changeModelValue({ id: 1 })
    expect(g.modelValue.value).toEqual([{ id: 2 }])
  })
  it('coerces a non-array model into an array (dropping falsy values)', () => {
    const g = useToggleGroup({ type: 'multiple', modelValue: ref<any>('a') })
    g.changeModelValue('b')
    expect(g.modelValue.value).toEqual(['a', 'b'])
    const empty = useToggleGroup({ type: 'multiple', modelValue: ref<any>(null) })
    empty.changeModelValue('b')
    expect(empty.modelValue.value).toEqual(['b'])
  })
  it('controlled multiple: emits the next array without writing locally', () => {
    const onUpdate = vi.fn()
    const g = useToggleGroup({ type: 'multiple', modelValue: () => ['a'], onUpdate })
    g.changeModelValue('b')
    expect(g.modelValue.value).toEqual(['a'])
    expect(onUpdate).toHaveBeenCalledWith(['a', 'b'], expect.objectContaining({ reason: 'imperative-action' }))
  })
})

describe('useToggleGroup — surfaces', () => {
  it('root is a role="group" surface with no data-*', () => {
    const g = useToggleGroup()
    expect(g.root.props.value).toEqual({ role: 'group' })
    expect(g.root.attrs.value).toEqual({ role: 'group' })
  })
  it('item props expose aria-pressed/disabled/onClick but NO data-*', () => {
    const g = useToggleGroup({ defaultValue: 'a' })
    const item = g.getItemSurface('a')
    expect(item.props.value).toMatchObject({ 'aria-pressed': true, 'disabled': false })
    expect(noDataAttrs(item.props.value)).toBe(true)
    expect(typeof item.props.value.onClick).toBe('function')
  })
  it('item attrs merges props with data-* derived from state', () => {
    const g = useToggleGroup({ defaultValue: 'a' })
    expect(g.getItemSurface('a').attrs.value).toMatchObject({ 'aria-pressed': true, 'data-state': 'checked' })
    const off = g.getItemSurface('b')
    expect(off.attrs.value).toMatchObject({ 'aria-pressed': false, 'data-state': 'unchecked' })
    expect(off.attrs.value).not.toHaveProperty('data-disabled')
    const disabled = g.getItemSurface('b', true)
    expect(disabled.attrs.value['data-disabled']).toBe('')
    expect(disabled.attrs.value.disabled).toBe(true)
  })
  it('item state reflects selection in single and multiple mode', () => {
    const single = useToggleGroup({ defaultValue: 'a' })
    expect(single.getItemSurface('a').state.value).toEqual({ state: 'checked', disabled: false })
    expect(single.getItemSurface('b').state.value).toEqual({ state: 'unchecked', disabled: false })
    const multiple = useToggleGroup({ defaultValue: ['a', 'b'] })
    expect(multiple.getItemSurface('a').state.value.state).toBe('checked')
    expect(multiple.getItemSurface('b').state.value.state).toBe('checked')
    expect(multiple.getItemSurface('c').state.value.state).toBe('unchecked')
  })
  it('a group-level disabled applies to every item', () => {
    const disabled = ref(false)
    const g = useToggleGroup({ disabled })
    const item = g.getItemSurface('a')
    expect(item.state.value.disabled).toBe(false)
    disabled.value = true
    expect(item.state.value.disabled).toBe(true)
    expect(item.props.value.disabled).toBe(true)
  })
  it('a reactive item value keeps the state live', () => {
    const g = useToggleGroup({ defaultValue: 'a' })
    const value = ref('a')
    const item = g.getItemSurface(() => value.value)
    expect(item.state.value.state).toBe('checked')
    value.value = 'b'
    expect(item.state.value.state).toBe('unchecked')
  })
  it('item onClick presses the item with reason "item-press" and the native event', () => {
    const onUpdate = vi.fn()
    const g = useToggleGroup({ type: 'single', onUpdate })
    const event = new MouseEvent('click')
    g.getItemSurface('a').props.value.onClick(event)
    expect(g.modelValue.value).toBe('a')
    expect(onUpdate).toHaveBeenCalledWith('a', expect.objectContaining({ reason: 'item-press', event, isCanceled: false }))
    expect(g.lastChangeDetails.value.reason).toBe('item-press')
  })
})

describe('useToggleGroup — context', () => {
  it('exposes the frozen-shape context with the composable defaults', () => {
    const g = useToggleGroup({ defaultValue: 'a', orientation: 'vertical' })
    expect(g.context.isSingle.value).toBe(true)
    expect(g.context.modelValue.value).toBe('a')
    expect(g.context.dir?.value).toBe('ltr')
    expect(g.context.orientation).toBe('vertical')
    expect(g.context.loop.value).toBe(true)
    expect(g.context.rovingFocus.value).toBe(true)
    expect(g.context.disabled?.value).toBe(false)
    expect(g.context.changeModelValue('b')).toBe(true)
    expect(g.modelValue.value).toBe('b')
  })
  it('reads dir/loop/rovingFocus reactively', () => {
    const dir = ref<'ltr' | 'rtl'>('rtl')
    const g = useToggleGroup({ dir, loop: () => false, rovingFocus: false })
    expect(g.context.dir?.value).toBe('rtl')
    expect(g.context.loop.value).toBe(false)
    expect(g.context.rovingFocus.value).toBe(false)
    dir.value = 'ltr'
    expect(g.context.dir?.value).toBe('ltr')
  })
})

describe('useToggleGroup — rendered surfaces', () => {
  // A standalone consumer binding the surfaces to plain elements, without the
  // RovingFocus wrappers: group role + per-item aria-pressed have to satisfy axe.
  const Fixture = defineComponent({
    setup() {
      const g = useToggleGroup({ defaultValue: 'center' })
      const items = ['left', 'center', 'right'].map(value => ({ value, surface: g.getItemSurface(value) }))
      return { g, items }
    },
    template: `
      <div v-bind="g.root.attrs.value" aria-label="Text alignment">
        <button v-for="item in items" :key="item.value" v-bind="item.surface.attrs.value" :aria-label="item.value">{{ item.value }}</button>
      </div>
    `,
  })

  it('renders role/aria-pressed/data-state, toggles on click and passes axe', async () => {
    const { container, getByRole, getAllByRole } = render(Fixture)
    expect(getByRole('group').getAttribute('role')).toBe('group')
    const [left, center] = getAllByRole('button')
    expect(center.getAttribute('aria-pressed')).toBe('true')
    expect(center.getAttribute('data-state')).toBe('checked')
    expect(left.getAttribute('aria-pressed')).toBe('false')
    expect(left.getAttribute('data-state')).toBe('unchecked')
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.click(left)
    expect(left.getAttribute('data-state')).toBe('checked')
    expect(center.getAttribute('data-state')).toBe('unchecked')
    await fireEvent.click(left)
    expect(left.getAttribute('data-state')).toBe('unchecked')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('useToggleGroup — public export', () => {
  it('is exported from the package barrel; the surface builder is internal', () => {
    expect(typeof Reka.useToggleGroup).toBe('function')
    expect('getToggleGroupItemSurface' in Reka).toBe(false)
  })
})
