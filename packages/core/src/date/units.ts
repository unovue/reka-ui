import type { WeekStartsOn } from './calendar'
import type { CalendarGridData, CalendarUnit, DateValue, Matcher } from './types'
import type { DateFormatterOptions, Formatter } from '@/shared/useDateFormatter'
import { createMonthGrid, createMonths, createYearGrid } from './calendar'
import {
  areAllDaysBetweenValid,
  areAllMonthsBetweenValid,
  areAllYearsBetweenValid,
  compareYear,
  compareYearMonth,
  getDaysInMonth,
  getMonthsBetween,
  getYearsBetween,
  isSameYear,
  isSameYearMonth,
} from './comparators'
import { compareDateValues, endOfMonth, endOfYear, isSameDay, isSameMonth, isToday, startOfMonth, startOfYear, toCalendar, today, toPlainDate } from './temporal'

type DateDuration = Temporal.DurationLikeObject
type DateFields = { day?: number, month?: number }

/**
 * A consumer-supplied paging function: receives the placeholder and the view
 * being paged. The root `nextPage` / `prevPage` props are used only in the
 * `granularity` view; coarser views page by their default step.
 */
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
  /**
   * A copy of `value` that keeps the finer fields of `reference`: selecting a
   * month keeps the reference's day, selecting a year keeps its month and day.
   * Identity (a copy) for days.
   */
  resolve: (value: DateValue, reference?: DateValue) => DateValue
  /** Whether `d` is in the same unit as today (in `d`'s calendar system). */
  isCurrent: (d: DateValue) => boolean
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

/** Whole days from `from` to `to` (negative when `to` is earlier). */
function daysBetween(from: DateValue, to: DateValue): number {
  return toPlainDate(from).until(toPlainDate(to), { largestUnit: 'days' }).days
}

/** `value` snapped to the first day (`day: 1`) and / or the first month (`month: 1`) of its period. */
function withFields(value: DateValue, fields: DateFields): DateValue {
  return Object.keys(fields).length ? value.with(fields) : value
}

/**
 * A date in the year of `value` with the month and day of `reference`, built
 * by stepping from the start of the year so eras and calendars with a varying
 * number of months are handled (the month and the day are clamped).
 */
function withMonthAndDay(value: DateValue, reference: DateValue): DateValue {
  const yearStart = startOfYear(value)
  const month = Math.min(reference.month, yearStart.monthsInYear)
  const monthStart = yearStart.add({ months: month - 1 })
  return monthStart.with({ day: Math.min(reference.day, monthStart.daysInMonth) })
}

// Cell text and label options: constant objects, so the formatter keys them once
// (by identity) instead of serialising the options for every cell.
const DAY_LABEL_OPTIONS: DateFormatterOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
const MONTH_CELL_OPTIONS: DateFormatterOptions = { month: 'short' }
const MONTH_LABEL_OPTIONS: DateFormatterOptions = { month: 'long', year: 'numeric' }
const YEAR_OPTIONS: DateFormatterOptions = { year: 'numeric' }

const numberFormats = new Map<string, Intl.NumberFormat>()
/** `n.toLocaleString(locale)` through a cached `Intl.NumberFormat` (same output, no per-call formatter). */
function getNumberFormat(locale: string): Intl.NumberFormat {
  let format = numberFormats.get(locale)
  if (!format) {
    format = new Intl.NumberFormat(locale)
    numberFormats.set(locale, format)
  }
  return format
}

