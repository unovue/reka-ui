import { render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import * as RadioGroup from './index'
import { useRadioGroup } from './useRadioGroup'

const { RadioGroupItem, RadioGroupRoot } = RadioGroup

function noDataAttrs(props: Record<string, any>) {
  return Object.keys(props).every(k => !k.startsWith('data-'))
}

/**
 * `handleSelect` dispatches the `radio.select` custom event on the click's
 * target, so the click has to come from a real element for the protocol to run.
 */
function clickThrough(onClick: (event: MouseEvent) => void) {
  const el = document.createElement('button')
  el.addEventListener('click', onClick)
  const event = new MouseEvent('click', { bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  return event
}

describe('useRadioGroup — state & selection', () => {
  it('defaults modelValue to the provided defaultValue', () => {
    const r = useRadioGroup({ defaultValue: 'a' })
    expect(r.modelValue.value).toBe('a')
    expect(r.isControlled.value).toBe(false)
    expect(r.disabled.value).toBe(false)
    expect(r.required.value).toBe(false)
    expect(r.orientation.value).toBeUndefined()
    expect(r.lastChangeDetails.value.reason).toBe('none')
  })

  it('is undefined (nothing checked) without a defaultValue', () => {
    const r = useRadioGroup()
    expect(r.modelValue.value).toBeUndefined()
    expect(r.getItemSurface('a').state.value.state).toBe('unchecked')
  })

  it('selectValue updates the model and records imperative-action details', () => {
    const r = useRadioGroup({ defaultValue: 'a' })
    expect(r.selectValue('b')).toBe(true)
    expect(r.modelValue.value).toBe('b')
    expect(r.lastChangeDetails.value.reason).toBe('imperative-action')
    // Unchanged → false, no new details.
    expect(r.selectValue('b')).toBe(false)
  })

  it('ref-owned mode: writes through an externally-owned model ref', () => {
    const model = ref<string | undefined>('a')
    const r = useRadioGroup({ modelValue: model })
    expect(r.isControlled.value).toBe(true)
    r.selectValue('b')
    expect(model.value).toBe('b')
    expect(r.modelValue.value).toBe('b')
  })

  it('controlled getter + emit: emits beforeUpdate/update with details and does not write locally', () => {
    const emit = vi.fn()
    const r = useRadioGroup({ modelValue: () => 'a', emit })
    expect(r.isControlled.value).toBe(true)
    r.selectValue('b')
    expect(r.modelValue.value).toBe('a')
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:modelValue', 'b', expect.objectContaining({ reason: 'imperative-action' }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:modelValue', 'b', expect.objectContaining({ reason: 'imperative-action' }))
  })

  it('onUpdate mode does not write the ref and receives (value, details)', () => {
    const model = ref<string | undefined>('a')
    const onUpdate = vi.fn()
    const r = useRadioGroup({ modelValue: model, onUpdate })
    clickThrough(r.getItemSurface('b').props.value.onClick)
    expect(model.value).toBe('a')
    expect(r.modelValue.value).toBe('a')
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const [value, details] = onUpdate.mock.calls[0]
    expect(value).toBe('b')
    expect(details.reason).toBe('item-press')
    expect(details.event).toBeInstanceOf(MouseEvent)
  })

  it('cancel in onBeforeUpdate leaves the selection unchanged', () => {
    const onUpdate = vi.fn()
    const r = useRadioGroup({
      defaultValue: 'a',
      onBeforeUpdate: (_value, details) => details.cancel(),
      onUpdate,
    })
    expect(r.selectValue('b')).toBe(false)
    expect(r.modelValue.value).toBe('a')
    expect(onUpdate).not.toHaveBeenCalled()
    expect(r.lastChangeDetails.value.isCanceled).toBe(true)
  })

  it('reads disabled/required/orientation reactively from getters', () => {
    const disabled = ref(false)
    const r = useRadioGroup({ disabled, required: () => true, orientation: () => 'vertical' })
    expect(r.disabled.value).toBe(false)
    expect(r.required.value).toBe(true)
    expect(r.orientation.value).toBe('vertical')
    disabled.value = true
    expect(r.disabled.value).toBe(true)
    expect(r.context.disabled.value).toBe(true)
  })
})

describe('useRadioGroup — root surface', () => {
  it('root.props carries role/aria-orientation/aria-required/dir but NO data-*', () => {
    const r = useRadioGroup({ orientation: 'vertical', required: true, dir: 'rtl' })
    expect(r.root.props.value).toEqual({ 'role': 'radiogroup', 'aria-orientation': 'vertical', 'aria-required': true, 'dir': 'rtl' })
    expect(noDataAttrs(r.root.props.value)).toBe(true)
  })

  it('aria-required passes through (false renders, undefined omits); dir defaults to ltr', () => {
    expect(useRadioGroup({ required: false }).root.props.value['aria-required']).toBe(false)
    const r = useRadioGroup()
    expect(r.root.props.value['aria-required']).toBeUndefined()
    expect(r.root.props.value['aria-orientation']).toBeUndefined()
    expect(r.root.props.value.dir).toBe('ltr')
  })

  it('root.attrs merges props with data-disabled derived from state', () => {
    const r = useRadioGroup()
    expect(r.root.state.value).toEqual({ disabled: false })
    expect(r.root.attrs.value).toEqual({ role: 'radiogroup', dir: 'ltr' })
    const d = useRadioGroup({ disabled: true })
    expect(d.root.state.value).toEqual({ disabled: true })
    expect(d.root.attrs.value['data-disabled']).toBe('')
  })
})

describe('useRadioGroup — item surface', () => {
  it('builds role/aria-checked/value/handlers with NO data-*', () => {
    const r = useRadioGroup({ defaultValue: 'a' })
    const item = r.getItemSurface('a')
    expect(item.props.value).toMatchObject({ 'role': 'radio', 'aria-checked': true, 'value': 'a' })
    expect(item.props.value.disabled).toBeUndefined()
    expect(noDataAttrs(item.props.value)).toBe(true)
    expect(typeof item.props.value.onClick).toBe('function')
    expect(typeof item.props.value.onKeydown).toBe('function')
  })

  it('attrs merges props with the data-* derived from state', () => {
    const r = useRadioGroup({ defaultValue: 'a' })
    expect(r.getItemSurface('a').attrs.value).toMatchObject({ 'role': 'radio', 'aria-checked': true, 'data-state': 'checked' })
    expect(r.getItemSurface('a').attrs.value).not.toHaveProperty('data-disabled')
    const disabled = r.getItemSurface('b', true)
    expect(disabled.attrs.value).toMatchObject({ 'aria-checked': false, 'data-state': 'unchecked', 'data-disabled': '' })
    // `''`, not `true` — the exact value shape Radio.vue binds.
    expect(disabled.props.value.disabled).toBe('')
  })

  it('carries semantic state and follows the model', () => {
    const r = useRadioGroup({ defaultValue: 'a' })
    const item = r.getItemSurface('b')
    expect(item.state.value).toEqual({ state: 'unchecked', disabled: false })
    r.selectValue('b')
    expect(item.state.value.state).toBe('checked')
    expect(item.props.value['aria-checked']).toBe(true)
  })

  it('a reactive value passed as a getter keeps state live', () => {
    const r = useRadioGroup({ defaultValue: 'a' })
    const value = ref('a')
    const item = r.getItemSurface(() => value.value)
    expect(item.state.value.state).toBe('checked')
    value.value = 'b'
    expect(item.state.value.state).toBe('unchecked')
    expect(item.props.value.value).toBe('b')
  })

  it('compares object values structurally (ohash isEqual)', () => {
    const r = useRadioGroup({ defaultValue: { id: 1 } })
    expect(r.getItemSurface({ id: 1 }).state.value.state).toBe('checked')
    expect(r.getItemSurface({ id: 2 }).state.value.state).toBe('unchecked')
  })

  it('inherits disabled and required from the group', () => {
    const r = useRadioGroup({ disabled: true, required: true })
    const item = r.getItemSurface('a')
    expect(item.state.value.disabled).toBe(true)
    expect(item.props.value.disabled).toBe('')
    expect(item.props.value.required).toBe(true)
    const own = useRadioGroup().getItemSurface('a', () => true, () => true)
    expect(own.state.value.disabled).toBe(true)
    expect(own.props.value.required).toBe(true)
    expect(useRadioGroup().getItemSurface('a').props.value.required).toBe(false)
  })

  it('onClick stops propagation, checks the radio with reason item-press and the click event', () => {
    const onUpdate = vi.fn()
    const r = useRadioGroup({ defaultValue: 'a', onUpdate })
    const outer = vi.fn()
    document.body.addEventListener('click', outer)
    const el = document.createElement('button')
    document.body.appendChild(el)
    el.addEventListener('click', r.getItemSurface('b').props.value.onClick)
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    el.dispatchEvent(event)
    document.body.removeEventListener('click', outer)
    el.remove()

    expect(outer).not.toHaveBeenCalled()
    expect(r.modelValue.value).toBe('b')
    expect(onUpdate).toHaveBeenCalledWith('b', expect.objectContaining({ reason: 'item-press', event, isCanceled: false }))
    expect(r.lastChangeDetails.value.reason).toBe('item-press')
  })

  it('onClick does nothing for a disabled item (own or group)', () => {
    const r = useRadioGroup({ defaultValue: 'a' })
    clickThrough(r.getItemSurface('b', true).props.value.onClick)
    expect(r.modelValue.value).toBe('a')
    const g = useRadioGroup({ defaultValue: 'a', disabled: true })
    clickThrough(g.getItemSurface('b').props.value.onClick)
    expect(g.modelValue.value).toBe('a')
  })

  it('a click on the already-checked item attempts no change', () => {
    const onBeforeUpdate = vi.fn()
    const r = useRadioGroup({ defaultValue: 'a', onBeforeUpdate })
    clickThrough(r.getItemSurface('a').props.value.onClick)
    expect(onBeforeUpdate).not.toHaveBeenCalled()
  })

  it('onKeydown prevents default on Enter only', () => {
    const r = useRadioGroup()
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    r.getItemSurface('a').props.value.onKeydown(enter)
    expect(enter.defaultPrevented).toBe(true)
    const space = new KeyboardEvent('keydown', { key: ' ', cancelable: true })
    r.getItemSurface('a').props.value.onKeydown(space)
    expect(space.defaultPrevented).toBe(false)
    expect(r.modelValue.value).toBeUndefined()
  })

  it('cancel in onBeforeUpdate vetoes a click', () => {
    const r = useRadioGroup({ defaultValue: 'a', onBeforeUpdate: (_value, details) => details.cancel() })
    clickThrough(r.getItemSurface('b').props.value.onClick)
    expect(r.modelValue.value).toBe('a')
    expect(r.lastChangeDetails.value).toMatchObject({ reason: 'item-press', isCanceled: true })
  })
})

describe('useRadioGroup — context', () => {
  it('exposes the frozen context shape; changeModelValue routes through setState', () => {
    const onUpdate = vi.fn()
    const r = useRadioGroup({ defaultValue: 'a', orientation: 'vertical', loop: false, name: 'group', onUpdate })
    expect(r.context.modelValue?.value).toBe('a')
    expect(r.context.orientation.value).toBe('vertical')
    expect(r.context.loop.value).toBe(false)
    expect(r.context.name).toBe('group')
    expect(r.context.required.value).toBe(false)
    expect(r.context.changeModelValue('b')).toBe(true)
    expect(r.modelValue.value).toBe('b')
    expect(onUpdate.mock.calls[0][1].reason).toBe('imperative-action')
    // Unchanged → false, so a caller can tell "nothing to do" from "cancelled".
    expect(r.context.changeModelValue('b')).toBe(false)
  })

  it('loop defaults to true; name is snapshotted at call time', () => {
    const name = ref<string | undefined>('first')
    const r = useRadioGroup({ name })
    expect(r.context.loop.value).toBe(true)
    name.value = 'second'
    expect(r.context.name).toBe('first')
  })
})

describe('useRadioGroup — rendered', () => {
  const Fixture = defineComponent({
    props: { disabled: Boolean },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const group = useRadioGroup({
        defaultValue: 'a',
        disabled: () => props.disabled,
        onUpdate: (value, details) => emit('update:modelValue', value, details),
      })
      const items = ['a', 'b', 'c'].map(value => ({ value, surface: group.getItemSurface(value) }))
      return () => h('div', { 'aria-label': 'Density', ...group.root.attrs.value }, items.map(({ value, surface }) =>
        h('button', { 'type': 'button', 'aria-label': value, 'data-testid': value, ...surface.attrs.value }, value)))
    },
  })

  it('passes axe with labelled radios', async () => {
    const { container } = render(Fixture)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders role/aria/data-* from the surfaces and checks on click', async () => {
    const { getByTestId, emitted } = render(Fixture)
    const a = getByTestId('a')
    const b = getByTestId('b')
    expect(a.getAttribute('role')).toBe('radio')
    expect(a.getAttribute('aria-checked')).toBe('true')
    expect(a.getAttribute('data-state')).toBe('checked')
    expect(b.getAttribute('data-state')).toBe('unchecked')
    expect(a.parentElement?.getAttribute('role')).toBe('radiogroup')

    b.click()
    await nextTick()
    expect(b.getAttribute('aria-checked')).toBe('true')
    expect(b.getAttribute('data-state')).toBe('checked')
    expect(a.getAttribute('data-state')).toBe('unchecked')
    expect(emitted('update:modelValue')?.[0]?.[0]).toBe('b')
    expect(emitted('update:modelValue')?.[0]?.[1]).toMatchObject({ reason: 'item-press' })
  })

  it('renders disabled="" and data-disabled on every item when the group is disabled', () => {
    const { getByTestId } = render(Fixture, { props: { disabled: true } })
    expect(getByTestId('b').getAttribute('disabled')).toBe('')
    expect(getByTestId('b').getAttribute('data-disabled')).toBe('')
    getByTestId('b').click()
    expect(getByTestId('b').getAttribute('data-state')).toBe('unchecked')
  })
})

describe('radioGroupRoot — change details through the SFCs', () => {
  const Group = defineComponent({
    components: { RadioGroupItem, RadioGroupRoot },
    props: { modelValue: String },
    emits: ['beforeUpdate:modelValue', 'update:modelValue', 'select'],
    template: `
      <RadioGroupRoot
        :model-value="modelValue"
        @before-update:model-value="(v, d) => $emit('beforeUpdate:modelValue', v, d)"
        @update:model-value="(v, d) => $emit('update:modelValue', v, d)"
      >
        <RadioGroupItem value="a" aria-label="a" />
        <RadioGroupItem value="b" aria-label="b" @select="e => $emit('select', e)" />
      </RadioGroupRoot>
    `,
  })

  it('emits beforeUpdate then update with item-press details carrying the click event', async () => {
    document.body.innerHTML = ''
    const wrapper = mount(Group, { props: { modelValue: 'a' }, attachTo: document.body })
    const radios = wrapper.findAll('[role=radio]')
    await radios[1].trigger('click')

    const before = wrapper.emitted('beforeUpdate:modelValue')?.[0]
    const update = wrapper.emitted('update:modelValue')?.[0]
    expect(before?.[0]).toBe('b')
    expect(before?.[1]).toMatchObject({ reason: 'item-press' })
    expect(update?.[0]).toBe('b')
    expect(update?.[1]).toMatchObject({ reason: 'item-press', isCanceled: false })
    expect((update?.[1] as any).event).toBeInstanceOf(MouseEvent)
    // Controlled: nothing written locally until the parent updates the prop.
    expect(radios[1].attributes('data-state')).toBe('unchecked')
    expect(wrapper.emitted('select')?.[0]?.[0]).toBeTruthy()
    wrapper.unmount()
  })

  it('cancel() in beforeUpdate:modelValue keeps the current value (uncontrolled)', async () => {
    document.body.innerHTML = ''
    const wrapper = mount({
      components: { RadioGroupItem, RadioGroupRoot },
      template: `
        <RadioGroupRoot default-value="a" @before-update:model-value="(_v, d) => d.cancel()">
          <RadioGroupItem value="a" aria-label="a" />
          <RadioGroupItem value="b" aria-label="b" />
        </RadioGroupRoot>
      `,
    }, { attachTo: document.body })
    const radios = wrapper.findAll('[role=radio]')
    await radios[1].trigger('click')
    expect(radios[0].attributes('data-state')).toBe('checked')
    expect(radios[1].attributes('data-state')).toBe('unchecked')
    wrapper.unmount()
  })

  it('a prevented `select` event blocks the change', async () => {
    document.body.innerHTML = ''
    const wrapper = mount({
      components: { RadioGroupItem, RadioGroupRoot },
      template: `
        <RadioGroupRoot default-value="a">
          <RadioGroupItem value="a" aria-label="a" />
          <RadioGroupItem value="b" aria-label="b" @select="e => e.preventDefault()" />
        </RadioGroupRoot>
      `,
    }, { attachTo: document.body })
    const radios = wrapper.findAll('[role=radio]')
    await radios[1].trigger('click')
    expect(radios[0].attributes('data-state')).toBe('checked')
    expect(radios[1].attributes('data-state')).toBe('unchecked')
    wrapper.unmount()
  })

  it('runs a consumer @click on the item before the internal check (both fire, consumer first)', async () => {
    document.body.innerHTML = ''
    const order: string[] = []
    const wrapper = mount({
      components: { RadioGroupItem, RadioGroupRoot },
      props: ['onItemClick', 'onUpdate'],
      template: `
        <RadioGroupRoot default-value="a" @update:model-value="onUpdate">
          <RadioGroupItem value="a" aria-label="a" />
          <RadioGroupItem value="b" aria-label="b" @click="onItemClick" />
        </RadioGroupRoot>
      `,
    }, {
      props: { onItemClick: () => order.push('consumer'), onUpdate: () => order.push('update') },
      attachTo: document.body,
    })
    await wrapper.findAll('[role=radio]')[1].trigger('click')
    expect(order).toEqual(['consumer', 'update'])
    wrapper.unmount()
  })
})

describe('useRadioGroup — public export', () => {
  it('is exported from the family index; the surface builders are internal', () => {
    expect(typeof RadioGroup.useRadioGroup).toBe('function')
    expect('getRadioGroupItemSurface' in RadioGroup).toBe(false)
    expect('getRadioGroupIndicatorSurface' in RadioGroup).toBe(false)
    expect('getRadioSurface' in RadioGroup).toBe(false)
  })
})
