/*
 * Implementation ported from from from https://github.com/melt-ui/melt-ui/blob/develop/src/lib/builders/calendar/create.ts
*/

import type { DateValue, DayOfWeek } from '@internationalized/date'
import type { Grid } from './types'
import type { DateRange } from '@/shared'
import { CalendarDate, endOfMonth, endOfYear, getDayOfWeek, GregorianCalendar, startOfMonth, startOfWeek, startOfYear, toCalendar, toCalendarDate } from '@internationalized/date'
import { getDaysInMonth, getLastFirstDayOfWeek, getNextLastDayOfWeek } from './comparators'
import { chunk } from './utils'

export type WeekDayFormat = 'narrow' | 'short' | 'long'

export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type CreateSelectProps = {
  /**
   * The date object representing the date (usually the first day of the month/year).
   */
  dateObj: DateValue
}

export type CreateMonthProps = {
  /**
   * The date object representing the month's date (usually the first day of the month).
   */
  dateObj: DateValue

  /**
   * The day of the week to start the calendar on (0 for Sunday, 1 for Monday, etc.).
   */
  weekStartsOn: WeekStartsOn

  /**
   * Whether to always render 6 weeks in the calendar, even if the month doesn't
   * span 6 weeks.
   */
  fixedWeeks: boolean

  /**
   * The locale to use when creating the calendar month.
   */
  locale: string
}

/**
 * Retrieves an array of date values representing the days between
 * the provided start and end dates.
 */
export function getDaysBetween(start: DateValue, end: DateValue) {
  const days: DateValue[] = []
  let dCurrent = start.add({ days: 1 })
  const dEnd = end
  while (dCurrent.compare(dEnd) < 0) {
    days.push(dCurrent)
    dCurrent = dCurrent.add({ days: 1 })
  }
  return days
}

export function createMonth(props: CreateMonthProps): Grid<DateValue> {
  const { dateObj, weekStartsOn, fixedWeeks, locale } = props
  const daysInMonth = getDaysInMonth(dateObj)

  const datesArray = Array.from({ length: daysInMonth }, (_, i) => dateObj.set({ day: i + 1 }))

  const firstDayOfMonth = startOfMonth(dateObj)
  const lastDayOfMonth = endOfMonth(dateObj)

  const lastSunday = getLastFirstDayOfWeek(firstDayOfMonth, weekStartsOn, locale)
  const nextSaturday = getNextLastDayOfWeek(lastDayOfMonth, weekStartsOn, locale)

  const lastMonthDays = getDaysBetween(lastSunday.subtract({ days: 1 }), firstDayOfMonth)
  const nextMonthDays = getDaysBetween(lastDayOfMonth, nextSaturday.add({ days: 1 }))

  const totalDays = lastMonthDays.length + datesArray.length + nextMonthDays.length

  if (fixedWeeks && totalDays < 42) {
    const extraDays = 42 - totalDays

    let startFrom = nextMonthDays.at(-1)

    if (!startFrom)
      startFrom = endOfMonth(dateObj)

    const extraDaysArray = Array.from({ length: extraDays }, (_, i) => {
      const incr = i + 1
      return startFrom.add({ days: incr })
    })
    nextMonthDays.push(...extraDaysArray)
  }

  const allDays = lastMonthDays.concat(datesArray, nextMonthDays)

  const weeks = chunk(allDays, 7)

  return {
    value: dateObj,
    cells: allDays,
    rows: weeks,
  }
}

type SetMonthProps = CreateMonthProps & {
  numberOfMonths: number | undefined
  currentMonths?: Grid<DateValue>[]
}

type SetYearProps = CreateSelectProps & {
  numberOfMonths?: number
  pagedNavigation?: boolean
}

type SetDecadeProps = CreateSelectProps & {
  startIndex?: number
  endIndex: number
}

/**
 * A continuous year number for decade alignment. `year` restarts in each era
 * (Japanese eras, BC / AD, ROC before / after Minguo), so multi-era calendars
 * are mapped onto one running count: the Gregorian-based calendars use the
 * proleptic Gregorian year (1 BC = 0), Ethiopic Amete Alem is offset onto Amete
 * Mihret, and the first era of the other two-era calendars counts backwards.
 */