const dayAdapter: CalendarUnitAdapter = {
  unit: 'day',
  isSame: isSameDay,
  compare: compareDateValues,
  startOf: d => d,
  endOf: d => d,
  add: (d, n) => d.add({ days: n }),
  resolve: value => value,
  isCurrent: d => isToday(d),
  // Whole days, inclusive, counted on the calendar-date parts.
  distance: (start, end) => toPlainDate(start).until(toPlainDate(end), { largestUnit: 'days' }).days + 1,
  areAllBetweenValid: areAllDaysBetweenValid,
  createGrid: (placeholder, layout) => createMonths({
    dateObj: placeholder,
    weekStartsOn: layout.weekStartsOn,
    locale: layout.locale,
    fixedWeeks: layout.fixedWeeks,
    numberOfMonths: layout.numberOfMonths,
  }),
  isInVisibleView: (date, grid) => grid.some(page => isSameMonth(page.value, date)),
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
      return first.with({ day: 1 })
    // A paging function passed straight to `nextPage()` / `prevPage()` overwrites
    // the placeholder as-is; the root-level `nextPage` / `prevPage` props get the
    // placeholder snapped to the first day/month of the page they landed on.
    if (mode === 'explicit-fn')
      return first
    const diff = Math.abs(daysBetween(previousFirst, first))
    const duration: DateFields = {}
    if (diff >= getDaysInMonth(previousFirst))
      duration.day = 1
    if (diff >= 365)
      duration.month = 1
    return withFields(first, duration)
  },
  nextPageStart: (grid, _layout, fn) => {
    const lastPeriodInView = grid.at(-1)!.value
    if (!fn)
      return lastPeriodInView.add({ months: 1 }).with({ day: 1 })
    const firstPeriodOfNextPage = fn(lastPeriodInView, 'day')
    const diff = daysBetween(lastPeriodInView, firstPeriodOfNextPage)
    const duration: DateFields = {}
    if (diff >= 7)
      duration.day = 1
    if (diff >= getDaysInMonth(lastPeriodInView))
      duration.month = 1
    return withFields(firstPeriodOfNextPage, duration)
  },
  prevPageEnd: (grid, _layout, fn) => {
    const firstPeriodInView = grid[0].value
    if (!fn)
      return endOfMonth(firstPeriodInView.subtract({ months: 1 }))
    const lastPeriodOfPrevPage = fn(firstPeriodInView, 'day')
    const diff = daysBetween(lastPeriodOfPrevPage, firstPeriodInView)
    const duration: DateFields = {}
    let result = lastPeriodOfPrevPage
    if (diff >= getDaysInMonth(firstPeriodInView))
      result = result.with({ month: result.monthsInYear })
    if (diff >= 7)
      result = endOfMonth(result)
    return result
  },
  formatCell: (_formatter, d, locale) => getNumberFormat(locale).format(d.day),
  formatLabel: (formatter, d) => formatter.custom(d, DAY_LABEL_OPTIONS),
  formatHeading: (formatter, grid, options) => {
    if (!grid.length)
      return ''
    if (grid.length === 1)
      return formatter.fullMonthAndYear(grid[0].value, options)

    const startMonth = grid[0].value
    const endMonth = grid.at(-1)!.value
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
  resolve: (value, reference) => reference ? value.with({ day: reference.day }) : value,
  isCurrent: d => isSameYearMonth(d, toCalendar(today(), d.calendarId)),
  distance: getMonthsBetween,
  areAllBetweenValid: areAllMonthsBetweenValid,
  createGrid: (placeholder, layout) => [createMonthGrid({ dateObj: placeholder, columns: layout.columns })],
  isInVisibleView: (date, grid) => grid.some(page => isSameYear(page.value, date)),
  isInPage: (cell, page) => isSameYear(cell, page),
  pageDuration: () => ({ years: 1 }),
  rowLength: layout => layout.columns,
  pageTarget: (grid, _layout, direction, fn) => {
    const current = grid[0].value
    if (fn)
      return fn(current, 'month')
    return direction > 0 ? current.add({ years: 1 }) : current.subtract({ years: 1 })
  },
  placeholderAfterPaging: (newGrid, _previousFirst, placeholder) => withMonthAndDay(newGrid[0].value, placeholder),
  nextPageStart: (grid, _layout, fn) => {
    const current = grid[0].value
    return startOfYear(fn ? fn(current, 'month') : current.add({ years: 1 }))
  },
  prevPageEnd: (grid, _layout, fn) => {
    const current = grid[0].value
    return endOfYear(fn ? fn(current, 'month') : current.subtract({ years: 1 }))
  },
  formatCell: (formatter, d) => formatter.custom(d, MONTH_CELL_OPTIONS),
  formatLabel: (formatter, d) => formatter.custom(d, MONTH_LABEL_OPTIONS),
  formatHeading: (formatter, grid, options) => grid.length ? formatter.fullYear(grid[0].value, options) : '',
  defaultLabel: 'Month Picker',
}

const yearAdapter: CalendarUnitAdapter = {
  unit: 'year',
  isSame: isSameYear,
  compare: compareYear,
  startOf: startOfYear,
  endOf: endOfYear,
  add: (d, n) => d.add({ years: n }),
  resolve: (value, reference) => reference ? withMonthAndDay(value, reference) : value,
  isCurrent: d => isSameYear(d, toCalendar(today(), d.calendarId)),
  distance: getYearsBetween,
  areAllBetweenValid: areAllYearsBetweenValid,
  createGrid: (placeholder, layout, options) => [createYearGrid({
    dateObj: placeholder,
    yearsPerPage: layout.yearsPerPage,
    columns: layout.columns,
    decadeAligned: options?.aligned ?? true,
  })],
  isInVisibleView: (date, grid) => grid.some((page) => {
    const first = page.cells[0]
    const last = page.cells.at(-1)
    return !!first && !!last && compareYear(date, first) >= 0 && compareYear(date, last) <= 0
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
  placeholderAfterPaging: (newGrid, _previousFirst, placeholder) => withMonthAndDay(newGrid[0].value, placeholder),
  nextPageStart: (grid, _layout, fn) => {
    const lastPage = grid.at(-1)!
    const lastYearInView = lastPage.cells.at(-1) ?? lastPage.value
    return startOfYear(fn ? fn(lastYearInView, 'year') : lastYearInView.add({ years: 1 }))
  },
  prevPageEnd: (grid, _layout, fn) => {
    const firstYearInView = grid[0].value
    return endOfYear(fn ? fn(firstYearInView, 'year') : firstYearInView.subtract({ years: 1 }))
  },
  formatCell: (formatter, d) => formatter.custom(d, YEAR_OPTIONS),
  formatLabel: (formatter, d) => formatter.custom(d, YEAR_OPTIONS),
  formatHeading: (formatter, grid, options) => {
    const first = grid[0]?.cells[0]
    const last = grid.at(-1)?.cells.at(-1)
    if (!first || !last)
      return ''
    return `${formatter.fullYear(first, options)} - ${formatter.fullYear(last, options)}`
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
