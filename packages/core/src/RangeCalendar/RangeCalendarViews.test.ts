import type { RangeCalendarRootProps } from './RangeCalendarRoot.vue'
import type { DateRange } from '@/shared/date'
import { CalendarDate } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import RangeCalendarUnitHarness from './story/_RangeCalendarUnit.vue'
import RangeCalendarViews from './story/_RangeCalendarViews.vue'

const kbd = useTestKbd()
const sep5 = new CalendarDate(2026, 9, 5)

type Listeners = Partial<Record<'onUpdate:modelValue' | 'onUpdate:validModelValue' | 'onUpdate:view', (...args: any[]) => void>>

function setupUnit(props: RangeCalendarRootProps = {}, listeners: Listeners = {}) {
  const user = userEvent.setup()
  const returned = render(RangeCalendarUnitHarness, { props: { ...props, ...listeners } })
  return { ...returned, user, calendar: returned.getByTestId('calendar') }
}

function setupViews(props: RangeCalendarRootProps = {}, listeners: Listeners = {}) {
  const user = userEvent.setup()
  const returned = render(RangeCalendarViews, { props: { ...props, ...listeners } })
  return { ...returned, user, calendar: returned.getByTestId('calendar') }
}

const selected = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>('[data-selected]'))
const range = (value: DateRange) => `${value.start?.toString()}..${value.end?.toString()}`

describe('range calendar — granularity="month" (replaces MonthRangePicker)', () => {
  it('passes axe', async () => {
    const { calendar } = setupUnit({ granularity: 'month', defaultPlaceholder: sep5 })
    expect(await axe(calendar)).toHaveNoViolations()
  })

  it('selects a month range in two clicks and reports it', async () => {
    const onUpdate = vi.fn()
    const onValid = vi.fn()
    const { user, getByTestId, calendar } = setupUnit({ granularity: 'month', defaultPlaceholder: sep5 }, { 'onUpdate:modelValue': onUpdate, 'onUpdate:validModelValue': onValid })

    await user.click(getByTestId('cell-2026-03-01'))
    expect(getByTestId('cell-2026-03-01')).toHaveAttribute('data-selection-start')
    expect(range(onUpdate.mock.calls.at(-1)![0])).toBe('2026-03-01..undefined')
    expect(onUpdate.mock.calls.at(-1)![1].reason).toBe('cell-press')

    await user.click(getByTestId('cell-2026-06-01'))
    expect(getByTestId('cell-2026-06-01')).toHaveAttribute('data-selection-end')
    expect(selected(calendar).map(el => el.getAttribute('data-value'))).toEqual(['2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01'])
    expect(range(onUpdate.mock.calls.at(-1)![0])).toBe('2026-03-01..2026-06-01')
    expect(range(onValid.mock.calls.at(-1)![0])).toBe('2026-03-01..2026-06-01')
  })

  it('orders a backwards selection', async () => {
    const onUpdate = vi.fn()
    const { user, getByTestId } = setupUnit({ granularity: 'month', defaultPlaceholder: sep5 }, { 'onUpdate:modelValue': onUpdate })
    await user.click(getByTestId('cell-2026-08-01'))
    await user.click(getByTestId('cell-2026-02-01'))
    expect(range(onUpdate.mock.calls.at(-1)![0])).toBe('2026-02-01..2026-08-01')
  })

  it('highlights the whole maximumLength window and disables months beyond it', async () => {
    const { user, getByTestId } = setupUnit({ granularity: 'month', defaultPlaceholder: sep5, maximumLength: 3 })
    await user.click(getByTestId('cell-2026-02-01'))
    // Hovering inside the window highlights the full reachable window (v2 `maximumDays` rule).
    await user.hover(getByTestId('cell-2026-03-01'))
    expect(getByTestId('cell-2026-02-01')).toHaveAttribute('data-highlighted-start')
    expect(getByTestId('cell-2026-03-01')).toHaveAttribute('data-highlighted')
    expect(getByTestId('cell-2026-04-01')).toHaveAttribute('data-highlighted-end')
    expect(getByTestId('cell-2026-05-01')).not.toHaveAttribute('data-highlighted')
    expect(getByTestId('cell-2026-05-01')).toHaveAttribute('data-disabled')
    // A disabled month is not a hover target, so the highlight does not follow it.
    await user.hover(getByTestId('cell-2026-09-01'))
    expect(getByTestId('cell-2026-04-01')).toHaveAttribute('data-highlighted-end')
  })

  it('accepts a controlled month range and renders it', () => {
    const { calendar } = setupUnit({ granularity: 'month', modelValue: { start: new CalendarDate(2026, 4, 1), end: new CalendarDate(2026, 5, 1) } })
    expect(selected(calendar).map(el => el.getAttribute('data-value'))).toEqual(['2026-04-01', '2026-05-01'])
  })

  it('navigates with the keyboard across the year boundary', async () => {
    const { user, getByTestId } = setupUnit({ granularity: 'month', defaultPlaceholder: sep5 })
    getByTestId('cell-2026-12-01').focus()
    await user.keyboard(kbd.ARROW_RIGHT)
    expect(getByTestId('cell-2027-01-01')).toHaveFocus()
    expect(getByTestId('heading')).toHaveTextContent('2027')
  })
})

