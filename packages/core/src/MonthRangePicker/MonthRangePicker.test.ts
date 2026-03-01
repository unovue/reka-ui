import type { DateValue } from '@internationalized/date'
import type { MonthRangePickerRootProps } from './MonthRangePickerRoot.vue'
import type { DateRange } from '@/shared/date'
import { CalendarDate, CalendarDateTime, toZoned } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import MonthRangePicker from './story/_MonthRangePicker.vue'

const calendarDateRange = {
  start: new CalendarDate(1980, 1, 20),
  end: new CalendarDate(1980, 3, 25),
}

const updatedCalendarDateRange = {
  start: new CalendarDate(1980, 4, 5),
  end: new CalendarDate(1980, 6, 5),
}

const calendarDateTimeRange = {
  start: new CalendarDateTime(1980, 1, 20, 12, 30, 0, 0),
  end: new CalendarDateTime(1980, 3, 25, 12, 30, 0, 0),
}

const zonedDateTimeRange = {
  start: toZoned(calendarDateTimeRange.start, 'America/New_York'),
  end: toZoned(calendarDateTimeRange.end, 'America/New_York'),
}

const kbd = useTestKbd()

function setup(props: { pickerProps?: MonthRangePickerRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateRange) => void } } = {}) {
  const user = userEvent.setup()
  const returned = render(MonthRangePicker, { props })
  const picker = returned.getByTestId('month-range-picker')
  expect(picker).toBeVisible()
  return { ...returned, user, picker }
}

function getSelectedMonths(picker: HTMLElement) {
  return Array.from(picker.querySelectorAll<HTMLElement>('[data-selected]'))
}

it('should pass axe accessibility tests', async () => {
  const wrapper = mount(MonthRangePicker)
  expect(await axe(wrapper.element)).toHaveNoViolations()
})

