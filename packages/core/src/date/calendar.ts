/*
 * Implementation ported from from from https://github.com/melt-ui/melt-ui/blob/develop/src/lib/builders/calendar/create.ts
*/

import type { Grid } from './types'
import type { DateRange } from '@/shared'
import type { DayOfWeek } from '@/shared/date'
import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { endOfMonth, endOfYear, getDayOfWeek, getDaysInMonth, getLastFirstDayOfWeek, getNextLastDayOfWeek, startOfMonth, startOfYear, toPlainDate } from '@/temporal/comparators'
import { chunk } from './utils'

export type WeekDayFormat = 'narrow' | 'short' | 'long'

export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6

function normalizeTemporalDate(dateObj: TemporalDate): TemporalDate {
  const value = dateObj as any

  if (value && typeof value.with === 'function' && typeof value.add === 'function')
    return value as TemporalDate

  if (value && typeof value.year === 'number' && typeof value.month === 'number') {
    return Temporal.PlainDate.from({
      year: value.year,
      month: value.month,
      day: typeof value.day === 'number' ? value.day : 1,
    })
  }

  return Temporal.PlainDate.from(String(value))
}

export type CreateSelectProps = {
  /**
   * The date object representing the date (usually the first day of the month/year).
   */
  dateObj: TemporalDate
}

