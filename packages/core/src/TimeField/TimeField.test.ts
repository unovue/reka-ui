import type { DateFields, TimeFields } from '@internationalized/date'

import type { TimeFieldRootProps } from './TimeFieldRoot.vue'
import type { TimeValue } from '@/shared/date'
import { CalendarDateTime, now, parseAbsoluteToLocal, Time, toZoned } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import TimeField from './story/_TimeField.vue'

const time = new Time(9, 15, 29)
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

function setup(props: { timeFieldProps?: TimeFieldRootProps, emits?: { 'onUpdate:modelValue'?: (data: TimeValue) => void } } = {}) {
  const user = userEvent.setup()
  const returned = render(TimeField, { props })
  const value = returned.getByTestId('value')
  const hour = returned.getByTestId('hour')
  const input = returned.getByTestId('input')
  const label = returned.getByTestId('label')

  return { ...returned, user, input, hour, label, value }
}

it('should pass axe accessibility tests', async () => {
  const { container } = setup()
  expect(await axe(container)).toHaveNoViolations()
})

describe('timeField', async () => {
  it('populates segment with value - `Time`', async () => {
    const { hour } = setup({
      timeFieldProps: { modelValue: time },
    })

    expect(hour).toHaveTextContent(String(time.hour))
  })

  it('populates segment with value - `CalendarDateTime`', async () => {
    const { hour, getByTestId } = setup({
      timeFieldProps: { modelValue: calendarDateTime },
    })

    const minute = getByTestId('minute')

    expect(hour).toHaveTextContent(String(calendarDateTime.hour))
    expect(minute).toHaveTextContent(String(calendarDateTime.minute))
  })

  it('populates segment with value - `ZonedDateTime`', async () => {
    const { hour, getByTestId } = setup({
      timeFieldProps: { modelValue: zonedDateTime },
    })

    const minute = getByTestId('minute')

    expect(hour).toHaveTextContent(String(zonedDateTime.hour))
    expect(minute).toHaveTextContent(String(zonedDateTime.minute))
    expect(getByTestId('dayPeriod')).toHaveTextContent('PM')
    expect(getByTestId('timeZoneName')).toHaveTextContent('EST')
  })

  it('doesn\'t show the day period for locales that don\'t use them', async () => {
    const { queryByTestId } = setup({
      timeFieldProps: {
        locale: 'en-UK',
        modelValue: calendarDateTime,
      },
    })
    expect(queryByTestId('dayPeriod')).not.toBeInTheDocument()
  })
  it('does show the day period for locales that do use them', async () => {
    const { queryByTestId } = setup({
      timeFieldProps: { modelValue: calendarDateTime },
    })
    expect(queryByTestId('dayPeriod')).toBeInTheDocument()
  })

  it('focuses first segment on label click', async () => {
    const { user, input, label } = setup()
    await user.click(label)
    expect(input.firstElementChild).toHaveFocus()
  })

  it('focuses segments on click', async () => {
    const { user, hour, getByTestId } = setup({
      timeFieldProps: { modelValue: zonedDateTime },
    })

    const minute = getByTestId('minute')
    const dayPeriod = getByTestId('dayPeriod')
    const timeZoneName = getByTestId('timeZoneName')
    const segments = [hour, minute, dayPeriod, timeZoneName]

    for (const segment of segments) {
      await user.click(segment)
      expect(segment).toHaveFocus()
    }
  })

  it('increments segment on arrow up', async () => {
    const { user, hour, getByTestId } = setup({
      timeFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })

    function cycle(segment: keyof TimeFields) {
      return String(zonedDateTime.cycle(segment, 1)[segment])
    }

    const minute = getByTestId('minute')
    const second = getByTestId('second')

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
    const { user, hour, getByTestId } = setup({
      timeFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })

    function cycle(segment: keyof TimeFields) {
      return String(zonedDateTime.cycle(segment, -1)[segment])
    }

    const minute = getByTestId('minute')
    const second = getByTestId('second')

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

  it('increase/decrease segments with step', async () => {
    const step = 2
    const { user, hour, getByTestId } = setup({
      timeFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
        step: { minute: step, second: step },
      },
    })

    function cycle(segment: keyof TimeFields, sign: number) {
      return String(zonedDateTime.cycle(segment, sign)[segment])
    }

    const minute = getByTestId('minute')
    const second = getByTestId('second')

    await user.click(hour)
    await user.keyboard(kbd.ARROW_DOWN)
    expect(hour).toHaveTextContent(cycle('hour', -1))
    await user.keyboard(kbd.ARROW_UP)
    expect(hour).toHaveTextContent(cycle('hour', 0))

    await user.click(minute)
    await user.keyboard(kbd.ARROW_DOWN)
    expect(minute).toHaveTextContent(cycle('minute', -step))
    await user.keyboard(kbd.ARROW_UP)
    await user.keyboard(kbd.ARROW_UP)
    expect(minute).toHaveTextContent(cycle('minute', step))

    await user.click(second)
    await user.keyboard(kbd.ARROW_DOWN)
    expect(second).toHaveTextContent(cycle('second', -step))
    await user.keyboard(kbd.ARROW_UP)
    await user.keyboard(kbd.ARROW_UP)
    expect(second).toHaveTextContent(cycle('second', step))
  })

  it('navigates segments using the arrow keys', async () => {
    const { getByTestId, user, hour } = setup({
      timeFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })
    const { minute, second, dayPeriod, timeZoneName } = getTimeSegments(getByTestId)

    const segments = [hour, minute, second, dayPeriod, timeZoneName]

    await user.click(hour)

    for (const seg of segments) {
      expect(seg).toHaveFocus()
      await user.keyboard(kbd.ARROW_RIGHT)
    }
    expect(timeZoneName).toHaveFocus()

    for (const seg of segments.reverse()) {
      expect(seg).toHaveFocus()
      await user.keyboard(kbd.ARROW_LEFT)
    }
    expect(hour).toHaveFocus()
  })

  it('navigates the segments using tab', async () => {
    const { getByTestId, user, hour } = setup({
      timeFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })
    const { minute, second, dayPeriod, timeZoneName } = getTimeSegments(getByTestId)

    const segments = [hour, minute, second, dayPeriod]

    await user.click(hour)

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

  it('prevents interaction when `disabled`', async () => {
    const { user, getByTestId, hour } = setup({
      timeFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
        disabled: true,
      },
    })

    const { minute, second, dayPeriod, timeZoneName } = getTimeSegments(getByTestId)

    const segments = [hour, minute, second, dayPeriod, timeZoneName]

    for (const seg of segments) {
      await user.click(seg)
      expect(seg).not.toHaveFocus()
      expect(seg).not.toHaveAttribute('tabindex')
    }
  })

  it('prevents modification when `readonly`', async () => {
    const { user, hour, getByTestId } = setup({
      timeFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
        readonly: true,
      },
    })

    const minute = getByTestId('minute')
    const second = getByTestId('second')

    const segments = [hour, minute, second]

    for (const segment of segments) {
      await user.click(segment)
      expect(segment).toHaveFocus()
      await user.keyboard(kbd.ARROW_UP)
      expect(segment).toHaveTextContent(
        String(zonedDateTime[segment.getAttribute('data-reka-time-field-segment') as keyof TimeFields | keyof DateFields]),
      )
    }
  })

  it('adjusts the hour cycle with the `hourCycle` prop', async () => {
    const { hour, queryByTestId, user } = setup({
      timeFieldProps: {
        modelValue: zonedDateTime,
        hourCycle: 24,
      },
    })

    expect(queryByTestId('dayPeriod')).toBeNull()
    expect(hour).toHaveTextContent('12')
    await user.click(hour)
    expect(hour).toHaveFocus()
    await user.keyboard(kbd.ARROW_UP)
    expect(hour).toHaveTextContent('13')
  })

  it('overrides the default displayed segments with the `granularity` prop - `hour`', async () => {
    const { queryByTestId, hour } = setup({
      timeFieldProps: {
        modelValue: calendarDateTime,
        granularity: 'hour',
      },
    })

    const nonDisplayedSegments = ['minute', 'second']
    const displayedSegments = [hour]
    for (const seg of nonDisplayedSegments)
      expect(queryByTestId(seg)).toBeNull()

    for (const seg of displayedSegments)
      expect(seg).toBeVisible()
  })

  it('overrides the default displayed segments with the `granularity` prop - `minute`', async () => {
    const { queryByTestId, getByTestId, hour } = setup({
      timeFieldProps: {
        modelValue: calendarDateTime,
        granularity: 'minute',
      },
    })

    const minute = getByTestId('minute')

    const displayedSegments = [
      hour,
      minute,
      getByTestId('dayPeriod'),
    ]

    expect(queryByTestId('second')).toBeNull()

    for (const seg of displayedSegments)
      expect(seg).toBeVisible()
  })

  it('takes you all the way through the segment with spamming 1', async () => {
    const { getByTestId, user, hour } = setup({
      timeFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })

    const { minute, second, dayPeriod } = getTimeSegments(getByTestId)

    await user.click(hour)
    await user.keyboard('{1}')
    await user.keyboard('{1}')
    expect(minute).toHaveFocus()
    await user.keyboard('{1}')
    await user.keyboard('{1}')
    expect(second).toHaveFocus()
    await user.keyboard('{1}')
    await user.keyboard('{1}')
    expect(dayPeriod).toHaveFocus()
  })

  it('updates the hour on the modelValue if the dayPeriod is updated', async () => {
    const { getByTestId, user, value, rerender } = setup({
      timeFieldProps: {
        modelValue: calendarDateTime,
        granularity: 'second',
      },
      emits: {
        'onUpdate:modelValue': (data: TimeValue) => {
          return rerender({
            timeFieldProps: {
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

  it('fully overwrites on first click and type - `hour`', async () => {
    const { user, hour } = setup({
      timeFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })

    await user.click(hour)
    expect(hour).toHaveFocus()
    expect(hour).toHaveTextContent(String(zonedDateTime.hour))
    await user.keyboard('{3}')
    expect(hour).toHaveTextContent('3')
  })

  it('displays correct timezone with ZonedDateTime value - `now`', async () => {
    const { getByTestId } = setup({
      timeFieldProps: { modelValue: now('America/Los_Angeles') },
    })

    const timeZone = getByTestId('timeZoneName')
    if (isDaylightSavingsTime())
      expect(timeZone).toHaveTextContent('PDT')
    else
      expect(timeZone).toHaveTextContent('PST')
  })

  it('displays correct timezone with ZonedDateTime value - absolute -> local', async () => {
    const { getByTestId } = setup({
      timeFieldProps: { modelValue: parseAbsoluteToLocal('2023-10-12T12:30:00Z') },
    })

    const timeZone = getByTestId('timeZoneName')
    expect(timeZone).toHaveTextContent(thisTimeZone('2023-10-12T12:30:00Z'))
  })
})