describe('month range picker', () => {
  it('respects a default value if provided - `CalendarDate`', async () => {
    const { picker, getByTestId } = setup({ pickerProps: { modelValue: calendarDateRange } })
    const selectedMonths = getSelectedMonths(picker)
    expect(selectedMonths).toHaveLength(3)
    expect(getByTestId('heading')).toHaveTextContent('1980')
  })

  it('respects a default value if provided - `CalendarDateTime`', async () => {
    const { picker, getByTestId } = setup({ pickerProps: { modelValue: calendarDateTimeRange } })
    const selectedMonths = getSelectedMonths(picker)
    expect(selectedMonths).toHaveLength(3)
    expect(getByTestId('heading')).toHaveTextContent('1980')
  })

  it('respects a default value if provided - `ZonedDateTime`', async () => {
    const { picker, getByTestId } = setup({ pickerProps: { modelValue: zonedDateTimeRange } })
    const selectedMonths = getSelectedMonths(picker)
    expect(selectedMonths).toHaveLength(3)
    expect(getByTestId('heading')).toHaveTextContent('1980')
  })

  it('does not crash when modelValue is null', async () => {
    const { picker, rerender } = setup({ pickerProps: { modelValue: null } })

    expect(getSelectedMonths(picker)).toHaveLength(0)

    await rerender({
      pickerProps: {
        modelValue: calendarDateRange,
      },
    })

    expect(getSelectedMonths(picker)).toHaveLength(3)
  })

  it('resets range on select when a range is already selected', async () => {
    const { getByTestId, picker, user, rerender } = setup({
      pickerProps: { modelValue: calendarDateRange },
      emits: { 'onUpdate:modelValue': data => rerender({ pickerProps: { modelValue: data } }) },
    })

    let startValue = picker.querySelector('[data-selection-start]')
    let endValue = picker.querySelector('[data-selection-end]')

    expect(startValue).toHaveTextContent('Jan')
    expect(endValue).toHaveTextContent('Mar')

    const mayMonth = getByTestId('month-5')
    await user.click(mayMonth)

    const selectedMonths = getSelectedMonths(picker)
    expect(selectedMonths).toHaveLength(1)

    startValue = picker.querySelector('[data-selection-start]')
    endValue = picker.querySelector('[data-selection-end]')

    expect(startValue).toBeInTheDocument()
    expect(endValue).not.toBeInTheDocument()

    const julyMonth = getByTestId('month-7')
    await user.click(julyMonth)
    expect(getSelectedMonths(picker)).toHaveLength(3)
  })

  it('keeps controlled end when parent preserves it after start edit', async () => {
    const preservedEnd = new CalendarDate(1980, 8, 1)
    const controlledRange = {
      start: new CalendarDate(1980, 1, 1),
      end: preservedEnd,
    }

    const { getByTestId, picker, user, rerender } = setup({
      pickerProps: { modelValue: controlledRange },
      emits: {
        'onUpdate:modelValue': (data) => {
          rerender({
            pickerProps: {
              modelValue: {
                start: data.start ?? controlledRange.start,
                end: data.end ?? preservedEnd,
              },
            },
          })
        },
      },
    })

    const aprilMonth = getByTestId('month-4')
    await user.click(aprilMonth)

    expect(getByTestId('month-4')).toHaveAttribute('data-selection-start')
    expect(getByTestId('month-8')).toHaveAttribute('data-selection-end')
    expect(getByTestId('month-5')).toHaveAttribute('data-selected')
    expect(getByTestId('month-7')).toHaveAttribute('data-selected')
    expect(getSelectedMonths(picker)).toHaveLength(5)
  })

  it('allows same month selection', async () => {
    const { getByTestId, picker, user, rerender } = setup({
      pickerProps: { placeholder: calendarDateRange.start },
      emits: { 'onUpdate:modelValue': data => rerender({ pickerProps: { modelValue: data } }) },
    })

    const janMonth = getByTestId('month-1')
    await user.click(janMonth)
    await user.click(janMonth)

    expect(getSelectedMonths(picker)).toHaveLength(1)
    expect(picker.querySelector('[data-selection-start]')).toBeInTheDocument()
    expect(picker.querySelector('[data-selection-end]')).toBeInTheDocument()
  })

  it('allows deselection', async () => {
    const { getByTestId, picker, user, rerender } = setup({
      pickerProps: { placeholder: calendarDateRange.start },
      emits: { 'onUpdate:modelValue': data => rerender({ pickerProps: { modelValue: data } }) },
    })

    const janMonth = getByTestId('month-1')
    await user.click(janMonth)
    await user.click(janMonth)

    expect(getSelectedMonths(picker)).toHaveLength(1)

    await user.click(janMonth)
    expect(getSelectedMonths(picker)).toHaveLength(0)
  })

  it('resets range selection when pressing Escape', async () => {
    const { getByTestId, picker, user, rerender } = setup({
      pickerProps: { modelValue: calendarDateRange },
      emits: { 'onUpdate:modelValue': data => rerender({ pickerProps: { modelValue: data } }) },
    })

    let startValue = picker.querySelector('[data-selection-start]')
    let endValue = picker.querySelector('[data-selection-end]')

    expect(startValue).toHaveTextContent('Jan')
    expect(endValue).toHaveTextContent('Mar')

    const mayMonth = getByTestId('month-5')
    await user.click(mayMonth)

    const selectedMonths = getSelectedMonths(picker)
    expect(selectedMonths).toHaveLength(1)

    await user.keyboard(kbd.ESCAPE)

    startValue = picker.querySelector('[data-selection-start]')
    endValue = picker.querySelector('[data-selection-end]')

    expect(startValue).toHaveTextContent('Jan')
    expect(endValue).toHaveTextContent('Mar')
  })

  it('resets to latest externally controlled complete range when pressing Escape', async () => {
    const { getByTestId, picker, user, rerender } = setup({
      pickerProps: { modelValue: calendarDateRange },
      emits: { 'onUpdate:modelValue': data => rerender({ pickerProps: { modelValue: data } }) },
    })

    await rerender({ pickerProps: { modelValue: updatedCalendarDateRange } })

    let startValue = picker.querySelector('[data-selection-start]')
    let endValue = picker.querySelector('[data-selection-end]')

    expect(startValue).toHaveTextContent('Apr')
    expect(endValue).toHaveTextContent('Jun')

    await user.click(getByTestId('month-2'))
    expect(getSelectedMonths(picker)).toHaveLength(1)

    await user.keyboard(kbd.ESCAPE)

    startValue = picker.querySelector('[data-selection-start]')
    endValue = picker.querySelector('[data-selection-end]')

    expect(startValue).toHaveTextContent('Apr')
    expect(endValue).toHaveTextContent('Jun')
  })

  it('navigates years forward using the next button', async () => {
    const { getByTestId, user } = setup({ pickerProps: { modelValue: calendarDateRange } })

    const heading = getByTestId('heading')
    const nextBtn = getByTestId('next-button')

    expect(heading).toHaveTextContent('1980')
    await user.click(nextBtn)
    expect(heading).toHaveTextContent('1981')
  })

  it('navigates years backwards using the prev button', async () => {
    const { getByTestId, user } = setup({ pickerProps: { modelValue: calendarDateRange } })

    const heading = getByTestId('heading')
    const prevBtn = getByTestId('prev-button')

    expect(heading).toHaveTextContent('1980')
    await user.click(prevBtn)
    expect(heading).toHaveTextContent('1979')
  })

  it('handles fixedDate with start correctly', async () => {
    const { getByTestId, picker, user } = setup({
      pickerProps: {
        defaultValue: calendarDateRange,
        fixedDate: 'start',
      },
    })

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('1980')

    const mayMonth = getByTestId('month-5')
    await user.click(mayMonth)

    expect(getByTestId('month-4')).toHaveAttribute('data-selected')
    expect(getByTestId('month-1')).toHaveAttribute('data-selection-start')
    expect(getByTestId('month-5')).toHaveAttribute('data-selection-end')
  })

  it('handles fixedDate with end correctly', async () => {
    const { getByTestId, picker, user } = setup({
      pickerProps: {
        defaultValue: calendarDateRange,
        fixedDate: 'end',
      },
    })

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('1980')

    const mayMonth = getByTestId('month-5')
    await user.click(mayMonth)

    expect(getByTestId('month-4')).toHaveAttribute('data-selected')
    expect(getByTestId('month-1')).toHaveAttribute('data-selection-start')
    expect(getByTestId('month-5')).toHaveAttribute('data-selection-end')

    const febMonth = getByTestId('month-2')
    await user.click(febMonth)
    expect(getByTestId('month-2')).toHaveAttribute('data-selection-start')
    expect(getByTestId('month-5')).toHaveAttribute('data-selection-end')
  })

  it('allows non-contiguous ranges', async () => {
    const { getByTestId, user } = setup({
      pickerProps: {
        placeholder: calendarDateRange.start,
        allowNonContiguousRanges: true,
        isMonthUnavailable: (date: DateValue) => {
          return date.month === 3
        },
      },
    })

    const janMonth = getByTestId('month-1')
    const aprilMonth = getByTestId('month-4')
    const mayMonth = getByTestId('month-5')
    await user.click(janMonth)
    await user.click(mayMonth)
    expect(aprilMonth).toHaveAttribute('data-selected')
  })
})

