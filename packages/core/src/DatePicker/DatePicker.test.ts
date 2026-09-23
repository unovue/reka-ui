import type { DateFields, DateValue, TimeFields } from '@internationalized/date'

import type { DatePickerRootProps } from './DatePickerRoot.vue'
import { CalendarDate, CalendarDateTime, toZoned } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { ConfigProvider } from '@/ConfigProvider'
import { useTestKbd } from '@/shared'
import DatePicker from './story/_DatePicker.vue'

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

function setup(props: { datePickerProps?: DatePickerRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateValue | undefined) => void } } = {}) {
  const user = userEvent.setup()
  const returned = render(DatePicker, { props })
  const month = returned.getByTestId('month')
  const day = returned.getByTestId('day')
  const year = returned.getByTestId('year')
  const input = returned.getByTestId('input')
  const label = returned.getByTestId('label')
  const trigger = returned.getByTestId('trigger')

  return { ...returned, user, month, day, year, input, label, trigger }
}

it('should pass axe accessibility tests', async () => {
  const { container } = setup()
  expect(await axe(container)).toHaveNoViolations()
})

describe('datePicker', async () => {
  it('populates segment with value - `CalendarDate`', async () => {
    const { month, day, year } = setup({
      datePickerProps: { modelValue: calendarDate },
    })

    expect(month).toHaveTextContent(String(calendarDate.month))
    expect(day).toHaveTextContent(String(calendarDate.day))
    expect(year).toHaveTextContent(String(calendarDate.year))
  })

  it('populates segment with value - `CalendarDateTime`', async () => {
    const { month, day, year, getByTestId } = setup({
      datePickerProps: { modelValue: calendarDateTime },
    })

    expect(month).toHaveTextContent(String(calendarDateTime.month))
    expect(day).toHaveTextContent(String(calendarDateTime.day))
    expect(year).toHaveTextContent(String(calendarDateTime.year))
    expect(getByTestId('hour')).toHaveTextContent(String(calendarDateTime.hour))
    expect(getByTestId('minute')).toHaveTextContent(String(calendarDateTime.minute))
  })

  it('populates segment with value - `ZonedDateTime`', async () => {
    const { month, day, year, getByTestId } = setup({
      datePickerProps: { modelValue: zonedDateTime },
    })

    expect(month).toHaveTextContent(String(zonedDateTime.month))
    expect(day).toHaveTextContent(String(zonedDateTime.day))
    expect(year).toHaveTextContent(String(zonedDateTime.year))
    expect(getByTestId('hour')).toHaveTextContent(String(zonedDateTime.hour))
    expect(getByTestId('minute')).toHaveTextContent(String(zonedDateTime.minute))
    expect(getByTestId('dayPeriod')).toHaveTextContent('PM')
    expect(getByTestId('timeZoneName')).toHaveTextContent('EST')
  })

  it('focuses first segment on label click', async () => {
    const { user, input, label } = setup()
    await user.click(label)
    expect(input.firstElementChild).toHaveFocus()
  })

  it('focuses segments on click', async () => {
    const { user, day, month, year, getByTestId } = setup({
      datePickerProps: { modelValue: zonedDateTime },
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
      datePickerProps: {
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
      datePickerProps: {
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

  it('navigates segments using the arrow keys', async () => {
    const { getByTestId, user, day, month, year, trigger } = setup({
      datePickerProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })
    const { hour, minute, second, dayPeriod, timeZoneName } = getTimeSegments(getByTestId)

    const segments = [month, day, year, hour, minute, second, dayPeriod, timeZoneName, trigger]

    await user.click(month)

    for (const seg of segments) {
      expect(seg).toHaveFocus()
      await user.keyboard(kbd.ARROW_RIGHT)
    }
    expect(trigger).toHaveFocus()

    for (const seg of segments.reverse()) {
      expect(seg).toHaveFocus()
      await user.keyboard(kbd.ARROW_LEFT)
    }
    expect(month).toHaveFocus()
  })

  it('navigates the segments using tab', async () => {
    const { getByTestId, user, day, month, year, trigger } = setup({
      datePickerProps: {
        modelValue: zonedDateTime,
        granularity: 'second',
      },
    })
    const { hour, minute, second, dayPeriod, timeZoneName } = getTimeSegments(getByTestId)

    const segments = [month, day, year, hour, minute, second, dayPeriod, timeZoneName]

    await user.click(month)

    for (const seg of segments) {
      expect(seg).toHaveFocus()
      await user.keyboard(kbd.TAB)
    }
    expect(trigger).toHaveFocus()

    for (const seg of segments.reverse()) {
      await user.keyboard(kbd.SHIFT_TAB)
      expect(seg).toHaveFocus()
    }
  })

  it('prevents interaction and picker to be opened when `disabled` is `true`', async () => {
    const { trigger, day, month, year } = setup({
      datePickerProps: {
        disabled: true,
      },
    })
    expect(trigger).toBeDisabled()
    expect(day).not.toHaveAttribute('tabindex')
    expect(month).not.toHaveAttribute('tabindex')
    expect(year).not.toHaveAttribute('tabindex')
  })

  it('should select and deselect a date', async () => {
    const { user, trigger, getByTestId } = setup()

    await user.click(trigger)
    const calendar = getByTestId('calendar')
    const targetCell = calendar.querySelector('div[data-reka-calendar-cell-trigger]:not([data-outside-view])')!

    await user.click(targetCell)
    expect(calendar.querySelector('[data-selected]')).toBeInTheDocument()
    await user.click(targetCell)
    expect(calendar.querySelector('[data-selected]')).not.toBeInTheDocument()
  })

  it('resets stale placeholder time when selecting a date after the model value is cleared', async () => {
    const emittedValues: (DateValue | undefined)[] = []
    const { user, trigger, getByTestId, rerender } = setup({
      datePickerProps: {
        modelValue: calendarDateTime,
        granularity: 'minute',
      },
      emits: {
        'onUpdate:modelValue': value => emittedValues.push(value),
      },
    })

    await rerender({
      datePickerProps: {
        modelValue: undefined,
        granularity: 'minute',
      },
      emits: {
        'onUpdate:modelValue': value => emittedValues.push(value),
      },
    })

    await user.click(trigger)
    await user.click(getByTestId('date-1-1'))

    const selectedValue = emittedValues.at(-1)
    expect(selectedValue).toBeInstanceOf(CalendarDateTime)
    expect((selectedValue as CalendarDateTime).hour).toBe(0)
    expect((selectedValue as CalendarDateTime).minute).toBe(0)
    expect((selectedValue as CalendarDateTime).second).toBe(0)
    expect((selectedValue as CalendarDateTime).millisecond).toBe(0)
  })

  it('resets stale ZonedDateTime placeholder time when selecting a date after the model value is cleared', async () => {
    const emittedValues: (DateValue | undefined)[] = []
    const zonedValue = toZoned(new CalendarDateTime(1980, 1, 20, 12, 30, 45, 123), 'America/New_York')
    const { user, trigger, getByTestId, rerender } = setup({
      datePickerProps: {
        modelValue: zonedValue,
        granularity: 'second',
      },
      emits: {
        'onUpdate:modelValue': value => emittedValues.push(value),
      },
    })

    await rerender({
      datePickerProps: {
        modelValue: undefined,
        granularity: 'second',
      },
      emits: {
        'onUpdate:modelValue': value => emittedValues.push(value),
      },
    })

    await user.click(trigger)
    await user.click(getByTestId('date-1-1'))

    const selectedValue = emittedValues.at(-1)
    expect(selectedValue).toHaveProperty('timeZone', 'America/New_York')
    expect(selectedValue?.hour).toBe(0)
    expect(selectedValue?.minute).toBe(0)
    expect(selectedValue?.second).toBe(0)
    expect(selectedValue?.millisecond).toBe(0)
  })

  it('preserves typed time when typing a date after the model value is cleared', async () => {
    const emittedValues: (DateValue | undefined)[] = []
    let rerender: ReturnType<typeof setup>['rerender']
    const handleUpdateModelValue = (value: DateValue | undefined) => {
      emittedValues.push(value)
      return rerender({
        datePickerProps: {
          modelValue: value,
          granularity: 'minute',
        },
        emits: {
          'onUpdate:modelValue': handleUpdateModelValue,
        },
      })
    }

    const view = setup({
      datePickerProps: {
        modelValue: calendarDateTime,
        granularity: 'minute',
      },
      emits: {
        'onUpdate:modelValue': handleUpdateModelValue,
      },
    })
    rerender = view.rerender

    await rerender({
      datePickerProps: {
        modelValue: undefined,
        granularity: 'minute',
      },
      emits: {
        'onUpdate:modelValue': handleUpdateModelValue,
      },
    })

    await view.user.click(view.month)
    await view.user.keyboard('{2}')
    await view.user.click(view.day)
    await view.user.keyboard('{3}')
    await view.user.click(view.year)
    await view.user.keyboard('{2020}')
    await view.user.click(view.getByTestId('hour'))
    await view.user.keyboard('{9}')
    await view.user.click(view.getByTestId('minute'))
    await view.user.keyboard('{45}')

    expect(view.month).toHaveTextContent('2')
    expect(view.day).toHaveTextContent('3')
    expect(view.year).toHaveTextContent('2020')
    expect(view.getByTestId('hour')).toHaveTextContent('9')
    expect(view.getByTestId('minute')).toHaveTextContent('45')
  })

  it('should close the picker on select when `closeOnSelect` is true', async () => {
    const { user, trigger, getByTestId } = setup({
      datePickerProps: {
        defaultValue: calendarDate,
        closeOnSelect: true,
      },
    })

    await user.click(trigger)

    const popoverContent = getByTestId('popover-content')
    expect(popoverContent).toBeVisible()

    const day = getByTestId('date-1-1')
    await user.click(day)
    expect(popoverContent).not.toBeVisible()
  })

  it('should not close the picker on select when `closeOnSelect` is true', async () => {
    const { user, trigger, getByTestId } = setup({
      datePickerProps: {
        defaultValue: calendarDate,
        closeOnSelect: false,
      },
    })

    await user.click(trigger)

    const popoverContent = getByTestId('popover-content')
    expect(popoverContent).toBeVisible()

    const day = getByTestId('date-1-1')
    await user.click(day)
    expect(popoverContent).toBeVisible()
  })

  describe('locale integration with ConfigProvider', () => {
    it('uses locale from ConfigProvider when no locale prop is provided', async () => {
      const user = userEvent.setup()
      const { getByTestId } = render({
        components: { ConfigProvider, DatePicker },
        template: `
          <ConfigProvider locale="de">
            <DatePicker :datePickerProps="{ modelValue: new CalendarDate(2024, 1, 15) }" />
          </ConfigProvider>
        `,
        setup() {
          return { CalendarDate }
        },
      })

      const trigger = getByTestId('trigger')
      await user.click(trigger)

      const heading = getByTestId('heading')
      // German locale should display month name in German (e.g., "Januar" not "January")
      expect(heading).toHaveTextContent('Januar')
    })

    it('locale prop overrides ConfigProvider locale', async () => {
      const user = userEvent.setup()
      const { getByTestId } = render({
        components: { ConfigProvider, DatePicker },
        template: `
          <ConfigProvider locale="de">
            <DatePicker :datePickerProps="{ modelValue: new CalendarDate(2024, 1, 15), locale: 'en-US' }" />
          </ConfigProvider>
        `,
        setup() {
          return { CalendarDate }
        },
      })

      const trigger = getByTestId('trigger')
      await user.click(trigger)

      const heading = getByTestId('heading')
      // Even though ConfigProvider sets 'de', explicit prop should use 'en-US'
      expect(heading).toHaveTextContent('January')
    })

    it('uses default locale when no ConfigProvider and no locale prop', async () => {
      const { user, trigger, getByTestId } = setup({
        datePickerProps: { modelValue: calendarDate },
      })

      await user.click(trigger)

      const heading = getByTestId('heading')
      // Should use browser default locale (typically 'en' in test environment)
      // January 1980 should be displayed
      expect(heading).toHaveTextContent('January')
      expect(heading).toHaveTextContent('1980')
    })
  })
})
