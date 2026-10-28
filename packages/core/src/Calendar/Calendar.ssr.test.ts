import type { Component } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'
import DateField from '@/DateField/story/_DateField.vue'
import RangeCalendar from '@/RangeCalendar/story/_RangeCalendar.vue'
import Calendar from './story/_Calendar.vue'

// The cells and segments render their slot content without a fragment and read
// their state from the root's keyed index: the server markup must match what
// the client hydrates, cell for cell.

const jan20 = new Temporal.PlainDate(1980, 1, 20)

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

async function hydrate(component: Component, props: Record<string, unknown>) {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const app = () => createSSRApp({ render: () => h(component, props) })
  const html = await renderToString(app())
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.append(container)
  app().mount(container)
  await nextTick()
  const messages = [...warn.mock.calls, ...error.mock.calls].flat().join('\n')
  expect(messages).not.toMatch(/hydration/i)
  // the DOM after hydration is the server markup (as the parser serialises it)
  const server = document.createElement('div')
  server.innerHTML = html
  expect(container.innerHTML).toBe(server.innerHTML)
  return container
}

describe('date components hydrate without mismatches', () => {
  it('calendar', async () => {
    const container = await hydrate(Calendar, { calendarProps: { defaultValue: jan20, numberOfMonths: 2 } })
    expect(container.querySelector('[data-selected]')).toHaveAttribute('data-value', '1980-01-20')
    expect(container.querySelectorAll('[data-reka-calendar-cell-trigger][tabindex="0"]')).toHaveLength(1)
  })

  it('range calendar', async () => {
    const container = await hydrate(RangeCalendar, { calendarProps: { defaultValue: { start: jan20, end: jan20.add({ days: 3 }) } } })
    expect(container.querySelector('[data-selection-start]')).toHaveAttribute('data-value', '1980-01-20')
    expect(container.querySelector('[data-selection-end]')).toHaveAttribute('data-value', '1980-01-23')
    expect(container.querySelectorAll('[data-reka-calendar-cell-trigger][data-selected]')).toHaveLength(4)
  })

  it('date field', async () => {
    const container = await hydrate(DateField, { dateFieldProps: { defaultValue: jan20, locale: 'en-US' } })
    expect(container.querySelector('[data-reka-date-field-segment="day"]')).toHaveTextContent('20')
  })
})
