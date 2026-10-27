import type { DateFieldRootProps } from './DateFieldRoot.vue'
import type { DateTimeField, DateValue } from '@/date'
import userEvent from '@testing-library/user-event'
import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { cycleField, getFieldValue } from '@/date'
import { useTestKbd } from '@/shared'
import DateField from './story/_DateField.vue'

const calendarDate = new Temporal.PlainDate(1980, 1, 20)
const calendarDateTime = new Temporal.PlainDateTime(1980, 1, 20, 12, 30, 0, 0)
const zonedDateTime = calendarDateTime.toZonedDateTime('America/New_York')

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

/**
 * Build a `ZonedDateTime` whose own clock reads PM while the same instant
 * reads 02:30 AM in the test runner's local zone. The zone is picked at
 * runtime so the mismatch exists wherever the suite runs. The candidates are
 * spaced at most three hours apart around the globe, and the target window is
 * twelve hours wide, so one of them always qualifies.
 */
function zonedDateTimeInForeignZone() {
  const local = new Temporal.PlainDateTime(2024, 1, 20, 2, 30).toZonedDateTime(Temporal.Now.timeZoneId())
  const candidateZones = [
    'Pacific/Honolulu',
    'America/Los_Angeles',
    'America/Chicago',
    'America/Sao_Paulo',
    'UTC',
    'Europe/Berlin',
    'Europe/Moscow',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Bangkok',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Pacific/Auckland',
  ]
  const foreign = candidateZones.map(zone => local.withTimeZone(zone)).find(date => date.hour >= 12)
  if (!foreign)
    throw new Error('No candidate zone reads PM while the local zone reads AM')
  return foreign
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

    function cycle(segment: DateTimeField) {
      return String(getFieldValue(cycleField(zonedDateTime, segment, 1), segment))
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

    function cycle(segment: DateTimeField) {
      return String(getFieldValue(cycleField(zonedDateTime, segment, -1), segment))
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
        placeholder: new Temporal.PlainDate(2025, 4, 30),
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

  it('doesn\'t change focus prematurely with segment value of 0', async () => {
    const { getByTestId, user, day, month, year } = setup({
      dateFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })
    const { hour, minute, second } = getTimeSegments(getByTestId)

    const segments = [month, day, year, hour, minute, second]

    for (const segment of segments) {
      await user.click(segment)
      await user.keyboard('{0}')
      await user.keyboard(kbd.TAB)
      expect(segment).not.toHaveFocus()
      await user.click(segment)
      await user.keyboard('{1}')
      expect(segment).toHaveFocus()
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
        modelValue: zonedDateTime,
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

  it('syncs a same-day time zone change from `modelValue`', async () => {
    const emitted: DateValue[] = []
    const { getByTestId, user, rerender } = setup({
      dateFieldProps: { modelValue: zonedDateTime },
      emits: { 'onUpdate:modelValue': data => emitted.push(data) },
    })
    expect(getByTestId('timeZoneName')).toHaveTextContent('EST')

    await rerender({
      dateFieldProps: { modelValue: calendarDateTime.toZonedDateTime('Asia/Tokyo') },
    })
    expect(getByTestId('timeZoneName')).toHaveTextContent('GMT+9')

    await user.click(getByTestId('minute'))
    await user.keyboard(kbd.ARROW_UP)
    expect(emitted.at(-1)).toMatchObject({ timeZoneId: 'Asia/Tokyo', minute: 31 })
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
        String(getFieldValue(zonedDateTime, segment.getAttribute('data-reka-date-field-segment') as DateTimeField)),
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

  it('advances focus through segments in DOM order when typing in RTL', async () => {
    const { user, month, day, year } = setup({
      dateFieldProps: {
        dir: 'rtl',
      },
    })

    await user.click(month)
    expect(month).toHaveFocus()
    await user.keyboard('{2}')
    expect(day).toHaveFocus()
    await user.keyboard('{19}')
    expect(year).toHaveFocus()
    await user.keyboard('{1980}')
    expect(year).toHaveTextContent('1980')
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

  it('keeps the day period of a `ZonedDateTime` in a zone other than the local one while editing the hour', async () => {
    const foreign = zonedDateTimeInForeignZone()
    const { getByTestId, user, rerender } = setup({
      dateFieldProps: { modelValue: foreign },
      emits: {
        'onUpdate:modelValue': (data: DateValue) => {
          return rerender({ dateFieldProps: { modelValue: data } })
        },
      },
    })

    const hour = getByTestId('hour')
    const dayPeriod = getByTestId('dayPeriod')

    // The value's own clock is in the afternoon, so the segments must say so
    // even though the same instant is 02:30 AM in the local zone.
    expect(hour).toHaveTextContent(String(foreign.hour > 12 ? foreign.hour - 12 : foreign.hour))
    expect(dayPeriod).toHaveTextContent('PM')

    // Typing an hour must be interpreted with the displayed period, not the
    // period of the local zone, so 3 becomes 15:30 rather than 03:30.
    await user.click(hour)
    await user.keyboard('{3}')

    expect(getByTestId('value').textContent).toBe(foreign.with({ hour: 15 }).toString())
    expect(dayPeriod).toHaveTextContent('PM')
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
      dateFieldProps: { modelValue: Temporal.Now.zonedDateTimeISO('America/Los_Angeles') },
    })

    const timeZone = getByTestId('timeZoneName')
    if (isDaylightSavingsTime())
      expect(timeZone).toHaveTextContent('PDT')
    else
      expect(timeZone).toHaveTextContent('PST')
  })

  it('displays correct timezone with ZonedDateTime value - absolute -> local', async () => {
    const { getByTestId } = setup({
      dateFieldProps: { modelValue: Temporal.Instant.from('2023-10-12T12:30:00Z').toZonedDateTimeISO(Temporal.Now.timeZoneId()) },
    })

    const timeZone = getByTestId('timeZoneName')
    expect(timeZone).toHaveTextContent(thisTimeZone('2023-10-12T12:30:00Z'))
  })

  describe('stepSnapping', () => {
    function setupStepSnappingTest({
      step,
      stepSnapping,
      modelValue = new Temporal.PlainDateTime(1980, 1, 20, 12, 0, 0, 0),
      hourCycle,
    }: {
      step: DateFieldRootProps['step']
      stepSnapping: boolean
      modelValue?: DateValue
      hourCycle?: DateFieldRootProps['hourCycle']
    }) {
      let rerender: ReturnType<typeof setup>['rerender']
      const returned = setup({
        dateFieldProps: {
          modelValue,
          granularity: 'second',
          hourCycle,
          step,
          stepSnapping,
        },
        emits: {
          'onUpdate:modelValue': (data: DateValue) => {
            return rerender({
              dateFieldProps: {
                modelValue: data,
                granularity: 'second',
                hourCycle,
                step,
                stepSnapping,
              },
            })
          },
        },
      })
      rerender = returned.rerender
      return returned
    }

    it('snaps typed minute value to nearest step', async () => {
      const { user, getByTestId } = setupStepSnappingTest({
        step: { minute: 15 },
        stepSnapping: true,
      })

      const minute = getByTestId('minute')
      await user.click(minute)
      await user.keyboard('{2}{3}')
      await user.click(getByTestId('second'))

      expect(minute).toHaveTextContent('30')
    })

    it('does not change typed minute value already on the step boundary', async () => {
      const { user, getByTestId } = setupStepSnappingTest({
        step: { minute: 15 },
        stepSnapping: true,
      })

      const minute = getByTestId('minute')
      await user.click(minute)
      await user.keyboard('{1}{5}')
      await user.click(getByTestId('second'))

      expect(minute).toHaveTextContent('15')
    })

    it('snaps typed minute value using custom step', async () => {
      const { user, getByTestId } = setupStepSnappingTest({
        step: { minute: 10 },
        stepSnapping: true,
      })

      const minute = getByTestId('minute')
      await user.click(minute)
      await user.keyboard('{2}{6}')
      await user.click(getByTestId('second'))

      expect(minute).toHaveTextContent('30')
    })

    it('snaps typed minute value down to the nearest step', async () => {
      const { user, getByTestId, rerender } = setup({
        dateFieldProps: {
          modelValue: new Temporal.PlainDateTime(1980, 1, 20, 12, 0, 0, 0),
          granularity: 'second',
          step: { minute: 15 },
          stepSnapping: true,
        },
        emits: {
          'onUpdate:modelValue': (data: DateValue) => {
            return rerender({
              dateFieldProps: {
                modelValue: data,
                granularity: 'second',
                step: { minute: 15 },
                stepSnapping: true,
              },
            })
          },
        },
      })

      const minute = getByTestId('minute')
      await user.click(minute)
      await user.keyboard('{0}{7}')
      await user.click(getByTestId('second'))

      expect(minute).toHaveTextContent('0')
    })

    it('does not snap typed minute value when step is 1', async () => {
      const { user, getByTestId } = setupStepSnappingTest({
        step: { minute: 1 },
        stepSnapping: true,
      })

      const minute = getByTestId('minute')
      await user.click(minute)
      await user.keyboard('{2}{3}')
      await user.click(getByTestId('second'))

      expect(minute).toHaveTextContent('23')
    })

    it('snaps typed minute value to nearest non-divisor step', async () => {
      const { user, getByTestId } = setupStepSnappingTest({
        step: { minute: 7 },
        stepSnapping: true,
      })

      const minute = getByTestId('minute')
      await user.click(minute)
      await user.keyboard('{2}{3}')
      await user.click(getByTestId('second'))

      expect(minute).toHaveTextContent('21')
    })

    it('snaps typed hour value to nearest step', async () => {
      const { user, getByTestId } = setupStepSnappingTest({
        modelValue: new Temporal.PlainDateTime(1980, 1, 20, 0, 0, 0, 0),
        hourCycle: 24,
        step: { hour: 4 },
        stepSnapping: true,
      })

      const hour = getByTestId('hour')
      await user.click(hour)
      await user.keyboard('{1}{0}')
      await user.click(getByTestId('minute'))

      expect(hour).toHaveTextContent('12')
    })

    it('snaps typed second value to nearest step', async () => {
      const { user, getByTestId } = setupStepSnappingTest({
        step: { second: 7 },
        stepSnapping: true,
      })

      const second = getByTestId('second')
      await user.click(second)
      await user.keyboard('{1}{0}')
      await user.click(getByTestId('minute'))

      expect(second).toHaveTextContent('7')
    })

    it('does not snap typed values when stepSnapping is false', async () => {
      const { user, getByTestId } = setupStepSnappingTest({
        step: { minute: 15 },
        stepSnapping: false,
      })

      const minute = getByTestId('minute')
      await user.click(minute)
      await user.keyboard('{2}{3}')
      await user.click(getByTestId('second'))

      expect(minute).toHaveTextContent('23')
    })
  })
})

describe('handle IME composition', () => {
  it('should block direct text insertion into the segment (Safari fires beforeinput before keydown with an IME active)', async () => {
    const { day, user } = setup()

    await user.click(day)

    // Safari inserts the raw character at `input` (before `keydown`) while an IME
    // is active; blocking `beforeinput` is the only way to stop it leaking in.
    const event = new InputEvent('beforeinput', { data: '1', inputType: 'insertText', cancelable: true })
    Object.defineProperty(event, 'isComposing', { value: false })
    day.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('should let composition input through beforeinput', async () => {
    const { day, user } = setup()

    await user.click(day)

    const event = new InputEvent('beforeinput', { data: 'n', inputType: 'insertCompositionText', cancelable: true })
    Object.defineProperty(event, 'isComposing', { value: true })
    day.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
  })

  it('should still apply a directly-typed digit when a CJK IME is active (keyCode 229, not composing)', async () => {
    const { day, user, getByTestId } = setup()

    await user.click(day)
    expect(day).toHaveFocus()

    // Pinyin active but NOT composing: Safari flags the keydown with keyCode 229
    // while passing the real digit through (key === '1', isComposing false).
    await fireEvent.keyDown(day, { key: '1', keyCode: 229 })
    await nextTick()

    expect(getByTestId('day')).toHaveTextContent('1')
  })

  it('should not update segment during IME keydown (keyCode 229)', async () => {
    const { day, user } = setup()

    await user.click(day)
    expect(day).toHaveFocus()

    await fireEvent.keyDown(day, { key: 'Process', keyCode: 229, isComposing: true })

    expect(day).toHaveTextContent('dd')
  })

  it('should process committed digit after compositionend', async () => {
    const { day, user, getByTestId } = setup()

    await user.click(day)

    await fireEvent.keyDown(day, { key: 'Process', keyCode: 229, isComposing: true })
    expect(day).toHaveTextContent('dd')

    await fireEvent(day, new CompositionEvent('compositionend', { data: '5' }))
    await nextTick()

    expect(getByTestId('day')).toHaveTextContent('5')
  })

  it('should ignore non-digit characters from compositionend', async () => {
    const { day, user, getByTestId } = setup()

    await user.click(day)

    await fireEvent(day, new CompositionEvent('compositionend', { data: 'あ' }))
    await nextTick()

    expect(getByTestId('day')).toHaveTextContent('dd')
  })

  it('should restore the placeholder after composing non-numeric text into the segment', async () => {
    const { day, user, getByTestId } = setup()

    await user.click(day)

    // The IME mutates the contenteditable directly: capture Vue's nodes on
    // compositionstart, then simulate the IME prepending text to the value node.
    await fireEvent(day, new CompositionEvent('compositionstart', { data: '' }))
    const valueNode = [...day.childNodes].find(n => n.nodeType === 3 && n.nodeValue) as Text
    valueNode.nodeValue = `你${valueNode.nodeValue}`
    expect(getByTestId('day')).toHaveTextContent('你dd')

    // On commit, the IME text must be reverted and Vue's node restored so it stays
    // patchable (Vue won't reconcile it since the segment value never changed).
    await fireEvent(day, new CompositionEvent('compositionend', { data: '你' }))
    await nextTick()

    expect(getByTestId('day')).toHaveTextContent('dd')
  })

  it('should still apply a digit typed right after a non-numeric composition', async () => {
    const { day, user, getByTestId } = setup()

    await user.click(day)

    // Compose a non-numeric character and commit it.
    await fireEvent(day, new CompositionEvent('compositionstart', { data: '' }))
    const valueNode = [...day.childNodes].find(n => n.nodeType === 3 && n.nodeValue) as Text
    valueNode.nodeValue = `你${valueNode.nodeValue}`
    await fireEvent(day, new CompositionEvent('compositionend', { data: '你' }))
    await nextTick()
    expect(getByTestId('day')).toHaveTextContent('dd')

    // Typing a digit afterwards must still update the segment (regression: Vue's
    // text node was being detached, freezing the display).
    await fireEvent.keyDown(day, { key: '5' })
    await nextTick()
    expect(getByTestId('day')).toHaveTextContent('5')
  })

  it('should not advance to next segment during composition', async () => {
    const { month, day, user } = setup()

    await user.click(month)
    expect(month).toHaveFocus()

    await fireEvent.keyDown(month, { key: 'Process', keyCode: 229, isComposing: true })

    expect(month).toHaveFocus()
    expect(day).not.toHaveFocus()
  })

  it('should route multi-digit commit to following segments after focus advances', async () => {
    const { month, day, user, getByTestId } = setup()

    await user.click(month)

    // Committing "45": 4 fills month and auto-advances, 5 lands in the next segment
    await fireEvent(month, new CompositionEvent('compositionend', { data: '45' }))
    await nextTick()

    expect(getByTestId('month')).toHaveTextContent('4')
    expect(getByTestId('day')).toHaveTextContent('5')
  })

  it('should not navigate between segments during composition (arrow keys are IME candidate navigation)', async () => {
    const { month, day, user } = setup()

    await user.click(month)
    expect(month).toHaveFocus()

    // Arrow keys mid-composition are used to navigate IME candidates, not segments
    await fireEvent.keyDown(month, { key: 'ArrowRight', isComposing: true })
    expect(month).toHaveFocus()
    expect(day).not.toHaveFocus()

    // Once composition ends, arrow keys navigate segments again
    await fireEvent.keyDown(month, { key: 'ArrowRight' })
    expect(day).toHaveFocus()
  })
})

// Baseline coverage (2026-06-12): lines 89.18%, branches 87.26%, functions 97.43%
describe('useDateField – characterization tests (coverage gaps)', () => {
  describe('deleteValue – null prevValue path (line 317)', () => {
    it('pressing Backspace on an already-empty segment is a no-op (placeholder stays)', async () => {
      // Branch 40:0 — deleteValue(null) early-return path
      const { user, month } = setup()
      // month is empty (no modelValue), backspace should be a no-op
      await user.click(month)
      expect(month).toHaveTextContent('mm')
      await user.keyboard(kbd.BACKSPACE)
      // NOTE: current behavior — backspace on null segment leaves it null (placeholder text stays)
      expect(month).toHaveTextContent('mm')
    })

    it('pressing Backspace on a two-digit year value truncates to one digit', async () => {
      // Covers the `str.length > 1` path of deleteValue returning Number.parseInt(str.slice(0,-1))
      const { user, year, rerender } = setup({
        dateFieldProps: { modelValue: calendarDate },
        emits: {
          'onUpdate:modelValue': (data: DateValue) => {
            return rerender({ dateFieldProps: { modelValue: data } })
          },
        },
      })
      // Year is 1980 (4 digits). First backspace removes the last digit → 198
      await user.click(year)
      await user.keyboard(kbd.BACKSPACE)
      expect(year).toHaveTextContent('198')
    })
  })

  describe('updateYear – str.length > 4 path (line 618)', () => {
    it('typing a 5th digit in the year segment resets the year to that digit', async () => {
      // Branch 77:0 — updateYear when accumulated str would exceed 4 digits
      // Also covers branch 78:1 — num !== 0, so returns num directly
      const { user, year, rerender } = setup({
        dateFieldProps: { modelValue: calendarDate },
        emits: {
          'onUpdate:modelValue': (data: DateValue) => {
            return rerender({ dateFieldProps: { modelValue: data } })
          },
        },
      })
      // Type 4 digits to fill the year segment (auto-advances after 4th digit)
      await user.click(year)
      await user.keyboard('{2}{0}{2}{4}')
      expect(year).toHaveTextContent('2024')
      // Click back on year and type more to get to a 5-digit accumulated string
      await user.click(year)
      await user.keyboard('{2}{0}{2}{4}{5}')
      // NOTE: current behavior — 5th digit resets: returns { value: 5, moveToNext: false }
      expect(year).toHaveTextContent('5')
    })

    it('typing 0 as the 5th digit in the year segment resets to 1 (prevents year=0)', async () => {
      // Branch 78:0 — num === 0 in updateYear overflow path, returns 1 instead of 0
      const { user, year, rerender } = setup({
        dateFieldProps: { modelValue: calendarDate },
        emits: {
          'onUpdate:modelValue': (data: DateValue) => {
            return rerender({ dateFieldProps: { modelValue: data } })
          },
        },
      })
      await user.click(year)
      await user.keyboard('{2}{0}{2}{4}')
      await user.click(year)
      await user.keyboard('{2}{0}{2}{4}{0}')
      // NOTE: current behavior — 5th digit of 0 returns 1 (year 0 is invalid)
      expect(year).toHaveTextContent('1')
    })
  })

  describe('compositionend – no data early return (line 988)', () => {
    it('compositionend with empty string data does not crash or modify the segment', async () => {
      // Branch 171:0 — handleSegmentCompositionEnd early return when data is falsy
      const { day, user, getByTestId } = setup()
      await user.click(day)
      // Fire compositionend with empty string data
      await fireEvent(day, new CompositionEvent('compositionend', { data: '' }))
      await nextTick()
      // NOTE: current behavior — no change, segment stays at placeholder
      expect(getByTestId('day')).toHaveTextContent('dd')
    })

    it('compositionend with no data (undefined) does not crash or modify the segment', async () => {
      // Branch 171:0 — handleSegmentCompositionEnd early return when data is null/undefined
      const { day, user, getByTestId } = setup()
      await user.click(day)
      await fireEvent(day, new CompositionEvent('compositionend'))
      await nextTick()
      expect(getByTestId('day')).toHaveTextContent('dd')
    })
  })

  describe('hourSegmentAttrs hourCycle=12 aria-value bounds (lines 129-130)', () => {
    it('hour segment has aria-valuemin=1 and aria-valuemax=12 when hourCycle is 12', async () => {
      // Covers the true branch of (hourCycle === 12 ? 1 : 0) and (hourCycle === 12 ? 12 : 23)
      const { getByTestId } = setup({
        dateFieldProps: {
          modelValue: calendarDateTime,
          hourCycle: 12,
        },
      })
      const hour = getByTestId('hour')
      expect(hour).toHaveAttribute('aria-valuemin', '1')
      expect(hour).toHaveAttribute('aria-valuemax', '12')
    })

    it('hour segment has aria-valuemin=0 and aria-valuemax=23 when hourCycle is 24', async () => {
      const { getByTestId } = setup({
        dateFieldProps: {
          modelValue: calendarDateTime,
          hourCycle: 24,
        },
      })
      const hour = getByTestId('hour')
      expect(hour).toHaveAttribute('aria-valuemin', '0')
      expect(hour).toHaveAttribute('aria-valuemax', '23')
    })
  })
})

/**
 * Locales whose formatted day period is not `AM`/`PM` used to fall through to
 * the `AM` token, so an afternoon value rendered as AM and editing the hour
 * converted it to the morning.
 *
 * @see https://github.com/unovue/reka-ui/issues/2956
 */
describe('dayPeriod across locales', () => {
  const afternoon = new Temporal.PlainDateTime(2024, 1, 20, 15, 30)
  const morning = new Temporal.PlainDateTime(2024, 1, 20, 9, 30)
  const locales = ['en-US', 'nl-NL', 'es-ES', 'ja-JP', 'zh-CN', 'ko-KR', 'ar-EG', 'hi-IN']

  describe.each(locales)('%s', (locale) => {
    it('shows PM for an afternoon value', async () => {
      const { getByTestId } = setup({ dateFieldProps: { modelValue: afternoon, locale, hourCycle: 12 } })
      expect(getByTestId('dayPeriod')).toHaveTextContent('PM')
    })

    it('shows AM for a morning value', async () => {
      const { getByTestId } = setup({ dateFieldProps: { modelValue: morning, locale, hourCycle: 12 } })
      expect(getByTestId('dayPeriod')).toHaveTextContent('AM')
    })

    it('keeps an afternoon value in the afternoon when the hour is retyped', async () => {
      const { getByTestId, user, rerender } = setup({
        dateFieldProps: { modelValue: afternoon, locale, hourCycle: 12 },
        emits: {
          'onUpdate:modelValue': (data: DateValue) => {
            return rerender({ dateFieldProps: { modelValue: data, locale, hourCycle: 12 } })
          },
        },
      })

      await user.click(getByTestId('hour'))
      await user.keyboard('{3}')

      expect(getByTestId('value').textContent).toBe(afternoon.with({ hour: 15 }).toString())
      expect(getByTestId('dayPeriod')).toHaveTextContent('PM')
    })
  })
})

describe('temporal calendar systems', () => {
  it('shows and edits the year of the era', async () => {
    const onUpdate = vi.fn()
    const reiwa6 = Temporal.PlainDate.from({ calendar: 'japanese', era: 'reiwa', eraYear: 6, month: 5, day: 1 })
    const { user, year, getByTestId } = setup({
      dateFieldProps: { modelValue: reiwa6, locale: 'en-US' },
      emits: { 'onUpdate:modelValue': onUpdate },
    })
    expect(year).toHaveTextContent('6')
    // en-US abbreviates Reiwa to its narrow form.
    expect(getByTestId('era')).toHaveTextContent('R')

    await user.click(year)
    await user.keyboard(kbd.ARROW_DOWN)
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled())
    const decremented = onUpdate.mock.lastCall![0] as Temporal.PlainDate
    expect([decremented.era, decremented.eraYear]).toEqual(['reiwa', 5])
    expect(decremented.toString({ calendarName: 'never' })).toBe('2023-05-01')
  })
})

describe('temporal regressions (#3088 review)', () => {
  it('steps the hour of a ZonedDateTime over a spring-forward gap', async () => {
    const onUpdate = vi.fn()
    // New York springs forward at 02:00 on 2024-03-10: 02:30 does not exist.
    const { user, getByTestId } = setup({
      dateFieldProps: { modelValue: Temporal.ZonedDateTime.from('2024-03-10T03:30-04:00[America/New_York]'), granularity: 'minute' },
      emits: { 'onUpdate:modelValue': onUpdate },
    })
    await user.click(getByTestId('hour'))
    await user.keyboard(kbd.ARROW_DOWN)
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1))
    expect(onUpdate.mock.lastCall![0].toString()).toBe('2024-03-10T01:30:00-05:00[America/New_York]')

    await user.keyboard(kbd.ARROW_DOWN)
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(2))
    expect(onUpdate.mock.lastCall![0].toString()).toBe('2024-03-10T00:30:00-05:00[America/New_York]')
  })

  it('steps the hour of a ZonedDateTime forward over a spring-forward gap', async () => {
    const onUpdate = vi.fn()
    const { user, getByTestId } = setup({
      dateFieldProps: { modelValue: Temporal.ZonedDateTime.from('2024-03-10T01:30-05:00[America/New_York]'), granularity: 'minute' },
      emits: { 'onUpdate:modelValue': onUpdate },
    })
    await user.click(getByTestId('hour'))
    await user.keyboard(kbd.ARROW_UP)
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1))
    expect(onUpdate.mock.lastCall![0].toString()).toBe('2024-03-10T03:30:00-04:00[America/New_York]')
  })

  it('wraps the year within a Japanese era', async () => {
    const onUpdate = vi.fn()
    const heisei1 = Temporal.PlainDate.from('1989-04-30').withCalendar('japanese')
    const { user, year } = setup({
      dateFieldProps: { modelValue: heisei1, locale: 'ja-JP-u-ca-japanese' },
      emits: { 'onUpdate:modelValue': onUpdate },
    })
    await user.click(year)
    await user.keyboard(kbd.ARROW_DOWN)
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled())
    // Heisei 31 is the era's last year: it ends on 30 April 2019.
    const wrapped = onUpdate.mock.lastCall![0] as Temporal.PlainDate
    expect([wrapped.era, wrapped.eraYear]).toEqual(['heisei', 31])
    expect(wrapped.toString({ calendarName: 'never' })).toBe('2019-04-30')
  })

  it('keeps the years of the current era within the ISO years 1 to 9999', async () => {
    const onUpdate = vi.fn()
    const { user, year } = setup({
      dateFieldProps: { modelValue: Temporal.PlainDate.from('2019-05-01').withCalendar('japanese'), locale: 'ja-JP-u-ca-japanese' },
      emits: { 'onUpdate:modelValue': onUpdate },
    })
    await user.click(year)
    await user.keyboard(kbd.ARROW_DOWN)
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled())
    const wrapped = onUpdate.mock.lastCall![0] as Temporal.PlainDate
    expect(wrapped.era).toBe('reiwa')
    expect(wrapped.withCalendar('iso8601').year).toBe(9999)
  })

  it('reads the era segment\'s value as its label, not its Temporal code', () => {
    const reiwa6 = Temporal.PlainDate.from({ calendar: 'japanese', era: 'reiwa', eraYear: 6, month: 5, day: 1 })
    const { getByTestId } = setup({ dateFieldProps: { modelValue: reiwa6, locale: 'en-US' } })
    expect(getByTestId('era')).toHaveAttribute('aria-valuetext', 'Reiwa')
  })

  it('ignores keys on the era segment', async () => {
    const reiwa6 = Temporal.PlainDate.from({ calendar: 'japanese', era: 'reiwa', eraYear: 6, month: 5, day: 1 })
    const { getByTestId } = setup({ dateFieldProps: { modelValue: reiwa6, locale: 'en-US' } })
    const era = getByTestId('era')
    // Vue reports a throwing event handler instead of rethrowing it.
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      await fireEvent.keyDown(era, { key: kbd.ARROW_UP })
      expect([...error.mock.calls, ...warn.mock.calls]).toEqual([])
      expect(era).toHaveTextContent('R')
    }
    finally {
      error.mockRestore()
      warn.mockRestore()
    }
  })

  it('shows an ISO value in the Gregorian calendar, whatever the locale\'s default calendar', () => {
    const { year, queryByTestId } = setup({ dateFieldProps: { modelValue: Temporal.PlainDate.from('2024-05-01'), locale: 'ja-JP-u-ca-japanese' } })
    expect(year).toHaveTextContent('2024')
    expect(queryByTestId('era')).toBeNull()
  })
})
