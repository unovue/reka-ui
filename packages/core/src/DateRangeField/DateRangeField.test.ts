import type { DateRangeFieldRootProps } from './DateRangeFieldRoot.vue'

import type { DateRange } from '@/shared/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import { Temporal } from '@/temporal'
import DateRangeField from './story/_DateRangeField.vue'

const calendarDate = {
  start: Temporal.PlainDate.from({ year: 2022, month: 1, day: 1 }),
  end: Temporal.PlainDate.from({ year: 2022, month: 3, day: 1 }),
}

const calendarDateTime = {
  start: Temporal.PlainDateTime.from({ year: 2022, month: 1, day: 1, hour: 12, minute: 30 }),
  end: Temporal.PlainDateTime.from({ year: 2022, month: 3, day: 1, hour: 12, minute: 30 }),
}
const zonedDateTime = {
  start: calendarDateTime.start.toZonedDateTime('America/New_York'),
  end: calendarDateTime.end.toZonedDateTime('America/New_York'),
}

const kbd = useTestKbd()

function setup(props: { dateFieldProps?: DateRangeFieldRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateRange) => void } } = {}) {
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
  it('advances focus through segments in DOM order when typing in RTL', async () => {
    const { user, start, end } = setup({
      dateFieldProps: {
        dir: 'rtl',
      },
    })

    await user.click(start.month)
    expect(start.month).toHaveFocus()
    await user.keyboard('{2}')
    expect(start.day).toHaveFocus()
    await user.keyboard('{19}')
    expect(start.year).toHaveFocus()
    await user.keyboard('1980')
    expect(end.month).toHaveFocus()
  })

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

  it('marks the field as invalid when start is after end', async () => {
    const invertedRange = {
      start: Temporal.PlainDate.from({ year: 2022, month: 6, day: 1 }),
      end: Temporal.PlainDate.from({ year: 2022, month: 1, day: 1 }),
    }
    const { input } = setup({
      dateFieldProps: { modelValue: invertedRange },
    })

    expect(input).toHaveAttribute('data-invalid', '')
  })

  it('does not mark the field as invalid when start is before end', async () => {
    const { input } = setup({
      dateFieldProps: { modelValue: calendarDate },
    })

    expect(input).not.toHaveAttribute('data-invalid')
  })

  it('does not mark the field as invalid when start equals end', async () => {
    const sameDay = {
      start: Temporal.PlainDate.from({ year: 2022, month: 1, day: 1 }),
      end: Temporal.PlainDate.from({ year: 2022, month: 1, day: 1 }),
    }
    const { input } = setup({
      dateFieldProps: { modelValue: sameDay },
    })

    expect(input).not.toHaveAttribute('data-invalid')
  })

  it('prevents modification to either side when disabled', async () => {
    const { start, end, user } = setup({
      dateFieldProps: { modelValue: calendarDate, disabled: true },
    })

    await user.click(start.month)
    expect(start.month).not.toHaveFocus()
    expect(start.month).toHaveTextContent(String(calendarDate.start.month))

    await user.click(end.year)
    expect(end.year).not.toHaveFocus()
    expect(end.year).toHaveTextContent(String(calendarDate.end.year))
  })

  it('prevents modification to either side when readonly', async () => {
    const { start, end, user } = setup({
      dateFieldProps: { modelValue: calendarDate, readonly: true },
    })

    await user.click(start.month)
    expect(start.month).toHaveFocus()
    await user.keyboard(kbd.ARROW_UP)
    expect(start.month).toHaveTextContent(String(calendarDate.start.month))

    await user.click(end.year)
    expect(end.year).toHaveFocus()
    await user.keyboard(kbd.ARROW_UP)
    expect(end.year).toHaveTextContent(String(calendarDate.end.year))
  })

  it('tracks the placeholder from the start value, not the end value', async () => {
    // The hidden input value is a built-in probe for the placeholder: it serialises
    // `${start} - ${end}`, so a placeholder that drifted to the end would show in
    // the month/year segments after the user navigated to the end side.
    const { start, end, user } = setup({
      dateFieldProps: { modelValue: calendarDate },
    })

    // The start month/year reflect the start value, not the end.
    expect(start.month).toHaveTextContent(String(calendarDate.start.month))
    expect(start.year).toHaveTextContent(String(calendarDate.start.year))
    expect(end.month).toHaveTextContent(String(calendarDate.end.month))
    expect(end.year).toHaveTextContent(String(calendarDate.end.year))

    // Focus the end side and type a new month — the placeholder should stay anchored
    // to the start value, so the start month segment must not change.
    await user.click(end.month)
    expect(end.month).toHaveFocus()
    await user.keyboard('5')
    expect(end.month).toHaveTextContent('5')
    expect(start.month).toHaveTextContent(String(calendarDate.start.month))
  })

  it('marks the field as invalid when a day between start and end is unavailable', async () => {
    const { input } = setup({
      dateFieldProps: {
        modelValue: calendarDate,
        isDateUnavailable: date => date.day === 15,
      },
    })

    // calendarDate spans 2022-01-01 to 2022-03-01 — 2022-01-15 is between them.
    expect(input).toHaveAttribute('data-invalid', '')
  })

  it('does not mark the field as invalid when no day between start and end is unavailable', async () => {
    const { input } = setup({
      dateFieldProps: {
        modelValue: calendarDate,
        isDateUnavailable: date => date.day === 15 && date.month === 6, // June 15, outside the range
      },
    })

    expect(input).not.toHaveAttribute('data-invalid')
  })

  it('does not mark the field as invalid for days-between-unavailable when only one side is set', async () => {
    const { input } = setup({
      dateFieldProps: {
        modelValue: { start: calendarDate.start, end: undefined },
        // isDateUnavailable returns true for days *between* what would be the
        // range, but the start itself is available. With only one side set
        // there's no range to validate, so the field must stay valid.
        isDateUnavailable: date => date.day === 15 && date.month === 1,
      },
    })

    expect(input).not.toHaveAttribute('data-invalid')
  })
})
