import type { DateValue } from '@internationalized/date'
import type { YearRangePickerRootProps } from './YearRangePickerRoot.vue'
import type { DateRange } from '@/shared/date'
import { CalendarDate, CalendarDateTime, toZoned } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import YearRangePicker from './story/_YearRangePicker.vue'

const calendarDateRange = {
  start: new CalendarDate(1980, 1, 20),
  end: new CalendarDate(1983, 3, 25),
}

const calendarDateTimeRange = {
  start: new CalendarDateTime(1980, 1, 20, 12, 30, 0, 0),
  end: new CalendarDateTime(1983, 3, 25, 12, 30, 0, 0),
}

const zonedDateTimeRange = {
  start: toZoned(calendarDateTimeRange.start, 'America/New_York'),
  end: toZoned(calendarDateTimeRange.end, 'America/New_York'),
}

const kbd = useTestKbd()

function setup(props: { pickerProps?: YearRangePickerRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateRange) => void } } = {}) {
  const user = userEvent.setup()
  const returned = render(YearRangePicker, { props })
  const picker = returned.getByTestId('year-range-picker')
  expect(picker).toBeVisible()
  return { ...returned, user, picker }
}

function getSelectedYears(picker: HTMLElement) {
  return Array.from(picker.querySelectorAll<HTMLElement>('[data-selected]'))
}

it('should pass axe accessibility tests', async () => {
  const wrapper = mount(YearRangePicker)
  expect(await axe(wrapper.element)).toHaveNoViolations()
})

