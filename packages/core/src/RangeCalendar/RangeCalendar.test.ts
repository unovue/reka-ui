import type { DateValue } from '@internationalized/date'
import type { RangeCalendarRootProps } from './RangeCalendarRoot.vue'
import { CalendarDate, CalendarDateTime, toZoned } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import RangeCalendar from './story/_RangeCalendar.vue'

it('should pass axe accessibility tests', async () => {
  const wrapper = mount(RangeCalendar)
  expect(await axe(wrapper.element)).toHaveNoViolations()
})

const kbd = useTestKbd()

const calendarDateRange = {
  start: new CalendarDate(1980, 1, 20),
  end: new CalendarDate(1980, 1, 25),
}

const calendarDateTimeRange = {
  start: new CalendarDateTime(1980, 1, 20, 12, 30, 0, 0),
  end: new CalendarDateTime(1980, 1, 25, 12, 30, 0, 0),
}

const zonedDateTimeRange = {
  start: toZoned(calendarDateTimeRange.start, 'America/New_York'),
  end: toZoned(calendarDateTimeRange.end, 'America/New_York'),
}

const narrowWeekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const shortWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const longWeekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function getSelectedDays(calendar: HTMLElement) {
  return Array.from(calendar.querySelectorAll<HTMLElement>('[data-selected]'))
}

function setup(props: { calendarProps?: RangeCalendarRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateValue) => void } } = {}) {
  const user = userEvent.setup()
  const returned = render(RangeCalendar, { props })
  const calendar = returned.getByTestId('calendar')
  expect(calendar).toBeVisible()
  return { ...returned, user, calendar }
}

