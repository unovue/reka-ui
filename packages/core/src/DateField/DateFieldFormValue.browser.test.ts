import type { Component } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick, shallowRef } from 'vue'
import { DatePickerField, DatePickerRoot } from '@/DatePicker'
import { DateRangeFieldRoot } from '@/DateRangeField'
import { DateRangePickerField, DateRangePickerRoot } from '@/DateRangePicker'
import DateFieldRoot from './DateFieldRoot.vue'

const plainDate = new Temporal.PlainDate(2026, 11, 30)
const plainDateTime = new Temporal.PlainDateTime(2026, 11, 30, 23, 59)
const zoned = Temporal.ZonedDateTime.from('2026-11-30T23:59:00-05:00[America/New_York]')
const zonedLater = Temporal.ZonedDateTime.from('2026-12-02T08:15:00-05:00[America/New_York]')

async function mountForm(render: () => any) {
  let submits = 0
  const wrapper = mount({
    render: () => h('form', {
      onSubmit: (event: Event) => {
        event.preventDefault()
        submits++
      },
    }, [render()]),
  }, { attachTo: document.body })
  await nextTick()
  const form = wrapper.get('form').element as HTMLFormElement
  return {
    wrapper,
    form,
    /** Every entry the form submits, so a second named control would show up. */
    entries: () => Array.from(new FormData(form).entries()),
    getSubmits: () => submits,
  }
}

const single: [string, (props: Record<string, unknown>) => any][] = [
  ['DateFieldRoot', props => h(DateFieldRoot, props)],
  ['DatePickerRoot', props => h(DatePickerRoot as Component, props, () => h(DatePickerField))],
]
const range: [string, (props: Record<string, unknown>) => any][] = [
  ['DateRangeFieldRoot', props => h(DateRangeFieldRoot, props)],
  ['DateRangePickerRoot', props => h(DateRangePickerRoot as Component, props, () => h(DateRangePickerField))],
]

describe.each(single)('%s form value', (_, render) => {
  it('submits a plain date as an ISO date', async () => {
    const { entries } = await mountForm(() => render({ name: 'date', modelValue: plainDate }))
    expect(entries()).toEqual([['date', '2026-11-30']])
  })

  it('submits a plain date-time as a local date-time', async () => {
    const { entries } = await mountForm(() => render({ name: 'date', modelValue: plainDateTime }))
    expect(entries()).toEqual([['date', '2026-11-30T23:59']])
  })

  it('submits a zoned date-time with its offset and time zone', async () => {
    const { entries } = await mountForm(() => render({ name: 'date', modelValue: zoned }))
    expect(entries()).toEqual([['date', '2026-11-30T23:59:00-05:00[America/New_York]']])
  })

  it('submits an empty string for an empty field', async () => {
    const { entries } = await mountForm(() => render({ name: 'date', defaultPlaceholder: zoned }))
    expect(entries()).toEqual([['date', '']])
  })

  it('submits nothing when a zoned field is disabled', async () => {
    const { entries } = await mountForm(() => render({ name: 'date', modelValue: zoned, disabled: true }))
    expect(entries()).toEqual([])
  })
})

describe.each(range)('%s form value', (_, render) => {
  it('submits plain dates as ISO dates', async () => {
    const { entries } = await mountForm(() => render({ name: 'date', modelValue: { start: plainDate, end: plainDate.add({ days: 2 }) } }))
    expect(entries()).toEqual([['date', '2026-11-30 - 2026-12-02']])
  })

  it('submits plain date-times as local date-times', async () => {
    const { entries } = await mountForm(() => render({ name: 'date', modelValue: { start: plainDateTime, end: plainDateTime.add({ days: 2 }) } }))
    expect(entries()).toEqual([['date', '2026-11-30T23:59:00 - 2026-12-02T23:59:00']])
  })

  it('submits zoned date-times with their offset and time zone', async () => {
    const { entries } = await mountForm(() => render({ name: 'date', modelValue: { start: zoned, end: zonedLater } }))
    expect(entries()).toEqual([['date', '2026-11-30T23:59:00-05:00[America/New_York] - 2026-12-02T08:15:00-05:00[America/New_York]']])
  })
})

describe('dateField zoned native validation', () => {
  it.each([
    { props: { modelValue: zoned, minValue: zonedLater }, reason: 'rangeUnderflow' },
    { props: { modelValue: zonedLater, maxValue: zoned }, reason: 'rangeOverflow' },
    { props: { defaultPlaceholder: zoned, required: true }, reason: 'valueMissing' },
  ] as const)('blocks submit on $reason', async ({ props, reason }) => {
    const { wrapper, form, getSubmits } = await mountForm(() => h(DateFieldRoot, { name: 'date', ...props }))
    const input = wrapper.get('input[aria-hidden="true"]').element as HTMLInputElement
    expect(input.validity[reason]).toBe(true)
    form.requestSubmit()
    expect(getSubmits()).toBe(0)
  })

  it('submits a zoned value inside its bounds', async () => {
    const { form, entries, getSubmits } = await mountForm(() => h(DateFieldRoot, {
      name: 'date',
      modelValue: zonedLater,
      minValue: zoned,
      maxValue: zonedLater.add({ days: 1 }),
      required: true,
    }))
    form.requestSubmit()
    expect(getSubmits()).toBe(1)
    expect(entries()).toEqual([['date', '2026-12-02T08:15:00-05:00[America/New_York]']])
  })

  it('keeps one named control when the value changes between zoned and plain', async () => {
    const model = shallowRef<Temporal.ZonedDateTime | Temporal.PlainDateTime>(zoned)
    const { wrapper, entries } = await mountForm(() => h(DateFieldRoot, { name: 'date', modelValue: model.value }))
    expect(wrapper.findAll('input[name="date"]')).toHaveLength(1)
    expect(entries()).toEqual([['date', '2026-11-30T23:59:00-05:00[America/New_York]']])

    model.value = plainDateTime
    await nextTick()
    expect(wrapper.findAll('input[name="date"]')).toHaveLength(1)
    expect(wrapper.find('input[type="hidden"]').exists()).toBe(false)
    expect(entries()).toEqual([['date', '2026-11-30T23:59']])

    model.value = zonedLater
    await nextTick()
    expect(wrapper.findAll('input[name="date"]')).toHaveLength(1)
    expect(entries()).toEqual([['date', '2026-12-02T08:15:00-05:00[America/New_York]']])
  })
})
