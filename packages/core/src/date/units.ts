import type { DateDuration, DateFields, DateValue } from '@internationalized/date'
import type { WeekStartsOn } from './calendar'
import type { CalendarGridData, CalendarUnit, Matcher } from './types'
import type { DateFormatterOptions, Formatter } from '@/shared/useDateFormatter'
import { endOfMonth, endOfYear, isEqualMonth, isSameDay, isSameMonth, startOfMonth, startOfYear } from '@internationalized/date'
import { createMonthGrid, createMonths, createYearGrid } from './calendar'
import {
  areAllDaysBetweenValid,
  areAllMonthsBetweenValid,
  areAllYearsBetweenValid,
  compareYearMonth,
  getDaysInMonth,
  getMonthsBetween,
  getYearsBetween,
  isSameYear,
  isSameYearMonth,
  toDate,
} from './comparators'

/** A consumer-supplied paging function: receives the placeholder and the view being paged. */
export type CalendarPageFunction = (placeholder: DateValue, view: CalendarUnit) => DateValue

/** How the placeholder should be resolved after a page change (see the day adapter). */
export type PagingMode = 'default' | 'root-fn' | 'explicit-fn'

/**
 * Layout inputs that shape a calendar page. The day view reads
 * `weekStartsOn` / `fixedWeeks` / `numberOfMonths` / `locale`, the month view
 * reads `columns`, the year view reads `yearsPerPage` / `columns`.
 */
export interface CalendarLayout {
  locale: string
  weekStartsOn: WeekStartsOn
  fixedWeeks: boolean
  numberOfMonths: number
  pagedNavigation: boolean
  yearsPerPage: number
  columns: number
}

export interface CreateGridOptions {
  /**
   * Year view only: align the first year to the start of its decade
   * (`true` on initial render and when the placeholder leaves the grid,
   * `false` when paging with Prev / Next).
   */
  aligned?: boolean
}

/**
 * Everything that differs between the day, month and year flavours of a
 * calendar. `useCalendarGrid` and the cell triggers are written once against
 * this interface; `getUnitAdapter(unit)` supplies the values.
 */
export interface CalendarUnitAdapter {
  unit: CalendarUnit
  /** `isSameDay` / same year-and-month / same year. */
  isSame: (a: DateValue, b: DateValue) => boolean
  /** Unit-level ordering (a month compares by year+month, ignoring the day). */
  compare: (a: DateValue, b: DateValue) => number
  /** First instant of the unit containing `d` (identity for days). */
  startOf: (d: DateValue) => DateValue
  /** Last day of the unit containing `d` (identity for days). */
  endOf: (d: DateValue) => DateValue
  /** Move by `n` units (negative moves back). */
  add: (d: DateValue, n: number) => DateValue
  /** Inclusive number of units from `start` to `end`. */
  distance: (start: DateValue, end: DateValue) => number
  /** Whether every unit strictly between `start` and `end` passes the matchers. */
  areAllBetweenValid: (start: DateValue, end: DateValue, isUnavailable?: Matcher, isDisabled?: Matcher, isHighlightable?: Matcher) => boolean
  /** Builds the page(s) shown for `placeholder`. */
  createGrid: (placeholder: DateValue, layout: CalendarLayout, options?: CreateGridOptions) => CalendarGridData[]
  /** Whether `date` falls inside the currently rendered page(s). */
  isInVisibleView: (date: DateValue, grid: CalendarGridData[]) => boolean
  /** Whether `cell` belongs to `page` (a leading/trailing day of a neighbouring month does not). */
  isInPage: (cell: DateValue, page: DateValue) => boolean
  /** How far Prev / Next move. */
  pageDuration: (layout: CalendarLayout) => DateDuration
  /** Cells per row: the up/down keyboard stride. */
  rowLength: (layout: CalendarLayout) => number
  /** The date to build the next (`direction: 1`) or previous (`-1`) page from. */
  pageTarget: (grid: CalendarGridData[], layout: CalendarLayout, direction: 1 | -1, fn?: CalendarPageFunction) => DateValue
  /** The placeholder to set once `newGrid` replaced a grid whose first page was `previousFirst`. */
  placeholderAfterPaging: (newGrid: CalendarGridData[], previousFirst: DateValue, placeholder: DateValue, mode: PagingMode) => DateValue
  /** First unit of the page after `grid` — compared against `maxValue` to disable Next. */
  nextPageStart: (grid: CalendarGridData[], layout: CalendarLayout, fn?: CalendarPageFunction) => DateValue
  /** Last unit of the page before `grid` — compared against `minValue` to disable Prev. */
  prevPageEnd: (grid: CalendarGridData[], layout: CalendarLayout, fn?: CalendarPageFunction) => DateValue
  /** Text inside a cell: `5`, `Sep`, `2026`. */
  formatCell: (formatter: Formatter, d: DateValue, locale: string) => string
  /** `aria-label` of a cell: `Saturday, September 5, 2026`, `September 2026`, `2026`. */
  formatLabel: (formatter: Formatter, d: DateValue) => string
  /** Heading for the rendered page(s). */
  formatHeading: (formatter: Formatter, grid: CalendarGridData[], options: DateFormatterOptions) => string
  /** Fallback for `calendarLabel` (v2 kept a different one per family). */
  defaultLabel: string
}

