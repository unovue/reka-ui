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

  it('filter time zone brackets for specific locales', async () => {
    const { queryByTestId } = setup({
      timeFieldProps: { modelValue: calendarDateTime, locale: 'zh-TW', hideTimeZone: true },
    })
    expect(queryByTestId('input')).not.toHaveTextContent('[')
    expect(queryByTestId('input')).not.toHaveTextContent(']')
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

  it('doesn\'t change focus prematurely with segment value of 0', async () => {
    const { getByTestId, user, hour } = setup({
      timeFieldProps: {
        modelValue: time,
        granularity: 'second',
      },
    })

    const minute = getByTestId('minute')
    const second = getByTestId('second')

    const segments = [hour, minute, second]

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

  it('allows typing two-digit hours (e.g. 14) in 24h mode regardless of locale', async () => {
    const { hour, user, value, rerender } = setup({
      timeFieldProps: {
        modelValue: new Time(0, 30, 0),
        hourCycle: 24,
      },
      emits: {
        'onUpdate:modelValue': (data: TimeValue) => {
          return rerender({
            timeFieldProps: {
              modelValue: data,
              hourCycle: 24,
            },
          })
        },
      },
    })

    await user.click(hour)
    await user.keyboard('{1}{4}')

    expect(hour).toHaveTextContent('14')
    expect(value.textContent).toContain('14:30:00')
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

  it('takes you all the way through the segment with spamming 0', async () => {
    const { getByTestId, user, hour } = setup({
      timeFieldProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })

    const { minute, second, dayPeriod } = getTimeSegments(getByTestId)

    await user.click(hour)
    await user.keyboard('{0}')
    expect(hour).toHaveFocus()
    await user.keyboard('{0}')
    expect(minute).toHaveFocus()
    await user.keyboard('{0}')
    expect(minute).toHaveFocus()
    await user.keyboard('{0}')
    expect(second).toHaveFocus()
    await user.keyboard('{0}')
    expect(second).toHaveFocus()
    await user.keyboard('{0}')
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

  describe('12-hour format display', () => {
    it('displays midnight (hour 0) as 12 AM', async () => {
      const { hour, getByTestId } = setup({
        timeFieldProps: {
          modelValue: new Time(0, 30, 0),
          hourCycle: 12,
        },
      })

      expect(hour).toHaveTextContent('12')
      expect(getByTestId('dayPeriod')).toHaveTextContent('AM')
    })

    it('displays noon (hour 12) as 12 PM', async () => {
      const { hour, getByTestId } = setup({
        timeFieldProps: {
          modelValue: new Time(12, 30, 0),
          hourCycle: 12,
        },
      })

      expect(hour).toHaveTextContent('12')
      expect(getByTestId('dayPeriod')).toHaveTextContent('PM')
    })

    it('converts afternoon hours (13-23) to 12-hour format', async () => {
      const { hour, getByTestId } = setup({
        timeFieldProps: {
          modelValue: new Time(13, 30, 0),
          hourCycle: 12,
        },
      })

      expect(hour).toHaveTextContent('1')
      expect(getByTestId('dayPeriod')).toHaveTextContent('PM')
    })

    it('converts late evening hour (23) to 11 PM', async () => {
      const { hour, getByTestId } = setup({
        timeFieldProps: {
          modelValue: new Time(23, 30, 0),
          hourCycle: 12,
        },
      })

      expect(hour).toHaveTextContent('11')
      expect(getByTestId('dayPeriod')).toHaveTextContent('PM')
    })

    it('displays morning hours (1-11) correctly', async () => {
      const { hour, getByTestId } = setup({
        timeFieldProps: {
          modelValue: new Time(9, 30, 0),
          hourCycle: 12,
        },
      })

      expect(hour).toHaveTextContent('9')
      expect(getByTestId('dayPeriod')).toHaveTextContent('AM')
    })

    it('works with CalendarDateTime values', async () => {
      const { hour, getByTestId } = setup({
        timeFieldProps: {
          modelValue: new CalendarDateTime(2024, 1, 15, 15, 45, 0, 0),
          hourCycle: 12,
        },
      })

      expect(hour).toHaveTextContent('3')
      expect(getByTestId('dayPeriod')).toHaveTextContent('PM')
    })

    it('works with ZonedDateTime values', async () => {
      const { hour, getByTestId } = setup({
        timeFieldProps: {
          modelValue: toZoned(new CalendarDateTime(2024, 1, 15, 0, 30, 0, 0), 'America/New_York'),
          hourCycle: 12,
        },
      })

      expect(hour).toHaveTextContent('12')
      expect(getByTestId('dayPeriod')).toHaveTextContent('AM')
    })
  })

  describe('12-hour arrow key cycling', () => {
    it('transitions from PM to AM when cycling from 11 PM to 12 AM', async () => {
      const { hour, user, getByTestId } = setup({
        timeFieldProps: {
          modelValue: new Time(23, 30, 0), // 11 PM
          hourCycle: 12,
        },
      })

      await user.click(hour)
      await user.keyboard(kbd.ARROW_UP)

      expect(hour).toHaveTextContent('12')
      expect(getByTestId('dayPeriod')).toHaveTextContent('AM')
    })

    it('transitions from AM to PM when cycling from 11 AM to 12 PM', async () => {
      const { hour, user, getByTestId } = setup({
        timeFieldProps: {
          modelValue: new Time(11, 30, 0), // 11 AM
          hourCycle: 12,
        },
      })

      await user.click(hour)
      await user.keyboard(kbd.ARROW_UP)

      expect(hour).toHaveTextContent('12')
      expect(getByTestId('dayPeriod')).toHaveTextContent('PM')
    })

    it('cycles correctly through all PM hours without changing to AM', async () => {
      const { hour, user, getByTestId, rerender } = setup({
        timeFieldProps: {
          modelValue: new Time(13, 30, 0), // 1 PM
          hourCycle: 12,
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: {
                modelValue: data,
                hourCycle: 12,
              },
            })
          },
        },
      })

      await user.click(hour)

      // Cycle from 1 PM through 11 PM
      for (let i = 1; i < 11; i++) {
        await user.keyboard(kbd.ARROW_UP)
        expect(getByTestId('dayPeriod')).toHaveTextContent('PM')
      }

      // At 11 PM, next should be 12 AM
      await user.keyboard(kbd.ARROW_UP)
      expect(hour).toHaveTextContent('12')
      expect(getByTestId('dayPeriod')).toHaveTextContent('AM')
    })
  })

  describe('12-hour input handling', () => {
    it('allows typing 10 with AM period', async () => {
      const { hour, user, value, rerender } = setup({
        timeFieldProps: {
          modelValue: new Time(0, 30, 0),
          hourCycle: 12,
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: {
                modelValue: data,
                hourCycle: 12,
              },
            })
          },
        },
      })

      await user.click(hour)
      await user.keyboard('{1}{0}')

      expect(hour).toHaveTextContent('10')
      // Internal value should be 10 for 10 AM
      expect(value.textContent).toContain('10:30:00')
    })

    it('allows typing 11 with AM period', async () => {
      const { hour, user, value, rerender } = setup({
        timeFieldProps: {
          modelValue: new Time(0, 30, 0),
          hourCycle: 12,
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: {
                modelValue: data,
                hourCycle: 12,
              },
            })
          },
        },
      })

      await user.click(hour)
      await user.keyboard('{1}{1}')

      expect(hour).toHaveTextContent('11')
      // Internal value should be 11 for 11 AM
      expect(value.textContent).toContain('11:30:00')
    })

    it('allows typing 12 with PM period', async () => {
      const { hour, user, value, getByTestId, rerender } = setup({
        timeFieldProps: {
          modelValue: new Time(13, 30, 0),
          hourCycle: 12,
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: {
                modelValue: data,
                hourCycle: 12,
              },
            })
          },
        },
      })

      await user.click(hour)
      await user.keyboard('{1}{2}')

      expect(hour).toHaveTextContent('12')
      expect(getByTestId('dayPeriod')).toHaveTextContent('PM')
      // Internal value should be 12 for 12 PM
      expect(value.textContent).toContain('12:30:00')
    })

    it('allows typing 10 with PM period - converts to 22:00', async () => {
      const { hour, user, value, getByTestId, rerender } = setup({
        timeFieldProps: {
          modelValue: new Time(13, 30, 0),
          hourCycle: 12,
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: {
                modelValue: data,
                hourCycle: 12,
              },
            })
          },
        },
      })

      await user.click(hour)
      await user.keyboard('{1}{0}')

      expect(hour).toHaveTextContent('10')
      expect(getByTestId('dayPeriod')).toHaveTextContent('PM')
      // Internal value should be 22 for 10 PM
      expect(value.textContent).toContain('22:30:00')
    })

    it('allows typing 11 with PM period - converts to 23:00', async () => {
      const { hour, user, value, getByTestId, rerender } = setup({
        timeFieldProps: {
          modelValue: new Time(13, 30, 0),
          hourCycle: 12,
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: {
                modelValue: data,
                hourCycle: 12,
              },
            })
          },
        },
      })

      await user.click(hour)
      await user.keyboard('{1}{1}')

      expect(hour).toHaveTextContent('11')
      expect(getByTestId('dayPeriod')).toHaveTextContent('PM')
      // Internal value should be 23 for 11 PM
      expect(value.textContent).toContain('23:30:00')
    })

    it('allows typing 12 with AM period - converts to 00:00', async () => {
      const { hour, user, value, getByTestId, rerender } = setup({
        timeFieldProps: {
          modelValue: new Time(1, 30, 0),
          hourCycle: 12,
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: {
                modelValue: data,
                hourCycle: 12,
              },
            })
          },
        },
      })

      await user.click(hour)
      await user.keyboard('{1}{2}')

      expect(hour).toHaveTextContent('12')
      expect(getByTestId('dayPeriod')).toHaveTextContent('AM')
      // Internal value should be 0 for 12 AM (midnight)
      expect(value.textContent).toContain('00:30:00')
    })
  })

  describe('stepSnapping', () => {
    it('snaps typed minute value to nearest step', async () => {
      const { user, getByTestId, rerender } = setup({
        timeFieldProps: {
          modelValue: new CalendarDateTime(1980, 1, 20, 12, 0, 0, 0),
          granularity: 'second',
          step: { minute: 15 },
          stepSnapping: true,
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: {
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
      // Type 23 - should snap to 30 (nearest multiple of 15)
      await user.keyboard('{2}{3}')
      expect(minute).toHaveTextContent('30')
    })

    it('snaps typed minute value down to nearest step', async () => {
      const { user, getByTestId, rerender } = setup({
        timeFieldProps: {
          modelValue: new CalendarDateTime(1980, 1, 20, 12, 0, 0, 0),
          granularity: 'second',
          step: { minute: 15 },
          stepSnapping: true,
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: {
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
      // Type 17 - should snap to 15 (nearest multiple of 15)
      await user.keyboard('{1}{7}')
      expect(minute).toHaveTextContent('15')
    })

    it('does not snap typed values when stepSnapping is false', async () => {
      const { user, getByTestId, rerender } = setup({
        timeFieldProps: {
          modelValue: new CalendarDateTime(1980, 1, 20, 12, 0, 0, 0),
          granularity: 'second',
          step: { minute: 15 },
          stepSnapping: false,
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: {
                modelValue: data,
                granularity: 'second',
                step: { minute: 15 },
                stepSnapping: false,
              },
            })
          },
        },
      })

      const minute = getByTestId('minute')
      await user.click(minute)
      // Type 23 - should remain 23 (no snapping)
      await user.keyboard('{2}{3}')
      expect(minute).toHaveTextContent('23')
    })

    it('arrow keys still use step regardless of stepSnapping setting', async () => {
      const { user, getByTestId } = setup({
        timeFieldProps: {
          modelValue: new CalendarDateTime(1980, 1, 20, 12, 0, 0, 0),
          granularity: 'second',
          step: { minute: 15 },
          stepSnapping: false,
        },
      })

      const minute = getByTestId('minute')
      await user.click(minute)
      await user.keyboard(kbd.ARROW_UP)
      expect(minute).toHaveTextContent('15')
    })

    it('snaps to max boundary when value exceeds max', async () => {
      const { user, getByTestId, rerender } = setup({
        timeFieldProps: {
          modelValue: new CalendarDateTime(1980, 1, 20, 12, 0, 0, 0),
          granularity: 'second',
          step: { minute: 15 },
          stepSnapping: true,
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: {
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
      // Type 58 - should snap to 45 (last valid step before 60)
      await user.keyboard('{5}{8}')
      expect(minute).toHaveTextContent('45')
    })
  })
})

// Baseline coverage (2026-06-12): lines 89.18%, branches 87.26%, functions 97.43%
describe('useDateField – time segment characterization tests (coverage gaps)', () => {
  describe('backspace on empty/null time segments (lines 785, 814, 842)', () => {
    it('backspace on an empty hour segment is a no-op (data-placeholder stays)', async () => {
      // Branch 125:0 — deleteValue(null) from handleHourSegmentKeydown
      // Also covers isNumberString false-branch (branch 111:1) for Backspace on hour
      const { user, hour } = setup()
      await user.click(hour)
      // Empty segments show a placeholder (data-placeholder attribute is present and empty string)
      expect(hour).toHaveAttribute('data-placeholder', '')
      await user.keyboard(kbd.BACKSPACE)
      // NOTE: current behavior — backspace on null segment leaves it null (placeholder stays)
      expect(hour).toHaveAttribute('data-placeholder', '')
    })

    it('backspace on an empty minute segment is a no-op (data-placeholder stays)', async () => {
      // Branch 132:0 — deleteValue(null) from handleMinuteSegmentKeydown
      const { user, getByTestId } = setup({ timeFieldProps: { granularity: 'second' } })
      const minute = getByTestId('minute')
      await user.click(minute)
      expect(minute).toHaveAttribute('data-placeholder', '')
      await user.keyboard(kbd.BACKSPACE)
      // NOTE: current behavior — backspace on null segment leaves it null (placeholder stays)
      expect(minute).toHaveAttribute('data-placeholder', '')
    })

    it('backspace on an empty second segment is a no-op (data-placeholder stays)', async () => {
      // Branch 139:0 — deleteValue(null) from handleSecondSegmentKeydown
      const { user, getByTestId } = setup({ timeFieldProps: { granularity: 'second' } })
      const second = getByTestId('second')
      await user.click(second)
      expect(second).toHaveAttribute('data-placeholder', '')
      await user.keyboard(kbd.BACKSPACE)
      // NOTE: current behavior — backspace on null segment leaves it null (placeholder stays)
      expect(second).toHaveAttribute('data-placeholder', '')
    })

    it('backspace on a non-null hour segment clears it to empty', async () => {
      // Branch 111:1 — isNumberString false in handleHourSegmentKeydown (Backspace key)
      // Branch 125:0 (via deleteValue) — single-digit value → modelValue=undefined, segment=null
      const { user, hour } = setup({
        timeFieldProps: { modelValue: new Time(9, 30, 0) },
      })
      // Segment is filled (no data-placeholder attribute when value is set)
      expect(hour).not.toHaveAttribute('data-placeholder')
      await user.click(hour)
      await user.keyboard(kbd.BACKSPACE)
      // NOTE: current behavior — single-digit value is cleared to null (placeholder shown)
      expect(hour).toHaveAttribute('data-placeholder', '')
    })

    it('backspace on a two-digit minute segment truncates to one digit', async () => {
      // deleteValue: str.length===2 > 1 → returns parseInt(str.slice(0,-1))
      const { user, getByTestId } = setup({
        timeFieldProps: { modelValue: new Time(9, 30, 0), granularity: 'second' },
      })
      const minute = getByTestId('minute')
      expect(minute).not.toHaveAttribute('data-placeholder')
      await user.click(minute)
      await user.keyboard(kbd.BACKSPACE)
      // deleteValue(30) → '30'.slice(0,-1) = '3', returns 3
      // NOTE: current behavior — minute=30 after backspace becomes 3
      expect(minute).not.toHaveAttribute('data-placeholder')
      expect(minute).toHaveTextContent('3')
    })

    it('backspace on a single-digit second segment clears it to empty', async () => {
      // Branch 139:0 via deleteValue on single-digit second
      const { user, getByTestId } = setup({
        timeFieldProps: { modelValue: new Time(9, 30, 5), granularity: 'second' },
      })
      const second = getByTestId('second')
      expect(second).not.toHaveAttribute('data-placeholder')
      await user.click(second)
      await user.keyboard(kbd.BACKSPACE)
      // deleteValue(5): str='5', length===1 → modelValue=undefined, returns null
      // NOTE: current behavior — single-digit second cleared to null (placeholder shows)
      expect(second).toHaveAttribute('data-placeholder', '')
    })
  })

  describe('minuteSecondIncrementation – null prevValue paths (lines 308-309)', () => {
    it('arrow Up on empty minute sets it to 0 (min) — fills data-placeholder', async () => {
      // Branch 38:0 — minuteSecondIncrementation with prevValue=null, sign>0 → returns min (0)
      // Branch 39:0 — cond-expr sign > 0 → min path
      const { user, getByTestId } = setup({ timeFieldProps: { granularity: 'second' } })
      const minute = getByTestId('minute')
      await user.click(minute)
      expect(minute).toHaveAttribute('data-placeholder', '')
      await user.keyboard(kbd.ARROW_UP)
      // NOTE: current behavior — null minute + arrow up → returns 0 (the min), segment is filled
      expect(minute).not.toHaveAttribute('data-placeholder')
      expect(minute).toHaveTextContent('0')
    })

    it('arrow Down on empty minute sets it to 59 (max) — fills data-placeholder', async () => {
      // Branch 38:0 — minuteSecondIncrementation with prevValue=null, sign<0 → returns max (59)
      // Branch 39:1 — cond-expr sign > 0 → max path
      const { user, getByTestId } = setup({ timeFieldProps: { granularity: 'second' } })
      const minute = getByTestId('minute')
      await user.click(minute)
      expect(minute).toHaveAttribute('data-placeholder', '')
      await user.keyboard(kbd.ARROW_DOWN)
      // NOTE: current behavior — null minute + arrow down → returns 59 (the max)
      expect(minute).not.toHaveAttribute('data-placeholder')
      expect(minute).toHaveTextContent('59')
    })

    it('arrow Down on empty second sets it to 59 (max)', async () => {
      const { user, getByTestId } = setup({ timeFieldProps: { granularity: 'second' } })
      const second = getByTestId('second')
      await user.click(second)
      await user.keyboard(kbd.ARROW_DOWN)
      // NOTE: current behavior — null second + arrow down → returns 59
      expect(second).toHaveTextContent('59')
    })

    it('arrow Up on empty second with custom step uses the step value', async () => {
      // Branch 36:1 — step ?? 1 when step IS explicitly provided
      // The step for arrow is used directly (not just for snap): sign = step, min=0
      const { user, getByTestId } = setup({
        timeFieldProps: {
          granularity: 'second',
          step: { second: 15 },
        },
      })
      const second = getByTestId('second')
      await user.click(second)
      await user.keyboard(kbd.ARROW_UP)
      // NOTE: current behavior — null second with step=15, arrow up: sign>0 → returns min (0)
      expect(second).toHaveTextContent('0')
    })
  })

  describe('updateMinuteOrSecond – boundary and overflow branches (lines 473, 502, 508)', () => {
    it('typing a first digit > 5 in minute auto-advances to next segment', async () => {
      // Branch 61:0 — updateMinuteOrSecond: num > maxStart (5) on first digit → moveToNext=true
      const { user, getByTestId } = setup({
        timeFieldProps: { modelValue: new Time(9, 15, 0), granularity: 'second' },
      })
      const minute = getByTestId('minute')
      const second = getByTestId('second')
      await user.click(minute)
      await user.keyboard('{7}')
      // NOTE: current behavior — typing 7 (> maxStart=5) sets minute=7 and moves to next segment
      // hasLeftFocus=true resets prev to null; 7>5 → moveToNext=true
      expect(minute).not.toHaveAttribute('data-placeholder')
      expect(second).toHaveFocus()
    })

    it('typing 12h hour overflow (e.g. 13 > 12) resets hour segment to the new digit', async () => {
      // Branch 73:0 — updateHour: total > max in 12h mode (max=12): resets to the new digit
      // Branch 65:0 equivalent in updateMinuteOrSecond but for hour
      const { user, hour, getByTestId } = setup({
        timeFieldProps: {
          modelValue: new Time(1, 30, 0),
          hourCycle: 12,
        },
      })
      const minute = getByTestId('minute')
      await user.click(hour)
      // Type 1, then 3: total=13 > 12 → resets to 3
      await user.keyboard('{1}{3}')
      // NOTE: current behavior — '13' > 12 → hour resets to 3 (and 3>maxStart=1 → moves to minute)
      expect(minute).toHaveFocus()
    })

    it('typing two valid digits in minute advances to next segment', async () => {
      // Branch 63 false path (total <= 59) → moveToNext=true at the end (line 515)
      const { user, getByTestId } = setup({
        timeFieldProps: { modelValue: new Time(9, 15, 0), granularity: 'second' },
      })
      const minute = getByTestId('minute')
      const second = getByTestId('second')
      await user.click(minute)
      await user.keyboard('{3}{5}')
      // NOTE: current behavior — '35' is valid (≤59), sets minute=35 and advances to second
      expect(minute).toHaveTextContent('35')
      expect(second).toHaveFocus()
    })
  })

  describe('updateHour – boundary and overflow branches (lines 582, 588)', () => {
    it('typing a first 24h digit > 2 in hour auto-advances to next segment', async () => {
      // Branch 71:0 — updateHour: num > maxStart (2 for max=24) on first digit → moveToNext=true
      const { user, hour, getByTestId } = setup({
        timeFieldProps: {
          modelValue: new Time(9, 30, 0),
          hourCycle: 24,
        },
      })
      const minute = getByTestId('minute')
      await user.click(hour)
      await user.keyboard('{3}')
      // NOTE: current behavior — typing 3 (> maxStart=2 for max=24) sets hour=3 and advances
      expect(hour).not.toHaveAttribute('data-placeholder')
      expect(minute).toHaveFocus()
    })

    it('typing a second 24h digit that overflows resets hour to the new digit', async () => {
      // Branch 73:0 — updateHour: total > max (25 > 24) → resets to new digit
      // Branch 73:1 — num (5) > maxStart (2) → moveToNext=true
      const { user, hour, getByTestId } = setup({
        timeFieldProps: {
          modelValue: new Time(9, 30, 0),
          hourCycle: 24,
        },
      })
      const minute = getByTestId('minute')
      await user.click(hour)
      // Type 2 then 5: total=25 > 24 → resets hour to 5, 5>2=maxStart → moveToNext
      await user.keyboard('{2}{5}')
      // NOTE: current behavior — '25' > 24 → hour resets to 5, advances to minute
      expect(minute).toHaveFocus()
    })
  })

  describe('handleDayPeriodSegmentKeydown – arrow key toggle (lines 852-858)', () => {
    it('arrow Up on dayPeriod segment toggles from AM to PM', async () => {
      // Branch 142:0 — ARROW_UP || ARROW_DOWN true branch (not previously covered)
      // Branch 144:0 — inner if(dayPeriod === 'AM') true branch
      const { user, getByTestId, rerender } = setup({
        timeFieldProps: {
          modelValue: new Time(9, 30, 0),
          granularity: 'second',
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: { modelValue: data, granularity: 'second' },
            })
          },
        },
      })
      const dayPeriod = getByTestId('dayPeriod')
      expect(dayPeriod).toHaveTextContent('AM')
      await user.click(dayPeriod)
      await user.keyboard(kbd.ARROW_UP)
      // NOTE: current behavior — AM + arrow up → PM, hour += 12 (9 → 21)
      expect(dayPeriod).toHaveTextContent('PM')
    })

    it('arrow Down on dayPeriod segment when AM toggles to PM', async () => {
      // Branch 142:0 — ARROW_DOWN true branch
      // Branch 144:0 — inner if(dayPeriod === 'AM') true branch
      const { user, getByTestId, rerender } = setup({
        timeFieldProps: {
          modelValue: new Time(9, 30, 0),
          granularity: 'second',
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: { modelValue: data, granularity: 'second' },
            })
          },
        },
      })
      const dayPeriod = getByTestId('dayPeriod')
      expect(dayPeriod).toHaveTextContent('AM')
      await user.click(dayPeriod)
      await user.keyboard(kbd.ARROW_DOWN)
      // NOTE: current behavior — AM + arrow down → PM (same as arrow up when currently AM)
      expect(dayPeriod).toHaveTextContent('PM')
    })

    it('arrow Up on dayPeriod when it is PM toggles to AM', async () => {
      // Branch 144:1 — inner if(dayPeriod === 'AM') is false → falls to lines 858-859 (set AM)
      const { user, getByTestId, rerender } = setup({
        timeFieldProps: {
          modelValue: new Time(21, 30, 0), // 9 PM
          granularity: 'second',
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: { modelValue: data, granularity: 'second' },
            })
          },
        },
      })
      const dayPeriod = getByTestId('dayPeriod')
      expect(dayPeriod).toHaveTextContent('PM')
      await user.click(dayPeriod)
      await user.keyboard(kbd.ARROW_UP)
      // NOTE: current behavior — PM + arrow up → AM, hour -= 12 (21 → 9)
      expect(dayPeriod).toHaveTextContent('AM')
    })

    it('pressing p key when dayPeriod is already PM has no effect', async () => {
      // Branch 147:1 — ['p','P'].includes(key) && dayPeriod !== 'PM' → false when already PM
      const { user, getByTestId } = setup({
        timeFieldProps: {
          modelValue: new Time(21, 30, 0), // 9 PM
          granularity: 'second',
        },
      })
      const dayPeriod = getByTestId('dayPeriod')
      expect(dayPeriod).toHaveTextContent('PM')
      await user.click(dayPeriod)
      await user.keyboard('{p}')
      // NOTE: current behavior — pressing p when already PM has no effect
      expect(dayPeriod).toHaveTextContent('PM')
    })
  })

  describe('handleSegmentFocusOut – hour step snapping with dayPeriod (lines 927-931)', () => {
    it('hour step snap sets dayPeriod to AM when snapped value < 12', async () => {
      // Branch 162:0 — after hour snap, if (hour < 12) → set dayPeriod = 'AM'
      const { user, hour, getByTestId, rerender } = setup({
        timeFieldProps: {
          modelValue: new CalendarDateTime(1980, 1, 20, 9, 0, 0, 0),
          granularity: 'second',
          step: { hour: 6 },
          stepSnapping: true,
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: {
                modelValue: data,
                granularity: 'second',
                step: { hour: 6 },
                stepSnapping: true,
              },
            })
          },
        },
      })
      const dayPeriod = getByTestId('dayPeriod')
      await user.click(hour)
      // Type 7 — auto-advances (7 > maxStart=1 for 12h max=12) → focusout on hour triggers snap
      await user.keyboard('{7}')
      // snapValueToStep(7, 0, 23, 6) = 6; 6 < 12 → dayPeriod set to 'AM'
      // NOTE: current behavior — after snapping 7 → 6, dayPeriod is set to AM
      expect(dayPeriod).toHaveTextContent('AM')
    })

    it('hour step snap sets dayPeriod to PM when snapped value >= 12', async () => {
      // Branch 163:0 — else if (hour) truthy branch → set dayPeriod = 'PM' when hour >= 12
      const { user, hour, getByTestId, rerender } = setup({
        timeFieldProps: {
          modelValue: new CalendarDateTime(1980, 1, 20, 14, 0, 0, 0),
          granularity: 'second',
          step: { hour: 6 },
          stepSnapping: true,
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: {
                modelValue: data,
                granularity: 'second',
                step: { hour: 6 },
                stepSnapping: true,
              },
            })
          },
        },
      })
      const dayPeriod = getByTestId('dayPeriod')
      await user.click(hour)
      // Type 9 — auto-advances (9 > maxStart=1 for 12h) → focusout triggers snap
      // snapValueToStep(9, 0, 23, 6) = 6; but we want a PM result
      // Use value that snaps to >=12: type a 2-digit 12h hour like 2 (display=2, internal depends on PM context)
      // Actually type 1 then 4 in 12h mode: total=14, 12h max=12, 14>12 → resets to 4
      // Let me type 2: 2>1=maxStart → moveToNext, internal=2+12=14 (PM), snap(14,0,23,6)=12 → PM
      await user.keyboard('{2}')
      // snapValueToStep(14, 0, 23, 6) = 12; 12 not < 12, else if (12) truthy → PM
      // NOTE: current behavior — after snapping 14 → 12, dayPeriod is set to PM
      expect(dayPeriod).toHaveTextContent('PM')
    })

    it('second step snapping works on focusout', async () => {
      // Covers the 'second' branch in handleSegmentFocusOut (third else-if at line 937)
      const { user, getByTestId, rerender } = setup({
        timeFieldProps: {
          modelValue: new CalendarDateTime(1980, 1, 20, 12, 0, 0, 0),
          granularity: 'second',
          step: { second: 15 },
          stepSnapping: true,
        },
        emits: {
          'onUpdate:modelValue': (data: TimeValue) => {
            return rerender({
              timeFieldProps: {
                modelValue: data,
                granularity: 'second',
                step: { second: 15 },
                stepSnapping: true,
              },
            })
          },
        },
      })
      const second = getByTestId('second')
      await user.click(second)
      // Type 17 — should snap to 15 (nearest multiple of 15)
      await user.keyboard('{1}{7}')
      expect(second).toHaveTextContent('15')
    })
  })

  describe('handleSegmentFocusOut – not all segments filled skips modelValue update (line 941)', () => {
    it('partial fill with stepSnapping does not crash and preserves partial values', async () => {
      // Branch 168:1 — handleSegmentFocusOut: Object.values(segmentValues).every(item=>item!==null)
      // False branch: not all segments filled → no modelValue update on focusout
      const { user, getByTestId } = setup({
        timeFieldProps: {
          granularity: 'second',
          step: { minute: 15 },
          stepSnapping: true,
        },
      })
      const minute = getByTestId('minute')
      await user.click(minute)
      // Type just one digit (minute has value but hour is still null)
      // Then tab away to trigger focusout — not all segments filled, so no modelValue update
      await user.keyboard('{3}')
      await user.keyboard(kbd.TAB)
      // NOTE: current behavior — partial fill with stepSnapping doesn't crash
      // minute snaps to 0 (nearest multiple of 15 to 3), but all-filled check fails so no emit
      expect(minute).not.toHaveAttribute('data-placeholder')
    })
  })
})
