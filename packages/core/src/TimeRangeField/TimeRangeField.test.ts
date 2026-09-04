import type { TimeRangeFieldRootProps } from './TimeRangeFieldRoot.vue'
import type { TimeRange, TimeValue } from '@/shared/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import { Temporal } from '@/temporal'
import TimeField from './story/_TimeRangeField.vue'

const time = {
  start: Temporal.PlainTime.from({ hour: 9, minute: 15, second: 29 }),
  end: Temporal.PlainTime.from({ hour: 17, minute: 45, second: 0 }),
}
const calendarDateTime = {
  start: Temporal.PlainDateTime.from({ year: 2022, month: 1, day: 1, hour: 9, minute: 15, second: 0 }),
  end: Temporal.PlainDateTime.from({ year: 2022, month: 1, day: 1, hour: 17, minute: 45, second: 0 }),
}
const zonedDateTime = {
  start: calendarDateTime.start.toZonedDateTime('America/New_York'),
  end: calendarDateTime.end.toZonedDateTime('America/New_York'),
}

const kbd = useTestKbd()

function setup(props: { timeRangeFieldProps?: TimeRangeFieldRootProps, emits?: { 'onUpdate:modelValue'?: (data: TimeValue) => void } } = {}) {
  const user = userEvent.setup()
  const returned = render(TimeField, { props })
  const value = returned.getByTestId('value')

  const start = {
    hour: returned.getByTestId('start-hour'),
    minute: returned.getByTestId('start-minute'),
  }

  const end = {
    hour: returned.getByTestId('end-hour'),
    minute: returned.getByTestId('end-minute'),
  }

  const input = returned.getByTestId('input')
  const label = returned.getByTestId('label')

  return { ...returned, user, input, start, end, label, value }
}

it('should pass axe accessibility tests', async () => {
  const { container } = setup()
  expect(await axe(container)).toHaveNoViolations()
})

