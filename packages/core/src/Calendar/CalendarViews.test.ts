import type { CalendarRootProps } from './CalendarRoot.vue'
import type { CalendarUnit, DateValue } from '@/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import CalendarUnitHarness from './story/_CalendarUnit.vue'
import CalendarViews from './story/_CalendarViews.vue'

const kbd = useTestKbd()
const sep5 = new Temporal.PlainDate(2026, 9, 5)

type Listeners = Partial<Record<'onUpdate:modelValue' | 'onUpdate:placeholder' | 'onUpdate:view', (...args: any[]) => void>>

function setupViews(props: CalendarRootProps = {}, listeners: Listeners = {}) {
  const user = userEvent.setup()
  const returned = render(CalendarViews, { props: { ...props, ...listeners } })
  const calendar = returned.getByTestId('calendar')
  return { ...returned, user, calendar }
}

function setupUnit(props: CalendarRootProps = {}, listeners: Listeners = {}) {
  const user = userEvent.setup()
  const returned = render(CalendarUnitHarness, { props: { ...props, ...listeners } })
  const calendar = returned.getByTestId('calendar')
  return { ...returned, user, calendar }
}

const selected = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>('[data-selected]'))

describe('calendar — granularity="month" (replaces MonthPicker)', () => {
  it('passes axe', async () => {
    const { calendar } = setupUnit({ granularity: 'month', defaultPlaceholder: sep5 })
    expect(await axe(calendar)).toHaveNoViolations()
  })

  it('renders twelve month cells in four columns with a year heading', () => {
    const { calendar, getByTestId } = setupUnit({ granularity: 'month', defaultPlaceholder: sep5 })
    expect(getByTestId('heading')).toHaveTextContent('2026')
    expect(calendar.querySelectorAll('[data-reka-calendar-cell-trigger]')).toHaveLength(12)
    expect(calendar.querySelectorAll('[data-row]')).toHaveLength(3)
    expect(getByTestId('cell-2026-09-01')).toHaveTextContent('Sep')
    expect(getByTestId('cell-2026-09-01')).toHaveAttribute('aria-label', 'September 2026')
    expect(calendar).toHaveAttribute('data-view', 'month')
    expect(getByTestId('grid')).toHaveAttribute('aria-labelledby')
  })

  it('honours columns', () => {
    const { calendar } = setupUnit({ granularity: 'month', defaultPlaceholder: sep5, columns: 3 })
    expect(calendar.querySelectorAll('[data-row]')).toHaveLength(4)
  })

  it('selects a month and keeps the placeholder day', async () => {
    const onUpdate = vi.fn()
    const { user, getByTestId } = setupUnit({ granularity: 'month', defaultPlaceholder: sep5 }, { 'onUpdate:modelValue': onUpdate })
    await user.click(getByTestId('cell-2026-03-01'))
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const [value, details] = onUpdate.mock.calls[0]
    expect((value as DateValue).toString()).toBe('2026-03-05')
    expect(details.reason).toBe('cell-press')
    expect(getByTestId('cell-2026-03-01')).toHaveAttribute('data-selected')
  })

  it('deselects on a second click unless preventDeselect', async () => {
    const { user, getByTestId, calendar, rerender } = setupUnit(
      { granularity: 'month', modelValue: sep5 },
      { 'onUpdate:modelValue': (v: DateValue | undefined) => rerender({ modelValue: v }) },
    )
    expect(selected(calendar)).toHaveLength(1)
    await user.click(getByTestId('cell-2026-09-01'))
    expect(selected(calendar)).toHaveLength(0)
  })

  it('keeps the selection on a second click with preventDeselect', async () => {
    const onUpdate = vi.fn()
    const { user, getByTestId, calendar } = setupUnit({ granularity: 'month', modelValue: sep5, preventDeselect: true }, { 'onUpdate:modelValue': onUpdate })
    await user.click(getByTestId('cell-2026-09-01'))
    // Re-committing the same month is allowed (v2 parity), clearing it is not.
    for (const [value] of onUpdate.mock.calls)
      expect((value as DateValue).toString()).toBe('2026-09-05')
    expect(selected(calendar)).toHaveLength(1)
  })

  it('pages by a year and disables Next past maxValue', async () => {
    const { user, getByTestId } = setupUnit({ granularity: 'month', defaultPlaceholder: sep5, maxValue: new Temporal.PlainDate(2027, 2, 1) })
    await user.click(getByTestId('next-button'))
    expect(getByTestId('heading')).toHaveTextContent('2027')
    expect(getByTestId('next-button')).toHaveAttribute('data-disabled')
    expect(getByTestId('cell-2027-03-01')).toHaveAttribute('data-disabled')
    expect(getByTestId('cell-2027-02-01')).not.toHaveAttribute('data-disabled')
  })

  it('moves focus by one month left/right and four up/down, flipping the year at the edges (#2781)', async () => {
    const { user, getByTestId } = setupUnit({ granularity: 'month', defaultPlaceholder: sep5 })
    const sep = getByTestId('cell-2026-09-01')
    sep.focus()
    expect(sep).toHaveFocus()

    await user.keyboard(kbd.ARROW_RIGHT)
    expect(getByTestId('cell-2026-10-01')).toHaveFocus()
    await user.keyboard(kbd.ARROW_DOWN)
    expect(getByTestId('cell-2027-02-01')).toHaveFocus()
    expect(getByTestId('heading')).toHaveTextContent('2027')
    await user.keyboard(kbd.ARROW_UP)
    expect(getByTestId('cell-2026-10-01')).toHaveFocus()
    await user.keyboard(kbd.ARROW_LEFT)
    expect(getByTestId('cell-2026-09-01')).toHaveFocus()
  })

  it('moves to the same month next year on PageDown', async () => {
    const { user, getByTestId } = setupUnit({ granularity: 'month', defaultPlaceholder: sep5 })
    getByTestId('cell-2026-09-01').focus()
    await user.keyboard(kbd.PAGE_DOWN)
    expect(getByTestId('cell-2027-09-01')).toHaveFocus()
    await user.keyboard(kbd.PAGE_UP)
    expect(getByTestId('cell-2026-09-01')).toHaveFocus()
  })

  it('keeps focus in the calendar when PageDown lands on a disabled month', async () => {
    const { user, getByTestId, calendar } = setupUnit({
      granularity: 'month',
      defaultPlaceholder: sep5,
      isDateDisabled: (date, unit) => unit === 'month' && date.year === 2027 && date.month === 9,
    })
    getByTestId('cell-2026-09-01').focus()
    await user.keyboard(kbd.PAGE_DOWN)
    expect(getByTestId('heading')).toHaveTextContent('2027')
    expect(getByTestId('cell-2027-09-01')).toHaveAttribute('data-disabled')
    expect(document.activeElement).toHaveAttribute('data-reka-calendar-cell-trigger')
    expect(calendar).toContainElement(document.activeElement as HTMLElement)
  })

  it('keeps the visible year when modelValue is a new object for the same month (#2961)', async () => {
    const value = new Temporal.PlainDate(1980, 1, 20)
    const { user, getByTestId, rerender } = setupUnit({ granularity: 'month', modelValue: value })
    await user.click(getByTestId('next-button'))
    expect(getByTestId('heading')).toHaveTextContent('1981')

    await rerender({ modelValue: value })
    expect(getByTestId('heading')).toHaveTextContent('1981')
    // Another day of the same month is still the same selection at this granularity.
    await rerender({ modelValue: new Temporal.PlainDate(1980, 1, 3) })
    expect(getByTestId('heading')).toHaveTextContent('1981')
  })

  it('moves the visible year when the selected month changes', async () => {
    const { user, getByTestId, rerender } = setupUnit({ granularity: 'month', modelValue: new Temporal.PlainDate(1980, 1, 20) })
    await user.click(getByTestId('next-button'))
    expect(getByTestId('heading')).toHaveTextContent('1981')

    await rerender({ modelValue: new Temporal.PlainDate(1975, 6, 1) })
    expect(getByTestId('heading')).toHaveTextContent('1975')
  })

  it('moves to the first and last month of the page on Home and End', async () => {
    const onPlaceholder = vi.fn()
    const { user, getByTestId } = setupUnit({ granularity: 'month', defaultPlaceholder: sep5 }, { 'onUpdate:placeholder': onPlaceholder })
    getByTestId('cell-2026-09-01').focus()
    await user.keyboard(kbd.HOME)
    expect(getByTestId('cell-2026-01-01')).toHaveFocus()
    // Like the arrow keys, the placeholder keeps its day.
    expect((onPlaceholder.mock.calls.at(-1)![0] as DateValue).toString()).toBe('2026-01-05')
    await user.keyboard(kbd.END)
    expect(getByTestId('cell-2026-12-01')).toHaveFocus()
    expect(getByTestId('heading')).toHaveTextContent('2026')
  })

  it('skips disabled and out-of-range months on Home and End without leaving the page', async () => {
    const { user, getByTestId } = setupUnit({
      granularity: 'month',
      defaultPlaceholder: sep5,
      minValue: new Temporal.PlainDate(2026, 2, 10),
      maxValue: new Temporal.PlainDate(2026, 11, 20),
      isDateDisabled: (date, unit) => unit === 'month' && date.month === 2,
    })
    getByTestId('cell-2026-09-01').focus()
    await user.keyboard(kbd.HOME)
    expect(getByTestId('cell-2026-03-01')).toHaveFocus()
    await user.keyboard(kbd.END)
    expect(getByTestId('cell-2026-11-01')).toHaveFocus()
    // Already on the last focusable month: End keeps focus where it is.
    await user.keyboard(kbd.END)
    expect(getByTestId('cell-2026-11-01')).toHaveFocus()
    expect(getByTestId('heading')).toHaveTextContent('2026')
  })

  it('handles Home and End in the cell and does not let them bubble', async () => {
    const onKeydown = vi.fn()
    const { user, getByTestId, calendar } = setupUnit({ granularity: 'month', defaultPlaceholder: sep5 })
    calendar.addEventListener('keydown', onKeydown)
    getByTestId('cell-2026-09-01').focus()
    await user.keyboard(kbd.HOME)
    await user.keyboard(kbd.END)
    expect(onKeydown).not.toHaveBeenCalled()
  })

  it('passes the unit to matchers', () => {
    const units = new Set<CalendarUnit | undefined>()
    setupUnit({ granularity: 'month', defaultPlaceholder: sep5, isDateDisabled: (_d, unit) => {
      units.add(unit)
      return false
    } })
    expect([...units]).toEqual(['month'])
  })
})

