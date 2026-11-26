import type { DateValue } from '@internationalized/date'
import type { Component } from 'vue'
import type { MonthPickerRootProps } from './MonthPickerRoot.vue'
import { CalendarDate, CalendarDateTime, HebrewCalendar, toZoned } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h } from 'vue'
import { useTestKbd } from '@/shared'
import { MonthPickerHeader, MonthPickerHeading, MonthPickerNext, MonthPickerPrev, MonthPickerRoot } from '..'
import MonthPicker from './story/_MonthPicker.vue'

const calendarDate = new CalendarDate(1980, 1, 20)
const calendarDateTime = new CalendarDateTime(1980, 1, 20, 12, 30, 0, 0)
const zonedDateTime = toZoned(calendarDateTime, 'America/New_York')

const kbd = useTestKbd()

function setup(props: { pickerProps?: MonthPickerRootProps, emits?: { 'onUpdate:modelValue'?: (data: DateValue | DateValue[] | undefined) => void } } = {}) {
  const user = userEvent.setup()
  const returned = render(MonthPicker, { props })
  const picker = returned.getByTestId('month-picker')
  expect(picker).toBeVisible()
  return { ...returned, user, picker }
}

function getSelectedMonth(picker: HTMLElement) {
  return picker.querySelector<HTMLElement>('[data-selected]') as HTMLElement
}

function getSelectedMonths(picker: HTMLElement) {
  return Array.from(picker.querySelectorAll<HTMLElement>('[data-selected]'))
}

it('should pass axe accessibility tests', async () => {
  const { picker } = setup()
  expect(await axe(picker)).toHaveNoViolations()
})

