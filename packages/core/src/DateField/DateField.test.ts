import type { DateFields, DateValue, TimeFields } from '@internationalized/date'

import type { DateFieldRootProps } from './DateFieldRoot.vue'
import { CalendarDate, CalendarDateTime, now, parseAbsoluteToLocal, toZoned } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import DateField from './story/_DateField.vue'

const calendarDate = new CalendarDate(1980, 1, 20)
const calendarDateTime = new CalendarDateTime(1980, 1, 20, 12, 30, 0, 0)
const zonedDateTime = toZoned(calendarDateTime, 'America/New_York')

const kbd = useTestKbd()

function getTimeSegments(getByTestId: (...args: any[]) => HTMLElement) {
  return {
    hour: getByTestId('hour'),
    minute: getByTestId('minute'),
    second: getByTestId('second'),
    dayPeriod: getByTestId('dayPeriod'),
    timeZoneName: getByTestId('timeZoneName'),
  }
}

function isDaylightSavingsTime(): boolean {
  const now = new Date()
  const january = new Date(now.getFullYear(), 0, 1)
  const july = new Date(now.getFullYear(), 6, 1)
  const timezoneOffset = now.getTimezoneOffset()
  const isDaylightSavingsTime = timezoneOffset < Math.max(january.getTimezoneOffset(), july.getTimezoneOffset())
  return isDaylightSavingsTime
}

function thisTimeZone(date: string): string {
  const timezone = Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(new Date(date)).find(p => p.type === 'timeZoneName')?.value ?? ''
  return timezone
}

function setup(props: { dateFieldProps?: DateFieldRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateValue) => void } } = {}) {
  const user = userEvent.setup()
  const returned = render(DateField, { props })
  const value = returned.getByTestId('value')
  const month = returned.getByTestId('month')
  const day = returned.getByTestId('day')
  const year = returned.getByTestId('year')
  const input = returned.getByTestId('input')
  const label = returned.getByTestId('label')

  return { ...returned, user, month, day, year, input, label, value }
}

it('should pass axe accessibility tests', async () => {
  const { container } = setup()
  expect(await axe(container)).toHaveNoViolations()
})