describe('timeField', () => {
  it('advances focus through segments in DOM order when typing in RTL', async () => {
    const { user, start, end } = setup({
      timeRangeFieldProps: {
        dir: 'rtl',
        locale: 'en-GB',
      },
    })

    await user.click(start.hour)
    expect(start.hour).toHaveFocus()
    await user.keyboard('{11}')
    expect(start.minute).toHaveFocus()
    await user.keyboard('{45}')
    expect(end.hour).toHaveFocus()
  })

  it('populates segment with value - `Time`', async () => {
    const { start, end } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })

    expect(start.hour).toHaveTextContent(String(time.start.hour).padStart(2, '0'))
    expect(end.hour).toHaveTextContent(String(time.end.hour).padStart(2, '0'))
  })

  it('populates segment with value - `CalendarDateTime`', async () => {
    const { start, end } = setup({
      timeRangeFieldProps: { modelValue: calendarDateTime, locale: 'en-GB' },
    })

    expect(start.hour).toHaveTextContent(String(calendarDateTime.start.hour))
    expect(start.minute).toHaveTextContent(String(calendarDateTime.start.minute))
    expect(end.hour).toHaveTextContent(String(calendarDateTime.end.hour).padStart(2, '0'))
    expect(end.minute).toHaveTextContent(String(calendarDateTime.end.minute))
  })

  it('populates segment with value - `ZonedDateTime`', async () => {
    const { start, end, getByTestId } = setup({
      timeRangeFieldProps: { modelValue: zonedDateTime, locale: 'en-US', hourCycle: 12 },
    })

    expect(start.hour).toHaveTextContent(String(zonedDateTime.start.hour))
    expect(start.minute).toHaveTextContent(String(zonedDateTime.start.minute))
    expect(end.hour).toHaveTextContent(String(zonedDateTime.end.hour - 12))
    expect(end.minute).toHaveTextContent(String(zonedDateTime.end.minute))
    expect(getByTestId('start-dayPeriod')).toHaveTextContent('AM')
    expect(getByTestId('end-dayPeriod')).toHaveTextContent('PM')
  })
  it('navigates between the fields', async () => {
    const { getByTestId, user } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })

    const fields = ['start', 'end'] as const
    const segments = ['hour', 'minute'] as const

    await user.click(getByTestId('start-hour'))

    for (const field of fields) {
      for (const segment of segments) {
        if (field === 'start' && segment === 'hour')
          continue
        const seg = getByTestId(`${field}-${segment}`)
        await user.keyboard(kbd.ARROW_RIGHT)
        expect(seg).toHaveFocus()
      }
    }

    await user.click(getByTestId('start-hour'))

    for (const field of fields) {
      for (const segment of segments) {
        if (field === 'start' && segment === 'hour')
          continue
        const seg = getByTestId(`${field}-${segment}`)
        await user.keyboard(kbd.TAB)
        expect(seg).toHaveFocus()
      }
    }
  })

  it('navigates between the fields - right to left', async () => {
    const { getByTestId, user } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })

    const fields = ['end', 'start'] as const
    const segments = ['minute', 'hour'] as const

    await user.click(getByTestId('end-minute'))

    for (const field of fields) {
      for (const segment of segments) {
        if (field === 'end' && segment === 'minute')
          continue
        const seg = getByTestId(`${field}-${segment}`)
        await user.keyboard(kbd.ARROW_LEFT)
        expect(seg).toHaveFocus()
      }
    }

    await user.click(getByTestId('end-minute'))

    for (const field of fields) {
      for (const segment of segments) {
        if (field === 'end' && segment === 'minute')
          continue
        const seg = getByTestId(`${field}-${segment}`)
        await user.keyboard(kbd.SHIFT_TAB)
        expect(seg).toHaveFocus()
      }
    }
  })

  it('binds to the value', async () => {
    const { start, end, user } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })
    expect(start.hour).toHaveTextContent(String(time.start.hour))
    expect(end.hour).toHaveTextContent(String(time.end.hour))

    await user.click(start.minute)
    await user.keyboard('2')
    expect(start.minute).toHaveTextContent('2')
    expect(end.minute).toHaveTextContent(String(time.end.minute))
  })

  it('modifying end value does not affect start value', async () => {
    const { start, end, user } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })

    await user.click(end.hour)
    await user.keyboard(kbd.ARROW_UP)
    expect(start.hour).toHaveTextContent(String(time.start.hour).padStart(2, '0'))
    expect(start.minute).toHaveTextContent(String(time.start.minute))
  })

  it('increments start hour on arrow up', async () => {
    const { start, user } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })

    await user.click(start.hour)
    await user.keyboard(kbd.ARROW_UP)
    expect(start.hour).toHaveTextContent(String(time.start.hour + 1).padStart(2, '0'))
  })

  it('decrements end minute on arrow down', async () => {
    const { end, user } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })

    await user.click(end.minute)
    await user.keyboard(kbd.ARROW_DOWN)
    expect(end.minute).toHaveTextContent(String(time.end.minute - 1))
  })

  it('types a digit into start segment', async () => {
    const { start, user } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })

    await user.click(start.hour)
    await user.keyboard('{1}{4}')
    expect(start.hour).toHaveTextContent('14')
  })

  it('types a digit into end segment', async () => {
    const { end, user } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })

    await user.click(end.minute)
    await user.keyboard('{3}{0}')
    expect(end.minute).toHaveTextContent('30')
  })

  it('prevents interaction when disabled', async () => {
    const { start, end, user } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB', disabled: true },
    })

    const segments = [start.hour, start.minute, end.hour, end.minute]
    for (const seg of segments) {
      await user.click(seg)
      expect(seg).not.toHaveFocus()
    }
  })

  it('prevents modification when readonly', async () => {
    const { start, end, user } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB', readonly: true },
    })

    await user.click(start.hour)
    expect(start.hour).toHaveFocus()
    await user.keyboard(kbd.ARROW_UP)
    expect(start.hour).toHaveTextContent(String(time.start.hour).padStart(2, '0'))

    await user.click(end.hour)
    expect(end.hour).toHaveFocus()
    await user.keyboard(kbd.ARROW_UP)
    expect(end.hour).toHaveTextContent(String(time.end.hour).padStart(2, '0'))
  })

  it('displays data-invalid when start is after end', async () => {
    const invalidTime = {
      start: Temporal.PlainTime.from({ hour: 17, minute: 0, second: 0 }),
      end: Temporal.PlainTime.from({ hour: 9, minute: 0, second: 0 }),
    }
    const { input } = setup({
      timeRangeFieldProps: { modelValue: invalidTime, locale: 'en-GB' },
    })

    expect(input).toHaveAttribute('data-invalid', '')
  })

  it('does not display data-invalid for valid range', async () => {
    const { input } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })

    expect(input).not.toHaveAttribute('data-invalid')
  })

  it('displays data-invalid when value is outside min/max', async () => {
    const { input } = setup({
      timeRangeFieldProps: {
        modelValue: time,
        locale: 'en-GB',
        minValue: Temporal.PlainTime.from({ hour: 10, minute: 0, second: 0 }),
      },
    })

    // start time is 9:15 which is before min of 10:00
    expect(input).toHaveAttribute('data-invalid', '')
  })

  it('focuses first segment on label click', async () => {
    const { user, label, start } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })

    await user.click(label)
    expect(start.hour).toHaveFocus()
  })

  it('renders with second granularity', async () => {
    const { getByTestId } = setup({
      timeRangeFieldProps: {
        modelValue: time,
        locale: 'en-GB',
        granularity: 'second',
      },
    })

    expect(getByTestId('start-second')).toHaveTextContent(String(time.start.second))
    expect(getByTestId('end-second')).toHaveTextContent(String(time.end.second).padStart(2, '0'))
  })

  it('renders with hour granularity', async () => {
    const returned = render(TimeField, {
      props: {
        timeRangeFieldProps: {
          modelValue: time,
          locale: 'en-GB',
          granularity: 'hour',
        },
      },
    })

    expect(returned.getByTestId('start-hour')).toBeVisible()
    expect(returned.getByTestId('end-hour')).toBeVisible()
    expect(returned.queryByTestId('start-minute')).toBeNull()
    expect(returned.queryByTestId('end-minute')).toBeNull()
  })

  it('navigates from start to end with keyboard typing', async () => {
    const { start, end, user } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })

    // Type into start hour (value > 2 auto-advances), then start minute
    await user.click(start.hour)
    await user.keyboard('{0}{9}')
    expect(start.minute).toHaveFocus()
    await user.keyboard('{1}{5}')
    // After finishing start minute, focus should move to end hour
    expect(end.hour).toHaveFocus()
  })

  it('does not mark the field as invalid when start equals end', async () => {
    const sameTime = {
      start: Temporal.PlainTime.from({ hour: 9, minute: 0, second: 0 }),
      end: Temporal.PlainTime.from({ hour: 9, minute: 0, second: 0 }),
    }
    const { input } = setup({
      timeRangeFieldProps: { modelValue: sameTime, locale: 'en-GB' },
    })

    expect(input).not.toHaveAttribute('data-invalid')
  })
})