const dayAdapter: CalendarUnitAdapter = {
  unit: 'day',
  isSame: isSameDay,
  compare: (a, b) => a.compare(b),
  startOf: d => d,
  endOf: d => d,
  add: (d, n) => d.add({ days: n }),
  distance: (start, end) => end.compare(start) + 1,
  areAllBetweenValid: areAllDaysBetweenValid,
  createGrid: (placeholder, layout) => createMonths({
    dateObj: placeholder,
    weekStartsOn: layout.weekStartsOn,
    locale: layout.locale,
    fixedWeeks: layout.fixedWeeks,
    numberOfMonths: layout.numberOfMonths,
  }),
  isInVisibleView: (date, grid) => grid.some(page => isEqualMonth(page.value, date)),
  isInPage: (cell, page) => isSameMonth(cell, page),
  pageDuration: layout => ({ months: layout.pagedNavigation ? layout.numberOfMonths : 1 }),
  rowLength: () => 7,
  pageTarget: (grid, layout, direction, fn) => {
    const first = grid[0].value
    if (fn)
      return fn(first, 'day')
    const months = layout.pagedNavigation ? layout.numberOfMonths : 1
    return direction > 0 ? first.add({ months }) : first.subtract({ months })
  },
  placeholderAfterPaging: (newGrid, previousFirst, _placeholder, mode) => {
    const first = newGrid[0].value
    if (mode === 'default')
      return first.set({ day: 1 })
    // A paging function passed straight to `nextPage()` / `prevPage()` overwrites
    // the placeholder as-is; the root-level `nextPage` / `prevPage` props get the
    // placeholder snapped to the first day/month of the page they landed on.
    if (mode === 'explicit-fn')
      return first.set({})
    const diff = Math.abs(first.compare(previousFirst))
    const duration: DateFields = {}
    if (diff >= getDaysInMonth(previousFirst))
      duration.day = 1
    if (diff >= 365)
      duration.month = 1
    return first.set({ ...duration })
  },
  nextPageStart: (grid, _layout, fn) => {
    const lastPeriodInView = grid.at(-1)!.value
    if (!fn)
      return lastPeriodInView.add({ months: 1 }).set({ day: 1 })
    const firstPeriodOfNextPage = fn(lastPeriodInView, 'day')
    const diff = firstPeriodOfNextPage.compare(lastPeriodInView)
    const duration: DateFields = {}
    if (diff >= 7)
      duration.day = 1
    if (diff >= getDaysInMonth(lastPeriodInView))
      duration.month = 1
    return firstPeriodOfNextPage.set({ ...duration })
  },
  prevPageEnd: (grid, _layout, fn) => {
    const firstPeriodInView = grid[0].value
    if (!fn)
      return firstPeriodInView.subtract({ months: 1 }).set({ day: 35 })
    const lastPeriodOfPrevPage = fn(firstPeriodInView, 'day')
    const diff = firstPeriodInView.compare(lastPeriodOfPrevPage)
    const duration: DateFields = {}
    if (diff >= 7)
      duration.day = 35
    if (diff >= getDaysInMonth(firstPeriodInView))
      duration.month = 13
    return lastPeriodOfPrevPage.set({ ...duration })
  },
  formatCell: (_formatter, d, locale) => d.day.toLocaleString(locale),
  formatLabel: (formatter, d) => formatter.custom(toDate(d), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }),
  formatHeading: (formatter, grid, options) => {
    if (!grid.length)
      return ''
    if (grid.length === 1)
      return formatter.fullMonthAndYear(toDate(grid[0].value), options)

    const startMonth = toDate(grid[0].value)
    const endMonth = toDate(grid.at(-1)!.value)
    const startMonthName = formatter.fullMonth(startMonth, options)
    const endMonthName = formatter.fullMonth(endMonth, options)
    const startMonthYear = formatter.fullYear(startMonth, options)
    const endMonthYear = formatter.fullYear(endMonth, options)

    return startMonthYear === endMonthYear
      ? `${startMonthName} - ${endMonthName} ${endMonthYear}`
      : `${startMonthName} ${startMonthYear} - ${endMonthName} ${endMonthYear}`
  },
  defaultLabel: 'Event Date',
}