describe('month range picker - maximumMonths', () => {
  it('limits the maximum number of months that can be selected', async () => {
    const { getByTestId, user } = setup({
      pickerProps: {
        placeholder: new CalendarDate(1980, 3, 15),
        maximumMonths: 3,
      },
    })

    const marchMonth = getByTestId('month-3')
    await user.click(marchMonth)
    expect(marchMonth).toHaveAttribute('data-selection-start')

    const juneMonth = getByTestId('month-6')
    await user.click(juneMonth)

    expect(juneMonth).toHaveAttribute('data-disabled')
    expect(juneMonth).not.toHaveAttribute('data-selected')

    const mayMonth = getByTestId('month-5')
    expect(mayMonth).not.toHaveAttribute('data-disabled')

    await user.click(mayMonth)
    expect(getByTestId('month-3')).toHaveAttribute('data-selected')
    expect(getByTestId('month-4')).toHaveAttribute('data-selected')
    expect(getByTestId('month-5')).toHaveAttribute('data-selected')
  })

  it('highlights backwards within maximumMonths without inverting', async () => {
    const { getByTestId, user } = setup({
      pickerProps: {
        placeholder: new CalendarDate(1980, 3, 15),
        maximumMonths: 3,
      },
    })

    const marchMonth = getByTestId('month-3')
    await user.click(marchMonth)
    expect(marchMonth).toHaveAttribute('data-selection-start')

    const janMonth = getByTestId('month-1')
    await user.hover(janMonth)

    expect(janMonth).toHaveAttribute('data-highlighted-start')
    expect(getByTestId('month-2')).toHaveAttribute('data-highlighted')
    expect(marchMonth).toHaveAttribute('data-highlighted-end')
    expect(getByTestId('month-4')).not.toHaveAttribute('data-highlighted')
  })

  it('enforces maximumMonths for out-of-bounds controlled ranges with fixedDate="start"', async () => {
    const outOfBoundsRange = {
      start: new CalendarDate(1980, 1, 1),
      end: new CalendarDate(1980, 6, 1),
    }

    const { getByTestId, user, rerender } = setup({
      pickerProps: {
        modelValue: outOfBoundsRange,
        fixedDate: 'start',
        maximumMonths: 3,
      },
      emits: { 'onUpdate:modelValue': data => rerender({ pickerProps: { modelValue: data, fixedDate: 'start', maximumMonths: 3 } }) },
    })

    expect(getByTestId('month-5')).toHaveAttribute('data-disabled')

    await user.click(getByTestId('month-5'))
    expect(getByTestId('month-6')).toHaveAttribute('data-selection-end')

    await user.click(getByTestId('month-3'))
    expect(getByTestId('month-1')).toHaveAttribute('data-selection-start')
    expect(getByTestId('month-2')).toHaveAttribute('data-selected')
    expect(getByTestId('month-3')).toHaveAttribute('data-selection-end')
    expect(getByTestId('month-4')).not.toHaveAttribute('data-selected')
  })

  it('enforces maximumMonths for out-of-bounds controlled ranges with fixedDate="end"', async () => {
    const outOfBoundsRange = {
      start: new CalendarDate(1980, 1, 1),
      end: new CalendarDate(1980, 6, 1),
    }

    const { getByTestId, user, rerender } = setup({
      pickerProps: {
        modelValue: outOfBoundsRange,
        fixedDate: 'end',
        maximumMonths: 3,
      },
      emits: { 'onUpdate:modelValue': data => rerender({ pickerProps: { modelValue: data, fixedDate: 'end', maximumMonths: 3 } }) },
    })

    expect(getByTestId('month-2')).toHaveAttribute('data-disabled')

    await user.click(getByTestId('month-2'))
    expect(getByTestId('month-1')).toHaveAttribute('data-selection-start')

    await user.click(getByTestId('month-4'))
    expect(getByTestId('month-4')).toHaveAttribute('data-selection-start')
    expect(getByTestId('month-5')).toHaveAttribute('data-selected')
    expect(getByTestId('month-6')).toHaveAttribute('data-selection-end')
    expect(getByTestId('month-3')).not.toHaveAttribute('data-selected')
  })
})