// Coverage gap: TimeRangeField inherits the same per-segment Temporal behaviour
// as TimeField. These tests pin it to the shared shell seam — if the shell's
// step/IME/backspace/overflow logic drifts, both single-side and range fields
// fail together.
describe('timeField – shared shell seam coverage gaps', () => {
  describe('12-hour format (hourCycle: 12)', () => {
    it('renders dayPeriod segments for both start and end with hourCycle 12', async () => {
      const { getByTestId } = setup({
        timeRangeFieldProps: { modelValue: time, locale: 'en-US', hourCycle: 12 },
      })
      expect(getByTestId('start-dayPeriod')).toHaveTextContent('AM')
      expect(getByTestId('end-dayPeriod')).toHaveTextContent('PM')
    })

    it('converts internal 24h hour to 12-hour display on both sides', async () => {
      const afternoon = {
        start: Temporal.PlainTime.from({ hour: 14, minute: 30, second: 0 }),
        end: Temporal.PlainTime.from({ hour: 22, minute: 45, second: 0 }),
      }
      const { start, end, getByTestId } = setup({
        timeRangeFieldProps: { modelValue: afternoon, locale: 'en-US', hourCycle: 12 },
      })
      // 14:00 → 2 PM, 22:00 → 10 PM
      expect(start.hour).toHaveTextContent('2')
      expect(end.hour).toHaveTextContent('10')
      expect(getByTestId('start-dayPeriod')).toHaveTextContent('PM')
      expect(getByTestId('end-dayPeriod')).toHaveTextContent('PM')
    })

    it('keeps start and end dayPeriod independent when only one side is PM', async () => {
      const mixed = {
        start: Temporal.PlainTime.from({ hour: 8, minute: 0, second: 0 }),
        end: Temporal.PlainTime.from({ hour: 20, minute: 0, second: 0 }),
      }
      const { getByTestId } = setup({
        timeRangeFieldProps: { modelValue: mixed, locale: 'en-US', hourCycle: 12 },
      })
      expect(getByTestId('start-dayPeriod')).toHaveTextContent('AM')
      expect(getByTestId('end-dayPeriod')).toHaveTextContent('PM')
    })
  })

  describe('hour cycle behaviour', () => {
    it('does not render dayPeriod in 24-hour locales (default en-GB)', async () => {
      const { queryByTestId } = setup({
        timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
      })
      expect(queryByTestId('start-dayPeriod')).toBeNull()
      expect(queryByTestId('end-dayPeriod')).toBeNull()
    })
  })

  describe('step snapping', () => {
    it('snaps typed minute value on focusout when stepSnapping is true', async () => {
      const { user, start, rerender } = setup({
        timeRangeFieldProps: {
          modelValue: {
            start: Temporal.PlainTime.from({ hour: 12, minute: 0, second: 0 }),
            end: Temporal.PlainTime.from({ hour: 13, minute: 0, second: 0 }),
          },
          granularity: 'second',
          step: { minute: 15 },
          stepSnapping: true,
        },
        emits: {
          'onUpdate:modelValue': (data) => {
            return rerender({
              timeRangeFieldProps: {
                modelValue: data,
                granularity: 'second',
                step: { minute: 15 },
                stepSnapping: true,
              },
            })
          },
        },
      })
      await user.click(start.minute)
      // Type 23 — should snap to 30 (nearest multiple of 15) on focusout
      await user.keyboard('{2}{3}')
      await user.keyboard(kbd.TAB)
      expect(start.minute).toHaveTextContent('30')
    })

    it('arrow keys still use step regardless of stepSnapping setting', async () => {
      const { user, start } = setup({
        timeRangeFieldProps: {
          modelValue: time,
          granularity: 'second',
          step: { minute: 15 },
          stepSnapping: false,
        },
      })
      await user.click(start.minute)
      await user.keyboard(kbd.ARROW_UP)
      expect(start.minute).toHaveTextContent('30')
    })
  })

  describe('iME composition', () => {
    it('does not step the hour when arrow up is pressed mid-composition', async () => {
      // The shared shell's handleKeydown bails on e.isComposing, so a
      // composition arrow must not advance the focused segment.
      const { user, start } = setup({ timeRangeFieldProps: { modelValue: time, locale: 'en-GB' } })
      await user.click(start.hour)
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
      Object.defineProperty(event, 'isComposing', { value: true })
      start.hour.dispatchEvent(event)
      expect(start.hour).toHaveTextContent(String(time.start.hour).padStart(2, '0'))
    })

    it('does not navigate between segments when arrow keys are pressed mid-composition', async () => {
      // Pressing ArrowRight mid-composition should not move focus to the next
      // segment — the IME owns the arrow keys for candidate navigation.
      const { user, start, getByTestId } = setup({ timeRangeFieldProps: { modelValue: time, locale: 'en-GB' } })
      await user.click(start.hour)
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
      Object.defineProperty(event, 'isComposing', { value: true })
      start.hour.dispatchEvent(event)
      // Focus should still be on start hour, not on start minute
      expect(start.hour).toHaveFocus()
      expect(getByTestId('start-minute')).not.toHaveFocus()
    })
  })

  describe('backspace on empty segments', () => {
    it('backspace on an empty hour segment is a no-op (placeholder stays)', async () => {
      const { user, start } = setup({ timeRangeFieldProps: { locale: 'en-GB' } })
      await user.click(start.hour)
      expect(start.hour).toHaveAttribute('data-placeholder', '')
      await user.keyboard(kbd.BACKSPACE)
      expect(start.hour).toHaveAttribute('data-placeholder', '')
    })

    it('backspace on a filled hour segment clears it to empty', async () => {
      const { user, start } = setup({ timeRangeFieldProps: { modelValue: time, locale: 'en-GB' } })
      expect(start.hour).not.toHaveAttribute('data-placeholder')
      await user.click(start.hour)
      await user.keyboard(kbd.BACKSPACE)
      expect(start.hour).toHaveAttribute('data-placeholder', '')
    })
  })

  describe('boundary overflow', () => {
    it('typing a first digit > 5 in minute auto-advances to next segment', async () => {
      const { user, start, getByTestId } = setup({ timeRangeFieldProps: { modelValue: time, locale: 'en-GB' } })
      await user.click(start.minute)
      await user.keyboard('{7}')
      // 7 > maxStart(5) → minute=7, focus moves to next segment (end hour on the range)
      expect(start.minute).toHaveTextContent('7')
      expect(getByTestId('end-hour')).toHaveFocus()
    })

    it('typing a two-digit minute within bounds advances to next segment', async () => {
      const { user, start, getByTestId } = setup({ timeRangeFieldProps: { modelValue: time, locale: 'en-GB' } })
      await user.click(start.minute)
      await user.keyboard('{3}{5}')
      expect(start.minute).toHaveTextContent('35')
      expect(getByTestId('end-hour')).toHaveFocus()
    })

    it('typing a first 24h digit > 2 in hour auto-advances', async () => {
      const { user, start, getByTestId } = setup({ timeRangeFieldProps: { modelValue: time, locale: 'en-GB' } })
      await user.click(start.hour)
      await user.keyboard('{3}')
      // 3 > maxStart(2 for 24h) → hour=3, focus moves to minute
      expect(start.hour).toHaveTextContent('3')
      expect(start.minute).toHaveFocus()
      expect(getByTestId('end-hour')).not.toHaveFocus()
    })
  })

  describe('second granularity', () => {
    it('arrow Up on empty second fills it with 0 (min)', async () => {
      const { user, getByTestId } = setup({
        timeRangeFieldProps: {
          locale: 'en-GB',
          granularity: 'second',
        },
      })
      const startSecond = getByTestId('start-second')
      await user.click(startSecond)
      expect(startSecond).toHaveAttribute('data-placeholder', '')
      await user.keyboard(kbd.ARROW_UP)
      expect(startSecond).toHaveTextContent('0')
    })
  })
})

