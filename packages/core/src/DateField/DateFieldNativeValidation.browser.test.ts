import type { DateFieldRootProps } from './DateFieldRoot.vue'
import { CalendarDate, CalendarDateTime } from '@internationalized/date'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import DateFieldRoot from './DateFieldRoot.vue'

const value = new CalendarDateTime(2026, 11, 30, 23, 59, 59)
const minValue = new CalendarDateTime(2026, 10, 7, 15, 20, 6)

async function mountForm(props: DateFieldRootProps) {
  let submits = 0
  const wrapper = mount({
    render: () => h('form', {
      onSubmit: (event: Event) => {
        event.preventDefault()
        submits++
      },
    }, [h(DateFieldRoot, props)]),
  }, { attachTo: document.body })
  await nextTick()
  return {
    input: wrapper.get('input').element as HTMLInputElement,
    form: wrapper.get('form').element as HTMLFormElement,
    getSubmits: () => submits,
  }
}

describe('dateField native validation', () => {
  it('submits second-precision values whose seconds differ from minValue', async () => {
    const { input, form, getSubmits } = await mountForm({
      modelValue: value,
      minValue,
      granularity: 'second',
    })
    expect(input.validity.stepMismatch).toBe(false)
    expect(input.validity.valid).toBe(true)
    form.requestSubmit()
    expect(getSubmits()).toBe(1)
  })

  it.each(['minute', 'day'] as const)('keeps native default step for %s granularity', async (granularity) => {
    const { input, form, getSubmits } = await mountForm({
      modelValue: granularity === 'day' ? new CalendarDate(2026, 11, 30) : value,
      granularity,
    })
    expect(input.hasAttribute('step')).toBe(false)
    expect(input.validity.valid).toBe(true)
    form.requestSubmit()
    expect(getSubmits()).toBe(1)
  })

  it.each([
    { props: { modelValue: new CalendarDateTime(2026, 10, 7, 15, 20, 5), minValue }, reason: 'rangeUnderflow' },
    { props: { modelValue: value, maxValue: new CalendarDateTime(2026, 11, 30, 23, 59, 58) }, reason: 'rangeOverflow' },
    { props: { defaultPlaceholder: value, required: true }, reason: 'valueMissing' },
  ] as const)('preserves $reason validation', async ({ props, reason }) => {
    const { input, form, getSubmits } = await mountForm({ ...props, granularity: 'second' })
    expect(input.validity[reason]).toBe(true)
    expect(input.validity.valid).toBe(false)
    form.requestSubmit()
    expect(getSubmits()).toBe(0)
  })
})