describe('range calendar — granularity="year" (replaces YearRangePicker)', () => {
  it('selects a year range', async () => {
    const onUpdate = vi.fn()
    const { user, getByTestId, calendar } = setupUnit({ granularity: 'year', defaultPlaceholder: sep5 }, { 'onUpdate:modelValue': onUpdate })
    expect(getByTestId('heading')).toHaveTextContent('2020 - 2031')
    await user.click(getByTestId('cell-2024-01-01'))
    await user.click(getByTestId('cell-2027-01-01'))
    expect(selected(calendar)).toHaveLength(4)
    expect(range(onUpdate.mock.calls.at(-1)![0])).toBe('2024-01-01..2027-01-01')
  })
})

describe('range calendar — views and drill-down', () => {
  it('passes axe', async () => {
    const { calendar } = setupViews({ defaultPlaceholder: sep5 })
    expect(await axe(calendar)).toHaveNoViolations()
  })

  it('drills up and down without touching the range, then selects days', async () => {
    const onUpdate = vi.fn()
    const onView = vi.fn()
    const { user, getByTestId, queryByTestId, calendar } = setupViews({ defaultPlaceholder: sep5 }, { 'onUpdate:modelValue': onUpdate, 'onUpdate:view': onView })

    await user.click(getByTestId('view-trigger'))
    expect(getByTestId('view-month')).toBeInTheDocument()
    await user.click(getByTestId('view-trigger'))
    expect(getByTestId('view-year')).toBeInTheDocument()
    expect(getByTestId('view-trigger')).toHaveAttribute('disabled')

    await user.click(getByTestId('year-2027-01-01'))
    expect(getByTestId('view-month')).toBeInTheDocument()
    await user.click(getByTestId('month-2027-03-01'))
    expect(getByTestId('view-day')).toBeInTheDocument()
    expect(queryByTestId('view-month')).toBeNull()
    expect(onUpdate).not.toHaveBeenCalled()
    expect(onView).toHaveBeenLastCalledWith('day', expect.objectContaining({ reason: 'view-drill' }))

    await user.click(getByTestId('day-2027-03-10'))
    await user.click(getByTestId('day-2027-03-14'))
    expect(selected(calendar)).toHaveLength(5)
    expect(range(onUpdate.mock.calls.at(-1)![0])).toBe('2027-03-10..2027-03-14')
  })

  it('shows no range state in views coarser than the granularity', async () => {
    const { user, getByTestId, calendar } = setupViews({ defaultPlaceholder: sep5, modelValue: { start: new CalendarDate(2026, 9, 3), end: new CalendarDate(2026, 9, 8) } })
    expect(selected(calendar)).toHaveLength(6)
    await user.click(getByTestId('view-trigger'))
    expect(selected(calendar)).toHaveLength(0)
    expect(getByTestId('month-2026-09-01')).not.toHaveAttribute('data-selected')
  })

  it('honours beforeUpdate:modelValue cancellation', async () => {
    const onUpdate = vi.fn()
    const cancel = vi.fn((_value: unknown, details: { cancel: () => void }) => details.cancel())
    const user = userEvent.setup()
    const { getByTestId, container } = render(RangeCalendarViews, {
      props: { 'defaultPlaceholder': sep5, 'onBeforeUpdate:modelValue': cancel, 'onUpdate:modelValue': onUpdate } as any,
    })
    await user.click(getByTestId('day-2026-09-10'))
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(onUpdate).not.toHaveBeenCalled()
    expect(container.querySelector('[data-selection-start]')).toBeNull()
  })
})