describe('rangeCalendar', () => {
  it('respects a default value if provided - `CalendarDate`', async () => {
    const { calendar, getByTestId } = setup({ calendarProps: { modelValue: calendarDateRange } })

    const selectedDays = calendar.querySelectorAll<HTMLElement>('[data-selected]')
    expect(selectedDays).toHaveLength(6)

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January 1980')
  })

  it('respects a default value if provided - `CalendarDateTime`', async () => {
    const { calendar, getByTestId } = setup({ calendarProps: { modelValue: calendarDateTimeRange } })

    const selectedDays = calendar.querySelectorAll<HTMLElement>('[data-selected]')
    expect(selectedDays).toHaveLength(6)

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January 1980')
  })

  it('respects a default value if provided - `ZonedDateTime`', async () => {
    const { calendar, getByTestId } = setup({ calendarProps: { modelValue: zonedDateTimeRange } })

    const selectedDays = calendar.querySelectorAll<HTMLElement>('[data-selected]')
    expect(selectedDays).toHaveLength(6)

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January 1980')
  })

  it('respects programmatically updated value', async () => {
    const { calendar, getByTestId, rerender } = setup({ calendarProps: { modelValue: undefined } })

    const selectedDays = calendar.querySelectorAll<HTMLElement>('[data-selected]')
    expect(selectedDays).toHaveLength(0)

    // update value programmatically
    await rerender({
      calendarProps: {
        modelValue: zonedDateTimeRange,
      },
    })

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January 1980')
  })

  it('resets range on select when a range is already selected', async () => {
    const { getByTestId, calendar, user, rerender } = setup({
      calendarProps: { modelValue: calendarDateRange },
      emits: { 'onUpdate:modelValue': data => rerender({ calendarProps: { modelValue: data } }) },
    })

    let startValue = calendar.querySelector('[data-selection-start]')
    let endValue = calendar.querySelector('[data-selection-end]')

    expect(startValue).toHaveTextContent(String(calendarDateRange.start.day))
    expect(endValue).toHaveTextContent(String(calendarDateRange.end.day))

    const fifthDayInMonth = getByTestId('date-1-5')
    await user.click(fifthDayInMonth)
    expect(getByTestId('date-1-5')).toHaveAttribute('data-focused')

    const selectedDays = getSelectedDays(calendar)
    expect(selectedDays).toHaveLength(1)

    startValue = calendar.querySelector('[data-selection-start]')
    endValue = calendar.querySelector('[data-selection-end]')

    expect(startValue).toBeInTheDocument()
    expect(endValue).not.toBeInTheDocument()

    const seventhDayInMonth = getByTestId('date-1-7')
    await user.click(seventhDayInMonth)
    expect(getSelectedDays(calendar)).toHaveLength(3)
  })

  it('resets range selection when pressing Escape', async () => {
    const { getByTestId, calendar, user, rerender } = setup({
      calendarProps: { modelValue: calendarDateRange },
      emits: { 'onUpdate:modelValue': data => rerender({ calendarProps: { modelValue: data } }) },
    })

    let startValue = calendar.querySelector('[data-selection-start]')
    let endValue = calendar.querySelector('[data-selection-end]')

    expect(startValue).toHaveTextContent(String(calendarDateRange.start.day))
    expect(endValue).toHaveTextContent(String(calendarDateRange.end.day))

    const fifthDayInMonth = getByTestId('date-1-5')
    await user.click(fifthDayInMonth)
    expect(getByTestId('date-1-5')).toHaveAttribute('data-focused')

    const selectedDays = getSelectedDays(calendar)
    expect(selectedDays).toHaveLength(1)

    startValue = calendar.querySelector('[data-selection-start]')
    endValue = calendar.querySelector('[data-selection-end]')

    expect(startValue).toBeInTheDocument()
    expect(endValue).not.toBeInTheDocument()

    await user.keyboard(kbd.ESCAPE)

    startValue = calendar.querySelector('[data-selection-start]')
    endValue = calendar.querySelector('[data-selection-end]')

    expect(startValue).toHaveTextContent(String(calendarDateRange.start.day))
    expect(endValue).toHaveTextContent(String(calendarDateRange.end.day))
  })

  it('navigates the months forward using the next button', async () => {
    const { getByTestId, user } = setup({ calendarProps: { modelValue: calendarDateTimeRange } })

    const heading = getByTestId('heading')
    const nextBtn = getByTestId('next-button')

    for (const month of months) {
      expect(heading).toHaveTextContent(`${month} 1980`)
      await user.click(nextBtn)
    }
    expect(heading).toHaveTextContent('January 1981')
  })

  it('navigates the months backwards using the prev button', async () => {
    const { getByTestId, user } = setup({ calendarProps: { modelValue: calendarDateTimeRange } })

    const heading = getByTestId('heading')
    const prevBtn = getByTestId('prev-button')
    const newMonths = [...months].reverse()
    newMonths.pop()

    expect(heading).toHaveTextContent('January 1980')
    await user.click(prevBtn)

    for (const month of newMonths) {
      expect(heading).toHaveTextContent(`${month} 1979`)
      await user.click(prevBtn)
    }
    expect(heading).toHaveTextContent('January 1979')
  })

  it('should navigate one year in the past (prev year button)', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        modelValue: calendarDateRange,
      },
    })

    const prevBtn = getByTestId('prev-year-button')
    await user.click(prevBtn)
    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January 1979')

    await user.click(prevBtn)
    expect(heading).toHaveTextContent('January 1978')

    await user.click(prevBtn)
    expect(heading).toHaveTextContent('January 1977')
  })

  it('should navigate one year in the future (next year button)', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        modelValue: calendarDateRange,
      },
    })

    const nextBtn = getByTestId('next-year-button')
    await user.click(nextBtn)
    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January 1981')

    await user.click(nextBtn)
    expect(heading).toHaveTextContent('January 1982')

    await user.click(nextBtn)
    expect(heading).toHaveTextContent('January 1983')
  })

  it('always renders six weeks when `fixedWeeks` is `true`', async () => {
    const { getByTestId, calendar, user } = setup({
      calendarProps: {
        modelValue: calendarDateTimeRange,
        fixedWeeks: true,
      },
    })

    function getNumberOfWeeks() {
      return calendar.querySelectorAll('[data-week]').length
    }

    const nextButton = getByTestId('next-button')

    for (let i = 0; i < 12; i++) {
      expect(getNumberOfWeeks()).toBe(6)
      await user.click(nextButton)
    }

    for (let i = 0; i < 24; i++) {
      expect(getNumberOfWeeks()).toBe(6)
      await user.click(nextButton)
    }
  })

  it('should not allow navigation before the `minValue` (prev button)', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        modelValue: calendarDateRange,
        minValue: new CalendarDate(1979, 11, 25),
      },
    })

    const prevBtn = getByTestId('prev-button')
    await user.click(prevBtn)
    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('December 1979')
    expect(prevBtn).not.toHaveAttribute('aria-disabled', 'true')
    expect(prevBtn).not.toHaveAttribute('data-disabled')

    await user.click(prevBtn)
    expect(heading).toHaveTextContent('November 1979')
    expect(prevBtn).toHaveAttribute('aria-disabled', 'true')
    expect(prevBtn).toHaveAttribute('data-disabled')

    await user.click(prevBtn)
    expect(heading).toHaveTextContent('November 1979')
  })

  it('should not allow navigation after the `maxValue` (next button)', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        modelValue: calendarDateRange,
        maxValue: new CalendarDate(1980, 3, 25),
      },
    })

    const nextBtn = getByTestId('next-button')
    await user.click(nextBtn)
    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('February 1980')
    expect(nextBtn).not.toHaveAttribute('aria-disabled', 'true')
    expect(nextBtn).not.toHaveAttribute('data-disabled')

    await user.click(nextBtn)
    expect(heading).toHaveTextContent('March 1980')
    expect(nextBtn).toHaveAttribute('aria-disabled', 'true')
    expect(nextBtn).toHaveAttribute('data-disabled')

    await user.click(nextBtn)
    expect(heading).toHaveTextContent('March 1980')
  })

  it('doesnt allow focus or interaction when `disabled` is `true`', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        modelValue: calendarDateRange,
        disabled: true,
      },
    })

    const grid = getByTestId('grid-1')
    expect(grid).toHaveAttribute('aria-disabled', 'true')
    expect(grid).toHaveAttribute('data-disabled')

    const firstDayOfMonth = getByTestId('date-1-1')
    expect(firstDayOfMonth).toHaveAttribute('aria-disabled', 'true')
    expect(firstDayOfMonth).toHaveAttribute('data-disabled')

    await user.click(firstDayOfMonth)
    expect(firstDayOfMonth).not.toHaveAttribute('data-selected')
    firstDayOfMonth.focus()
    expect(firstDayOfMonth).not.toHaveFocus()
    expect(firstDayOfMonth).not.toHaveAttribute('tabindex')

    const tenthDayOfMonth = getByTestId('date-1-10')
    expect(tenthDayOfMonth).toHaveAttribute('aria-disabled', 'true')
    expect(tenthDayOfMonth).toHaveAttribute('data-disabled')
    await user.click(tenthDayOfMonth)
    expect(tenthDayOfMonth).not.toHaveAttribute('data-selected')
    tenthDayOfMonth.focus()
    expect(tenthDayOfMonth).not.toHaveFocus()

    const prevButton = getByTestId('prev-button')
    const nextButton = getByTestId('next-button')
    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeDisabled()
  })

  it('does not navigate after `maxValue` (with keyboard)', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        modelValue: calendarDateRange,
        maxValue: new CalendarDate(1980, 3, 31),
      },
    })

    const firstDayInMonth = getByTestId('date-1-1')
    firstDayInMonth.focus()
    expect(firstDayInMonth).toHaveFocus()

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January 1980')

    // five keypresses to February 1980
    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('date-1-8')).toHaveFocus()
    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('date-1-15')).toHaveFocus()
    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('date-1-22')).toHaveFocus()
    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('date-1-29')).toHaveFocus()
    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('date-2-5')).toHaveFocus()
    expect(heading).toHaveTextContent('February 1980')

    // four keypresses to March 1980
    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('date-2-12')).toHaveFocus()
    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('date-2-19')).toHaveFocus()
    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('date-2-26')).toHaveFocus()
    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('date-3-4')).toHaveFocus()
    expect(heading).toHaveTextContent('March 1980')

    // four keypresses to April 1980
    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('date-3-11')).toHaveFocus()
    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('date-3-18')).toHaveFocus()
    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('date-3-25')).toHaveFocus()
    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('date-3-25')).toHaveFocus()
    expect(heading).toHaveTextContent('March 1980')
  })

  it('does not navigate before `minValue` (with keyboard)', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        modelValue: calendarDateRange,
        minValue: new CalendarDate(1979, 12, 1),
      },
    })

    const firstDayInMonth = getByTestId('date-1-1')
    firstDayInMonth.focus()
    expect(firstDayInMonth).toHaveFocus()

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January 1980')

    // one keypress to get to December 1979
    await user.keyboard(kbd.ARROW_UP)
    expect(getByTestId('date-12-25')).toHaveFocus()
    expect(heading).toHaveTextContent('December 1979')

    // four keypresses to November 1979
    await user.keyboard(kbd.ARROW_UP)
    expect(getByTestId('date-12-18')).toHaveFocus()
    await user.keyboard(kbd.ARROW_UP)
    expect(getByTestId('date-12-11')).toHaveFocus()
    await user.keyboard(kbd.ARROW_UP)
    expect(getByTestId('date-12-4')).toHaveFocus()
    await user.keyboard(kbd.ARROW_UP)
    expect(getByTestId('date-12-4')).toHaveFocus()
    expect(heading).toHaveTextContent('December 1979')
  })

  it('handles unavailable dates appropriately', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        placeholder: calendarDateRange.start,
        isDateUnavailable: (date: DateValue) => {
          return date.day === 3
        },
      },
    })

    const thirdDayInMonth = getByTestId('date-1-3')
    expect(thirdDayInMonth).toHaveTextContent('3')
    expect(thirdDayInMonth).toHaveAttribute('data-unavailable')
    expect(thirdDayInMonth).toHaveAttribute('aria-disabled', 'true')
    await user.click(thirdDayInMonth)
    expect(thirdDayInMonth).not.toHaveAttribute('data-selected')
  })

  it('allows non-contiguous ranges', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        placeholder: calendarDateRange.start,
        allowNonContiguousRanges: true,
        isDateUnavailable: (date: DateValue) => {
          return date.day === 3
        },
      },
    })

    const firstDayInMonth = getByTestId('date-1-1')
    const fourthDayInMonth = getByTestId('date-1-4')
    const fifthDayInMonth = getByTestId('date-1-5')
    await user.click(firstDayInMonth)
    await user.click(fifthDayInMonth)
    expect(fourthDayInMonth).toHaveAttribute('data-selected')
  })

  it('formats the weekday labels correctly - `\'narrow\'`', async () => {
    const { getByTestId } = setup({
      calendarProps: {
        placeholder: calendarDateRange.start,
        weekdayFormat: 'narrow',
      },
    })
    for (const [i, weekday] of narrowWeekdays.entries()) {
      const weekdayEl = getByTestId(`weekday-1-${i}`)
      expect(weekdayEl).toHaveTextContent(weekday)
    }
  })

  it('formats the weekday labels correctly - `\'short\'`', async () => {
    const { getByTestId } = setup({
      calendarProps: {
        placeholder: calendarDateRange.start,
        weekdayFormat: 'short',
      },
    })
    for (const [i, weekday] of shortWeekdays.entries()) {
      const weekdayEl = getByTestId(`weekday-1-${i}`)
      expect(weekdayEl).toHaveTextContent(weekday)
    }
  })

  it('formats the weekday labels correctly - `\'long\'`', async () => {
    const { getByTestId } = setup({
      calendarProps: {
        placeholder: calendarDateRange.start,
        weekdayFormat: 'long',
      },
    })
    for (const [i, weekday] of longWeekdays.entries()) {
      const weekdayEl = getByTestId(`weekday-1-${i}`)
      expect(weekdayEl).toHaveTextContent(weekday)
    }
  })

  it('handles maxValue correctly using arrow keys', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        modelValue: calendarDateRange,
        maxValue: new CalendarDate(1980, 2, 15),
      },
    })

    const lastDayOfMonth = getByTestId('date-1-31')
    lastDayOfMonth.focus()
    expect(lastDayOfMonth).toHaveFocus()

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January 1980')

    await user.keyboard(kbd.ARROW_RIGHT)
    expect(getByTestId('date-2-1')).toHaveFocus()
    await user.keyboard(kbd.ARROW_LEFT)
    expect(getByTestId('date-1-31')).toHaveFocus()
  })

  it('handles minValue correctly using arrow keys', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        modelValue: calendarDateRange,
        minValue: new CalendarDate(1979, 12, 15),
      },
    })

    const firstDayOfMonth = getByTestId('date-1-1')
    firstDayOfMonth.focus()
    expect(firstDayOfMonth).toHaveFocus()

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January 1980')

    await user.keyboard(kbd.ARROW_LEFT)
    expect(getByTestId('date-12-31')).toHaveFocus()
    await user.keyboard(kbd.ARROW_RIGHT)
    expect(getByTestId('date-1-1')).toHaveFocus()
  })
})

