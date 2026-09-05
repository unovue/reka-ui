import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import * as Reka from '../index'
import { useCheckbox } from './useCheckbox'
import { useCheckboxGroup } from './useCheckboxGroup'

describe('useCheckbox — state', () => {
  it('defaults to unchecked with falseValue', () => {
    const c = useCheckbox()
    expect(c.modelValue.value).toBe(false)
    expect(c.checked.value).toBe(false)
    expect(c.checkedState.value).toBe(false)
    expect(c.disabled.value).toBe(false)
    expect(c.isControlled.value).toBe(false)
    expect(c.lastChangeDetails.value.reason).toBe('none')
  })
  it('toggle() flips between trueValue and falseValue', () => {
    const c = useCheckbox({ trueValue: 'yes', falseValue: 'no', defaultValue: 'no' })
    expect(c.toggle()).toBe(true)
    expect(c.modelValue.value).toBe('yes')
    expect(c.checked.value).toBe(true)
    c.toggle()
    expect(c.modelValue.value).toBe('no')
    expect(c.checked.value).toBe(false)
  })
  it('compares structurally against an object trueValue (ohash isEqual)', () => {
    const c = useCheckbox<Record<string, any>>({ trueValue: { on: true }, falseValue: { on: false }, modelValue: () => ({ on: true }) })
    expect(c.checked.value).toBe(true)
    expect(c.checkedState.value).toBe(true)
  })
  it('indeterminate reads as "indeterminate" and toggles to checked', () => {
    const c = useCheckbox({ defaultValue: 'indeterminate' })
    expect(c.modelValue.value).toBe('indeterminate')
    expect(c.checked.value).toBe(false)
    expect(c.checkedState.value).toBe('indeterminate')
    c.toggle()
    expect(c.modelValue.value).toBe(true)
    expect(c.checkedState.value).toBe(true)
  })
  it('setChecked() sets the value explicitly, including indeterminate', () => {
    const c = useCheckbox()
    expect(c.setChecked(true)).toBe(true)
    expect(c.checked.value).toBe(true)
    expect(c.setChecked(true)).toBe(false)
    c.setChecked('indeterminate')
    expect(c.checkedState.value).toBe('indeterminate')
    c.setChecked(false)
    expect(c.checked.value).toBe(false)
    expect(c.checkedState.value).toBe(false)
  })
  it('disabled is reflected in state and ignores the click, while the imperative toggle() still works', () => {
    const onUpdate = vi.fn()
    const c = useCheckbox({ disabled: true, onUpdate })
    expect(c.disabled.value).toBe(true)
    expect(c.root.state.value.disabled).toBe(true)
    c.root.props.value.onClick(new MouseEvent('click'))
    expect(c.checked.value).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()
    c.toggle()
    expect(c.checked.value).toBe(true)
  })
  it('ref-owned mode writes through the passed ref', () => {
    const model = ref<boolean | 'indeterminate'>(false)
    const c = useCheckbox({ modelValue: model })
    c.toggle()
    expect(model.value).toBe(true)
    expect(c.checked.value).toBe(true)
  })
  it('onUpdate mode does not write the ref and receives (value, details)', () => {
    const model = ref(false)
    const onUpdate = vi.fn()
    const c = useCheckbox({ modelValue: model, onUpdate })
    c.root.props.value.onClick(new MouseEvent('click'))
    expect(model.value).toBe(false)
    expect(c.checked.value).toBe(false)
    expect(c.isControlled.value).toBe(true)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const [value, details] = onUpdate.mock.calls[0]
    expect(value).toBe(true)
    expect(details.reason).toBe('trigger-press')
    expect(details.event).toBeInstanceOf(MouseEvent)
  })
  it('emit mode fires beforeUpdate:modelValue then update:modelValue with details', () => {
    const emit = vi.fn()
    const c = useCheckbox({ modelValue: () => false, emit })
    const event = new MouseEvent('click')
    c.root.props.value.onClick(event)
    expect(c.modelValue.value).toBe(false)
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:modelValue', true, expect.objectContaining({ reason: 'trigger-press', event }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:modelValue', true, expect.objectContaining({ reason: 'trigger-press', event }))
  })
  it('cancel() in onBeforeUpdate vetoes the change', () => {
    const onUpdate = vi.fn()
    const c = useCheckbox({ onBeforeUpdate: (_value, details) => details.cancel(), onUpdate })
    expect(c.toggle()).toBe(false)
    expect(c.checked.value).toBe(false)
    expect(c.lastChangeDetails.value.isCanceled).toBe(true)
    expect(onUpdate).not.toHaveBeenCalled()
  })
  it('imperative toggle()/setChecked() report reason "imperative-action"', () => {
    const onUpdate = vi.fn()
    const c = useCheckbox({ onUpdate })
    c.toggle()
    expect(onUpdate.mock.calls[0][1].reason).toBe('imperative-action')
    c.setChecked(false)
    expect(onUpdate.mock.calls[1][1].reason).toBe('imperative-action')
    expect(c.lastChangeDetails.value.reason).toBe('imperative-action')
  })
})

