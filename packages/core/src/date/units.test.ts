import type { Matcher } from './types'
import type { CalendarLayout } from './units'
import { CalendarDate } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { useDateFormatter } from '@/shared/useDateFormatter'
import { clampLayoutCount, createMonthGrid, createYearGrid } from './calendar'
import { CALENDAR_UNITS, clampCalendarView, coarserUnit, finerUnit, getUnitAdapter, isCoarserUnit } from './units'

const layout: CalendarLayout = {
  locale: 'en-US',
  weekStartsOn: 0,
  fixedWeeks: false,
  numberOfMonths: 1,
  pagedNavigation: false,
  yearsPerPage: 12,
  columns: 4,
}

const sep5 = new CalendarDate(2026, 9, 5)
const strings = (dates: { toString: () => string }[]) => dates.map(d => d.toString())

describe('unit ordering helpers', () => {
  it('orders units finest to coarsest', () => {
    expect(CALENDAR_UNITS).toEqual(['day', 'month', 'year'])
    expect(isCoarserUnit('year', 'day')).toBe(true)
    expect(isCoarserUnit('day', 'month')).toBe(false)
    expect(isCoarserUnit('month', 'month')).toBe(false)
    expect(finerUnit('month')).toBe('day')
    expect(finerUnit('day')).toBeUndefined()
    expect(coarserUnit('month')).toBe('year')
    expect(coarserUnit('year')).toBeUndefined()
  })

  it('clamps the view into [granularity, maxView]', () => {
    expect(clampCalendarView('day', 'month', 'year')).toBe('month')
    expect(clampCalendarView('year', 'day', 'month')).toBe('month')
    expect(clampCalendarView('month', 'day', 'year')).toBe('month')
  })
})

describe('day adapter', () => {
  const day = getUnitAdapter('day')

  it('builds one 7-column month page per numberOfMonths', () => {
    const [page] = day.createGrid(sep5, layout)
    expect(page.value.toString()).toBe('2026-09-05')
    expect(page.rows.every(row => row.length === 7)).toBe(true)
    expect(page.cells[0].toString()).toBe('2026-08-30')
    expect(page.cells.at(-1)!.toString()).toBe('2026-10-03')

    const two = day.createGrid(sep5, { ...layout, numberOfMonths: 2 })
    expect(strings(two.map(p => p.value))).toEqual(['2026-09-05', '2026-10-05'])
    expect(day.createGrid(sep5, { ...layout, fixedWeeks: true })[0].cells).toHaveLength(42)
  })

  it('marks leading and trailing days as outside the page', () => {
    const [page] = day.createGrid(sep5, layout)
    expect(day.isInPage(page.cells[0], page.value)).toBe(false)
    expect(day.isInPage(new CalendarDate(2026, 9, 1), page.value)).toBe(true)
    expect(day.isInVisibleView(new CalendarDate(2026, 9, 30), [page])).toBe(true)
    expect(day.isInVisibleView(new CalendarDate(2026, 10, 1), [page])).toBe(false)
  })

  it('pages by one month, or by numberOfMonths with pagedNavigation', () => {
    const grid = day.createGrid(new CalendarDate(2026, 9, 1), { ...layout, numberOfMonths: 2 })
    expect(day.pageTarget(grid, { ...layout, numberOfMonths: 2 }, 1).toString()).toBe('2026-10-01')
    expect(day.pageTarget(grid, { ...layout, numberOfMonths: 2, pagedNavigation: true }, 1).toString()).toBe('2026-11-01')
    expect(day.pageTarget(grid, { ...layout, numberOfMonths: 2 }, -1).toString()).toBe('2026-08-01')
    expect(day.rowLength(layout)).toBe(7)
  })

  it('computes the bounds Prev / Next are checked against', () => {
    const grid = day.createGrid(new CalendarDate(2026, 9, 1), layout)
    expect(day.nextPageStart(grid, layout).toString()).toBe('2026-10-01')
    expect(day.prevPageEnd(grid, layout).toString()).toBe('2026-08-31')
    // A custom page function that jumps a year is snapped to the start / end of
    // that year (the v2 `useCalendar` bounds rule, kept for parity).
    expect(day.nextPageStart(grid, layout, d => d.add({ years: 1 })).toString()).toBe('2027-01-01')
    expect(day.prevPageEnd(grid, layout, d => d.subtract({ years: 1 })).toString()).toBe('2025-12-31')
  })

  it('snaps the placeholder after paging', () => {
    const grid = day.createGrid(new CalendarDate(2026, 10, 1), layout)
    const previousFirst = new CalendarDate(2026, 9, 17)
    expect(day.placeholderAfterPaging(grid, previousFirst, previousFirst, 'default').toString()).toBe('2026-10-01')
    expect(day.placeholderAfterPaging(grid, previousFirst, previousFirst, 'explicit-fn').toString()).toBe('2026-10-01')
    const yearGrid = day.createGrid(new CalendarDate(2027, 9, 17), layout)
    expect(day.placeholderAfterPaging(yearGrid, previousFirst, previousFirst, 'root-fn').toString()).toBe('2027-01-01')
  })

  it('formats cells, labels and headings', () => {
    const formatter = useDateFormatter('en-US')
    expect(day.formatCell(formatter, sep5, 'en-US')).toBe('5')
    expect(day.formatLabel(formatter, sep5)).toBe('Saturday, September 5, 2026')
    expect(day.formatHeading(formatter, day.createGrid(sep5, layout), {})).toBe('September 2026')
    expect(day.formatHeading(formatter, day.createGrid(sep5, { ...layout, numberOfMonths: 2 }), {})).toBe('September - October 2026')
    expect(day.formatHeading(formatter, day.createGrid(new CalendarDate(2026, 12, 1), { ...layout, numberOfMonths: 2 }), {})).toBe('December 2026 - January 2027')
  })
})