describe('numberOfMonths > 1', () => {
  it('properly handles multiple months correctly', async () => {
    const { getByTestId, calendar, user } = setup({
      calendarProps: {
        modelValue: calendarDateRange,
        numberOfMonths: 2,
      },
    })

    const selectedDays = getSelectedDays(calendar)
    expect(selectedDays.at(0)).toHaveTextContent(String(calendarDateRange.start.day))
    expect(selectedDays.at(-1)).toHaveTextContent(String(calendarDateRange.end.day))

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January - February 1980')

    const firstMonthDayDateStr = calendarDateRange.start.set({ day: 12 }).toString()
    const firstMonthDay = getByTestId('date-0-1-12')
    expect(firstMonthDay).toHaveTextContent('12')
    expect(firstMonthDay).toHaveAttribute('data-value', firstMonthDayDateStr)

    const secondMonthDay = getByTestId('date-1-2-15')
    const secondMonthDayDateStr = calendarDateRange.start.set({ day: 15, month: 2 }).toString()
    expect(secondMonthDay).toHaveTextContent('15')
    expect(secondMonthDay).toHaveAttribute('data-value', secondMonthDayDateStr)

    const prevButton = getByTestId('prev-button')
    const nextButton = getByTestId('next-button')

    await user.click(nextButton)
    expect(heading).toHaveTextContent('February - March 1980')
    expect(firstMonthDay).not.toBeInTheDocument()

    await user.click(prevButton)
    expect(heading).toHaveTextContent('January - February 1980')
    expect(firstMonthDay).not.toBeInTheDocument()

    await user.click(prevButton)
    expect(heading).toHaveTextContent('December 1979 - January 1980')
    expect(firstMonthDay).not.toBeInTheDocument()
  })

  it('properly handles `pagedNavigation`', async () => {
    const { getByTestId, calendar, user } = setup({
      calendarProps: {
        modelValue: calendarDateRange,
        numberOfMonths: 2,
        pagedNavigation: true,
      },
    })

    const selectedDays = getSelectedDays(calendar)
    expect(selectedDays.at(0)).toHaveTextContent(String(calendarDateRange.start.day))
    expect(selectedDays.at(-1)).toHaveTextContent(String(calendarDateRange.end.day))

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January - February 1980')

    const firstMonthDayDateStr = calendarDateRange.start.set({ day: 12 }).toString()
    const firstMonthDay = getByTestId('date-0-1-12')
    expect(firstMonthDay).toHaveTextContent('12')
    expect(firstMonthDay).toHaveAttribute('data-value', firstMonthDayDateStr)

    const secondMonthDay = getByTestId('date-1-2-15')
    const secondMonthDayDateStr = calendarDateRange.start.set({ day: 15, month: 2 }).toString()
    expect(secondMonthDay).toHaveTextContent('15')
    expect(secondMonthDay).toHaveAttribute('data-value', secondMonthDayDateStr)

    const prevButton = getByTestId('prev-button')
    const nextButton = getByTestId('next-button')

    await user.click(nextButton)
    expect(heading).toHaveTextContent('March - April 1980')
    expect(firstMonthDay).not.toBeInTheDocument()

    await user.click(prevButton)
    expect(heading).toHaveTextContent('January - February 1980')
    expect(firstMonthDay).not.toBeInTheDocument()

    await user.click(prevButton)
    expect(heading).toHaveTextContent('November - December 1979')
    expect(firstMonthDay).not.toBeInTheDocument()
  })

  it('handles maxValue correctly using arrow keys', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        modelValue: calendarDateRange,
        numberOfMonths: 2,
        maxValue: new CalendarDate(1980, 3, 15),
      },
    })

    const lastDayOfMonth = getByTestId('date-1-2-29')
    lastDayOfMonth.focus()
    expect(lastDayOfMonth).toHaveFocus()

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January - February 1980')

    await user.keyboard(kbd.ARROW_RIGHT)
    expect(getByTestId('date-1-3-1')).toHaveFocus()
    await user.keyboard(kbd.ARROW_LEFT)
    expect(getByTestId('date-0-2-29')).toHaveFocus()
  })

  it('handles minValue correctly using arrow keys', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        modelValue: calendarDateRange,
        numberOfMonths: 2,
        minValue: new CalendarDate(1979, 12, 15),
      },
    })

    const firstDayOfMonth = getByTestId('date-0-1-1')
    firstDayOfMonth.focus()
    expect(firstDayOfMonth).toHaveFocus()

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January - February 1980')

    await user.keyboard(kbd.ARROW_LEFT)
    expect(getByTestId('date-0-12-31')).toHaveFocus()
    await user.keyboard(kbd.ARROW_RIGHT)
    expect(getByTestId('date-1-1-1')).toHaveFocus()
  })

  it('handles fixedDate with start correctly', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        defaultValue: calendarDateRange,
        fixedDate: 'start',
      },
    })

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January 1980')

    const nextDay = getByTestId('date-1-27')
    await user.click(nextDay)

    expect(getByTestId('date-1-26')).toHaveAttribute('data-selected')
    expect(getByTestId('date-1-20')).toHaveAttribute('data-selection-start')
    expect(getByTestId('date-1-27')).toHaveAttribute('data-selection-end')

    await user.click(getByTestId('date-1-26'))
    expect(getByTestId('date-1-20')).toHaveAttribute('data-selection-start')
    expect(getByTestId('date-1-26')).toHaveAttribute('data-selection-end')
  })

  it('handles fixedDate with end correctly', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        defaultValue: calendarDateRange,
        fixedDate: 'end',
      },
    })

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January 1980')

    const nextDay = getByTestId('date-1-27')
    await user.click(nextDay)

    expect(getByTestId('date-1-26')).toHaveAttribute('data-selected')
    expect(getByTestId('date-1-20')).toHaveAttribute('data-selection-start')
    expect(getByTestId('date-1-27')).toHaveAttribute('data-selection-end')

    await user.click(getByTestId('date-1-26'))
    expect(getByTestId('date-1-26')).toHaveAttribute('data-selection-start')
    expect(getByTestId('date-1-27')).toHaveAttribute('data-selection-end')
  })
})