describe('month picker', async () => {
  it('focuses and selects the thirteenth month of a Hebrew leap year', async () => {
    const date = new CalendarDate(new HebrewCalendar(), 5784, 12, 1)
    const { getByTestId, user } = setup({ pickerProps: { defaultPlaceholder: date, locale: 'en-US-u-ca-hebrew' } })

    const lastMonth = getByTestId('month-13')
    getByTestId('month-12').focus()
    await user.keyboard(kbd.ARROW_RIGHT)
    expect(lastMonth).toHaveFocus()
    await user.keyboard(kbd.ENTER)
    expect(lastMonth).toHaveAttribute('data-selected')
  })

  it.each([
    { navigation: 'default', prevPage: undefined },
    { navigation: 'custom', prevPage: (date: DateValue) => date.subtract({ years: 1 }) },
  ])('can return to a year whose last month contains minValue with $navigation navigation', async ({ prevPage }) => {
    const calendar = new HebrewCalendar()
    const { getByTestId, queryByTestId, user } = setup({
      pickerProps: {
        defaultPlaceholder: new CalendarDate(calendar, 5785, 1, 1),
        minValue: new CalendarDate(calendar, 5784, 13, 15),
        prevPage,
      },
    })

    expect(queryByTestId('month-13')).toBeNull()
    const prev = getByTestId('prev-button')
    expect(prev).not.toHaveAttribute('data-disabled')
    await user.click(prev)
    expect(getByTestId('month-13')).not.toHaveAttribute('data-disabled')
    expect(prev).toHaveAttribute('data-disabled')
  })

  it('does not forward month prop as a DOM attribute', async () => {
    const { getByTestId } = setup({ pickerProps: { placeholder: calendarDate } })
    const janMonth = getByTestId('month-1')
    expect(janMonth.getAttribute('month')).toBe(null)
  })

  it('does not navigate when prev is disabled and rendered as div', async () => {
    const user = userEvent.setup()

    const Test = {
      components: {
        MonthPickerRoot,
        MonthPickerHeader,
        MonthPickerPrev,
        MonthPickerHeading,
        MonthPickerNext,
      },
      setup() {
        const placeholder = new CalendarDate(1980, 1, 1)
        const minValue = new CalendarDate(1980, 1, 1)
        return { placeholder, minValue }
      },
      template: `
        <MonthPickerRoot
          :placeholder="placeholder"
          :min-value="minValue"
        >
          <MonthPickerHeader>
            <MonthPickerPrev as="div" data-testid="prev-button" />
            <MonthPickerHeading data-testid="heading" />
            <MonthPickerNext as="div" data-testid="next-button" />
          </MonthPickerHeader>
        </MonthPickerRoot>
      `,
    }

    const { getByTestId } = render(Test)
    expect(getByTestId('heading')).toHaveTextContent('1980')
    await user.click(getByTestId('prev-button'))
    expect(getByTestId('heading')).toHaveTextContent('1980')
  })

  it('respects a default value if provided - `CalendarDate`', async () => {
    const { getByTestId, picker } = setup({ pickerProps: { modelValue: calendarDate } })
    expect(getSelectedMonth(picker)).toHaveTextContent('Jan')
    expect(getByTestId('heading')).toHaveTextContent('1980')
  })

  it('respects a default value if provided - `CalendarDateTime`', async () => {
    const { picker, getByTestId } = setup({ pickerProps: { modelValue: calendarDateTime } })
    expect(getSelectedMonth(picker)).toHaveTextContent('Jan')
    expect(getByTestId('heading')).toHaveTextContent('1980')
  })

  it('respects a default value if provided - `ZonedDateTime`', async () => {
    const { picker, getByTestId } = setup({ pickerProps: { modelValue: zonedDateTime } })
    expect(getSelectedMonth(picker)).toHaveTextContent('Jan')
    expect(getByTestId('heading')).toHaveTextContent('1980')
  })

  it('does not crash when modelValue is null', async () => {
    const { picker, rerender } = setup({ pickerProps: { modelValue: null } })

    expect(getSelectedMonths(picker)).toHaveLength(0)

    await rerender({
      pickerProps: {
        modelValue: calendarDate,
      },
    })

    expect(getSelectedMonth(picker)).toHaveTextContent('Jan')
  })

  it('navigates to next year using next button', async () => {
    const { getByTestId, user } = setup({ pickerProps: { modelValue: calendarDate } })

    const heading = getByTestId('heading')
    const nextBtn = getByTestId('next-button')

    expect(heading).toHaveTextContent('1980')
    await user.click(nextBtn)
    expect(heading).toHaveTextContent('1981')
    await user.click(nextBtn)
    expect(heading).toHaveTextContent('1982')
  })

  it('keeps the visible year when modelValue is a new object for the same month', async () => {
    const selected = new CalendarDate(1980, 1, 20)
    const { getByTestId, user, rerender } = setup({ pickerProps: { modelValue: selected } })
    const heading = getByTestId('heading')

    await user.click(getByTestId('next-button'))
    expect(heading).toHaveTextContent('1981')

    await rerender({ pickerProps: { modelValue: selected.copy() } })

    expect(heading).toHaveTextContent('1981')
  })

  it('moves the visible year when the selected month changes', async () => {
    const { getByTestId, user, rerender } = setup({ pickerProps: { modelValue: new CalendarDate(1980, 1, 20) } })

    await user.click(getByTestId('next-button'))
    expect(getByTestId('heading')).toHaveTextContent('1981')

    await rerender({ pickerProps: { modelValue: new CalendarDate(1975, 6, 1) } })

    expect(getByTestId('heading')).toHaveTextContent('1975')
  })

  it('navigates to prev year using prev button', async () => {
    const { getByTestId, user } = setup({ pickerProps: { modelValue: calendarDate } })

    const heading = getByTestId('heading')
    const prevBtn = getByTestId('prev-button')

    expect(heading).toHaveTextContent('1980')
    await user.click(prevBtn)
    expect(heading).toHaveTextContent('1979')
    await user.click(prevBtn)
    expect(heading).toHaveTextContent('1978')
  })

  it('allows months to be deselected by clicking the selected month', async () => {
    const { user, picker, rerender } = setup({
      pickerProps: { modelValue: calendarDate },
      emits: { 'onUpdate:modelValue': (data: DateValue) => rerender({ pickerProps: { modelValue: data } }) },
    })

    const selectedMonth = getSelectedMonth(picker)
    expect(selectedMonth).toHaveTextContent('Jan')
    await user.click(selectedMonth)
    expect(getSelectedMonth(picker)).toBe(null)
  })

  it.each([kbd.ENTER, kbd.SPACE])('allows deselection with %s key', async (key) => {
    const { user, picker, rerender } = setup({
      pickerProps: { modelValue: calendarDate },
      emits: { 'onUpdate:modelValue': (data: DateValue) => rerender({ pickerProps: { modelValue: data } }) },
    })

    const selectedMonth = getSelectedMonth(picker)
    expect(selectedMonth).toHaveTextContent('Jan')
    selectedMonth!.focus()
    await user.keyboard(key)
    expect(getSelectedMonth(picker)).toBe(null)
  })

  it('allows selection with mouse', async () => {
    const { getByTestId, user, picker } = setup({
      pickerProps: { placeholder: zonedDateTime },
    })

    const marchMonth = getByTestId('month-3')
    expect(marchMonth).toHaveTextContent('Mar')
    await user.click(marchMonth)

    const selectedMonth = getSelectedMonth(picker)
    expect(selectedMonth).toHaveTextContent('Mar')
  })

  it.each([kbd.ENTER, kbd.SPACE])('allows selection with %s key', async (key) => {
    const { getByTestId, user, picker } = setup({
      pickerProps: { placeholder: zonedDateTime },
    })

    const marchMonth = getByTestId('month-3')
    marchMonth.focus()
    await user.keyboard(key)

    const selectedMonth = getSelectedMonth(picker)
    expect(selectedMonth).toHaveTextContent('Mar')
  })

  it('should not allow navigation before the `minValue` (prev button)', async () => {
    const { getByTestId, user } = setup({
      pickerProps: {
        modelValue: calendarDate,
        minValue: new CalendarDate(1979, 6, 1),
      },
    })

    const prevBtn = getByTestId('prev-button')
    await user.click(prevBtn)
    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('1979')
    expect(prevBtn).toHaveAttribute('aria-disabled', 'true')
    expect(prevBtn).toHaveAttribute('data-disabled')

    await user.click(prevBtn)
    expect(heading).toHaveTextContent('1979')
  })

  it('should not allow navigation after the `maxValue` (next button)', async () => {
    const { getByTestId, user } = setup({
      pickerProps: {
        modelValue: calendarDate,
        maxValue: new CalendarDate(1981, 6, 30),
      },
    })

    const nextBtn = getByTestId('next-button')
    await user.click(nextBtn)
    const heading = getByTestId('heading')
    expect(heading).toHaveTextContent('1981')
    expect(nextBtn).toHaveAttribute('aria-disabled', 'true')
    expect(nextBtn).toHaveAttribute('data-disabled')

    await user.click(nextBtn)
    expect(heading).toHaveTextContent('1981')
  })

  it('handles unavailable months appropriately', async () => {
    const { getByTestId, user } = setup({
      pickerProps: {
        placeholder: calendarDate,
        isMonthUnavailable: (date: DateValue) => {
          return date.month === 3
        },
      },
    })

    const marchMonth = getByTestId('month-3')
    expect(marchMonth).toHaveTextContent('Mar')
    expect(marchMonth).toHaveAttribute('data-unavailable')
    expect(marchMonth).toHaveAttribute('aria-disabled', 'true')
    await user.click(marchMonth)
    expect(marchMonth).not.toHaveAttribute('data-selected')
  })

  it('handles disabled months appropriately', async () => {
    const { getByTestId, user } = setup({
      pickerProps: {
        placeholder: calendarDate,
        isMonthDisabled: (date: DateValue) => {
          return date.month === 3
        },
      },
    })

    const marchMonth = getByTestId('month-3')
    expect(marchMonth).toHaveTextContent('Mar')
    expect(marchMonth).toHaveAttribute('data-disabled')
    expect(marchMonth).toHaveAttribute('aria-disabled', 'true')
    await user.click(marchMonth)
    expect(marchMonth).not.toHaveAttribute('data-selected')
  })

  it('doesnt allow focus or interaction when `disabled` is `true`', async () => {
    const { getByTestId, user } = setup({
      pickerProps: {
        placeholder: calendarDate,
        disabled: true,
      },
    })

    const grid = getByTestId('grid')
    expect(grid).toHaveAttribute('aria-disabled', 'true')
    expect(grid).toHaveAttribute('data-disabled')

    const janMonth = getByTestId('month-1')
    expect(janMonth).toHaveAttribute('aria-disabled', 'true')
    expect(janMonth).toHaveAttribute('data-disabled')

    await user.click(janMonth)
    expect(janMonth).not.toHaveAttribute('data-selected')
    janMonth.focus()
    expect(janMonth).not.toHaveFocus()

    const prevButton = getByTestId('prev-button')
    const nextButton = getByTestId('next-button')
    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeDisabled()
  })

  it('prevents selection but allows focus when `readonly` is `true`', async () => {
    const { getByTestId, user } = setup({
      pickerProps: {
        placeholder: calendarDate,
        readonly: true,
      },
    })

    const grid = getByTestId('grid')
    expect(grid).toHaveAttribute('aria-readonly', 'true')
    expect(grid).toHaveAttribute('data-readonly')

    const janMonth = getByTestId('month-1')
    await user.click(janMonth)
    expect(janMonth).not.toHaveAttribute('data-selected')
    janMonth.focus()
    expect(janMonth).toHaveFocus()
  })
})