describe('month range picker - keyboard navigation', () => {
  it('navigates with arrow keys within the grid', async () => {
    const { getByTestId, user } = setup({
      pickerProps: { placeholder: calendarDateRange.start },
    })

    const janMonth = getByTestId('month-1')
    janMonth.focus()
    expect(janMonth).toHaveFocus()

    await user.keyboard(kbd.ARROW_RIGHT)
    expect(getByTestId('month-2')).toHaveFocus()

    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('month-6')).toHaveFocus()

    await user.keyboard(kbd.ARROW_LEFT)
    expect(getByTestId('month-5')).toHaveFocus()

    await user.keyboard(kbd.ARROW_UP)
    expect(getByTestId('month-1')).toHaveFocus()
  })

  it('navigates to next/prev year with PageDown/PageUp', async () => {
    const { getByTestId, user } = setup({
      pickerProps: { placeholder: calendarDateRange.start },
    })

    const janMonth = getByTestId('month-1')
    janMonth.focus()
    expect(janMonth).toHaveFocus()
    expect(getByTestId('heading')).toHaveTextContent('1980')

    await user.keyboard(kbd.PAGE_DOWN)
    expect(getByTestId('heading')).toHaveTextContent('1981')

    await user.keyboard(kbd.PAGE_UP)
    expect(getByTestId('heading')).toHaveTextContent('1980')
  })

  it('skips disabled candidate month when paging by year', async () => {
    const { getByTestId, user } = setup({
      pickerProps: {
        placeholder: calendarDateRange.start,
        isMonthDisabled: (date: DateValue) => date.year === 1981 && date.month === 1,
      },
    })

    const janMonth = getByTestId('month-1')
    janMonth.focus()
    expect(janMonth).toHaveFocus()

    await user.keyboard(kbd.PAGE_DOWN)
    expect(getByTestId('heading')).toHaveTextContent('1981')
    expect(getByTestId('month-1')).toHaveAttribute('data-disabled')
    expect(getByTestId('month-2')).toHaveFocus()
  })
})
