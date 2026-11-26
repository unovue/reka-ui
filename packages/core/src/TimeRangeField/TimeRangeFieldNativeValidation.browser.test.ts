import type { TimeRangeFieldRootProps } from './TimeRangeFieldRoot.vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import TimeRangeFieldRoot from './TimeRangeFieldRoot.vue'

const start = new Temporal.PlainTime(9, 30)
const end = new Temporal.PlainTime(17, 0)

async function mountForm(props: TimeRangeFieldRootProps) {
  let submits = 0
  const wrapper = mount({
    render: () => h('form', {
      onSubmit: (event: Event) => {
        event.preventDefault()
        submits++
      },
    }, [h(TimeRangeFieldRoot, props)]),
  }, { attachTo: document.body })
  await nextTick()
  const form = wrapper.get('form').element as HTMLFormElement
  return {
    form,
    input: wrapper.get('input').element as HTMLInputElement,
    getSubmits: () => submits,
    getFormData: () => [...new FormData(form).entries()],
  }
}

describe('timeRangeField native validation', () => {
  it.each([
    { label: 'no value', modelValue: undefined },
    { label: 'a null value', modelValue: null },
    { label: 'an empty range', modelValue: { start: undefined, end: undefined } },
  ])('blocks submission of a required field with $label', async ({ modelValue }) => {
    const { form, input, getSubmits, getFormData } = await mountForm({ name: 'range', required: true, modelValue })

    expect(input.value).toBe('')
    expect(input.validity.valueMissing).toBe(true)
    expect(form.checkValidity()).toBe(false)
    form.requestSubmit()
    expect(getSubmits()).toBe(0)
    expect(getFormData()).toEqual([['range', '']])
  })

  // TODO(v3-port): #3228 v3's toRangeFormValue submits a half-filled range ("09:30:00 - ") instead of an empty value
  it.skip.each([
    { label: 'only a start', modelValue: { start, end: undefined } },
    { label: 'only an end', modelValue: { start: undefined, end } },
  ])('blocks submission of a required field with $label', async ({ modelValue }) => {
    const { form, input, getSubmits, getFormData } = await mountForm({ name: 'range', required: true, modelValue })

    expect(input.value).toBe('')
    expect(input.validity.valueMissing).toBe(true)
    expect(form.checkValidity()).toBe(false)
    form.requestSubmit()
    expect(getSubmits()).toBe(0)
    expect(getFormData()).toEqual([['range', '']])
  })

  it('submits a complete range in the existing format', async () => {
    const { form, input, getSubmits, getFormData } = await mountForm({ name: 'range', required: true, modelValue: { start, end } })

    expect(input.validity.valid).toBe(true)
    expect(form.checkValidity()).toBe(true)
    form.requestSubmit()
    expect(getSubmits()).toBe(1)
    expect(getFormData()).toEqual([['range', '09:30:00 - 17:00:00']])
  })

  it('submits an empty value for an empty optional field', async () => {
    const { form, getSubmits, getFormData } = await mountForm({ name: 'range' })

    form.requestSubmit()
    expect(getSubmits()).toBe(1)
    expect(getFormData()).toEqual([['range', '']])
  })
})