describe('handles maximumDays', () => {
  it('limits the maximum number of days that can be selected', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        placeholder: new CalendarDate(1980, 1, 15),
        maximumDays: 5,
      },
    })

    const startDay = getByTestId('date-1-15')
    const maximumDay = getByTestId('date-1-19') // 5 days ahead
    const beyondMaximumDay = getByTestId('date-1-20') // 6 days ahead

    await user.click(startDay)
    expect(startDay).toHaveAttribute('data-selection-start')

    // Attempt to select an end date beyond the maximum days (more than 5 days ahead)
    await user.click(beyondMaximumDay)

    expect(beyondMaximumDay).toHaveAttribute('data-disabled')
    expect(beyondMaximumDay).not.toHaveAttribute('data-selected')

    // Should be limited to 5 days
    expect(getByTestId('date-1-19')).not.toHaveAttribute('data-disabled')

    await user.click(maximumDay)

    // Check that all days within the maximum range are selected
    for (let day = 15; day < 20; day++) {
      expect(getByTestId(`date-1-${day}`)).toHaveAttribute('data-selected')
    }
  })

  it('dynamically updates disabled dates based on the selection and clears constraints after completing a range', async () => {
    const { getByTestId, user, rerender } = setup({
      calendarProps: {
        placeholder: new CalendarDate(1980, 1, 10),
        maximumDays: 3,
      },
      emits: { 'onUpdate:modelValue': data => rerender({ calendarProps: { placeholder: new CalendarDate(1980, 1, 10), maximumDays: 3, modelValue: data } }) },
    })

    // No dates should be disabled due to maximumDays
    expect(getByTestId('date-1-14')).not.toHaveAttribute('aria-disabled', 'true')
    expect(getByTestId('date-1-20')).not.toHaveAttribute('aria-disabled', 'true')

    // Select a start date (10th of January)
    const startDay = getByTestId('date-1-10')
    await user.click(startDay)
    expect(startDay).toHaveAttribute('data-selection-start')

    // Days beyond the maximum limit are now disabled
    expect(getByTestId('date-1-14')).toHaveAttribute('aria-disabled', 'true')

    // Days within the limit should not be disabled
    expect(getByTestId('date-1-12')).not.toHaveAttribute('aria-disabled', 'true')

    // Complete the range selection with a date within the limit
    await user.click(getByTestId('date-1-12'))

    // Distant dates should no longer be disabled
    expect(getByTestId('date-1-20')).not.toHaveAttribute('aria-disabled', 'true')

    // Select a new range
    await user.click(getByTestId('date-1-15'))
    expect(getByTestId('date-1-15')).toHaveAttribute('data-selection-start')

    // Days beyond the maximum limit from the new start date should be disabled
    expect(getByTestId('date-1-18')).toHaveAttribute('aria-disabled', 'true')
    expect(getByTestId('date-1-17')).not.toHaveAttribute('aria-disabled', 'true')
  })
})