describe('month picker - keyboard navigation', () => {
  it('navigates with arrow keys within the grid', async () => {
    const { getByTestId, user } = setup({
      pickerProps: { placeholder: calendarDate },
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
      pickerProps: { placeholder: calendarDate },
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

  it('wraps around months when navigating past boundaries', async () => {
    const { getByTestId, user } = setup({
      pickerProps: { placeholder: calendarDate },
    })

    const decMonth = getByTestId('month-12')
    decMonth.focus()
    expect(decMonth).toHaveFocus()

    await user.keyboard(kbd.ARROW_RIGHT)
    expect(getByTestId('heading')).toHaveTextContent('1981')
    expect(getByTestId('month-1')).toHaveFocus()
  })
})

describe('month picker - multiple', () => {
  it('handles multiple selection', async () => {
    const d1 = new CalendarDate(1980, 1, 1)
    const d2 = new CalendarDate(1980, 3, 1)

    const { picker, getByTestId, user, rerender } = setup({
      pickerProps: { modelValue: [d1, d2], multiple: true },
      emits: { 'onUpdate:modelValue': (data: DateValue) => rerender({ pickerProps: { modelValue: data as any, multiple: true } }) },
    } as any)

    const selectedMonths = getSelectedMonths(picker)
    expect(selectedMonths.length).toBe(2)

    const mayMonth = getByTestId('month-5')
    await user.click(mayMonth)

    expect(getSelectedMonths(picker).length).toBe(3)
  })

  it('allows deselection in multiple mode', async () => {
    const d1 = new CalendarDate(1980, 1, 1)
    const d2 = new CalendarDate(1980, 3, 1)

    const { picker, user, rerender } = setup({
      pickerProps: { modelValue: [d1, d2], multiple: true },
      emits: { 'onUpdate:modelValue': (data: DateValue) => rerender({ pickerProps: { modelValue: data as any, multiple: true } }) },
    } as any)

    const selectedMonths = getSelectedMonths(picker)
    expect(selectedMonths.length).toBe(2)

    await user.click(selectedMonths[0])
    expect(getSelectedMonths(picker).length).toBe(1)
  })

  it('normalizes single modelValue when multiple is true', async () => {
    const d1 = new CalendarDate(1980, 1, 1)

    const { picker, getByTestId, user, rerender } = setup({
      pickerProps: { modelValue: d1, multiple: true },
      emits: { 'onUpdate:modelValue': data => rerender({ pickerProps: { modelValue: data as any, multiple: true } }) },
    })

    expect(getSelectedMonths(picker)).toHaveLength(1)
    expect(getByTestId('month-1')).toHaveAttribute('data-selected')

    await user.click(getByTestId('month-5'))

    expect(getSelectedMonths(picker)).toHaveLength(2)
    expect(getByTestId('month-1')).toHaveAttribute('data-selected')
    expect(getByTestId('month-5')).toHaveAttribute('data-selected')
  })
})

const ButtonCell = defineComponent({
  setup(_, { slots }) {
    return () => h('button', { type: 'button' }, slots.default?.())
  },
})

describe('month picker - tabindex states', () => {
  function renderPicker(triggerAs?: string | Component) {
    return render(MonthPicker, {
      props: {
        pickerProps: {
          modelValue: new CalendarDate(2000, 1, 1),
          isMonthDisabled: (date: DateValue) => date.month === 3,
        },
        triggerAs,
      },
    })
  }

  it('omits tabindex on disabled months rendered as the default div', () => {
    const { getByTestId } = renderPicker()
    expect(getByTestId('month-1')).toHaveAttribute('tabindex', '0')
    expect(getByTestId('month-2')).toHaveAttribute('tabindex', '-1')
    expect(getByTestId('month-3')).not.toHaveAttribute('tabindex')
  })

  it.each([
    ['a button', 'button'],
    ['a component that renders a button', ButtonCell],
  ])('sets tabindex -1 on disabled months rendered as %s', (_, triggerAs) => {
    const { getByTestId } = renderPicker(triggerAs)
    expect(getByTestId('month-1')).toHaveAttribute('tabindex', '0')
    expect(getByTestId('month-3').tagName).toBe('BUTTON')
    expect(getByTestId('month-3')).toHaveAttribute('tabindex', '-1')
  })
})

describe('month picker - Home, End and the numeric keypad', () => {
  const placeholder = new CalendarDate(1980, 1, 20)

  it('moves to the first and last month of the row with Home and End', async () => {
    const { getByTestId, user } = setup({ pickerProps: { placeholder } })
    getByTestId('month-7').focus()

    await user.keyboard(kbd.END)
    expect(getByTestId('month-8')).toHaveFocus()

    await user.keyboard(kbd.HOME)
    expect(getByTestId('month-5')).toHaveFocus()

    // Already at the start of the row: stays put.
    await user.keyboard(kbd.HOME)
    expect(getByTestId('month-5')).toHaveFocus()
  })

  it('skips a disabled month at the row boundary', async () => {
    const { getByTestId, user } = setup({
      pickerProps: { placeholder, isMonthDisabled: date => date.month === 5 },
    })
    getByTestId('month-7').focus()

    await user.keyboard(kbd.HOME)
    expect(getByTestId('month-6')).toHaveFocus()
  })

  it('selects with the numeric keypad Enter', async () => {
    const { getByTestId, picker } = setup({ pickerProps: { placeholder } })
    const cell = getByTestId('month-7')
    cell.focus()

    await fireEvent.keyDown(cell, { key: 'Enter', code: 'NumpadEnter' })

    expect(picker.querySelector('[data-selected]')).toBe(cell)
  })

  it('moves focus with the numeric keypad arrows', async () => {
    const { getByTestId } = setup({ pickerProps: { placeholder } })
    const cell = getByTestId('month-7')
    cell.focus()

    await fireEvent.keyDown(cell, { key: 'ArrowRight', code: 'Numpad6' })

    expect(getByTestId('month-8')).toHaveFocus()
  })
})
