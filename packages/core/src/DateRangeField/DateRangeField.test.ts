import type { DateValue } from '@internationalized/date'

import type { DateRangeFieldRootProps } from './DateRangeFieldRoot.vue'
import { CalendarDate, CalendarDateTime, toZoned } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import DateRangeField from './story/_DateRangeField.vue'

const calendarDate = {
  start: new CalendarDate(2022, 1, 1),
  end: new CalendarDate(2022, 3, 1),
}

const calendarDateTime = {
  start: new CalendarDateTime(2022, 1, 1, 12, 30),
  end: new CalendarDateTime(2022, 3, 1, 12, 30),
}
const zonedDateTime = {
  start: toZoned(calendarDateTime.start, 'America/New_York'),
  end: toZoned(calendarDateTime.end, 'America/New_York'),
}

const kbd = useTestKbd()

function setup(props: { dateFieldProps?: DateRangeFieldRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateValue) => void } } = {}) {
  const user = userEvent.setup()
  const returned = render(DateRangeField, { props })

  const start = {
    month: returned.getByTestId('start-month'),
    day: returned.getByTestId('start-day'),
    year: returned.getByTestId('start-year'),
  }

  const end = {
    month: returned.getByTestId('end-month'),
    day: returned.getByTestId('end-day'),
    year: returned.getByTestId('end-year'),
  }

  const input = returned.getByTestId('input')
  const label = returned.getByTestId('label')

  return { ...returned, user, start, end, input, label }
}

it('should pass axe accessibility tests', async () => {
  const { container } = setup()
  expect(await axe(container)).toHaveNoViolations()
})

describe('dateField', async () => {
  it('populates segment with value - `CalendarDate`', async () => {
    const { start, end } = setup({
      dateFieldProps: { modelValue: calendarDate },
    })

    expect(start.month).toHaveTextContent(String(calendarDate.start.month))
    expect(start.day).toHaveTextContent(String(calendarDate.start.day))
    expect(start.year).toHaveTextContent(String(calendarDate.start.year))

    expect(end.month).toHaveTextContent(String(calendarDate.end.month))
    expect(end.day).toHaveTextContent(String(calendarDate.end.day))
    expect(end.year).toHaveTextContent(String(calendarDate.end.year))
  })

  it('populates segment with value - `CalendarDateTime`', async () => {
    const { start, end, getByTestId } = setup({
      dateFieldProps: {
        modelValue: calendarDateTime,
        granularity: 'second',
      },
    })

    expect(start.month).toHaveTextContent(String(calendarDateTime.start.month))
    expect(start.day).toHaveTextContent(String(calendarDateTime.start.day))
    expect(start.year).toHaveTextContent(String(calendarDateTime.start.year))
    expect(getByTestId('start-hour')).toHaveTextContent(String(calendarDateTime.start.hour))
    expect(getByTestId('start-minute')).toHaveTextContent(String(calendarDateTime.start.minute))
    expect(getByTestId('start-second')).toHaveTextContent(String(calendarDateTime.start.second))

    expect(end.month).toHaveTextContent(String(calendarDateTime.end.month))
    expect(end.day).toHaveTextContent(String(calendarDateTime.end.day))
    expect(end.year).toHaveTextContent(String(calendarDateTime.end.year))
    expect(getByTestId('end-hour')).toHaveTextContent(String(calendarDateTime.end.hour))
    expect(getByTestId('end-minute')).toHaveTextContent(String(calendarDateTime.end.minute))
    expect(getByTestId('end-second')).toHaveTextContent(String(calendarDateTime.end.second))
  })

  it('populates segment with value - `ZonedDateTime`', async () => {
    const { start, end, getByTestId } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })

    expect(start.month).toHaveTextContent(String(calendarDateTime.start.month))
    expect(start.day).toHaveTextContent(String(calendarDateTime.start.day))
    expect(start.year).toHaveTextContent(String(calendarDateTime.start.year))
    expect(getByTestId('start-hour')).toHaveTextContent(String(calendarDateTime.start.hour))
    expect(getByTestId('start-minute')).toHaveTextContent(String(calendarDateTime.start.minute))
    expect(getByTestId('start-second')).toHaveTextContent(String(calendarDateTime.start.second))

    expect(end.month).toHaveTextContent(String(calendarDateTime.end.month))
    expect(end.day).toHaveTextContent(String(calendarDateTime.end.day))
    expect(end.year).toHaveTextContent(String(calendarDateTime.end.year))
    expect(getByTestId('end-hour')).toHaveTextContent(String(calendarDateTime.end.hour))
    expect(getByTestId('end-minute')).toHaveTextContent(String(calendarDateTime.end.minute))
    expect(getByTestId('end-second')).toHaveTextContent(String(calendarDateTime.end.second))
  })

  it('navigates between the fields', async () => {
    const { getByTestId, user } = setup({
      dateFieldProps: { modelValue: calendarDate },
    })

    const fields = ['start', 'end'] as const
    const segments = ['month', 'day', 'year'] as const

    await user.click(getByTestId('start-month'))

    for (const field of fields) {
      for (const segment of segments) {
        if (field === 'start' && segment === 'month')
          continue
        const seg = getByTestId(`${field}-${segment}`)
        await user.keyboard(kbd.ARROW_RIGHT)
        expect(seg).toHaveFocus()
      }
    }

    await user.click(getByTestId('start-month'))

    for (const field of fields) {
      for (const segment of segments) {
        if (field === 'start' && segment === 'month')
          continue
        const seg = getByTestId(`${field}-${segment}`)
        await user.keyboard(kbd.TAB)
        expect(seg).toHaveFocus()
      }
    }
  })

  it('navigates between the fields - right to left', async () => {
    const { getByTestId, user } = setup({
      dateFieldProps: { modelValue: calendarDate },
    })

    const fields = ['end', 'start'] as const
    const segments = ['year', 'day', 'month'] as const

    await user.click(getByTestId('end-year'))

    for (const field of fields) {
      for (const segment of segments) {
        if (field === 'end' && segment === 'year')
          continue
        const seg = getByTestId(`${field}-${segment}`)
        await user.keyboard(kbd.ARROW_LEFT)
        expect(seg).toHaveFocus()
      }
    }

    await user.click(getByTestId('end-year'))

    for (const field of fields) {
      for (const segment of segments) {
        if (field === 'end' && segment === 'year')
          continue
        const seg = getByTestId(`${field}-${segment}`)
        await user.keyboard(kbd.SHIFT_TAB)
        expect(seg).toHaveFocus()
      }
    }
  })

  it('binds to the value', async () => {
    const { start, end, user } = setup({
      dateFieldProps: { modelValue: calendarDate },
    })
    expect(start.month).toHaveTextContent(String(calendarDate.start.month))
    expect(end.month).toHaveTextContent(String(calendarDate.end.month))

    await user.click(start.month)
    await user.keyboard('2')
    expect(start.month).toHaveTextContent('2')
    expect(end.month).toHaveTextContent(String(calendarDate.end.month))
  })
})