describe('year range picker', () => {
  it('respects a default value if provided - `CalendarDate`', async () => {
    const { picker, getByTestId } = setup({ pickerProps: { modelValue: calendarDateRange } })
    const selectedYears = getSelectedYears(picker)
    expect(selectedYears).toHaveLength(4)
    expect(getByTestId('heading')).toHaveTextContent('1980 - 1991')
  })

  it('respects a default value if provided - `CalendarDateTime`', async () => {
    const { picker, getByTestId } = setup({ pickerProps: { modelValue: calendarDateTimeRange } })
    const selectedYears = getSelectedYears(picker)
    expect(selectedYears).toHaveLength(4)
    expect(getByTestId('heading')).toHaveTextContent('1980 - 1991')
  })

  it('respects a default value if provided - `ZonedDateTime`', async () => {
    const { picker, getByTestId } = setup({ pickerProps: { modelValue: zonedDateTimeRange } })
    const selectedYears = getSelectedYears(picker)
    expect(selectedYears).toHaveLength(4)
    expect(getByTestId('heading')).toHaveTextContent('1980 - 1991')
  })

  it('does not crash when modelValue is null', async () => {
    const { picker, rerender } = setup({ pickerProps: { modelValue: null } })

    expect(getSelectedYears(picker)).toHaveLength(0)

    await rerender({
      pickerProps: {
        modelValue: calendarDateRange,
      },
    })

    expect(getSelectedYears(picker)).toHaveLength(4)
  })

  it('resets range on select when a range is already selected', async () => {
    const { getByTestId, picker, user, rerender } = setup({
      pickerProps: { modelValue: calendarDateRange },
      emits: { 'onUpdate:modelValue': data => rerender({ pickerProps: { modelValue: data } }) },
    })

    let startValue = picker.querySelector('[data-selection-start]')
    let endValue = picker.querySelector('[data-selection-end]')

    expect(startValue).toHaveTextContent('1980')
    expect(endValue).toHaveTextContent('1983')

    const year1985 = getByTestId('year-1985')
    await user.click(year1985)

    const selectedYears = getSelectedYears(picker)
    expect(selectedYears).toHaveLength(1)

    startValue = picker.querySelector('[data-selection-start]')
    endValue = picker.querySelector('[data-selection-end]')

    expect(startValue).toBeInTheDocument()
    expect(endValue).not.toBeInTheDocument()

    const year1987 = getByTestId('year-1987')
    await user.click(year1987)
    expect(getSelectedYears(picker)).toHaveLength(3)
  })

  it('keeps controlled end when parent preserves it after start edit', async () => {
    const preservedEnd = new CalendarDate(1986, 1, 1)
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

    const year1983 = getByTestId('year-1983')
    await user.click(year1983)

    expect(getByTestId('year-1983')).toHaveAttribute('data-selection-start')
    expect(getByTestId('year-1986')).toHaveAttribute('data-selection-end')
    expect(getByTestId('year-1984')).toHaveAttribute('data-selected')
    expect(getByTestId('year-1985')).toHaveAttribute('data-selected')
    expect(getSelectedYears(picker)).toHaveLength(4)
  })

  it('allows same year selection', async () => {
    const { getByTestId, picker, user, rerender } = setup({
      pickerProps: { placeholder: calendarDateRange.start },
      emits: { 'onUpdate:modelValue': data => rerender({ pickerProps: { modelValue: data } }) },
    })

    const year1980 = getByTestId('year-1980')
    await user.click(year1980)
    await user.click(year1980)

    expect(getSelectedYears(picker)).toHaveLength(1)
    expect(picker.querySelector('[data-selection-start]')).toBeInTheDocument()
    expect(picker.querySelector('[data-selection-end]')).toBeInTheDocument()
  })

  it('allows deselection', async () => {
    const { getByTestId, picker, user, rerender } = setup({
      pickerProps: { placeholder: calendarDateRange.start },
      emits: { 'onUpdate:modelValue': data => rerender({ pickerProps: { modelValue: data } }) },
    })

    const year1980 = getByTestId('year-1980')
    await user.click(year1980)
    await user.click(year1980)

    expect(getSelectedYears(picker)).toHaveLength(1)

    await user.click(year1980)
    expect(getSelectedYears(picker)).toHaveLength(0)
  })

  it('resets range selection when pressing Escape', async () => {
    const { getByTestId, picker, user, rerender } = setup({
      pickerProps: { modelValue: calendarDateRange },
      emits: { 'onUpdate:modelValue': data => rerender({ pickerProps: { modelValue: data } }) },
    })

    let startValue = picker.querySelector('[data-selection-start]')
    let endValue = picker.querySelector('[data-selection-end]')

    expect(startValue).toHaveTextContent('1980')
    expect(endValue).toHaveTextContent('1983')

    const year1985 = getByTestId('year-1985')
    await user.click(year1985)

    const selectedYears = getSelectedYears(picker)
    expect(selectedYears).toHaveLength(1)

    await user.keyboard(kbd.ESCAPE)

    startValue = picker.querySelector('[data-selection-start]')
    endValue = picker.querySelector('[data-selection-end]')

    expect(startValue).toHaveTextContent('1980')
    expect(endValue).toHaveTextContent('1983')
  })

  it('navigates pages forward using the next button', async () => {
    const { getByTestId, user } = setup({ pickerProps: { modelValue: calendarDateRange } })

    const heading = getByTestId('heading')
    const nextBtn = getByTestId('next-button')

    expect(heading).toHaveTextContent('1980 - 1991')
    await user.click(nextBtn)
    expect(heading).toHaveTextContent('1992 - 2003')
  })

  it('navigates pages backwards using the prev button', async () => {
    const { getByTestId, user } = setup({ pickerProps: { modelValue: calendarDateRange } })

    const heading = getByTestId('heading')
    const prevBtn = getByTestId('prev-button')

    expect(heading).toHaveTextContent('1980 - 1991')
    await user.click(prevBtn)
    expect(heading).toHaveTextContent('1968 - 1979')
  })

  it('handles fixedDate with start correctly', async () => {
    const { getByTestId, picker, user } = setup({
      pickerProps: {
        defaultValue: calendarDateRange,
        fixedDate: 'start',
      },
    })

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('1980 - 1991')

    const year1985 = getByTestId('year-1985')
    await user.click(year1985)

    expect(getByTestId('year-1984')).toHaveAttribute('data-selected')
    expect(getByTestId('year-1980')).toHaveAttribute('data-selection-start')
    expect(getByTestId('year-1985')).toHaveAttribute('data-selection-end')
  })

  it('handles fixedDate with end correctly', async () => {
    const { getByTestId, picker, user } = setup({
      pickerProps: {
        defaultValue: calendarDateRange,
        fixedDate: 'end',
      },
    })

    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('1980 - 1991')

    const year1985 = getByTestId('year-1985')
    await user.click(year1985)

    expect(getByTestId('year-1984')).toHaveAttribute('data-selected')
    expect(getByTestId('year-1980')).toHaveAttribute('data-selection-start')
    expect(getByTestId('year-1985')).toHaveAttribute('data-selection-end')

    const year1982 = getByTestId('year-1982')
    await user.click(year1982)
    expect(getByTestId('year-1982')).toHaveAttribute('data-selection-start')
    expect(getByTestId('year-1985')).toHaveAttribute('data-selection-end')
  })

  it('allows non-contiguous ranges', async () => {
    const { getByTestId, user } = setup({
      pickerProps: {
        placeholder: calendarDateRange.start,
        allowNonContiguousRanges: true,
        isYearUnavailable: (date: DateValue) => {
          return date.year === 1982
        },
      },
    })

    const year1980 = getByTestId('year-1980')
    const year1983 = getByTestId('year-1983')
    const year1984 = getByTestId('year-1984')
    await user.click(year1980)
    await user.click(year1984)
    expect(year1983).toHaveAttribute('data-selected')
  })
})