describe('month adapter', () => {
  const month = getUnitAdapter('month')

  it('builds one page of twelve months, columns per row', () => {
    const [page] = month.createGrid(sep5, layout)
    expect(page.cells).toHaveLength(12)
    expect(page.rows.map(r => r.length)).toEqual([4, 4, 4])
    expect(month.createGrid(sep5, { ...layout, columns: 3 })[0].rows.map(r => r.length)).toEqual([3, 3, 3, 3])
    expect(page.cells[0].toString()).toBe('2026-01-01')
    expect(page.cells[11].toString()).toBe('2026-12-01')
    expect(month.rowLength({ ...layout, columns: 3 })).toBe(3)
  })

  it('resolves a selection against a reference and detects the current unit', () => {
    expect(month.resolve(new CalendarDate(2026, 3, 1), sep5).toString()).toBe('2026-03-05')
    expect(month.resolve(new CalendarDate(2026, 2, 1), new CalendarDate(2026, 1, 31)).toString()).toBe('2026-02-28')
    expect(month.resolve(new CalendarDate(2026, 3, 1)).toString()).toBe('2026-03-01')
    expect(getUnitAdapter('year').resolve(new CalendarDate(2030, 1, 1), sep5).toString()).toBe('2030-09-05')
    expect(getUnitAdapter('day').resolve(new CalendarDate(2030, 1, 1), sep5).toString()).toBe('2030-01-01')
    expect(month.isCurrent(new CalendarDate(1900, 1, 1))).toBe(false)
    expect(getUnitAdapter('year').isCurrent(new CalendarDate(1900, 1, 1))).toBe(false)
  })

  it('compares, bounds and pages by month and year', () => {
    expect(month.isSame(sep5, new CalendarDate(2026, 9, 30))).toBe(true)
    expect(month.compare(new CalendarDate(2026, 9, 30), new CalendarDate(2026, 10, 1))).toBeLessThan(0)
    expect(month.startOf(sep5).toString()).toBe('2026-09-01')
    expect(month.endOf(sep5).toString()).toBe('2026-09-30')
    expect(month.add(sep5, 4).toString()).toBe('2027-01-05')
    expect(month.distance(new CalendarDate(2026, 1, 1), new CalendarDate(2026, 3, 1))).toBe(3)

    const grid = month.createGrid(sep5, layout)
    expect(month.pageTarget(grid, layout, 1).toString()).toBe('2027-09-05')
    expect(month.nextPageStart(grid, layout).toString()).toBe('2027-01-01')
    expect(month.prevPageEnd(grid, layout).toString()).toBe('2025-12-31')
    expect(month.isInVisibleView(new CalendarDate(2026, 1, 1), grid)).toBe(true)
    expect(month.isInVisibleView(new CalendarDate(2027, 1, 1), grid)).toBe(false)
    expect(month.placeholderAfterPaging(month.createGrid(new CalendarDate(2027, 9, 5), layout), sep5, sep5, 'default').toString()).toBe('2027-09-05')
  })

  it('formats cells, labels and headings', () => {
    const formatter = useDateFormatter('en-US')
    expect(month.formatCell(formatter, sep5, 'en-US')).toBe('Sep')
    expect(month.formatLabel(formatter, sep5)).toBe('September 2026')
    expect(month.formatHeading(formatter, month.createGrid(sep5, layout), {})).toBe('2026')
  })
})