function getExtendedYear(dateObj: DateValue): number {
  const eras = dateObj.calendar.getEras()
  if (eras.length <= 1)
    return dateObj.year
  const identifier = dateObj.calendar.identifier
  if (identifier === 'gregory' || identifier === 'japanese') {
    const gregorian = toCalendar(toCalendarDate(dateObj), new GregorianCalendar())
    return gregorian.era === 'BC' ? 1 - gregorian.year : gregorian.year
  }
  if (identifier === 'ethiopic' && dateObj.era === 'AA')
    return dateObj.year - 5500
  return dateObj.era === eras[0] ? 1 - dateObj.year : dateObj.year
}

export function startOfDecade(dateObj: DateValue) {
  // Round down to the nearest 10 on a continuous year count, then step back
  // with date arithmetic so era boundaries are crossed correctly.
  const offset = ((getExtendedYear(dateObj) % 10) + 10) % 10
  return startOfYear(startOfYear(dateObj).subtract({ years: offset }))
}

export function endOfDecade(dateObj: DateValue) {
  return endOfYear(startOfDecade(dateObj).add({ years: 9 }))
}

export function createDecade(props: SetDecadeProps): DateValue[] {
  const { dateObj, startIndex, endIndex } = props

  const decadeArray = Array.from({ length: Math.abs(startIndex ?? 0) + endIndex }, (_, i) =>
    i <= Math.abs((startIndex ?? 0))
      ? dateObj.subtract({ years: i }).set({ day: 1, month: 1 })
      : dateObj.add({ years: i - endIndex }).set({ day: 1, month: 1 }))

  decadeArray.sort((a: DateValue, b: DateValue) => a.year - b.year)

  return decadeArray
}

/**
 * The months of the year containing `dateObj`. The count comes from the
 * calendar (13 in a Hebrew leap year or the Ethiopic / Coptic calendars), and
 * the months are stepped with date arithmetic so a year spanning two eras
 * (Heisei 31 / Reiwa 1) is built correctly.
 */
export function createYear(props: SetYearProps): DateValue[] {
  const { dateObj, numberOfMonths = 1, pagedNavigation = false } = props
  const firstMonth = startOfYear(dateObj)
  const monthsInYear = dateObj.calendar.getMonthsInYear(firstMonth)

  if (numberOfMonths && pagedNavigation)
    return Array.from({ length: Math.floor(monthsInYear / numberOfMonths) }, (_, i) => startOfMonth(firstMonth.add({ months: i * numberOfMonths })))

  return Array.from({ length: monthsInYear }, (_, i) => startOfMonth(firstMonth.add({ months: i })))
}

export function createMonths(props: SetMonthProps) {
  const { numberOfMonths, dateObj, ...monthProps } = props

  const months: Grid<DateValue>[] = []

  if (!numberOfMonths || numberOfMonths === 1) {
    months.push(
      createMonth({
        ...monthProps,
        dateObj,
      }),
    )
    return months
  }

  months.push(
    createMonth({
      ...monthProps,
      dateObj,
    }),
  )

  // Create all the months, starting with the current month
  for (let i = 1; i < numberOfMonths; i++) {
    const nextMonth = dateObj.add({ months: i })
    months.push(
      createMonth({
        ...monthProps,
        dateObj: nextMonth,
      }),
    )
  }

  return months
}

/**
 * Normalises a layout count (`columns`, `yearsPerPage`, `numberOfMonths`) to a
 * positive integer: `NaN`, `Infinity`, non-numbers and values below 1 fall back
 * to `fallback`, fractions are floored. `chunk` never terminates at 0 and an
 * empty year page has no `value`, so every layout count passes through here.
 */
export function clampLayoutCount(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    return fallback
  const count = Math.floor(value)
  return count >= 1 ? count : fallback
}

/**
 * Creates a grid of the 12 months of the given year, `columns` per row
 * (default 4, i.e. 3 rows of 4).
 */
