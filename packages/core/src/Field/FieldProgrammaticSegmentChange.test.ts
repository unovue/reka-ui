import type { Component } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, shallowRef } from 'vue'
import { DateFieldInput, DateFieldRoot, injectDateFieldRootContext } from '@/DateField'
import { DateRangeFieldInput, DateRangeFieldRoot, injectDateRangeFieldRootContext } from '@/DateRangeField'
import { injectTimeFieldRootContext, TimeFieldInput, TimeFieldRoot } from '@/TimeField'
import { injectTimeRangeFieldRootContext, TimeRangeFieldInput, TimeRangeFieldRoot } from '@/TimeRangeField'
import { FieldRoot } from '.'

type Segment = { part: string, value: string }

// A part composed into the field that writes the value through the root's
// context (reason `'imperative-action'`), as a consumer's preset button would.
function setter(apply: () => void) {
  return defineComponent({
    setup() {
      apply()
      return () => null
    },
  })
}

function single(Root: Component, Input: Component, rootProps: Record<string, unknown>, Setter: Component) {
  return () => h(Root, rootProps, {
    default: ({ segments }: { segments: Segment[] }) => [
      ...segments.map(segment => h(Input, { 'key': segment.part, 'part': segment.part, 'data-segment': '' }, () => segment.value)),
      h(Setter),
    ],
  })
}

function range(Root: Component, Input: Component, rootProps: Record<string, unknown>, Setter: Component) {
  return () => h(Root, rootProps, {
    default: ({ segments }: { segments: Record<'start' | 'end', Segment[]> }) => [
      ...(['start', 'end'] as const).flatMap(type => segments[type].map(segment =>
        h(Input, { 'key': `${type}-${segment.part}`, 'part': segment.part, type, 'data-segment': '' }, () => segment.value))),
      h(Setter),
    ],
  })
}

let write: () => void

const cases: Array<[string, () => () => ReturnType<typeof h>]> = [
  ['DateField', () => single(DateFieldRoot, DateFieldInput, { locale: 'en-US' }, setter(() => {
    const context = injectDateFieldRootContext()
    write = () => context.setModelValue(Temporal.PlainDate.from('2024-01-15'))
  }))],
  ['DateRangeField (setRangeValue)', () => range(DateRangeFieldRoot, DateRangeFieldInput, { locale: 'en-US' }, setter(() => {
    const context = injectDateRangeFieldRootContext()
    write = () => {
      context.setRangeValue('start', Temporal.PlainDate.from('2024-01-15'))
      context.setRangeValue('end', Temporal.PlainDate.from('2024-01-20'))
    }
  }))],
  ['TimeField', () => single(TimeFieldRoot, TimeFieldInput, { hourCycle: 24, granularity: 'minute' }, setter(() => {
    const context = injectTimeFieldRootContext()
    write = () => context.setModelValue(Temporal.PlainDateTime.from('2024-01-15T10:30'))
  }))],
  ['TimeRangeField', () => range(TimeRangeFieldRoot, TimeRangeFieldInput, { hourCycle: 24, granularity: 'minute' }, setter(() => {
    const context = injectTimeRangeFieldRootContext()
    write = () => context.setModelValue({ start: Temporal.PlainTime.from('09:00'), end: Temporal.PlainTime.from('10:30') })
  }))],
]

describe.each(cases)('a Field-wrapped %s set programmatically while a segment has focus', (_, render) => {
  let wrapper: ReturnType<typeof mount> | undefined
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('is filled, but not dirty and not validated on change', async () => {
    const validate = vi.fn(() => null)
    const control = render()
    wrapper = mount(defineComponent(() => () =>
      h(FieldRoot, { 'name': 'value', 'data-testid': 'field', validate, 'validationMode': 'onChange' }, () => control())), { attachTo: document.body })
    await flushPromises()
    const field = () => wrapper!.find('[data-testid="field"]')
    const segment = wrapper.find('[data-segment]').element as HTMLElement
    segment.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    segment.focus()
    await flushPromises()
    expect(field().attributes('data-focused')).toBe('')

    write()
    await flushPromises()
    expect(field().attributes('data-filled')).toBe('')
    expect(field().attributes('data-dirty')).toBeUndefined()
    expect(validate).not.toHaveBeenCalled()
  })
})

// The other segmented fields run the same check through the control contract.
describe('a Field-wrapped DateField whose update handler moves focus out of it', () => {
  it('is dirty after a segment edit', async () => {
    const outside = document.body.appendChild(document.createElement('button'))
    const model = shallowRef<unknown>(Temporal.PlainDate.from('2024-01-15'))
    const wrapper = mount(defineComponent(() => () =>
      h(FieldRoot, { 'name': 'value', 'data-testid': 'field' }, () => h(DateFieldRoot as Component, {
        'locale': 'en-US',
        'modelValue': model.value,
        'onUpdate:modelValue': (value: unknown) => {
          model.value = value
          outside.focus()
        },
      }, {
        default: ({ segments }: { segments: Segment[] }) => segments.map(segment =>
          h(DateFieldInput as Component, { 'key': segment.part, 'part': segment.part, 'data-part': segment.part }, () => segment.value)),
      }))), { attachTo: document.body })
    await flushPromises()
    const day = wrapper.find('[data-part="day"]').element as HTMLElement
    day.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    day.focus()
    day.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    await flushPromises()
    expect(String(model.value)).toBe('2024-01-16')
    expect(document.activeElement).toBe(outside)
    expect(wrapper.find('[data-testid="field"]').attributes('data-dirty')).toBe('')
    wrapper.unmount()
    outside.remove()
  })
})