describe('calendar — granularity="year" (replaces YearPicker)', () => {
  it('renders a decade-aligned page of twelve years', () => {
    const { calendar, getByTestId } = setupUnit({ granularity: 'year', defaultPlaceholder: sep5 })
    expect(getByTestId('heading')).toHaveTextContent('2020 - 2031')
    expect(calendar.querySelectorAll('[data-reka-calendar-cell-trigger]')).toHaveLength(12)
    expect(getByTestId('cell-2020-01-01')).toHaveTextContent('2020')
  })

  it('selects a year and keeps the placeholder month and day', async () => {
    const onUpdate = vi.fn()
    const { user, getByTestId } = setupUnit({ granularity: 'year', defaultPlaceholder: sep5 }, { 'onUpdate:modelValue': onUpdate })
    await user.click(getByTestId('cell-2030-01-01'))
    expect((onUpdate.mock.calls[0][0] as DateValue).toString()).toBe('2030-09-05')
  })

  it('keeps the visible page when modelValue is a new object for the same year (#2961)', async () => {
    const value = new Temporal.PlainDate(1980, 1, 20)
    const { user, getByTestId, rerender } = setupUnit({ granularity: 'year', modelValue: value })
    expect(getByTestId('heading')).toHaveTextContent('1980 - 1991')
    await user.click(getByTestId('next-button'))
    expect(getByTestId('heading')).toHaveTextContent('1992 - 2003')

    await rerender({ modelValue: value })
    expect(getByTestId('heading')).toHaveTextContent('1992 - 2003')
  })

  it('moves the visible page when the selected year changes', async () => {
    const { user, getByTestId, rerender } = setupUnit({ granularity: 'year', modelValue: new Temporal.PlainDate(1980, 1, 20) })
    await user.click(getByTestId('next-button'))
    expect(getByTestId('heading')).toHaveTextContent('1992 - 2003')

    await rerender({ modelValue: new Temporal.PlainDate(1975, 6, 1) })
    expect(getByTestId('heading')).toHaveTextContent('1970 - 1981')
  })

  it('moves to the first and last year of the page on Home and End', async () => {
    const { user, getByTestId } = setupUnit({ granularity: 'year', defaultPlaceholder: sep5 })
    getByTestId('cell-2026-01-01').focus()
    await user.keyboard(kbd.HOME)
    expect(getByTestId('cell-2020-01-01')).toHaveFocus()
    await user.keyboard(kbd.END)
    expect(getByTestId('cell-2031-01-01')).toHaveFocus()
    expect(getByTestId('heading')).toHaveTextContent('2020 - 2031')
  })

  it('skips disabled and out-of-range years on Home and End', async () => {
    const { user, getByTestId } = setupUnit({
      granularity: 'year',
      defaultPlaceholder: sep5,
      minValue: new Temporal.PlainDate(2021, 6, 1),
      maxValue: new Temporal.PlainDate(2029, 6, 1),
      isDateDisabled: (date, unit) => unit === 'year' && date.year === 2021,
    })
    getByTestId('cell-2026-01-01').focus()
    await user.keyboard(kbd.HOME)
    expect(getByTestId('cell-2022-01-01')).toHaveFocus()
    await user.keyboard(kbd.END)
    expect(getByTestId('cell-2029-01-01')).toHaveFocus()
    expect(getByTestId('heading')).toHaveTextContent('2020 - 2031')
  })

  it('pages by yearsPerPage', async () => {
    const { user, getByTestId } = setupUnit({ granularity: 'year', defaultPlaceholder: sep5, yearsPerPage: 20 })
    expect(getByTestId('heading')).toHaveTextContent('2020 - 2039')
    await user.click(getByTestId('next-button'))
    expect(getByTestId('heading')).toHaveTextContent('2040 - 2059')
  })
})