export function createMonthGrid(props: CreateSelectProps & { columns?: number }): Grid<DateValue> {
  const { dateObj } = props
  const columns = clampLayoutCount(props.columns, 4)
  const months = createYear({ dateObj })
  return { value: dateObj, cells: months, rows: chunk(months, columns) }
}

/**
 * Creates a grid of `yearsPerPage` years (default 12), `columns` per row
 * (default 4). When `decadeAligned` (the default) the grid starts from the
 * decade that contains the given date; otherwise it starts at the given year.
 */
export function createYearGrid(props: CreateSelectProps & { yearsPerPage?: number, decadeAligned?: boolean, columns?: number }): Grid<DateValue> {
  const { dateObj, decadeAligned = true } = props
  const yearsPerPage = clampLayoutCount(props.yearsPerPage, 12)
  const columns = clampLayoutCount(props.columns, 4)

  // Step from the first year with date arithmetic (not `set({ year })`): the
  // `year` field restarts in each era, so a page may cross an era boundary.
  const firstYear = decadeAligned ? startOfDecade(dateObj) : startOfYear(dateObj)
  const years = Array.from({ length: yearsPerPage }, (_, i) => startOfYear(firstYear.add({ years: i })))
  return { value: years[0], cells: years, rows: chunk(years, columns) }
}

export function createYearRange({ start, end }: DateRange): DateValue[] {
  const years: DateValue[] = []

  if (!start || !end)
    return years

  let current = startOfYear(start)

  while (current.compare(end) <= 0) {
    years.push(current)
    // Move to the first day of the next year
    current = startOfYear(current.add({ years: 1 }))
  }

  return years
}

export function createDateRange({ start, end }: DateRange): DateValue[] {
  const dates: DateValue[] = []

  if (!start || !end)
    return dates

  let current = start

  while (current.compare(end) <= 0) {
    dates.push(current)
    current = current.add({ days: 1 })
  }

  return dates
}

/**
 * It's better to use `getWeekStart` from `@internationalized/date`,
 * but sadly it is not yet exported from the package.
 * And the `Intl.Locale` API is not supported well enough yet.
 */
export function getWeekStartsOn(locale: string): WeekStartsOn {
  // Jan 6, 2025 is a Monday (ISO day = 1)
  const monday = new CalendarDate(2025, 1, 6)
  const dayOfWeek = getDayOfWeek(monday, locale)
  // dayOfWeek tells us Monday's position in the locale's week (0-indexed)
  // If Monday is position 0 → week starts Monday (1)
  // If Monday is position 1 → week starts Sunday (0)
  return (1 - dayOfWeek + 7) % 7 as WeekStartsOn
}

/**
 * Returns the locale-specific week number
 */
export function getWeekNumber(date: DateValue, locale: string = 'en-US', firstDayOfWeek?: DayOfWeek): number {
  const jan1 = new CalendarDate(date.year, 1, 1)

  // Detect ISO locale by comparing JS day of week with locale day of week
  const usesISOWeek = jan1.toDate('UTC').getUTCDay() !== getDayOfWeek(jan1, locale)
  const weekStartsOn = firstDayOfWeek ?? (usesISOWeek ? 'mon' : 'sun')
  const firstWeekContainsDate = usesISOWeek ? 4 : 1

  // Find the "deciding day" - its year determines which year's week numbering to use
  const dayOfWeek = getDayOfWeek(date, locale, weekStartsOn)
  const decidingDay = date.add({ days: 7 - firstWeekContainsDate - dayOfWeek })
  const weekYear = decidingDay.year

  // Calculate week number from week 1 start
  const week1Ref = new CalendarDate(weekYear, 1, firstWeekContainsDate)
  const week1Start = startOfWeek(week1Ref, locale, weekStartsOn)
  const currentWeekStart = startOfWeek(date, locale, weekStartsOn)

  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
  const daysDiff = Math.round(
    (currentWeekStart.toDate('UTC').getTime() - week1Start.toDate('UTC').getTime())
    / MS_PER_WEEK,
  )
  return daysDiff + 1
}
