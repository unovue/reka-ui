import type { DateRangeFieldRootProps } from './DateRangeFieldRoot.vue'
import type { DateRange } from '@/shared/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import DateRangeField from './story/_DateRangeField.vue'

const calendarDate = {
  start: new Temporal.PlainDate(2022, 1, 1),
  end: new Temporal.PlainDate(2022, 3, 1),
}

const calendarDateTime = {
  start: new Temporal.PlainDateTime(2022, 1, 1, 12, 30),
  end: new Temporal.PlainDateTime(2022, 3, 1, 12, 30),
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
})

// #2789: the range field had about a sixth of DateField's coverage. These port
// the DateField cases that matter per end, plus the range-only rules.
describe('dateRangeField (parity with DateField)', () => {
  const emptyRange = { start: undefined, end: undefined }

  it('orders both ends by `locale`', () => {
    const { input } = setup({ dateFieldProps: { locale: 'en-GB' } })
    const parts = Array.from(input.querySelectorAll('[data-reka-date-field-segment]'))
      .map(el => el.getAttribute('data-reka-date-field-segment'))
      .filter(part => part !== 'literal')
    expect(parts).toEqual(['day', 'month', 'year', 'day', 'month', 'year'])
  })

  it('focuses the first start segment on label click', async () => {
    const { user, label, start } = setup()
    await user.click(label)
    expect(start.month).toHaveFocus()
  })

  it('increments and decrements each end on its own', async () => {
    const { user, start, end } = setup({ dateFieldProps: { defaultValue: calendarDate } })

    await user.click(start.day)
    await user.keyboard(kbd.ARROW_UP)
    expect(start.day).toHaveTextContent('2')
    expect(end.day).toHaveTextContent('1')

    await user.click(end.month)
    await user.keyboard(kbd.ARROW_DOWN)
    expect(end.month).toHaveTextContent('2')
    expect(start.month).toHaveTextContent('1')
  })

  it('emits the whole range once both ends are complete, and only then', async () => {
    const emitted: DateRange[] = []
    const { user, start, end } = setup({
      dateFieldProps: { placeholder: new Temporal.PlainDate(2024, 1, 1) },
      emits: { 'onUpdate:modelValue': value => emitted.push(value) },
    })

    await user.click(start.month)
    await user.keyboard('3151999')
    // The start is complete, the end is still empty.
    expect(end.month).toHaveFocus()
    expect(emitted.at(-1)?.end).toBeUndefined()

    await user.keyboard('4202000')
    const last = emitted.at(-1)!
    expect(last.start?.toString()).toBe('1999-03-15')
    expect(last.end?.toString()).toBe('2000-04-20')
    expect(start.month).toHaveTextContent('3')
  })

  it('keeps the other segments when one is deleted', async () => {
    const { user, start, end } = setup({ dateFieldProps: { defaultValue: calendarDate } })

    await user.click(end.day)
    await user.keyboard(kbd.BACKSPACE)
    expect(end.day).toHaveTextContent('dd')
    expect(end.month).toHaveTextContent('3')
    expect(start.day).toHaveTextContent('1')
  })

  it('clears both ends when `modelValue` is set to nullish', async () => {
    const { start, end, rerender } = setup({ dateFieldProps: { modelValue: calendarDate } })
    expect(start.month).not.toHaveTextContent('mm')

    await rerender({ dateFieldProps: { modelValue: emptyRange } })
    expect(start.month).toHaveTextContent('mm')
    expect(end.year).toHaveTextContent('yyyy')

    await rerender({ dateFieldProps: { modelValue: calendarDate } })
    await rerender({ dateFieldProps: { modelValue: null } })
    expect(start.day).toHaveTextContent('dd')
    expect(end.day).toHaveTextContent('dd')
  })

  it('prevents interaction when `disabled`', async () => {
    const { user, start, end, input } = setup({ dateFieldProps: { modelValue: calendarDate, disabled: true } })
    expect(input).toHaveAttribute('data-disabled')
    for (const segment of [start.month, start.day, end.year]) {
      await user.click(segment)
      expect(segment).not.toHaveFocus()
      expect(segment).not.toHaveAttribute('tabindex')
    }
  })

  it('prevents modification when `readonly`', async () => {
    const { user, start, end, input } = setup({ dateFieldProps: { modelValue: calendarDate, readonly: true } })
    expect(input).toHaveAttribute('data-readonly')
    for (const segment of [start.day, end.month]) {
      await user.click(segment)
      expect(segment).toHaveFocus()
      const before = segment.textContent
      await user.keyboard(kbd.ARROW_UP)
      expect(segment).toHaveTextContent(before!)
    }
  })

  it('is invalid when the start is after the end', () => {
    const { input, start, end } = setup({
      dateFieldProps: { modelValue: { start: calendarDate.end, end: calendarDate.start } },
    })
    expect(input).toHaveAttribute('data-invalid')
    expect(start.month).toHaveAttribute('aria-invalid', 'true')
    expect(end.month).toHaveAttribute('aria-invalid', 'true')
  })

  it('is invalid when a day in the range is unavailable', () => {
    const { input } = setup({
      dateFieldProps: { modelValue: calendarDate, isDateUnavailable: date => date.month === 2 && date.day === 14 },
    })
    expect(input).toHaveAttribute('data-invalid')
  })

  it('is invalid when an end is outside `minValue` / `maxValue`', async () => {
    const { input, rerender } = setup({
      dateFieldProps: { modelValue: calendarDate, minValue: new Temporal.PlainDate(2022, 1, 2) },
    })
    expect(input).toHaveAttribute('data-invalid')

    await rerender({ dateFieldProps: { modelValue: calendarDate, maxValue: new Temporal.PlainDate(2022, 2, 28) } })
    expect(input).toHaveAttribute('data-invalid')

    await rerender({ dateFieldProps: { modelValue: calendarDate, minValue: new Temporal.PlainDate(2022, 1, 1), maxValue: new Temporal.PlainDate(2022, 3, 1) } })
    expect(input).not.toHaveAttribute('data-invalid')
  })

  it('follows `granularity` and `hourCycle` on both ends', () => {
    const { queryByTestId } = setup({
      dateFieldProps: { modelValue: calendarDateTime, granularity: 'minute', hourCycle: 24 },
    })
    for (const end of ['start', 'end']) {
      expect(queryByTestId(`${end}-hour`)).toHaveTextContent('12')
      expect(queryByTestId(`${end}-minute`)).toHaveTextContent('30')
      expect(queryByTestId(`${end}-second`)).toBeNull()
      expect(queryByTestId(`${end}-dayPeriod`)).toBeNull()
    }
  })

  it('shows the day period for a 12-hour locale', () => {
    const { queryByTestId } = setup({ dateFieldProps: { modelValue: calendarDateTime } })
    expect(queryByTestId('start-dayPeriod')).toHaveTextContent('PM')
    expect(queryByTestId('end-dayPeriod')).toHaveTextContent('PM')
  })

  it('passes axe with a value and while invalid', async () => {
    const valid = setup({ dateFieldProps: { modelValue: calendarDateTime, granularity: 'minute' } })
    expect(await axe(valid.container)).toHaveNoViolations()
    valid.unmount()

    const invalid = setup({ dateFieldProps: { modelValue: { start: calendarDate.end, end: calendarDate.start } } })
    expect(await axe(invalid.container)).toHaveNoViolations()
  })
})