describe('useCheckbox — part surfaces', () => {
  it('root.props exposes role/aria/disabled/handlers but NO data-*', () => {
    const c = useCheckbox({ required: true })
    expect(c.root.props.value).toMatchObject({ 'role': 'checkbox', 'aria-checked': false, 'aria-required': true, 'disabled': false })
    expect(Object.keys(c.root.props.value).some(k => k.startsWith('data-'))).toBe(false)
    expect(c.root.props.value).not.toHaveProperty('value')
    expect(typeof c.root.props.value.onClick).toBe('function')
    expect(typeof c.root.props.value.onKeydown).toBe('function')
  })
  it('aria-required passes through untouched (undefined omits, false renders)', () => {
    expect(useCheckbox().root.props.value['aria-required']).toBeUndefined()
    expect(useCheckbox({ required: false }).root.props.value['aria-required']).toBe(false)
  })
  it('aria-checked is "mixed" while indeterminate', () => {
    const c = useCheckbox({ defaultValue: 'indeterminate' })
    expect(c.root.props.value['aria-checked']).toBe('mixed')
    c.toggle()
    expect(c.root.props.value['aria-checked']).toBe(true)
  })
  it('root.attrs merges props with data-* derived from state', () => {
    const c = useCheckbox()
    expect(c.root.attrs.value).toMatchObject({ 'role': 'checkbox', 'data-state': 'unchecked' })
    expect(c.root.attrs.value).not.toHaveProperty('data-disabled')
    const d = useCheckbox({ disabled: true, defaultValue: 'indeterminate' })
    expect(d.root.attrs.value['data-disabled']).toBe('')
    expect(d.root.attrs.value['data-state']).toBe('indeterminate')
    expect(d.root.attrs.value.disabled).toBe(true)
  })
  it('root.state carries the semantic state', () => {
    const c = useCheckbox()
    expect(c.root.state.value).toEqual({ state: 'unchecked', disabled: false })
    c.toggle()
    expect(c.root.state.value.state).toBe('checked')
  })
  it('root.props.onKeydown prevents Enter (no toggle) and ignores other keys', () => {
    const onUpdate = vi.fn()
    const c = useCheckbox({ onUpdate })
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    c.root.props.value.onKeydown(enter)
    expect(enter.defaultPrevented).toBe(true)
    expect(c.checked.value).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()
    const space = new KeyboardEvent('keydown', { key: ' ', cancelable: true })
    c.root.props.value.onKeydown(space)
    expect(space.defaultPrevented).toBe(false)
  })
  it('indicator.state mirrors checked/disabled with no props', () => {
    const c = useCheckbox()
    expect(c.indicator.props.value).toEqual({})
    expect(c.indicator.attrs.value).toEqual({ 'data-state': 'unchecked' })
    c.toggle()
    expect(c.indicator.state.value).toEqual({ state: 'checked', disabled: false })
    expect(c.indicator.attrs.value).toEqual({ 'data-state': 'checked' })
    const d = useCheckbox({ disabled: true, defaultValue: 'indeterminate' })
    expect(d.indicator.attrs.value).toEqual({ 'data-state': 'indeterminate', 'data-disabled': '' })
  })
  it('context keeps the { disabled, state } shape', () => {
    const c = useCheckbox({ defaultValue: 'indeterminate' })
    expect(c.context.disabled.value).toBe(false)
    expect(c.context.state.value).toBe('indeterminate')
    c.toggle()
    expect(c.context.state.value).toBe(true)
  })
})