// Pin the range-specific glue (start/end sync, range order invalidity,
// per-side min/max) to the shared shell seam. If a future shell change
// regresses any of these, the range adapter would silently break.
describe('timeRangeField – shared shell seam: range start/end sync & invalidity', () => {
  it('renders both start and end segments with their own values from the initial render', async () => {
    const { start, end, getByTestId } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })
    expect(start.hour).toHaveTextContent(String(time.start.hour).padStart(2, '0'))
    expect(start.minute).toHaveTextContent(String(time.start.minute))
    expect(end.hour).toHaveTextContent(String(time.end.hour).padStart(2, '0'))
    expect(end.minute).toHaveTextContent(String(time.end.minute))
    expect(getByTestId('start-hour')).not.toBe(getByTestId('end-hour'))
  })

  it('modifying start does not change the end value', async () => {
    const { user, start, end } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })
    await user.click(start.minute)
    await user.keyboard('{2}')
    expect(start.minute).toHaveTextContent('2')
    expect(end.minute).toHaveTextContent(String(time.end.minute))
  })

  it('modifying end does not change the start value', async () => {
    const { user, start, end } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })
    await user.click(end.hour)
    await user.keyboard(kbd.ARROW_UP)
    expect(end.hour).toHaveTextContent(String(time.end.hour + 1).padStart(2, '0'))
    expect(start.hour).toHaveTextContent(String(time.start.hour).padStart(2, '0'))
  })

  it('keeps the placeholder anchored to the start value when the end side is edited', async () => {
    // The hidden input value is a built-in probe for the placeholder: it
    // serialises `${start} - ${end}`. The start-hour segment should not
    // change when we edit the end side.
    const { user, start, end } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })
    await user.click(end.hour)
    await user.keyboard(kbd.ARROW_UP)
    expect(end.hour).toHaveTextContent(String(time.end.hour + 1).padStart(2, '0'))
    expect(start.hour).toHaveTextContent(String(time.start.hour).padStart(2, '0'))
  })

  it('marks the field as invalid when start is after end on the same day', async () => {
    const inverted = {
      start: Temporal.PlainTime.from({ hour: 17, minute: 0, second: 0 }),
      end: Temporal.PlainTime.from({ hour: 9, minute: 0, second: 0 }),
    }
    const { input } = setup({
      timeRangeFieldProps: { modelValue: inverted, locale: 'en-GB' },
    })
    expect(input).toHaveAttribute('data-invalid', '')
  })

  it('does not mark the field as invalid when start is before end on the same day', async () => {
    const { input } = setup({
      timeRangeFieldProps: { modelValue: time, locale: 'en-GB' },
    })
    expect(input).not.toHaveAttribute('data-invalid')
  })

  it('marks the field as invalid when both sides violate minValue at the shared shell seam', async () => {
    // Both 8:15 and 17:45 are below the min of 20:00 — each shell instance
    // reports its own invalidity, and the range-level invalidity combines them.
    const { input } = setup({
      timeRangeFieldProps: {
        modelValue: time,
        locale: 'en-GB',
        minValue: Temporal.PlainTime.from({ hour: 20, minute: 0, second: 0 }),
      },
    })
    expect(input).toHaveAttribute('data-invalid', '')
  })

  it('does not mark the field as invalid when both sides are on or after minValue', async () => {
    const onOrAfter = {
      start: Temporal.PlainTime.from({ hour: 9, minute: 0, second: 0 }),
      end: Temporal.PlainTime.from({ hour: 17, minute: 0, second: 0 }),
    }
    const { input } = setup({
      timeRangeFieldProps: {
        modelValue: onOrAfter,
        locale: 'en-GB',
        minValue: Temporal.PlainTime.from({ hour: 9, minute: 0, second: 0 }),
      },
    })
    expect(input).not.toHaveAttribute('data-invalid')
  })

  it('marks the field as invalid when an unavailable time is matched by isTimeUnavailable', async () => {
    const { input } = setup({
      timeRangeFieldProps: {
        modelValue: time,
        locale: 'en-GB',
        // 9:15 (start) is unavailable
        isTimeUnavailable: date => date.hour === 9 && date.minute === 15,
      },
    })
    expect(input).toHaveAttribute('data-invalid', '')
  })

  it('does not mark the field as invalid when isTimeUnavailable matches neither side', async () => {
    const { input } = setup({
      timeRangeFieldProps: {
        modelValue: time,
        locale: 'en-GB',
        isTimeUnavailable: date => date.hour === 3, // no match
      },
    })
    expect(input).not.toHaveAttribute('data-invalid')
  })
})