describe('calendar — views and drill-down', () => {
  it('passes axe', async () => {
    const { calendar } = setupViews({ defaultPlaceholder: sep5 })
    expect(await axe(calendar)).toHaveNoViolations()
  })

  it('starts on the granularity view and only renders that view', () => {
    const { getByTestId, queryByTestId } = setupViews({ defaultPlaceholder: sep5 })
    expect(getByTestId('view-day')).toBeInTheDocument()
    expect(queryByTestId('view-month')).toBeNull()
    expect(queryByTestId('view-year')).toBeNull()
    expect(getByTestId('view-trigger')).toHaveTextContent('September 2026')
    // The visible heading names the trigger (label in name).
    expect(getByTestId('view-trigger')).not.toHaveAttribute('aria-label')
  })

  it('drills up with the heading trigger and down by selecting, without touching the model', async () => {
    const onModel = vi.fn()
    const onView = vi.fn()
    const { user, getByTestId, queryByTestId } = setupViews({ defaultPlaceholder: sep5 }, { 'onUpdate:modelValue': onModel, 'onUpdate:view': onView })

    await user.click(getByTestId('view-trigger'))
    expect(getByTestId('view-month')).toBeInTheDocument()
    expect(queryByTestId('view-day')).toBeNull()
    expect(getByTestId('view-trigger')).toHaveTextContent('2026')
    expect(onView).toHaveBeenLastCalledWith('month', expect.objectContaining({ reason: 'view-trigger' }))

    await user.click(getByTestId('view-trigger'))
    expect(getByTestId('view-year')).toBeInTheDocument()
    expect(getByTestId('view-trigger')).toHaveTextContent('2020 - 2031')
    expect(getByTestId('view-trigger')).toHaveAttribute('disabled')

    await user.click(getByTestId('year-2028-01-01'))
    expect(getByTestId('view-month')).toBeInTheDocument()
    expect(getByTestId('view-trigger')).toHaveTextContent('2028')
    expect(onView).toHaveBeenLastCalledWith('month', expect.objectContaining({ reason: 'view-drill' }))

    await user.click(getByTestId('month-2028-02-01'))
    expect(getByTestId('view-day')).toBeInTheDocument()
    expect(getByTestId('view-trigger')).toHaveTextContent('February 2028')
    expect(onModel).not.toHaveBeenCalled()

    await user.click(getByTestId('day-2028-02-14'))
    expect(onModel).toHaveBeenCalledTimes(1)
    expect((onModel.mock.calls[0][0] as DateValue).toString()).toBe('2028-02-14')
    expect(getByTestId('day-2028-02-14')).toHaveAttribute('data-selected')
  })

  it('keeps focus in the calendar when a cell drills down from the keyboard', async () => {
    const { user, getByTestId } = setupViews({ defaultPlaceholder: sep5, defaultView: 'year' })
    getByTestId('year-2028-01-01').focus()

    await user.keyboard(kbd.ENTER)
    expect(getByTestId('month-2028-09-01')).toHaveFocus()

    await user.keyboard(kbd.ARROW_LEFT)
    await user.keyboard(kbd.ENTER)
    expect(getByTestId('view-day')).toBeInTheDocument()
    // Arrow keys keep the placeholder's day, so the drill lands on the 5th as a click would.
    expect(getByTestId('day-2028-08-05')).toHaveFocus()
  })

  it('leaves focus on the view trigger when it drills up', async () => {
    const { user, getByTestId } = setupViews({ defaultPlaceholder: sep5 })
    getByTestId('view-trigger').focus()
    await user.keyboard(kbd.ENTER)
    expect(getByTestId('view-month')).toBeInTheDocument()
    expect(getByTestId('view-trigger')).toHaveFocus()
  })

  it('respects maxView', async () => {
    const { user, getByTestId, queryByTestId } = setupViews({ defaultPlaceholder: sep5, maxView: 'month' })
    await user.click(getByTestId('view-trigger'))
    expect(getByTestId('view-month')).toBeInTheDocument()
    expect(getByTestId('view-trigger')).toHaveAttribute('disabled')
    await user.click(getByTestId('view-trigger'))
    expect(queryByTestId('view-year')).toBeNull()
  })

  it('never shows a view finer than the granularity', () => {
    const { getByTestId, queryByTestId } = setupViews({ defaultPlaceholder: sep5, granularity: 'month', view: 'day' })
    expect(getByTestId('view-month')).toBeInTheDocument()
    expect(queryByTestId('view-day')).toBeNull()
  })

  it('is controllable through v-model:view', async () => {
    const { getByTestId, rerender } = setupViews({ defaultPlaceholder: sep5, view: 'year' })
    expect(getByTestId('view-year')).toBeInTheDocument()
    await rerender({ defaultPlaceholder: sep5, view: 'day' })
    expect(getByTestId('view-day')).toBeInTheDocument()
  })

  it('pages the active view: months in the day view, years in the month view', async () => {
    const { user, getByTestId } = setupViews({ defaultPlaceholder: sep5 })
    await user.click(getByTestId('next-button'))
    expect(getByTestId('view-trigger')).toHaveTextContent('October 2026')
    await user.click(getByTestId('view-trigger'))
    await user.click(getByTestId('next-button'))
    expect(getByTestId('view-trigger')).toHaveTextContent('2027')
  })

  it('emits beforeUpdate:modelValue and honours cancel()', async () => {
    const onModel = vi.fn()
    const cancel = vi.fn((_value: unknown, details: { cancel: () => void }) => details.cancel())
    const user = userEvent.setup()
    const { getByTestId } = render(CalendarViews, {
      props: { 'defaultPlaceholder': sep5, 'onBeforeUpdate:modelValue': cancel, 'onUpdate:modelValue': onModel } as any,
    })
    await user.click(getByTestId('day-2026-09-10'))
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(onModel).not.toHaveBeenCalled()
    expect(getByTestId('day-2026-09-10')).not.toHaveAttribute('data-selected')
  })
})

