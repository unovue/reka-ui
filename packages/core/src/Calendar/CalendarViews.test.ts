import type { DateValue } from '@internationalized/date'
import type { CalendarUnit } from '@/date'
import type { CalendarRootProps } from './CalendarRoot.vue'
import { CalendarDate } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import CalendarUnitHarness from './story/_CalendarUnit.vue'
import CalendarViews from './story/_CalendarViews.vue'

const kbd = useTestKbd()
const sep5 = new CalendarDate(2026, 9, 5)

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
    const { calendar } = setupUnit({ granularity: 'month', placeholder: sep5 })
    expect(await axe(calendar)).toHaveNoViolations()
  })

  it('renders twelve month cells in four columns with a year heading', () => {
    const { calendar, getByTestId } = setupUnit({ granularity: 'month', placeholder: sep5 })
    expect(getByTestId('heading')).toHaveTextContent('2026')
    expect(calendar.querySelectorAll('[data-reka-calendar-cell-trigger]')).toHaveLength(12)
    expect(calendar.querySelectorAll('[data-row]')).toHaveLength(3)
    expect(getByTestId('cell-2026-09-01')).toHaveTextContent('Sep')
    expect(getByTestId('cell-2026-09-01')).toHaveAttribute('aria-label', 'September 2026')
    expect(calendar).toHaveAttribute('data-view', 'month')
    expect(getByTestId('grid')).toHaveAttribute('aria-labelledby')
  })

  it('honours columns', () => {
    const { calendar } = setupUnit({ granularity: 'month', placeholder: sep5, columns: 3 })
    expect(calendar.querySelectorAll('[data-row]')).toHaveLength(4)
  })

  it('selects a month and keeps the placeholder day', async () => {
    const onUpdate = vi.fn()
    const { user, getByTestId } = setupUnit({ granularity: 'month', placeholder: sep5 }, { 'onUpdate:modelValue': onUpdate })
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

  it('pages by a year and disables Next past maxValue', async () => {
    const { user, getByTestId } = setupUnit({ granularity: 'month', placeholder: sep5, maxValue: new CalendarDate(2027, 2, 1) })
    await user.click(getByTestId('next-button'))
    expect(getByTestId('heading')).toHaveTextContent('2027')
    expect(getByTestId('next-button')).toHaveAttribute('data-disabled')
    expect(getByTestId('cell-2027-03-01')).toHaveAttribute('data-disabled')
    expect(getByTestId('cell-2027-02-01')).not.toHaveAttribute('data-disabled')
  })

  it('moves focus by one month left/right and four up/down, flipping the year at the edges (#2781)', async () => {
    const { user, getByTestId } = setupUnit({ granularity: 'month', placeholder: sep5 })
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

  it('PageDown moves to the same month next year', async () => {
    const { user, getByTestId } = setupUnit({ granularity: 'month', placeholder: sep5 })
    getByTestId('cell-2026-09-01').focus()
    await user.keyboard(kbd.PAGE_DOWN)
    expect(getByTestId('cell-2027-09-01')).toHaveFocus()
    await user.keyboard(kbd.PAGE_UP)
    expect(getByTestId('cell-2026-09-01')).toHaveFocus()
  })

  it('passes the unit to matchers', () => {
    const units = new Set<CalendarUnit | undefined>()
    setupUnit({ granularity: 'month', placeholder: sep5, isDateDisabled: (_d, unit) => {
      units.add(unit)
      return false
    } })
    expect([...units]).toEqual(['month'])
  })
})

describe('calendar — granularity="year" (replaces YearPicker)', () => {
  it('renders a decade-aligned page of twelve years', () => {
    const { calendar, getByTestId } = setupUnit({ granularity: 'year', placeholder: sep5 })
    expect(getByTestId('heading')).toHaveTextContent('2020 - 2031')
    expect(calendar.querySelectorAll('[data-reka-calendar-cell-trigger]')).toHaveLength(12)
    expect(getByTestId('cell-2020-01-01')).toHaveTextContent('2020')
  })

  it('selects a year and keeps the placeholder month and day', async () => {
    const onUpdate = vi.fn()
    const { user, getByTestId } = setupUnit({ granularity: 'year', placeholder: sep5 }, { 'onUpdate:modelValue': onUpdate })
    await user.click(getByTestId('cell-2030-01-01'))
    expect((onUpdate.mock.calls[0][0] as DateValue).toString()).toBe('2030-09-05')
  })

  it('pages by yearsPerPage', async () => {
    const { user, getByTestId } = setupUnit({ granularity: 'year', placeholder: sep5, yearsPerPage: 20 })
    expect(getByTestId('heading')).toHaveTextContent('2020 - 2039')
    await user.click(getByTestId('next-button'))
    expect(getByTestId('heading')).toHaveTextContent('2040 - 2059')
  })
})

describe('calendar — views and drill-down', () => {
  it('passes axe', async () => {
    const { calendar } = setupViews({ placeholder: sep5 })
    expect(await axe(calendar)).toHaveNoViolations()
  })

  it('starts on the granularity view and only renders that view', () => {
    const { getByTestId, queryByTestId } = setupViews({ placeholder: sep5 })
    expect(getByTestId('view-day')).toBeInTheDocument()
    expect(queryByTestId('view-month')).toBeNull()
    expect(queryByTestId('view-year')).toBeNull()
    expect(getByTestId('view-trigger')).toHaveTextContent('September 2026')
    expect(getByTestId('view-trigger')).toHaveAttribute('aria-label', 'Switch to month view')
  })

  it('drills up with the heading trigger and down by selecting, without touching the model', async () => {
    const onModel = vi.fn()
    const onView = vi.fn()
    const { user, getByTestId, queryByTestId } = setupViews({ placeholder: sep5 }, { 'onUpdate:modelValue': onModel, 'onUpdate:view': onView })

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

  it('respects maxView', async () => {
    const { user, getByTestId, queryByTestId } = setupViews({ placeholder: sep5, maxView: 'month' })
    await user.click(getByTestId('view-trigger'))
    expect(getByTestId('view-month')).toBeInTheDocument()
    expect(getByTestId('view-trigger')).toHaveAttribute('disabled')
    await user.click(getByTestId('view-trigger'))
    expect(queryByTestId('view-year')).toBeNull()
  })

  it('never shows a view finer than the granularity', () => {
    const { getByTestId, queryByTestId } = setupViews({ placeholder: sep5, granularity: 'month', view: 'day' })
    expect(getByTestId('view-month')).toBeInTheDocument()
    expect(queryByTestId('view-day')).toBeNull()
  })

  it('is controllable through v-model:view', async () => {
    const { getByTestId, rerender } = setupViews({ placeholder: sep5, view: 'year' })
    expect(getByTestId('view-year')).toBeInTheDocument()
    await rerender({ placeholder: sep5, view: 'day' })
    expect(getByTestId('view-day')).toBeInTheDocument()
  })

  it('pages the active view: months in the day view, years in the month view', async () => {
    const { user, getByTestId } = setupViews({ placeholder: sep5 })
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
      props: { 'placeholder': sep5, 'onBeforeUpdate:modelValue': cancel, 'onUpdate:modelValue': onModel } as any,
    })
    await user.click(getByTestId('day-2026-09-10'))
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(onModel).not.toHaveBeenCalled()
    expect(getByTestId('day-2026-09-10')).not.toHaveAttribute('data-selected')
  })
})
