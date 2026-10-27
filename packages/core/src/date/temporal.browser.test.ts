// The #3088 review regressions on the browser's native Temporal (the setup's
// `install(false)` keeps it), where jsdom runs on the polyfill.
import type { DateValue } from './types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import CalendarViews from '../Calendar/story/_CalendarViews.vue'
import { DateFieldInput, DateFieldRoot } from '../DateField'

function mountDateField(initial: DateValue, props: Record<string, unknown> = {}) {
  const model = ref<DateValue>(initial)
  const Field = defineComponent({
    setup: () => () => h(DateFieldRoot, {
      ...props,
      'modelValue': model.value,
      'onUpdate:modelValue': (value: DateValue | undefined) => { model.value = value! },
    }, {
      default: ({ segments }: { segments: { part: any, value: string }[] }) =>
        segments.map(segment => h(DateFieldInput, { key: segment.part, part: segment.part }, () => segment.value)),
    }),
  })
  const wrapper = mount(Field, { attachTo: document.body })
  const segment = (part: string) => document.querySelector<HTMLElement>(`[data-reka-date-field-segment="${part}"]`)!
  return { model, segment, wrapper }
}

it('runs on the native Temporal', () => {
  expect(Function.prototype.toString.call(Temporal.PlainDate)).toContain('[native code]')
})

describe('temporal regressions (#3088 review), native Temporal', () => {
  it('steps the hour of a ZonedDateTime over a spring-forward gap', async () => {
    const { model, segment, wrapper } = mountDateField(Temporal.ZonedDateTime.from('2024-03-10T03:30-04:00[America/New_York]'), { granularity: 'minute' })
    segment('hour').focus()
    await userEvent.keyboard('{ArrowDown}')
    await vi.waitFor(() => expect(model.value.toString()).toBe('2024-03-10T01:30:00-05:00[America/New_York]'))
    wrapper.unmount()
  })

  it('wraps the year within a Japanese era', async () => {
    const { model, segment, wrapper } = mountDateField(Temporal.PlainDate.from('1989-04-30').withCalendar('japanese'), { locale: 'ja-JP-u-ca-japanese' })
    segment('year').focus()
    await userEvent.keyboard('{ArrowDown}')
    await vi.waitFor(() => expect(model.value.toString({ calendarName: 'never' })).toBe('2019-04-30'))
    expect([model.value.era, model.value.eraYear]).toEqual(['heisei', 31])
    wrapper.unmount()
  })

  it('heads an ISO grid with Gregorian month names in a Persian-calendar locale', () => {
    const wrapper = mount(CalendarViews, { attachTo: document.body, props: { locale: 'fa-IR', placeholder: Temporal.PlainDate.from('2024-12-15') } })
    expect(document.querySelector('[role="heading"]')!.textContent).toContain('دسامبر')
    wrapper.unmount()
  })
})