export type CreateMonthProps = {
  /**
   * The date object representing the month's date (usually the first day of the month).
   */
  dateObj: TemporalDate

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
export function getDaysBetween(start: TemporalDate, end: TemporalDate) {
  const days: TemporalDate[] = []
  const startDate = toPlainDate(start)
  const endDate = toPlainDate(end)
  let dCurrent = startDate.add({ days: 1 })
  while (Temporal.PlainDate.compare(dCurrent, endDate) < 0) {
    days.push(dCurrent)
    dCurrent = dCurrent.add({ days: 1 })
  }
  return days
}

export function createMonth(props: CreateMonthProps): Grid<TemporalDate> {
  const { weekStartsOn, fixedWeeks, locale } = props
  const dateObj = normalizeTemporalDate(props.dateObj)
  const daysInMonth = getDaysInMonth(dateObj)

  const datesArray = Array.from({ length: daysInMonth }, (_, i) => dateObj.with({ day: i + 1 }))

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
  currentMonths?: Grid<TemporalDate>[]
}

type SetYearProps = CreateSelectProps & {
  numberOfMonths?: number
  pagedNavigation?: boolean
}

type SetDecadeProps = CreateSelectProps & {
  startIndex?: number
  endIndex: number
}

export function startOfDecade(dateObj: TemporalDate) {
  dateObj = normalizeTemporalDate(dateObj)
  // round to the lowest nearest 10 when building the decade
  return startOfYear(dateObj.subtract({ years: dateObj.year - Math.floor(dateObj.year / 10) * 10 }).with({ day: 1, month: 1 }))
}

export function endOfDecade(dateObj: TemporalDate) {
  dateObj = normalizeTemporalDate(dateObj)
  // round to the lowest nearest 10 when building the decade
  return endOfYear(dateObj.add({ years: Math.ceil((dateObj.year + 1) / 10) * 10 - dateObj.year - 1 }).with({ day: 35, month: 12 }))
}

export function createDecade(props: SetDecadeProps): TemporalDate[] {
  const { startIndex, endIndex } = props
  const dateObj = normalizeTemporalDate(props.dateObj)

  const decadeArray = Array.from({ length: Math.abs(startIndex ?? 0) + endIndex }, (_, i) =>
    i <= Math.abs((startIndex ?? 0))
      ? dateObj.subtract({ years: i }).with({ day: 1, month: 1 })
      : dateObj.add({ years: i - endIndex }).with({ day: 1, month: 1 }))

  decadeArray.sort((a: TemporalDate, b: TemporalDate) => a.year - b.year)

  return decadeArray
}

export function createYear(props: SetYearProps): TemporalDate[] {
  const { numberOfMonths = 1, pagedNavigation = false } = props
  const dateObj = normalizeTemporalDate(props.dateObj)

  if (numberOfMonths && pagedNavigation) {
    const monthsArray = Array.from({ length: Math.floor(12 / numberOfMonths) }, (_, i) =>
      Temporal.PlainDate.from({ year: dateObj.year, month: i * numberOfMonths + 1, day: 1 }))

    return monthsArray
  }

  const monthsArray = Array.from({ length: 12 }, (_, i) =>
    Temporal.PlainDate.from({ year: dateObj.year, month: i + 1, day: 1 }))
  return monthsArray
}

export function createMonths(props: SetMonthProps) {
  const { numberOfMonths, ...monthProps } = props
  const dateObj = normalizeTemporalDate(props.dateObj)

  const months: Grid<TemporalDate>[] = []

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
 * Creates a 3x4 grid of months for a given year.
 */
export function createMonthGrid(props: CreateSelectProps): Grid<TemporalDate> {
  const dateObj = normalizeTemporalDate(props.dateObj)
  const months = createYear({ dateObj })
  return { value: dateObj, cells: months, rows: chunk(months, 4) }
}

/**
 * Creates a 3x4 grid of years (decade-aligned).
 * The grid starts from the decade that contains the given date.
 */
export function createYearGrid(props: CreateSelectProps & { yearsPerPage?: number, decadeAligned?: boolean }): Grid<TemporalDate> {
  const { yearsPerPage = 12, decadeAligned = true } = props
  const dateObj = normalizeTemporalDate(props.dateObj)

  let startYear: number
  if (decadeAligned) {
    startYear = startOfDecade(dateObj).year
  }
  else {
    startYear = dateObj.year
  }

  const years = Array.from({ length: yearsPerPage }, (_, i) => startOfYear(dateObj.with({ year: startYear + i })))
  const firstYear = years[0]
  return { value: firstYear, cells: years, rows: chunk(years, 4) }
}

export function createYearRange({ start, end }: DateRange): TemporalDate[] {
  const years: TemporalDate[] = []

  if (!start || !end)
    return years

  const startDate = toPlainDate(start)
  const endDate = toPlainDate(end)
  let current = startOfYear(startDate)

  while (Temporal.PlainDate.compare(toPlainDate(current), endDate) <= 0) {
    years.push(current)
    // Move to the first day of the next year
    current = startOfYear(current.add({ years: 1 }))
  }

  return years
}

export function createDateRange({ start, end }: DateRange): TemporalDate[] {
  const dates: TemporalDate[] = []

  if (!start || !end)
    return dates

  let current = toPlainDate(start)
  const endDate = toPlainDate(end)

  while (Temporal.PlainDate.compare(toPlainDate(current), endDate) <= 0) {
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
  const firstDay = new Intl.Locale(locale).weekInfo?.firstDay
  return ((firstDay ?? 7) % 7) as WeekStartsOn
}

/**
 * Returns the locale-specific week number
 */
export function getWeekNumber(date: TemporalDate, locale: string = 'en-US', firstDayOfWeek?: DayOfWeek): number {
  const plainDate = toPlainDate(date)

  const explicitFirstDay = firstDayOfWeek as unknown as string | undefined
  const firstDayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
  const localeWeekInfo = new Intl.Locale(locale).weekInfo
  const minimalDays = localeWeekInfo?.minimalDays ?? 1

  const getWeek1Start = (year: number) => {
    const jan1 = Temporal.PlainDate.from({ year, month: 1, day: 1 })
    const jan1Offset = getDayOfWeek(jan1, locale, firstDayOfWeek)
    const weekStart = jan1.subtract({ days: jan1Offset })
    const daysInNewYear = 7 - jan1Offset
    return daysInNewYear >= minimalDays ? weekStart : weekStart.add({ days: 7 })
  }

  const thisYearWeek1 = getWeek1Start(plainDate.year)
  if (Temporal.PlainDate.compare(plainDate, thisYearWeek1) < 0)
    return getWeekNumber(Temporal.PlainDate.from({ year: plainDate.year - 1, month: 12, day: 31 }), locale, firstDayOfWeek)

  const nextYearWeek1 = getWeek1Start(plainDate.year + 1)
  if (Temporal.PlainDate.compare(plainDate, nextYearWeek1) >= 0)
    return 1

  const daysSinceWeek1 = thisYearWeek1.until(plainDate, { largestUnit: 'day' }).days
  return Math.floor(daysSinceWeek1 / 7) + 1
}