describe('useCheckbox — group mode', () => {
  it('reads checked state from group membership and toggles it through the group', () => {
    const g = useCheckboxGroup<string>({ defaultValue: ['b'] })
    const a = useCheckbox({ value: 'a', group: g.context })
    const b = useCheckbox({ value: 'b', group: g.context })
    expect(a.checkedState.value).toBe(false)
    expect(b.checkedState.value).toBe(true)
    expect(b.root.attrs.value['data-state']).toBe('checked')

    expect(a.toggle()).toBe(true)
    expect(g.modelValue.value).toEqual(['b', 'a'])
    expect(a.checkedState.value).toBe(true)
    b.toggle()
    expect(g.modelValue.value).toEqual(['a'])
    expect(b.checkedState.value).toBe(false)
    // The local model is untouched in group mode.
    expect(a.modelValue.value).toBe(false)
    expect(a.lastChangeDetails.value.reason).toBe('none')
  })
  it('matches object values structurally (ohash isEqual)', () => {
    const g = useCheckboxGroup<Record<string, any>>({ defaultValue: [{ name: 'jack' }] })
    const c = useCheckbox({ value: { name: 'jack' }, group: g.context })
    expect(c.checkedState.value).toBe(true)
    c.toggle()
    expect(g.modelValue.value).toEqual([])
  })
  it('a press reaches the group as reason "item-press"; imperative calls stay "imperative-action"', () => {
    const onUpdate = vi.fn()
    const g = useCheckboxGroup<string>({ onUpdate })
    const c = useCheckbox({ value: 'a', group: g.context })
    const event = new MouseEvent('click')
    c.root.props.value.onClick(event)
    expect(onUpdate).toHaveBeenCalledWith(['a'], expect.objectContaining({ reason: 'item-press', event }))
    c.toggle()
    expect(onUpdate.mock.calls[1][1].reason).toBe('imperative-action')
    expect(g.lastChangeDetails.value.reason).toBe('imperative-action')
  })
  it('setChecked() adds/removes membership and ignores "indeterminate"', () => {
    const g = useCheckboxGroup<string>()
    const c = useCheckbox({ value: 'a', group: g.context })
    expect(c.setChecked(true)).toBe(true)
    expect(g.modelValue.value).toEqual(['a'])
    expect(c.setChecked(true)).toBe(false)
    expect(c.setChecked('indeterminate')).toBe(false)
    expect(g.modelValue.value).toEqual(['a'])
    expect(c.setChecked(false)).toBe(true)
    expect(g.modelValue.value).toEqual([])
  })
  it('group disabled wins over the local disabled', () => {
    const g = useCheckboxGroup({ disabled: true })
    const c = useCheckbox({ disabled: false, group: g.context })
    expect(c.disabled.value).toBe(true)
    expect(c.root.attrs.value).toMatchObject({ 'disabled': true, 'data-disabled': '' })
    expect(c.indicator.attrs.value['data-disabled']).toBe('')
    const local = useCheckbox({ disabled: true, group: useCheckboxGroup().context })
    expect(local.disabled.value).toBe(true)
  })
  it('cancel() in the group\'s onBeforeUpdate vetoes a member press', () => {
    const onUpdate = vi.fn()
    const g = useCheckboxGroup<string>({ onBeforeUpdate: (_value, details) => details.cancel(), onUpdate })
    const c = useCheckbox({ value: 'a', group: g.context })
    expect(c.toggle('trigger-press')).toBe(false)
    expect(g.modelValue.value).toEqual([])
    expect(c.checkedState.value).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()
    expect(g.lastChangeDetails.value).toMatchObject({ reason: 'item-press', isCanceled: true })
  })
  it('falls back to the local model while the group value is nullish', () => {
    const g = useCheckboxGroup<string>({ modelValue: () => null as unknown as string[] })
    const c = useCheckbox({ value: 'a', group: g.context })
    c.toggle()
    expect(c.modelValue.value).toBe(true)
    expect(c.checkedState.value).toBe(true)
  })
})

describe('useCheckbox — rendered', () => {
  const Fixture = defineComponent({
    props: { disabled: Boolean },
    setup(props) {
      const c = useCheckbox({ disabled: () => props.disabled, defaultValue: 'indeterminate' })
      return () => [
        h('label', { id: 'cb-label', for: 'cb' }, 'Accept terms'),
        h('button', { ...c.root.attrs.value, 'id': 'cb', 'type': 'button', 'aria-labelledby': 'cb-label' }, [
          h('span', c.indicator.attrs.value, c.checkedState.value === 'indeterminate' ? '-' : c.checked.value ? 'x' : ''),
        ]),
      ]
    },
  })

  it('binds attrs onto a real element and passes axe', async () => {
    const { container } = render(Fixture)
    const button = container.querySelector('button')!
    expect(button.getAttribute('role')).toBe('checkbox')
    expect(button.getAttribute('aria-checked')).toBe('mixed')
    expect(button.getAttribute('data-state')).toBe('indeterminate')
    expect(button.hasAttribute('disabled')).toBe(false)
    expect(container.querySelector('span')!.getAttribute('data-state')).toBe('indeterminate')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('a click toggles through the bound onClick and re-renders', async () => {
    const { container } = render(Fixture)
    const button = container.querySelector('button')!
    button.click()
    await nextTick()
    expect(button.getAttribute('aria-checked')).toBe('true')
    expect(button.getAttribute('data-state')).toBe('checked')
    expect(container.querySelector('span')!.getAttribute('data-state')).toBe('checked')
  })

  it('renders disabled + data-disabled and passes axe', async () => {
    const { container } = render(Fixture, { props: { disabled: true } })
    const button = container.querySelector('button')!
    expect(button.hasAttribute('disabled')).toBe(true)
    expect(button.getAttribute('data-disabled')).toBe('')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('useCheckbox — public export', () => {
  it('is exported from the package barrel; the indicator builder is internal', () => {
    expect(typeof Reka.useCheckbox).toBe('function')
    expect('getCheckboxIndicatorSurface' in Reka).toBe(false)
  })
})