const monthAdapter: CalendarUnitAdapter = {
  unit: 'month',
  isSame: isSameYearMonth,
  compare: compareYearMonth,
  startOf: startOfMonth,
  endOf: endOfMonth,
  add: (d, n) => d.add({ months: n }),
  distance: getMonthsBetween,
  areAllBetweenValid: (start, end, isUnavailable, isDisabled) => areAllMonthsBetweenValid(start, end, isUnavailable, isDisabled),
  createGrid: (placeholder, layout) => [createMonthGrid({ dateObj: placeholder, columns: layout.columns })],
  isInVisibleView: (date, grid) => grid.some(page => page.value.year === date.year),
  isInPage: (cell, page) => cell.year === page.year,
  pageDuration: () => ({ years: 1 }),
  rowLength: layout => layout.columns,
  pageTarget: (grid, _layout, direction, fn) => {
    const current = grid[0].value
    if (fn)
      return fn(current, 'month')
    return direction > 0 ? current.add({ years: 1 }) : current.subtract({ years: 1 })
  },
  placeholderAfterPaging: (newGrid, _previousFirst, placeholder) =>
    newGrid[0].value.set({ month: placeholder.month, day: placeholder.day }),
  nextPageStart: (grid, _layout, fn) => {
    const current = grid[0].value
    const next = fn ? fn(current, 'month') : current.add({ years: 1 })
    return next.set({ month: 1, day: 1 })
  },
  prevPageEnd: (grid, _layout, fn) => {
    const current = grid[0].value
    if (fn)
      return endOfMonth(fn(current, 'month').set({ month: 12 }))
    return current.subtract({ years: 1 }).set({ month: 12, day: 31 })
  },
  formatCell: (formatter, d) => formatter.custom(toDate(d), { month: 'short' }),
  formatLabel: (formatter, d) => formatter.custom(toDate(d), { month: 'long', year: 'numeric' }),
  formatHeading: (formatter, grid, options) => grid.length ? formatter.fullYear(toDate(grid[0].value), options) : '',
  defaultLabel: 'Month Picker',
}

