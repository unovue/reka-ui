import type { DateValue } from '@internationalized/date'
import type { CalendarRootProps } from './CalendarRoot.vue'
import { CalendarDate, CalendarDateTime, toZoned } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import Calendar from './story/_Calendar.vue'
import CalendarMultiple from './story/_CalendarMultiple.vue'

const calendarDate = new CalendarDate(1980, 1, 20)
const edgeCaseCalendarDate = new CalendarDate(2025, 1, 1)
const calendarDateTime = new CalendarDateTime(1980, 1, 20, 12, 30, 0, 0)
const zonedDateTime = toZoned(calendarDateTime, 'America/New_York')

const narrowWeekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const shortWeekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const longWeekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const kbd = useTestKbd()

function setup(props: { calendarProps?: CalendarRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateValue) => void } } = {}) {
  const user = userEvent.setup()
  const returned = render(Calendar, { props })
  const calendar = returned.getByTestId('calendar')
  expect(calendar).toBeVisible()
  return { ...returned, user, calendar }
}

function setupMulti(props: { calendarProps?: CalendarRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateValue[]) => void } } = { }) {
  const user = userEvent.setup()
  const returned = render(CalendarMultiple, { props: { ...props, multiple: true } })
  const calendar = returned.getByTestId('calendar')
  expect(calendar).toBeVisible()
  return { ...returned, user, calendar }
}

function getSelectedDay(calendar: HTMLElement) {
  return calendar.querySelector<HTMLElement>('[data-selected]') as HTMLElement
}

function getSelectedDays(calendar: HTMLElement) {
  return Array.from(calendar.querySelectorAll<HTMLElement>('[data-selected]'))
}

it('should pass axe accessibility tests', async () => {
  const { calendar } = setup()
  expect(await axe(calendar)).toHaveNoViolations()
})