describe('coderabbit review (#3088)', () => {
  const hiddenInput = (container: Element) => container.querySelector<HTMLInputElement>('input[name="range"]')!

  it('submits an empty endpoint as an empty string, and an empty range as nothing', async () => {
    const start = new Temporal.PlainDate(2024, 1, 1)
    const partial = render(DateRangeField, { props: { dateFieldProps: { name: 'range', modelValue: { start, end: undefined } } } })
    expect(hiddenInput(partial.container).value).toBe('2024-01-01 - ')
    partial.unmount()

    const empty = render(DateRangeField, { props: { dateFieldProps: { name: 'range', modelValue: { start: undefined, end: undefined } } } })
    expect(hiddenInput(empty.container).value).toBe('')
  })

  it('follows a same-instant change of time zone of the start', async () => {
    const start = Temporal.ZonedDateTime.from('2024-07-10T12:30[America/New_York]')
    const end = start.add({ days: 1 })
    const { getByTestId, rerender } = render(DateRangeField, { props: { dateFieldProps: { modelValue: { start, end }, granularity: 'minute', locale: 'en-US' } } })
    expect(getByTestId('start-timeZoneName')).toHaveTextContent('EDT')

    await rerender({ dateFieldProps: { modelValue: { start: start.withTimeZone('America/Chicago'), end }, granularity: 'minute', locale: 'en-US' } })
    await vi.waitFor(() => expect(getByTestId('start-timeZoneName')).toHaveTextContent('CDT'))
  })
})