const yearAdapter: CalendarUnitAdapter = {
  unit: 'year',
  isSame: isSameYear,
  compare: (a, b) => a.year - b.year,
  startOf: startOfYear,
  endOf: endOfYear,
  add: (d, n) => d.add({ years: n }),
  distance: getYearsBetween,
  areAllBetweenValid: (start, end, isUnavailable, isDisabled) => areAllYearsBetweenValid(start, end, isUnavailable, isDisabled),
  createGrid: (placeholder, layout, options) => [createYearGrid({
    dateObj: placeholder,
    yearsPerPage: layout.yearsPerPage,
    columns: layout.columns,
    decadeAligned: options?.aligned ?? true,
  })],
  isInVisibleView: (date, grid) => grid.some((page) => {
    const first = page.cells[0]
    const last = page.cells.at(-1)
    return !!first && !!last && date.year >= first.year && date.year <= last.year
  }),
  // A year grid has no leading/trailing cells from a neighbouring page.
  isInPage: () => true,
  pageDuration: layout => ({ years: layout.yearsPerPage }),
  rowLength: layout => layout.columns,
  pageTarget: (grid, layout, direction, fn) => {
    const first = grid[0].value
    if (fn)
      return fn(first, 'year')
    return direction > 0 ? first.add({ years: layout.yearsPerPage }) : first.subtract({ years: layout.yearsPerPage })
  },
  placeholderAfterPaging: (newGrid, _previousFirst, placeholder) =>
    newGrid[0].value.set({ month: placeholder.month, day: placeholder.day }),
  nextPageStart: (grid, _layout, fn) => {
    const lastYearInView = grid.at(-1)!.cells.at(-1)!
    return startOfYear(fn ? fn(lastYearInView, 'year') : lastYearInView.add({ years: 1 }))
  },
  prevPageEnd: (grid, _layout, fn) => {
    const firstYearInView = grid[0].value
    return endOfYear(fn ? fn(firstYearInView, 'year') : firstYearInView.subtract({ years: 1 }))
  },
  formatCell: (formatter, d) => formatter.custom(toDate(d), { year: 'numeric' }),
  formatLabel: (formatter, d) => formatter.custom(toDate(d), { year: 'numeric' }),
  formatHeading: (formatter, grid, options) => {
    const first = grid[0]?.cells[0]
    const last = grid.at(-1)?.cells.at(-1)
    if (!first || !last)
      return ''
    return `${formatter.fullYear(toDate(first), options)} - ${formatter.fullYear(toDate(last), options)}`
  },
  defaultLabel: 'Year Picker',
}

const adapters: Record<CalendarUnit, CalendarUnitAdapter> = {
  day: dayAdapter,
  month: monthAdapter,
  year: yearAdapter,
}

/** The adapter for a calendar unit. Adapters are stateless singletons. */
export function getUnitAdapter(unit: CalendarUnit): CalendarUnitAdapter {
  return adapters[unit]
}

/** Views ordered finest → coarsest; `granularity` is a lower bound, `maxView` an upper bound. */
export const CALENDAR_UNITS: readonly CalendarUnit[] = ['day', 'month', 'year']

/** `true` when `a` is a coarser unit than `b` (`'year'` is coarser than `'day'`). */
export function isCoarserUnit(a: CalendarUnit, b: CalendarUnit): boolean {
  return CALENDAR_UNITS.indexOf(a) > CALENDAR_UNITS.indexOf(b)
}

/** Clamps `view` into `[granularity, maxView]`. */
export function clampCalendarView(view: CalendarUnit, granularity: CalendarUnit, maxView: CalendarUnit): CalendarUnit {
  if (isCoarserUnit(granularity, view))
    return granularity
  if (isCoarserUnit(view, maxView))
    return maxView
  return view
}

/** The next finer unit, or `undefined` at `'day'`. */
export function finerUnit(unit: CalendarUnit): CalendarUnit | undefined {
  return CALENDAR_UNITS[CALENDAR_UNITS.indexOf(unit) - 1]
}

/** The next coarser unit, or `undefined` at `'year'`. */
export function coarserUnit(unit: CalendarUnit): CalendarUnit | undefined {
  return CALENDAR_UNITS[CALENDAR_UNITS.indexOf(unit) + 1]
}