// Ticket 0004 — public time value shape preservation for range endpoints
describe('timeRangeField public value shape preservation (ticket 0004)', () => {
  it('emits PlainTime shapes for start and end when range was PlainTime', async () => {
    let captured: TimeRange | undefined
    const original = {
      start: Temporal.PlainTime.from({ hour: 9, minute: 15, second: 0 }),
      end: Temporal.PlainTime.from({ hour: 17, minute: 45, second: 0 }),
    }
    const { user, start, rerender } = setup({
      timeRangeFieldProps: { modelValue: original, locale: 'en-GB' },
      emits: {
        'onUpdate:modelValue': (data: TimeValue) => {
          captured = data as unknown as TimeRange
          rerender({ timeRangeFieldProps: { modelValue: data, locale: 'en-GB' } })
        },
      },
    })

    await user.click(start.hour)
    await user.keyboard(kbd.ARROW_UP)

    expect(captured).toBeDefined()
    expect(captured!.start).toBeInstanceOf(Temporal.PlainTime)
    expect(captured!.end).toBeInstanceOf(Temporal.PlainTime)
    expect(captured!.start!.hour).toBe(10)
    expect(captured!.end!.hour).toBe(17)
  })

  it('emits PlainDateTime shapes for start and end when range was PlainDateTime', async () => {
    let captured: TimeRange | undefined
    const original = {
      start: Temporal.PlainDateTime.from({ year: 2024, month: 1, day: 1, hour: 9, minute: 15, second: 0 }),
      end: Temporal.PlainDateTime.from({ year: 2024, month: 1, day: 1, hour: 17, minute: 45, second: 0 }),
    }
    const { user, start, rerender } = setup({
      timeRangeFieldProps: { modelValue: original, locale: 'en-GB' },
      emits: {
        'onUpdate:modelValue': (data: TimeValue) => {
          captured = data as unknown as TimeRange
          rerender({ timeRangeFieldProps: { modelValue: data, locale: 'en-GB' } })
        },
      },
    })

    await user.click(start.hour)
    await user.keyboard(kbd.ARROW_UP)

    expect(captured).toBeDefined()
    expect(captured!.start).toBeInstanceOf(Temporal.PlainDateTime)
    expect(captured!.end).toBeInstanceOf(Temporal.PlainDateTime)
    // Date preserved
    expect((captured!.start as Temporal.PlainDateTime).year).toBe(2024)
    expect((captured!.start as Temporal.PlainDateTime).month).toBe(1)
    expect((captured!.start as Temporal.PlainDateTime).day).toBe(1)
    expect((captured!.end as Temporal.PlainDateTime).year).toBe(2024)
    // Time updated only for start
    expect(captured!.start!.hour).toBe(10)
    expect(captured!.end!.hour).toBe(17)
  })

  it('emits ZonedDateTime shapes preserving zone when range was ZonedDateTime', async () => {
    let captured: TimeRange | undefined
    const original = {
      start: Temporal.ZonedDateTime.from('2024-01-01T09:15:00[America/New_York]'),
      end: Temporal.ZonedDateTime.from('2024-01-01T17:45:00[America/New_York]'),
    }
    const { user, start, rerender } = setup({
      timeRangeFieldProps: { modelValue: original, locale: 'en-US', hourCycle: 12 },
      emits: {
        'onUpdate:modelValue': (data: TimeValue) => {
          captured = data as unknown as TimeRange
          rerender({ timeRangeFieldProps: { modelValue: data, locale: 'en-US', hourCycle: 12 } })
        },
      },
    })

    await user.click(start.hour)
    await user.keyboard(kbd.ARROW_UP)

    expect(captured).toBeDefined()
    expect(captured!.start).toBeInstanceOf(Temporal.ZonedDateTime)
    expect(captured!.end).toBeInstanceOf(Temporal.ZonedDateTime)
    // Zone preserved on both
    expect((captured!.start as Temporal.ZonedDateTime).timeZoneId).toBe('America/New_York')
    expect((captured!.end as Temporal.ZonedDateTime).timeZoneId).toBe('America/New_York')
    // Date preserved
    expect((captured!.start as Temporal.ZonedDateTime).year).toBe(2024)
    expect((captured!.end as Temporal.ZonedDateTime).year).toBe(2024)
    // Time updated on start, unchanged on end
    expect(captured!.start!.hour).toBe(10)
    expect(captured!.end!.hour).toBe(17)
  })

  it('preserves shape when editing end side of a PlainTime range', async () => {
    let captured: TimeRange | undefined
    const original = {
      start: Temporal.PlainTime.from({ hour: 9, minute: 15, second: 0 }),
      end: Temporal.PlainTime.from({ hour: 17, minute: 45, second: 0 }),
    }
    const { user, end, rerender } = setup({
      timeRangeFieldProps: { modelValue: original, locale: 'en-GB' },
      emits: {
        'onUpdate:modelValue': (data: TimeValue) => {
          captured = data as unknown as TimeRange
          rerender({ timeRangeFieldProps: { modelValue: data, locale: 'en-GB' } })
        },
      },
    })

    await user.click(end.hour)
    await user.keyboard(kbd.ARROW_DOWN)

    expect(captured).toBeDefined()
    expect(captured!.start).toBeInstanceOf(Temporal.PlainTime)
    expect(captured!.end).toBeInstanceOf(Temporal.PlainTime)
    // Start unchanged
    expect(captured!.start!.hour).toBe(9)
    // End decremented
    expect(captured!.end!.hour).toBe(16)
  })
})
