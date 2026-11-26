import type { Component } from 'vue'
import { CalendarDate, CalendarDateTime } from '@internationalized/date'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { h, nextTick } from 'vue'
import { DateRangePickerField, DateRangePickerRoot } from '@/DateRangePicker'
import DateRangeFieldRoot from './DateRangeFieldRoot.vue'
import DateRangeField from './story/_DateRangeField.vue'

const start = new CalendarDate(2022, 1, 1)
const end = new CalendarDate(2022, 3, 1)

async function mountForm(render: () => ReturnType<typeof h>) {
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
    input: wrapper.get('input').element as HTMLInputElement,
    getSubmits: () => submits,
    getFormData: () => [...new FormData(form).entries()],
  }
}

const fields: { name: string, render: (props: Record<string, unknown>) => ReturnType<typeof h> }[] = [
  { name: 'DateRangeFieldRoot', render: props => h(DateRangeFieldRoot, props) },
  { name: 'DateRangePickerRoot', render: props => h(DateRangePickerRoot as Component, props, () => h(DateRangePickerField)) },
]

describe.each(fields)('$name native validation', ({ render }) => {
  it.each([
    { label: 'no value', modelValue: undefined },
    { label: 'a null value', modelValue: null },
    { label: 'an empty range', modelValue: { start: undefined, end: undefined } },
    { label: 'only a start', modelValue: { start, end: undefined } },
    { label: 'only an end', modelValue: { start: undefined, end } },
  ])('blocks submission of a required field with $label', async ({ modelValue }) => {
    const { form, input, getSubmits, getFormData } = await mountForm(() => render({ name: 'range', required: true, modelValue }))

    expect(input.value).toBe('')
    expect(input.validity.valueMissing).toBe(true)
    expect(form.checkValidity()).toBe(false)
    form.requestSubmit()
    expect(getSubmits()).toBe(0)
    expect(getFormData()).toEqual([['range', '']])
  })

  it('submits a complete range in the existing format', async () => {
    const { form, input, getSubmits, getFormData } = await mountForm(() => render({ name: 'range', required: true, modelValue: { start, end } }))

    expect(input.validity.valid).toBe(true)
    expect(form.checkValidity()).toBe(true)
    form.requestSubmit()
    expect(getSubmits()).toBe(1)
    expect(getFormData()).toEqual([['range', '2022-01-01 - 2022-03-01']])
  })

  it('submits an empty value for an empty optional field', async () => {
    const { form, getSubmits, getFormData } = await mountForm(() => render({ name: 'range' }))

    form.requestSubmit()
    expect(getSubmits()).toBe(1)
    expect(getFormData()).toEqual([['range', '']])
  })
})

describe('dateRangeField native validation', () => {
  it('keeps the date time format of a complete range', async () => {
    const { getFormData } = await mountForm(() => h(DateRangeFieldRoot, {
      name: 'range',
      modelValue: { start: new CalendarDateTime(2022, 1, 1, 12, 30), end: new CalendarDateTime(2022, 3, 1, 12, 30) },
    }))

    expect(getFormData()).toEqual([['range', '2022-01-01T12:30:00 - 2022-03-01T12:30:00']])
  })

  it('stays missing until both dates are typed', async () => {
    const { wrapper, form, input, getSubmits, getFormData } = await mountForm(() => h(DateRangeField, {
      dateFieldProps: { name: 'range', required: true, locale: 'en-US' },
    }))

    await userEvent.click(wrapper.get('[data-testid="start-month"]').element)
    await userEvent.keyboard('01012022')
    await nextTick()
    expect(input.value).toBe('')
    expect(input.validity.valueMissing).toBe(true)
    form.requestSubmit()
    expect(getSubmits()).toBe(0)

    // The blocked submit moves focus to the first segment, so go back to the end date.
    await userEvent.click(wrapper.get('[data-testid="end-month"]').element)
    await userEvent.keyboard('03012022')
    await nextTick()
    expect(input.validity.valid).toBe(true)
    form.requestSubmit()
    expect(getSubmits()).toBe(1)
    expect(getFormData()).toEqual([['range', '2022-01-01 - 2022-03-01']])
  })
})