describe('dateField', async () => {
  it('populates segment with value - `CalendarDate`', async () => {
    const { month, day, year } = setup({
      dateFieldProps: { modelValue: calendarDate },
    })

    expect(month).toHaveTextContent(String(calendarDate.month))
    expect(day).toHaveTextContent(String(calendarDate.day))
    expect(year).toHaveTextContent(String(calendarDate.year))
  })

  it('populates segment with value - `CalendarDateTime`', async () => {
    const { month, day, year, getByTestId } = setup({
      dateFieldProps: { modelValue: calendarDateTime },
    })

    expect(month).toHaveTextContent(String(calendarDateTime.month))
    expect(day).toHaveTextContent(String(calendarDateTime.day))
    expect(year).toHaveTextContent(String(calendarDateTime.year))
    expect(getByTestId('hour')).toHaveTextContent(String(calendarDateTime.hour))
    expect(getByTestId('minute')).toHaveTextContent(String(calendarDateTime.minute))
  })

  it('populates segment with value - `ZonedDateTime`', async () => {
    const { month, day, year, getByTestId } = setup({
      dateFieldProps: { modelValue: zonedDateTime },
    })

    expect(month).toHaveTextContent(String(zonedDateTime.month))
    expect(day).toHaveTextContent(String(zonedDateTime.day))
    expect(year).toHaveTextContent(String(zonedDateTime.year))
    expect(getByTestId('hour')).toHaveTextContent(String(zonedDateTime.hour))
    expect(getByTestId('minute')).toHaveTextContent(String(zonedDateTime.minute))
    expect(getByTestId('dayPeriod')).toHaveTextContent('PM')
    expect(getByTestId('timeZoneName')).toHaveTextContent('EST')
  })

  it('changes segment positioning based on `locale`', async () => {
    const { input } = setup({
      dateFieldProps: { locale: 'en-UK' },
    })

    const firstSeg = input.children[0]
    // skipping the literal slashes here
    const secondSeg = input.children[2]
    const thirdSeg = input.children[4]

    expect(firstSeg).toHaveTextContent('dd')
    expect(secondSeg).toHaveTextContent('mm')
    expect(thirdSeg).toHaveTextContent('yyyy')
  })

  it('doesnt show the day period for locales that don\'t use them', async () => {
    const { queryByTestId } = setup({
      dateFieldProps: {
        locale: 'en-UK',
        modelValue: calendarDateTime,
      },
    })
    expect(queryByTestId('dayPeriod')).not.toBeInTheDocument()
  })
  it('does show the day period for locales that do use them', async () => {
    const { queryByTestId } = setup({
      dateFieldProps: { modelValue: calendarDateTime },
    })
    expect(queryByTestId('dayPeriod')).toBeInTheDocument()
  })

  it('focuses first segment on label click', async () => {
    const { user, input, label } = setup()
    await user.click(label)
    expect(input.firstElementChild).toHaveFocus()
  })

  it('focuses segments on click', async () => {
    const { user, day, month, year, getByTestId } = setup({
      dateFieldProps: { modelValue: zonedDateTime },
    })

    const hour = getByTestId('hour')
    const minute = getByTestId('minute')
    const dayPeriod = getByTestId('dayPeriod')
    const timeZoneName = getByTestId('timeZoneName')
    const segments = [day, month, year, hour, minute, dayPeriod, timeZoneName]

    for (const segment of segments) {
      await user.click(segment)
      expect(segment).toHaveFocus()
    }
  })

  it('increments segment on arrow up', async () => {
    const { user, day, month, year, getByTestId } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })

    const hour = getByTestId('hour')
    const minute = getByTestId('minute')
    const second = getByTestId('second')

    function cycle(segment: keyof TimeFields | keyof DateFields) {
      return String(zonedDateTime.cycle(segment, 1)[segment])
    }

    await user.click(day)
    await user.keyboard(kbd.ARROW_UP)
    expect(day).toHaveTextContent(cycle('day'))
    await user.click(month)
    await user.keyboard(kbd.ARROW_UP)
    expect(month).toHaveTextContent(cycle('month'))
    await user.click(year)
    await user.keyboard(kbd.ARROW_UP)
    expect(year).toHaveTextContent(cycle('year'))
    await user.click(hour)
    await user.keyboard(kbd.ARROW_UP)
    expect(hour).toHaveTextContent('1')
    await user.click(minute)
    await user.keyboard(kbd.ARROW_UP)
    expect(minute).toHaveTextContent(cycle('minute'))
    await user.click(second)
    await user.keyboard(kbd.ARROW_UP)
    expect(second).toHaveTextContent(cycle('second'))
  })

  it('decrements segment on arrow down', async () => {
    const { user, day, month, year, getByTestId } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })

    const hour = getByTestId('hour')
    const minute = getByTestId('minute')
    const second = getByTestId('second')

    function cycle(segment: keyof TimeFields | keyof DateFields) {
      return String(zonedDateTime.cycle(segment, -1)[segment])
    }

    await user.click(day)
    await user.keyboard(kbd.ARROW_DOWN)
    expect(day).toHaveTextContent(cycle('day'))
    await user.click(month)
    await user.keyboard(kbd.ARROW_DOWN)
    expect(month).toHaveTextContent(cycle('month'))
    await user.click(year)
    await user.keyboard(kbd.ARROW_DOWN)
    expect(year).toHaveTextContent(cycle('year'))
    await user.click(hour)
    await user.keyboard(kbd.ARROW_DOWN)
    expect(hour).toHaveTextContent(cycle('hour'))
    await user.click(minute)
    await user.keyboard(kbd.ARROW_DOWN)
    expect(minute).toHaveTextContent(cycle('minute'))
    await user.click(second)
    await user.keyboard(kbd.ARROW_DOWN)
    expect(second).toHaveTextContent(cycle('second'))
  })

  it('allow the maximum day to be 31 when no month field', async () => {
    const { user, day } = setup({
      dateFieldProps: {
        /**
         * Explicitly set the placeholder to avoid using current local time as placeholder.
         * And use a month (here is April, 30 days) with less than 31 days to ensure the day can be 31
         * when user input day segment first.
         */
        placeholder: new CalendarDate(2025, 4, 30),
      },
    })

    await user.click(day)
    await user.keyboard(kbd.ARROW_UP)
    await user.keyboard(kbd.ARROW_UP)
    expect(day).toHaveTextContent('31')
  })

  it('navigates segments using the arrow keys', async () => {
    const { getByTestId, user, day, month, year } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })
    const { hour, minute, second, dayPeriod, timeZoneName } = getTimeSegments(getByTestId)

    const segments = [month, day, year, hour, minute, second, dayPeriod, timeZoneName]

    await user.click(month)

    for (const seg of segments) {
      expect(seg).toHaveFocus()
      await user.keyboard(kbd.ARROW_RIGHT)
    }
    expect(timeZoneName).toHaveFocus()

    for (const seg of segments.reverse()) {
      expect(seg).toHaveFocus()
      await user.keyboard(kbd.ARROW_LEFT)
    }
    expect(month).toHaveFocus()
  })

  it('navigates the segments using tab', async () => {
    const { getByTestId, user, day, month, year } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })
    const { hour, minute, second, dayPeriod, timeZoneName } = getTimeSegments(getByTestId)

    const segments = [month, day, year, hour, minute, second, dayPeriod]

    await user.click(month)

    for (const seg of segments) {
      expect(seg).toHaveFocus()
      await user.keyboard(kbd.TAB)
    }
    expect(timeZoneName).toHaveFocus()

    for (const seg of segments.reverse()) {
      await user.keyboard(kbd.SHIFT_TAB)
      expect(seg).toHaveFocus()
    }
  })

  it(`preserve other segment when one segment's value is deleted`, async () => {
    const { user, day, month, year } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
      },
    })

    const initialValues = {
      month: month.innerHTML,
      day: day.innerHTML,
      year: year.innerHTML,
    }

    await user.click(month)
    await user.keyboard(kbd.BACKSPACE)

    expect(month).toHaveTextContent('mm')
    expect(day).toHaveTextContent(initialValues.day)
    expect(year).toHaveTextContent(initialValues.year)

    await user.click(day)
    await user.keyboard(kbd.BACKSPACE)
    await user.keyboard(kbd.BACKSPACE)

    expect(month).toHaveTextContent('mm')
    expect(day).toHaveTextContent('dd')
    expect(year).toHaveTextContent(initialValues.year)
  })

  it('should clear all segment when `modelValue` is set to nullish', async () => {
    const { day, month, year, rerender } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime.copy(),
      },
    })

    expect(month).not.toHaveTextContent('mm')
    expect(day).not.toHaveTextContent('dd')
    expect(year).not.toHaveTextContent('yyyy')

    await rerender({
      dateFieldProps: {
        modelValue: undefined,
      },
    })

    expect(month).toHaveTextContent('mm')
    expect(day).toHaveTextContent('dd')
    expect(year).toHaveTextContent('yyyy')
  })

  it('prevents interaction when `disabled`', async () => {
    const { user, getByTestId, day, month, year } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
        disabled: true,
      },
    })

    const { hour, minute, second, dayPeriod, timeZoneName } = getTimeSegments(getByTestId)

    const segments = [month, day, year, hour, minute, second, dayPeriod, timeZoneName]

    for (const seg of segments) {
      await user.click(seg)
      expect(seg).not.toHaveFocus()
      expect(seg).not.toHaveAttribute('tabindex')
    }
  })

  it('prevents modification when `readonly`', async () => {
    const { user, getByTestId, day, month, year } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
        readonly: true,
      },
    })
    const { hour, minute, second } = getTimeSegments(getByTestId)
    const segments = [month, day, year, hour, minute, second]

    for (const segment of segments) {
      await user.click(segment)
      expect(segment).toHaveFocus()
      await user.keyboard(kbd.ARROW_UP)
      expect(segment).toHaveTextContent(
        String(zonedDateTime[segment.getAttribute('data-reka-date-field-segment') as keyof TimeFields | keyof DateFields]),
      )
    }
  })

  it('correctly marks the field as invalid if the value is invalid', async () => {
    const { getByTestId, day, month, year, input, user, rerender } = setup({
      dateFieldProps: {
        granularity: 'second',
        isDateUnavailable: date => date.day === 19,
        modelValue: zonedDateTime,
      },
      emits: {
        'onUpdate:modelValue': async (data: DateValue) => rerender({
          dateFieldProps: {
            modelValue: data,
            granularity: 'second',
            isDateUnavailable: (date: DateValue) => date.day === 19,
          },
        }),
      },
    })

    const { hour, minute, second, dayPeriod, timeZoneName } = getTimeSegments(getByTestId)
    const segments = [month, day, year, hour, minute, second, dayPeriod, timeZoneName]

    await user.click(month)
    await user.keyboard('{2}')
    expect(month).toHaveTextContent('2')
    expect(day).toHaveFocus()
    await user.keyboard('{19}')
    expect(day).toHaveTextContent('19')
    expect(year).toHaveFocus()
    await user.keyboard('{1111}')
    expect(year).toHaveTextContent('1111')

    expect(input).toHaveAttribute('data-invalid')

    for (const seg of segments) {
      expect(seg).toHaveAttribute('aria-invalid', 'true')
      expect(seg).toHaveAttribute('data-invalid')
    }
  })

  it('adjusts the hour cycle with the `hourCycle` prop', async () => {
    const { getByTestId, queryByTestId, user } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        hourCycle: 24,
      },
    })

    expect(queryByTestId('dayPeriod')).toBeNull()
    const hour = getByTestId('hour')
    expect(hour).toHaveTextContent('12')
    await user.click(hour)
    expect(hour).toHaveFocus()
    await user.keyboard(kbd.ARROW_UP)
    expect(hour).toHaveTextContent('13')
  })

  it('overrides the default displayed segments with the `granularity` prop - `day`', async () => {
    const { queryByTestId, month, day, year } = setup({
      dateFieldProps: {
        modelValue: calendarDateTime,
        granularity: 'day',
      },
    })

    const nonDisplayedSegments = ['hour', 'minute', 'second', 'dayPeriod']
    const displayedSegments = [month, day, year]
    for (const seg of nonDisplayedSegments)
      expect(queryByTestId(seg)).toBeNull()

    for (const seg of displayedSegments)
      expect(seg).toBeVisible()
  })

  it('overrides the default displayed segments with the `granularity` prop - `minute`', async () => {
    const { queryByTestId, getByTestId, month, day, year } = setup({
      dateFieldProps: {
        modelValue: calendarDateTime,
        granularity: 'minute',
      },
    })

    const displayedSegments = [
      month,
      day,
      year,
      getByTestId('hour'),
      getByTestId('minute'),
      getByTestId('dayPeriod'),
    ]

    expect(queryByTestId('second')).toBeNull()

    for (const seg of displayedSegments)
      expect(seg).toBeVisible()
  })

  it('takes you all the way through the segment with spamming 3', async () => {
    const { getByTestId, user, month, day, year } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })

    const { hour, minute, second, dayPeriod } = getTimeSegments(getByTestId)

    await user.click(month)
    await user.keyboard('{3}')
    expect(day).toHaveFocus()
    await user.keyboard('{3}')
    await user.keyboard('{3}')
    expect(year).toHaveFocus()
    await user.keyboard('{3}')
    await user.keyboard('{3}')
    await user.keyboard('{3}')
    await user.keyboard('{3}')
    expect(hour).toHaveFocus()
    await user.keyboard('{3}')
    expect(minute).toHaveFocus()
    await user.keyboard('{3}')
    await user.keyboard('{3}')
    expect(second).toHaveFocus()
    await user.keyboard('{3}')
    await user.keyboard('{3}')
    expect(dayPeriod).toHaveFocus()
  })

  it('updates the hour on the modelValue if the dayPeriod is updated', async () => {
    const { getByTestId, user, value, rerender } = setup({
      dateFieldProps: {
        modelValue: calendarDateTime,
        granularity: 'second',
      },
      emits: {
        'onUpdate:modelValue': (data: DateValue) => {
          return rerender({
            dateFieldProps: {
              modelValue: data,
              granularity: 'second',
            },
          })
        },
      },
    })

    const dayPeriod = getByTestId('dayPeriod')
    expect(value.textContent).toBe(calendarDateTime.toString())
    await user.click(dayPeriod)
    await user.keyboard('{a}')
    expect(getByTestId('value').textContent).toBe(calendarDateTime.subtract({ hours: 12 }).toString())
    await user.keyboard('{p}')
    expect(getByTestId('value').textContent).toBe(calendarDateTime.toString())
    await user.keyboard('{A}')
    expect(getByTestId('value').textContent).toBe(calendarDateTime.subtract({ hours: 12 }).toString())
    await user.keyboard('{P}')
    expect(getByTestId('value').textContent).toBe(calendarDateTime.toString())
  })

  it('fully overwrites on first click and type - `month`', async () => {
    const { user, month } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })

    await user.click(month)
    expect(month).toHaveFocus()
    expect(month).toHaveTextContent(String(zonedDateTime.month))
    await user.keyboard('{3}')
    expect(month).toHaveTextContent('3')
  })

  it('fully overwrites on first click and type - `day`', async () => {
    const { user, day } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })

    await user.click(day)
    expect(day).toHaveFocus()
    expect(day).toHaveTextContent(String(zonedDateTime.day))
    await user.keyboard('{1}')
    expect(day).toHaveTextContent('1')
  })

  it('fully overwrites on first click and type - `year`', async () => {
    const { user, year } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })

    await user.click(year)
    expect(year).toHaveFocus()
    expect(year).toHaveTextContent(String(zonedDateTime.year))
    await user.keyboard('{1}')
    expect(year).toHaveTextContent('1')
  })

  it('fully overwrites on first click and type - `hour`', async () => {
    const { user, getByTestId } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })
    const hour = getByTestId('hour')

    await user.click(hour)
    expect(hour).toHaveFocus()
    expect(hour).toHaveTextContent(String(zonedDateTime.hour))
    await user.keyboard('{1}')
    expect(hour).toHaveTextContent('1')
  })

  it('fully overwrites on first click and type - `minute`', async () => {
    const { user, getByTestId } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })
    const minute = getByTestId('minute')

    await user.click(minute)
    expect(minute).toHaveFocus()
    expect(minute).toHaveTextContent(String(zonedDateTime.minute))
    await user.keyboard('{1}')
    expect(minute).toHaveTextContent('1')
  })

  it('fully overwrites on first click and type - `second`', async () => {
    const { user, getByTestId } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })
    const second = getByTestId('second')

    await user.click(second)
    expect(second).toHaveFocus()
    expect(second).toHaveTextContent(String(zonedDateTime.second))
    await user.keyboard('{1}')
    expect(second).toHaveTextContent('1')
  })

  it('displays correct timezone with ZonedDateTime value - `now`', async () => {
    const { getByTestId } = setup({
      dateFieldProps: { modelValue: now('America/Los_Angeles') },
    })

    const timeZone = getByTestId('timeZoneName')
    if (isDaylightSavingsTime())
      expect(timeZone).toHaveTextContent('PDT')
    else
      expect(timeZone).toHaveTextContent('PST')
  })

  it('displays correct timezone with ZonedDateTime value - absolute -> local', async () => {
    const { getByTestId } = setup({
      dateFieldProps: { modelValue: parseAbsoluteToLocal('2023-10-12T12:30:00Z') },
    })

    const timeZone = getByTestId('timeZoneName')
    expect(timeZone).toHaveTextContent(thisTimeZone('2023-10-12T12:30:00Z'))
  })
})