describe('calendar — coarser views are navigation only', () => {
  const weekend = (d: DateValue) => d.dayOfWeek >= 6

  it('applies day matchers only in the day view: a weekend matcher leaves every month reachable', async () => {
    const units = new Set<CalendarUnit | undefined>()
    const { user, getByTestId, calendar } = setupViews({
      defaultPlaceholder: sep5,
      defaultView: 'month',
      isDateDisabled: (d, unit) => {
        units.add(unit)
        return weekend(d)
      },
      isDateUnavailable: weekend,
    })
    expect(calendar.querySelectorAll('[data-view="month"] [data-disabled], [data-view="month"] [data-unavailable]')).toHaveLength(0)
    expect(units.has('month')).toBe(false)
    // 1 February 2026 is a Sunday.
    await user.click(getByTestId('month-2026-02-01'))
    expect(getByTestId('view-day')).toBeInTheDocument()
    expect(getByTestId('day-2026-02-01')).toHaveAttribute('data-disabled')
    expect(getByTestId('day-2026-02-05')).not.toHaveAttribute('data-disabled')
  })

  it('still applies minValue / maxValue in the coarser views', () => {
    const { getByTestId } = setupViews({ defaultPlaceholder: sep5, defaultView: 'month', minValue: new Temporal.PlainDate(2026, 3, 15) })
    expect(getByTestId('month-2026-02-01')).toHaveAttribute('data-disabled')
    expect(getByTestId('month-2026-03-01')).not.toHaveAttribute('data-disabled')
  })

  it('moves to the page edges on Home and End in the coarser views, within minValue / maxValue', async () => {
    const { user, getByTestId, unmount } = setupViews({ defaultPlaceholder: sep5, defaultView: 'month', minValue: new Temporal.PlainDate(2026, 3, 15) })
    getByTestId('month-2026-09-01').focus()
    await user.keyboard(kbd.HOME)
    expect(getByTestId('month-2026-03-01')).toHaveFocus()
    await user.keyboard(kbd.END)
    expect(getByTestId('month-2026-12-01')).toHaveFocus()
    unmount()

    const views = setupViews({ defaultPlaceholder: sep5, defaultView: 'year', maxValue: new Temporal.PlainDate(2030, 1, 1) })
    views.getByTestId('year-2026-01-01').focus()
    await views.user.keyboard(kbd.END)
    expect(views.getByTestId('year-2030-01-01')).toHaveFocus()
    await views.user.keyboard(kbd.HOME)
    expect(views.getByTestId('year-2020-01-01')).toHaveFocus()
  })

  it('marks no selection in views coarser than the granularity', () => {
    for (const day of [1, 15]) {
      const { calendar, getByTestId, unmount } = setupViews({ modelValue: new Temporal.PlainDate(2026, 9, day), defaultView: 'month' })
      expect(getByTestId('month-2026-09-01')).not.toHaveAttribute('data-selected')
      expect(calendar.querySelectorAll('[aria-selected]')).toHaveLength(0)
      unmount()
    }
    const { calendar, unmount } = setupViews({ modelValue: new Temporal.PlainDate(2026, 1, 1), defaultView: 'year' })
    expect(selected(calendar)).toHaveLength(0)
    unmount()
  })

  it('uses the root nextPage / prevPage only in the granularity view', async () => {
    const nextPage = vi.fn((d: DateValue) => d.add({ months: 1 }))
    const { user, getByTestId } = setupViews({ defaultPlaceholder: sep5, defaultView: 'month', nextPage })
    await user.click(getByTestId('next-button'))
    expect(getByTestId('view-trigger')).toHaveTextContent('2027')
    expect(nextPage).not.toHaveBeenCalled()
    await user.click(getByTestId('month-2027-09-01'))
    await user.click(getByTestId('next-button'))
    expect(nextPage).toHaveBeenCalledWith(expect.anything(), 'day')
    expect(getByTestId('view-trigger')).toHaveTextContent('October 2027')
  })

  it('does not drill down when beforeUpdate:placeholder is cancelled', async () => {
    const cancel = vi.fn((_value: unknown, details: { cancel: () => void }) => details.cancel())
    const user = userEvent.setup()
    const { getByTestId, queryByTestId } = render(CalendarViews, {
      props: { 'defaultPlaceholder': sep5, 'defaultView': 'month', 'onBeforeUpdate:placeholder': cancel } as any,
    })
    await user.click(getByTestId('month-2026-03-01'))
    expect(cancel).toHaveBeenCalled()
    expect(getByTestId('view-month')).toBeInTheDocument()
    expect(queryByTestId('view-day')).toBeNull()
  })

  it('keeps the placeholder day when the keyboard moves between months', async () => {
    const onPlaceholder = vi.fn()
    const { user, getByTestId } = setupViews({ defaultPlaceholder: new Temporal.PlainDate(2026, 9, 15), defaultView: 'month' }, { 'onUpdate:placeholder': onPlaceholder })
    getByTestId('month-2026-09-01').focus()
    await user.keyboard(kbd.ARROW_RIGHT)
    expect(onPlaceholder.mock.calls.at(-1)![0].toString()).toBe('2026-10-15')
    await user.keyboard(kbd.ENTER)
    expect(getByTestId('day-2026-10-15')).toHaveFocus()
  })
})