describe('year range picker - maximumYears', () => {
  it('limits the maximum number of years that can be selected', async () => {
    const { getByTestId, user } = setup({
      pickerProps: {
        placeholder: new CalendarDate(1983, 3, 15),
        maximumYears: 3,
      },
    })

    const year1983 = getByTestId('year-1983')
    await user.click(year1983)
    expect(year1983).toHaveAttribute('data-selection-start')

    const year1986 = getByTestId('year-1986')
    await user.click(year1986)

    expect(year1986).toHaveAttribute('data-disabled')
    expect(year1986).not.toHaveAttribute('data-selected')

    const year1985 = getByTestId('year-1985')
    expect(year1985).not.toHaveAttribute('data-disabled')

    await user.click(year1985)
    expect(getByTestId('year-1983')).toHaveAttribute('data-selected')
    expect(getByTestId('year-1984')).toHaveAttribute('data-selected')
    expect(getByTestId('year-1985')).toHaveAttribute('data-selected')
  })

  it('highlights backwards within maximumYears without inverting', async () => {
    const { getByTestId, user } = setup({
      pickerProps: {
        placeholder: new CalendarDate(1983, 3, 15),
        maximumYears: 3,
      },
    })

    const year1983 = getByTestId('year-1983')
    await user.click(year1983)
    expect(year1983).toHaveAttribute('data-selection-start')

    const year1981 = getByTestId('year-1981')
    await user.hover(year1981)

    expect(year1981).toHaveAttribute('data-highlighted-start')
    expect(getByTestId('year-1982')).toHaveAttribute('data-highlighted')
    expect(year1983).toHaveAttribute('data-highlighted-end')
    expect(getByTestId('year-1980')).not.toHaveAttribute('data-highlighted')
  })
})

describe('year range picker - keyboard navigation', () => {
  it('navigates with arrow keys within the grid', async () => {
    const { getByTestId, user } = setup({
      pickerProps: { placeholder: calendarDateRange.start },
    })

    const year1980 = getByTestId('year-1980')
    year1980.focus()
    expect(year1980).toHaveFocus()

    await user.keyboard(kbd.ARROW_RIGHT)
    expect(getByTestId('year-1981')).toHaveFocus()

    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('year-1985')).toHaveFocus()

    await user.keyboard(kbd.ARROW_LEFT)
    expect(getByTestId('year-1984')).toHaveFocus()

    await user.keyboard(kbd.ARROW_UP)
    expect(getByTestId('year-1980')).toHaveFocus()
  })

  it('navigates to next/prev page with PageDown/PageUp', async () => {
    const { getByTestId, user } = setup({
      pickerProps: { placeholder: calendarDateRange.start },
    })

    const year1980 = getByTestId('year-1980')
    year1980.focus()
    expect(year1980).toHaveFocus()
    expect(getByTestId('heading')).toHaveTextContent('1980 - 1991')

    await user.keyboard(kbd.PAGE_DOWN)
    expect(getByTestId('heading')).toHaveTextContent('1992 - 2003')

    await user.keyboard(kbd.PAGE_UP)
    expect(getByTestId('heading')).toHaveTextContent('1980 - 1991')
  })

  it('skips disabled candidate year when navigating to next page', async () => {
    const { getByTestId, user } = setup({
      pickerProps: {
        placeholder: calendarDateRange.start,
        isYearDisabled: (date: DateValue) => date.year === 1992,
      },
    })

    const year1980 = getByTestId('year-1980')
    year1980.focus()
    expect(year1980).toHaveFocus()

    await user.keyboard(kbd.PAGE_DOWN)
    expect(getByTestId('heading')).toHaveTextContent('1992 - 2003')
    expect(getByTestId('year-1992')).toHaveAttribute('data-disabled')
    expect(getByTestId('year-1993')).toHaveFocus()
  })

  it('falls back to the nearest enabled year when paged candidate is missing', async () => {
    const { getByTestId, user } = setup({
      pickerProps: {
        placeholder: calendarDateRange.start,
        nextPage: date => date.add({ years: 13 }),
      },
    })

    const year1980 = getByTestId('year-1980')
    year1980.focus()
    expect(year1980).toHaveFocus()

    await user.keyboard(kbd.PAGE_DOWN)

    expect(getByTestId('heading')).toHaveTextContent('1993 - 2004')
    expect(getByTestId('year-1993')).toHaveFocus()
  })
})
