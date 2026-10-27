import { fireEvent, render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { RatingItem, RatingItemIndicator, RatingRoot } from '.'
import * as Reka from '../index'
import { useRating } from './useRating'

describe('useRating — model', () => {
  it('is uncontrolled and starts at defaultValue', () => {
    const r = useRating({ defaultValue: 2 })
    expect(r.modelValue.value).toBe(2)
    expect(r.isControlled.value).toBe(false)
    expect(r.items.value).toEqual([1, 2, 3, 4, 5])
    expect(r.changeModelValue(4)).toBe(true)
    expect(r.modelValue.value).toBe(4)
  })

  it('does not emit when the value is unchanged', () => {
    const onUpdate = vi.fn()
    const r = useRating({ defaultValue: 3, onUpdate })
    expect(r.changeModelValue(3, 'item-press')).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('clearable: pressing the current value clears to 0 and ends the hover preview', () => {
    const onUpdate = vi.fn()
    const r = useRating({ defaultValue: 3, clearable: true, hoverable: true, onUpdate })
    r.changeHoveredRating(3)
    r.changeModelValue(3, 'item-press')
    expect(r.modelValue.value).toBe(0)
    expect(r.hoveredRating.value).toBe(0)
    expect(onUpdate).toHaveBeenCalledWith(0, expect.objectContaining({ reason: 'item-press' }))
  })

  it('cancel() in onBeforeUpdate vetoes the change', () => {
    const onUpdate = vi.fn()
    const r = useRating({ defaultValue: 1, onBeforeUpdate: (_v, details) => details.cancel(), onUpdate })
    expect(r.changeModelValue(4, 'item-press')).toBe(false)
    expect(r.modelValue.value).toBe(1)
    expect(r.lastChangeDetails.value).toMatchObject({ reason: 'item-press', isCanceled: true })
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('disabled ignores changes and hover', () => {
    const r = useRating({ defaultValue: 1, disabled: true, hoverable: true })
    expect(r.changeModelValue(4)).toBe(false)
    r.changeHoveredRating(4)
    expect(r.hoveredRating.value).toBe(0)
  })

  it('controlled with onUpdate does not write; ref-owned writes the ref', () => {
    const controlled = ref(2)
    const onUpdate = vi.fn()
    const c = useRating({ modelValue: controlled, onUpdate })
    c.changeModelValue(5)
    expect(controlled.value).toBe(2)
    expect(c.isControlled.value).toBe(true)
    expect(onUpdate.mock.calls[0]).toEqual([5, expect.objectContaining({ reason: 'imperative-action' })])

    const owned = ref(2)
    const o = useRating({ modelValue: owned })
    o.changeModelValue(5)
    expect(owned.value).toBe(5)
  })

  it('getItemSteps splits an item by step', () => {
    expect(useRating({ step: 0.5 }).getItemSteps(3)).toEqual([2.5, 3])
  })

  it('indicator state is hover-aware', () => {
    const r = useRating({ defaultValue: 1, hoverable: true })
    const third = r.getItemIndicatorSurface(3)
    expect(third.attrs.value['data-state']).toBe('unchecked')
    third.props.value.onMouseenter()
    expect(third.attrs.value['data-state']).toBe('checked')
    r.root.props.value.onMouseleave()
    expect(third.attrs.value['data-state']).toBe('unchecked')
  })
})

describe('useRating — standalone render', () => {
  const Fixture = defineComponent({
    props: { onUpdate: Function },
    setup(props) {
      const rating = useRating({ defaultValue: 1, length: 3, onUpdate: (...args) => (props.onUpdate as any)?.(...args) })
      const indicators = rating.items.value.map(item => rating.getItemIndicatorSurface(item))
      return () => h('div', { ...rating.root.attrs.value, 'aria-label': 'Rating' }, indicators.map((indicator, index) =>
        h('button', { ...indicator.attrs.value, 'type': 'button', 'aria-label': `${index + 1} stars` }, '★')))
    },
  })

  it('binds onto plain buttons, passes axe and selects on click with "item-press"', async () => {
    const onUpdate = vi.fn()
    const { container } = render(Fixture, { props: { onUpdate } })
    const radios = [...container.querySelectorAll('[role=radio]')]
    expect(container.querySelector('[role=radiogroup]')).not.toBeNull()
    expect(radios.map(r => r.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false'])
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.click(radios[2])
    expect(onUpdate).toHaveBeenCalledWith(3, expect.objectContaining({ reason: 'item-press' }))
    await nextTick()
    expect(radios.map(r => r.getAttribute('data-state'))).toEqual(['checked', 'checked', 'checked'])
  })
})

describe('ratingRoot — change details', () => {
  const Fixture = defineComponent({
    props: { modelValue: Number, defaultValue: Number, cancel: Boolean, clearable: Boolean },
    emits: ['update:modelValue', 'beforeUpdate:modelValue'],
    setup(props, { emit }) {
      return () => h(RatingRoot, {
        'modelValue': props.modelValue,
        'defaultValue': props.defaultValue,
        'clearable': props.clearable,
        'length': 3,
        'onBeforeUpdate:modelValue': (value: number, details: any) => {
          if (props.cancel)
            details.cancel()
          emit('beforeUpdate:modelValue', value, details)
        },
        'onUpdate:modelValue': (value: number, details: any) => emit('update:modelValue', value, details),
      }, {
        default: ({ items }: { items: number[] }) => items.map(item =>
          h(RatingItem, { key: item, item }, {
            default: ({ steps }: { steps: number[] }) => steps.map(step =>
              h(RatingItemIndicator, { 'key': step, step, 'aria-label': `${step} stars` }, () => '★')),
          })),
      })
    },
  })

  it('emits beforeUpdate then update with reason "item-press" and the click', async () => {
    const wrapper = mount(Fixture, { props: { defaultValue: 1 }, attachTo: document.body })
    await wrapper.findAll('[role=radio]')[2].trigger('click')
    const [value, details] = wrapper.emitted('update:modelValue')![0] as [number, any]
    expect(value).toBe(3)
    expect(details.reason).toBe('item-press')
    expect(details.event).toBeInstanceOf(MouseEvent)
    expect(wrapper.emitted('beforeUpdate:modelValue')).toHaveLength(1)
    wrapper.unmount()
  })

  it('a cancelled press leaves both the rating and the radio unchanged', async () => {
    const wrapper = mount(Fixture, { props: { defaultValue: 1, cancel: true }, attachTo: document.body })
    const radios = wrapper.findAll('[role=radio]')
    await radios[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(radios[2].attributes('aria-checked')).toBe('false')
    expect(radios[2].attributes('data-state')).toBe('unchecked')
    expect(radios[0].attributes('aria-checked')).toBe('true')
    wrapper.unmount()
  })

  it('re-pressing the current value emits nothing unless clearable', async () => {
    const wrapper = mount(Fixture, { props: { defaultValue: 2 }, attachTo: document.body })
    await wrapper.findAll('[role=radio]')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ clearable: true })
    await wrapper.findAll('[role=radio]')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')![0][0]).toBe(0)
    expect(wrapper.findAll('[role=radio]').every(r => r.attributes('aria-checked') === 'false')).toBe(true)
    wrapper.unmount()
  })

  it('controlled: follows the parent value only', async () => {
    const wrapper = mount(Fixture, { props: { modelValue: 1 }, attachTo: document.body })
    const radios = wrapper.findAll('[role=radio]')
    await radios[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')![0][0]).toBe(3)
    expect(radios[2].attributes('data-state')).toBe('unchecked')
    await wrapper.setProps({ modelValue: 3 })
    expect(radios[2].attributes('data-state')).toBe('checked')
    wrapper.unmount()
  })
})

describe('useRating — public export', () => {
  it('is exported from the package barrel; the indicator builder is internal', () => {
    expect(typeof Reka.useRating).toBe('function')
    expect((Reka as Record<string, unknown>).getRatingItemIndicatorSurface).toBeUndefined()
  })
})