describe('year adapter', () => {
  const year = getUnitAdapter('year')

  it('aligns to the decade on first render and pages unaligned', () => {
    const [page] = year.createGrid(sep5, layout)
    expect(page.value.toString()).toBe('2020-01-01')
    expect(strings(page.cells)).toEqual(Array.from({ length: 12 }, (_, i) => `${2020 + i}-01-01`))
    expect(year.rowLength(layout)).toBe(4)

    const next = year.createGrid(year.pageTarget([page], layout, 1), layout, { aligned: false })
    expect(next[0].cells[0].toString()).toBe('2032-01-01')
    expect(next[0].cells.at(-1)!.toString()).toBe('2043-01-01')
    expect(year.createGrid(sep5, { ...layout, yearsPerPage: 20 })[0].cells).toHaveLength(20)
  })

  it('compares, bounds and pages by year', () => {
    expect(year.isSame(sep5, new CalendarDate(2026, 1, 1))).toBe(true)
    expect(year.startOf(sep5).toString()).toBe('2026-01-01')
    expect(year.endOf(sep5).toString()).toBe('2026-12-31')
    expect(year.distance(new CalendarDate(2020, 1, 1), new CalendarDate(2026, 1, 1))).toBe(7)

    const grid = year.createGrid(sep5, layout)
    expect(year.nextPageStart(grid, layout).toString()).toBe('2032-01-01')
    expect(year.prevPageEnd(grid, layout).toString()).toBe('2019-12-31')
    expect(year.isInVisibleView(new CalendarDate(2031, 6, 1), grid)).toBe(true)
    expect(year.isInVisibleView(new CalendarDate(2032, 1, 1), grid)).toBe(false)
    expect(year.isInPage(new CalendarDate(1999, 1, 1), grid[0].value)).toBe(true)
  })

  it('formats cells, labels and headings', () => {
    const formatter = useDateFormatter('en-US')
    expect(year.formatCell(formatter, sep5, 'en-US')).toBe('2026')
    expect(year.formatLabel(formatter, sep5)).toBe('2026')
    expect(year.formatHeading(formatter, year.createGrid(sep5, layout), {})).toBe('2020 - 2031')
  })
})

describe('createMonthGrid / createYearGrid columns', () => {
  it('default to the v2 layout of 4 per row', () => {
    expect(createMonthGrid({ dateObj: sep5 }).rows.map(r => r.length)).toEqual([4, 4, 4])
    expect(createYearGrid({ dateObj: sep5 }).rows.map(r => r.length)).toEqual([4, 4, 4])
    expect(createYearGrid({ dateObj: sep5, yearsPerPage: 9, columns: 3 }).rows.map(r => r.length)).toEqual([3, 3, 3])
  })

  it('clamp columns and yearsPerPage to at least one', () => {
    expect(createMonthGrid({ dateObj: sep5, columns: 0 }).rows).toHaveLength(12)
    const single = createYearGrid({ dateObj: sep5, yearsPerPage: 0, columns: -2 })
    expect(single.cells).toHaveLength(1)
    expect(single.value.toString()).toBe('2020-01-01')
  })

  it('normalise NaN, Infinity and fractional layout counts', () => {
    expect(clampLayoutCount(Number.NaN, 4)).toBe(4)
    expect(clampLayoutCount(Number.POSITIVE_INFINITY, 12)).toBe(12)
    expect(clampLayoutCount(2.9, 4)).toBe(2)
    expect(clampLayoutCount(0.4, 4)).toBe(4)
    expect(clampLayoutCount(undefined, 12)).toBe(12)
    expect(createYearGrid({ dateObj: sep5, yearsPerPage: Number.NaN }).cells).toHaveLength(12)
    expect(createYearGrid({ dateObj: sep5, yearsPerPage: 5.7, columns: Number.POSITIVE_INFINITY }).rows.map(r => r.length)).toEqual([4, 1])
  })
})

describe('range validation across units', () => {
  it('lets a highlightable unit override disabled / unavailable, like the day validator', () => {
    const month = getUnitAdapter('month')
    const year = getUnitAdapter('year')
    const start = new CalendarDate(2026, 2, 1)
    const end = new CalendarDate(2026, 6, 1)
    const april: Matcher = d => d.month === 4
    expect(month.areAllBetweenValid(start, end, undefined, april)).toBe(false)
    expect(month.areAllBetweenValid(start, end, undefined, april, april)).toBe(true)

    const y2028: Matcher = d => d.year === 2028
    expect(year.areAllBetweenValid(new CalendarDate(2026, 1, 1), new CalendarDate(2030, 1, 1), y2028, undefined)).toBe(false)
    expect(year.areAllBetweenValid(new CalendarDate(2026, 1, 1), new CalendarDate(2030, 1, 1), y2028, undefined, y2028)).toBe(true)
  })
})