describe('calendar', async () => {
  it('respects a default value if provided - `CalendarDate`', async () => {
    const { getByTestId, calendar } = setup({ calendarProps: { modelValue: calendarDate } })
    expect(getSelectedDay(calendar)).toHaveTextContent(String(calendarDate.day))
    expect(getByTestId('heading')).toHaveTextContent('January 1980')
  })

  it('respects a default value if provided - `CalendarDateTime`', async () => {
    const { calendar, getByTestId } = setup({ calendarProps: { modelValue: calendarDateTime } })

    expect(getSelectedDay(calendar)).toHaveTextContent(String(calendarDateTime.day))
    expect(getByTestId('heading')).toHaveTextContent('January 1980')
  })

  it('respects a default value if provided - `ZonedDateTime`', async () => {
    const { calendar, getByTestId } = setup({ calendarProps: { modelValue: zonedDateTime } })

    expect(getSelectedDay(calendar)).toHaveTextContent(String(zonedDateTime.day))
    expect(getByTestId('heading')).toHaveTextContent('January 1980')
  })

  it('navigates the months forward using the next button', async () => {
    const { getByTestId, user } = setup({ calendarProps: { modelValue: calendarDate } })

    const heading = getByTestId('heading')
    const nextBtn = getByTestId('next-button')

    for (const month of months) {
      expect(heading).toHaveTextContent(`${month} 1980`)
      await user.click(nextBtn)
    }
    expect(heading).toHaveTextContent('January 1981')
  })

  it('navigates 10 years into the past when setting the `prevPage` function to subtract 10 years', async () => {
    const { getByTestId, user } = setup({ calendarProps: { modelValue: calendarDate, prevPage: (date: DateValue) => date.subtract({ years: 10 }) } })

    const heading = getByTestId('heading')
    const prevBtn = getByTestId('prev-button')

    await user.click(prevBtn)

    expect(heading).toHaveTextContent('January 1970')
  })

  it('overwrites the `nextPage` function from `CalendarRoot`', async () => {
    const { getByTestId, user } = setup({ calendarProps: { modelValue: calendarDate, nextPage: (date: DateValue) => date.add({ years: 10 }) } })

    const heading = getByTestId('heading')
    const nextBtn = getByTestId('next-year-button')

    await user.click(nextBtn)

    expect(heading).toHaveTextContent('January 1981')
  })

  it('overwrites the `prevPage` function from `CalendarRoot`', async () => {
    const { getByTestId, user } = setup({ calendarProps: { modelValue: calendarDate, prevPage: (date: DateValue) => date.subtract({ years: 10 }) } })

    const heading = getByTestId('heading')
    const prevBtn = getByTestId('prev-year-button')

    await user.click(prevBtn)

    expect(heading).toHaveTextContent('January 1979')
  })

  it('navigates 10 years into the future when setting the `nextPage` function to add 10 years', async () => {
    const { getByTestId, user } = setup({ calendarProps: { modelValue: calendarDate, nextPage: (date: DateValue) => date.add({ years: 10 }) } })

    const heading = getByTestId('heading')
    const nextBtn = getByTestId('next-button')

    await user.click(nextBtn)

    expect(heading).toHaveTextContent('January 1990')
  })

  it('navigates the months backwards using the prev button', async () => {
    const { getByTestId, user } = setup({ calendarProps: { modelValue: calendarDate } })

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

  it('allows dates to be deselected by clicking the selected date', async () => {
    const { user, calendar, rerender } = setup({ calendarProps: { modelValue: calendarDate }, emits: { 'onUpdate:modelValue': (data: DateValue) => rerender({ modelValue: data }) } })

    const selectedDay = getSelectedDay(calendar)

    expect(selectedDay).toHaveTextContent(String(calendarDate.day))

    await user.click(selectedDay)

    const newSelectedDay = getSelectedDay(calendar)

    expect(newSelectedDay).not.toBeInTheDocument()
  })

  it.each([kbd.ENTER, kbd.SPACE])('allows deselection with %s key', async (key) => {
    const { user, calendar, rerender } = setup({
      calendarProps: { modelValue: calendarDate },
      emits: { 'onUpdate:modelValue': (data: DateValue) => rerender({ modelValue: data }) },
    })

    const selectedDay = getSelectedDay(calendar)

    expect(selectedDay).toHaveTextContent(String(calendarDate.day))

    selectedDay!.focus()

    await user.keyboard(key)
    const newSelectedDay = getSelectedDay(calendar)

    expect(newSelectedDay).not.toBeInTheDocument()
  })

  it('allows selection with mouse', async () => {
    const { getByTestId, user, calendar } = setup({
      calendarProps: { placeholder: zonedDateTime },
    })

    const secondDayInMonth = getByTestId('date-1-2')
    expect(secondDayInMonth).toHaveTextContent('2')
    await user.click(secondDayInMonth)

    const newDate = zonedDateTime.set({ day: 2 })
    const selectedDay = getSelectedDay(calendar)
    expect(selectedDay).toHaveTextContent(String(newDate.day))
  })

  it.each([kbd.ENTER, kbd.SPACE])('allows selection with %s key', async (key) => {
    const { getByTestId, user, calendar } = setup({
      calendarProps: { placeholder: zonedDateTime },
    })

    const secondDayInMonth = getByTestId('date-1-2')
    expect(secondDayInMonth).toHaveTextContent('2')
    secondDayInMonth.focus()
    await user.keyboard(key)

    const newDate = zonedDateTime.set({ day: 2 })
    const selectedDay = getSelectedDay(calendar)
    expect(selectedDay).toHaveTextContent(String(newDate.day))
  })

  it('displays multiple months when `numberOfMonths` is greater than 1', async () => {
    const { getByTestId, calendar, user } = setup({ calendarProps: { modelValue: calendarDateTime, numberOfMonths: 2 } })

    const selectedDay = getSelectedDay(calendar)
    expect(selectedDay).toHaveTextContent(String(calendarDateTime.day))

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January - February 1980')

    const firstMonthDayDateStr = calendarDateTime.set({ day: 12 }).toString()
    const firstMonthDay = getByTestId('date-0-1-12')
    expect(firstMonthDay).toHaveTextContent('12')
    expect(firstMonthDay).toHaveAttribute('data-value', firstMonthDayDateStr)

    const secondMonthDay = getByTestId('date-1-2-15')
    const secondMonthDayDateStr = calendarDateTime.set({ day: 15, month: 2 }).toString()
    expect(secondMonthDay).toHaveTextContent('15')
    expect(secondMonthDay).toHaveAttribute('data-value', secondMonthDayDateStr)

    const prevButton = getByTestId('prev-button')
    const nextButton = getByTestId('next-button')

    await user.click(nextButton)
    expect(heading).toHaveTextContent('February - March 1980')
    expect(firstMonthDay).not.toBeInTheDocument()

    await user.click(prevButton)
    expect(heading).toHaveTextContent('January - February 1980')
    expect(firstMonthDay).toHaveAttribute('data-value', firstMonthDayDateStr)

    await user.click(prevButton)
    expect(heading).toHaveTextContent('December 1979 - January 1980')
    expect(firstMonthDay).not.toBeInTheDocument()
  })

  it('properly handles multiple months correctly', async () => {
    const { getByTestId, calendar, user } = setup({
      calendarProps: {
        modelValue: calendarDateTime,
        numberOfMonths: 2,
      },
    })

    const selectedDay = getSelectedDay(calendar)
    expect(selectedDay).toHaveTextContent(String(calendarDateTime.day))

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January - February 1980')

    const firstMonthDayDateStr = calendarDateTime.set({ day: 12 }).toString()
    const firstMonthDay = getByTestId('date-0-1-12')
    expect(firstMonthDay).toHaveTextContent('12')
    expect(firstMonthDay).toHaveAttribute('data-value', firstMonthDayDateStr)

    const secondMonthDay = getByTestId('date-1-2-15')
    const secondMonthDayDateStr = calendarDateTime.set({ day: 15, month: 2 }).toString()
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

  it('properly handles `pagedNavigation` with multiple months', async () => {
    const { getByTestId, calendar, user } = setup({
      calendarProps: {
        modelValue: calendarDateTime,
        numberOfMonths: 2,
        pagedNavigation: true,
      },
    })

    const selectedDay = getSelectedDay(calendar)
    expect(selectedDay).toHaveTextContent(String(calendarDateTime.day))

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January - February 1980')

    const firstMonthDayDateStr = calendarDateTime.set({ day: 12 }).toString()
    const firstMonthDay = getByTestId('date-0-1-12')
    expect(firstMonthDay).toHaveTextContent('12')
    expect(firstMonthDay).toHaveAttribute('data-value', firstMonthDayDateStr)

    const secondMonthDay = getByTestId('date-1-2-15')
    const secondMonthDayDateStr = calendarDateTime.set({ day: 15, month: 2 }).toString()
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

  it('always renders six weeks when `fixedWeeks` is `true`', async () => {
    const calendarDate = new CalendarDate(2024, 8, 1)

    const { getByTestId, calendar, user } = setup({
      calendarProps: {
        modelValue: calendarDate,
        fixedWeeks: true,
      },
    })

    function getNumberOfWeeks() {
      return calendar.querySelectorAll('[data-week]').length
    }

    const nextButton = getByTestId('next-button')

    // Check the if the first day of the next month is rendered for the next 14 months starting from edge case August 2024
    for (let i = 0; i < 14; i++) {
      expect(getByTestId(`date-${calendarDate.add({ months: i + 1 }).month}-1`)).toHaveTextContent('1')
      expect(getNumberOfWeeks()).toBe(6)
      await user.click(nextButton)
    }
  })

  it('should not allow navigation before the `minValue` (prev button)', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        modelValue: calendarDate,
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

  it('should navigate one year in the past (prev year button)', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        modelValue: calendarDate,
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
        modelValue: calendarDate,
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

  it('should not allow navigation after the `maxValue` (next button)', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        modelValue: calendarDate,
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

  it('does not navigate after `maxValue` (with keyboard)', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        modelValue: calendarDate,
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
        modelValue: calendarDate,
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
        placeholder: calendarDate,
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

  it('handles disabled dates appropriately', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        placeholder: calendarDate,
        isDateDisabled: (date: DateValue) => {
          return date.day === 3
        },
      },
    })

    const thirdDayInMonth = getByTestId('date-1-3')
    expect(thirdDayInMonth).toHaveTextContent('3')
    expect(thirdDayInMonth).toHaveAttribute('data-disabled')
    expect(thirdDayInMonth).toHaveAttribute('aria-disabled', 'true')
    await user.click(thirdDayInMonth)
    expect(thirdDayInMonth).not.toHaveFocus()

    const secondDayInMonth = getByTestId('date-1-2')
    secondDayInMonth.focus()

    expect(secondDayInMonth).toHaveFocus()
    await user.keyboard(kbd.ARROW_RIGHT)
    expect(getByTestId('date-1-4')).toHaveFocus()
    await user.keyboard(kbd.ARROW_LEFT)
    expect(secondDayInMonth).toHaveFocus()

    const tenthDayOfMonth = getByTestId('date-1-10')
    tenthDayOfMonth.focus()
    expect(tenthDayOfMonth).toHaveFocus()

    await user.keyboard(kbd.ARROW_UP)
    expect(getByTestId('date-12-27')).toHaveFocus()

    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('date-1-10')).toHaveFocus()
  })

  it('doesnt allow focus or interaction when `disabled` is `true`', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        placeholder: calendarDate,
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

  it('prevents selection but allows focus when `readonly` is `true`', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        placeholder: calendarDate,
        readonly: true,
      },
    })

    const grid = getByTestId('grid-1')
    expect(grid).toHaveAttribute('aria-readonly', 'true')
    expect(grid).toHaveAttribute('data-readonly')

    const firstDayOfMonth = getByTestId('date-1-1')
    await user.click(firstDayOfMonth)
    expect(firstDayOfMonth).not.toHaveAttribute('data-selected')
    firstDayOfMonth.focus()
    expect(firstDayOfMonth).toHaveFocus()

    const tenthDayOfMonth = getByTestId('date-1-10')
    await user.click(tenthDayOfMonth)
    expect(tenthDayOfMonth).not.toHaveAttribute('data-selected')
    tenthDayOfMonth.focus()
    expect(tenthDayOfMonth).toHaveFocus()
  })
  it('formats the weekday labels correctly - `\'narrow\'`', async () => {
    const { getByTestId } = setup({
      calendarProps: {
        placeholder: calendarDate,
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
        placeholder: calendarDate,
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
        placeholder: calendarDate,
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
        defaultPlaceholder: calendarDate,
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
        defaultPlaceholder: calendarDate,
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
  it('handles maxValue correctly using arrow keys', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        defaultPlaceholder: calendarDate,
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
        defaultPlaceholder: calendarDate,
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
})

describe('calendar - `multiple`', () => {
  it('handles default value when `value` prop is provided - `CalendarDate[]`', async () => {
    const d1 = new CalendarDate(1980, 1, 2)
    const d2 = new CalendarDate(1980, 1, 5)

    const { calendar } = setupMulti({
      calendarProps: { modelValue: [d1, d2] },
    } as { calendarProps: CalendarRootProps & { multiple: true } })

    const selectedDays = getSelectedDays(calendar)
    expect(selectedDays.length).toBe(2)
    expect(selectedDays[0]).toHaveTextContent(String(d1.day))
    expect(selectedDays[1]).toHaveTextContent(String(d2.day))
  })

  it('handles default value when `value` prop is provided - `CalendarDateTime[]`', async () => {
    const d1 = new CalendarDateTime(1980, 1, 2)
    const d2 = new CalendarDateTime(1980, 1, 5)

    const { calendar } = setupMulti({
      calendarProps: { modelValue: [d1, d2] },
    } as { calendarProps: CalendarRootProps & { multiple: true } })

    const selectedDays = getSelectedDays(calendar)
    expect(selectedDays.length).toBe(2)
    expect(selectedDays[0]).toHaveTextContent(String(d1.day))
    expect(selectedDays[1]).toHaveTextContent(String(d2.day))
  })

  it('handles default value when `value` prop is provided - `ZonedDateTime[]`', async () => {
    const d1 = toZoned(new CalendarDateTime(1980, 1, 2), 'America/New_York')
    const d2 = toZoned(new CalendarDateTime(1980, 1, 5), 'America/New_York')

    const { calendar } = setupMulti({
      calendarProps: { modelValue: [d1, d2] },
    } as { calendarProps: CalendarRootProps & { multiple: true } })

    const selectedDays = getSelectedDays(calendar)
    expect(selectedDays.length).toBe(2)
    expect(selectedDays[0]).toHaveTextContent(String(d1.day))
    expect(selectedDays[1]).toHaveTextContent(String(d2.day))
  })

  it('sets placeholder to last value in `value` prop', async () => {
    const d1 = new CalendarDate(1980, 1, 2)
    const d2 = new CalendarDate(1980, 5, 5)

    const { calendar, rerender, getByTestId } = setupMulti({
      calendarProps: { modelValue: [d1, d2] } as CalendarRootProps & { multiple: true },
      emits: { 'onUpdate:modelValue': (data: DateValue[]) => rerender({ modelValue: data }) },
    })

    const heading = getByTestId('heading')
    const selectedDays = getSelectedDays(calendar)
    expect(selectedDays.length).toBe(1)
    expect(heading).toHaveTextContent('May 1980')
  })

  it('allows deselection', async () => {
    const d1 = new CalendarDate(1980, 1, 2)
    const d2 = new CalendarDate(1980, 1, 5)
    const { calendar, user, rerender } = setupMulti({
      calendarProps: { modelValue: [d1, d2] } as CalendarRootProps & { multiple: true },
      emits: { 'onUpdate:modelValue': (data: DateValue[]) => rerender({ modelValue: data }) },
    })

    const selectedDays = getSelectedDays(calendar)
    expect(selectedDays.length).toBe(2)
    await user.click(selectedDays[0])
    const newSelectedDays = getSelectedDays(calendar)
    expect(newSelectedDays.length).toBe(1)
  })

  it('prevents deselection when only one date is selected and `preventDeselect` is `true`', async () => {
    const d1 = new CalendarDate(1980, 1, 2)

    const { calendar, user } = setupMulti({
      calendarProps: {
        modelValue: [d1],
        preventDeselect: true,
      },
    } as { calendarProps: CalendarRootProps & { multiple: true } })
    const selectedDays = getSelectedDays(calendar)
    await user.click(selectedDays[0])
    const selectedDays2 = getSelectedDays(calendar)
    expect(selectedDays2.length).toBe(1)
    await user.click(selectedDays2[0])
    expect(getSelectedDays(calendar).length).toBe(1)
  })
})

describe('calendar - edge cases', () => {
  it('handles february correctly using arrow keys', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        defaultPlaceholder: edgeCaseCalendarDate,
        numberOfMonths: 2,
      },
    })

    const lastDayOfMonth = getByTestId('date-1-2-28')
    lastDayOfMonth.focus()
    expect(lastDayOfMonth).toHaveFocus()

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January - February 2025')

    await user.keyboard(kbd.ARROW_RIGHT)
    expect(getByTestId('date-1-3-1')).toHaveFocus()
    await user.keyboard(kbd.ARROW_LEFT)
    expect(getByTestId('date-0-2-28')).toHaveFocus()
  })

  it('handles multiple number of months properly', async () => {
    const { getByTestId, user } = setup({
      calendarProps: {
        defaultPlaceholder: edgeCaseCalendarDate,
        numberOfMonths: 4,
      },
    })

    const lastDayOfMonth = getByTestId('date-3-4-30')
    lastDayOfMonth.focus()
    expect(lastDayOfMonth).toHaveFocus()

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('January - April 2025')

    await user.keyboard(kbd.ARROW_RIGHT)
    expect(getByTestId('date-3-5-1')).toHaveFocus()

    const firstDayOfMonth = getByTestId('date-0-2-1')
    firstDayOfMonth.focus()
    expect(firstDayOfMonth).toHaveFocus()

    await user.keyboard(kbd.ARROW_LEFT)
    expect(getByTestId('date-0-1-31')).toHaveFocus()
  })
})
