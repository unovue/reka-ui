import { CalendarDate, CalendarDateTime } from '@internationalized/date'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Calendar from './story/_Calendar.vue'

function activeTestId() {
  return document.activeElement?.getAttribute('data-testid')
}

describe('given a Calendar, in a real browser', () => {
  it('moves focus by a month with PageUp / PageDown and by a week with arrow keys', async () => {
    mount(Calendar, {
      attachTo: document.body,
      props: { calendarProps: { placeholder: new CalendarDate(2024, 3, 20) } },
    })
    document.querySelector<HTMLElement>('[data-testid="date-3-20"]')!.focus()

    await userEvent.keyboard('{PageUp}')
    await expect.poll(activeTestId).toBe('date-2-20')

    await userEvent.keyboard('{PageDown}{ArrowDown}')
    await expect.poll(activeTestId).toBe('date-3-27')
  })

  it('keeps focus on the min day when PageUp is clamped and minValue has no time', async () => {
    mount(Calendar, {
      attachTo: document.body,
      props: {
        calendarProps: {
          placeholder: new CalendarDateTime(2024, 3, 20, 10, 30),
          minValue: new CalendarDate(2024, 2, 25),
        },
      },
    })
    document.querySelector<HTMLElement>('[data-testid="date-3-20"]')!.focus()

    await userEvent.keyboard('{PageUp}')

    await expect.poll(activeTestId).toBe('date-2-25')
    expect(document.activeElement?.getAttribute('data-value')).toBe('2024-02-25T10:30:00')
  })
})
