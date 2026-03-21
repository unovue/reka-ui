/*
 * Date comparison utilities using the Temporal API.
 */

import type { Matcher, TemporalDate, TemporalDateTime, TemporalTime } from './types'
import type { DayOfWeek, Granularity } from '@/shared/date'
import { Temporal } from 'temporal-polyfill'

// Type guards
export function isPlainDate(date: TemporalDate): date is Temporal.PlainDate {
  return date instanceof Temporal.PlainDate
}

export function isPlainDateTime(date: TemporalDate): date is Temporal.PlainDateTime {
  return date instanceof Temporal.PlainDateTime
}

export function isZonedDateTime(date: TemporalDate | TemporalDateTime): date is Temporal.ZonedDateTime {
  return date instanceof Temporal.ZonedDateTime
}

type LocaleWeekInfo = {
  firstDay?: number
  minimalDays?: number
}

export function getLocaleWeekInfo(locale: string): LocaleWeekInfo | undefined {
  return (new Intl.Locale(locale) as Intl.Locale & { weekInfo?: LocaleWeekInfo }).weekInfo
}

export function hasTime(date: TemporalDate): boolean {
  return isPlainDateTime(date) || isZonedDateTime(date)
}

export function toPlainDate(date: TemporalDate): Temporal.PlainDate {
  const value = date as any

  if (isPlainDate(value))
    return value

  if (value && typeof value.toPlainDate === 'function')
    return value.toPlainDate()

  if (value && typeof value.year === 'number' && typeof value.month === 'number') {
    return Temporal.PlainDate.from({
      year: value.year,
      month: value.month,
      day: typeof value.day === 'number' ? value.day : 1,
    })
  }

  return Temporal.PlainDate.from(String(value))
}

// Comparison functions
export function isSameDay(date1: TemporalDate, date2: TemporalDate): boolean {
  if (isPlainDate(date1) && isPlainDate(date2)) {
    return Temporal.PlainDate.compare(date1, date2) === 0
  }

  // For date-time types, compare the date parts
  const d1 = toPlainDate(date1)
  const d2 = toPlainDate(date2)
  return Temporal.PlainDate.compare(d1, d2) === 0
}

export function isEqualMonth(date1: TemporalDate, date2: TemporalDate): boolean {
  const d1 = toPlainDate(date1)
  const d2 = toPlainDate(date2)
  return d1.year === d2.year && d1.month === d2.month
}

export function isBefore(dateToCompare: TemporalDate, referenceDate: TemporalDate): boolean {
  return Temporal.PlainDate.compare(
    toPlainDate(dateToCompare),
    toPlainDate(referenceDate),
  ) < 0
}

export function isAfter(dateToCompare: TemporalDate, referenceDate: TemporalDate): boolean {
  return Temporal.PlainDate.compare(
    toPlainDate(dateToCompare),
    toPlainDate(referenceDate),
  ) > 0
}

export function isBeforeOrSame(dateToCompare: TemporalDate, referenceDate: TemporalDate): boolean {
  return Temporal.PlainDate.compare(
    toPlainDate(dateToCompare),
    toPlainDate(referenceDate),
  ) <= 0
}

export function isAfterOrSame(dateToCompare: TemporalDate, referenceDate: TemporalDate): boolean {
  return Temporal.PlainDate.compare(
    toPlainDate(dateToCompare),
    toPlainDate(referenceDate),
  ) >= 0
}

export function isBetweenInclusive(date: TemporalDate, start: TemporalDate, end: TemporalDate): boolean {
  return isAfterOrSame(date, start) && isBeforeOrSame(date, end)
}

export function isBetween(date: TemporalDate, start: TemporalDate, end: TemporalDate): boolean {
  return isAfter(date, start) && isBefore(date, end)
}

// Date boundary functions
export function startOfMonth(date: TemporalDate): Temporal.PlainDate {
  const plainDate = toPlainDate(date)
  return plainDate.with({ day: 1 })
}

export function endOfMonth(date: TemporalDate): Temporal.PlainDate {
  const plainDate = toPlainDate(date)
  return plainDate.with({ day: plainDate.daysInMonth })
}

export function startOfYear(date: TemporalDate): Temporal.PlainDate {
  const plainDate = toPlainDate(date)
  return plainDate.with({ month: 1, day: 1 })
}

export function endOfYear(date: TemporalDate): Temporal.PlainDate {
  const plainDate = toPlainDate(date)
  return plainDate.with({ month: 12, day: 31 })
}

// Date checks
export function isToday(date: TemporalDate): boolean {
  const today = Temporal.Now.plainDateISO()
  const dateToCheck = toPlainDate(date)
  return isSameDay(dateToCheck, today)
}

export function isWeekend(date: TemporalDate): boolean {
  const plainDate = toPlainDate(date)
  const dayOfWeek = plainDate.dayOfWeek
  return dayOfWeek === 6 || dayOfWeek === 7 // Saturday = 6, Sunday = 7 in ISO
}

// Utility functions
export function getDaysInMonth(date: TemporalDate): number {
  const plainDate = toPlainDate(date)
  return plainDate.daysInMonth
}

export function getDayOfWeek(date: TemporalDate, locale = 'en-US', firstDayOfWeek?: DayOfWeek): number {
  const plainDate = toPlainDate(date)
  const isoDay = plainDate.dayOfWeek % 7

  let weekStart = 0
  const explicit = firstDayOfWeek as unknown as string | undefined

  if (explicit) {
    const map: Record<string, number> = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    }
    weekStart = map[explicit] ?? 0
  }
  else {
    const localeWeekStart = getLocaleWeekInfo(locale)?.firstDay
    if (localeWeekStart)
      weekStart = localeWeekStart % 7
  }

  return (isoDay - weekStart + 7) % 7
}

export function getLastFirstDayOfWeek<T extends TemporalDate = TemporalDate>(
  date: T,
  firstDayOfWeek: number,
  locale: string,
): T {
  const day = getDayOfWeek(date, locale)

  if (firstDayOfWeek > day)
    return date.subtract({ days: day + 7 - firstDayOfWeek }) as T

  if (firstDayOfWeek === day)
    return date as T

  return date.subtract({ days: day - firstDayOfWeek }) as T
}

export function getNextLastDayOfWeek<T extends TemporalDate = TemporalDate>(
  date: T,
  firstDayOfWeek: number,
  locale: string,
): T {
  const day = getDayOfWeek(date, locale)
  const lastDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  if (day === lastDayOfWeek)
    return date as T

  if (day > lastDayOfWeek)
    return date.add({ days: 7 - day + lastDayOfWeek }) as T

  return date.add({ days: lastDayOfWeek - day }) as T
}

// Default date/time creation
export function getDefaultDate(props: {
  defaultValue?: TemporalDate | TemporalDate[]
  defaultPlaceholder?: TemporalDate
  granularity?: Granularity
  locale?: string
}): TemporalDate {
  const { defaultValue, defaultPlaceholder, granularity = 'day' } = props

  if (Array.isArray(defaultValue) && defaultValue.length) {
    return defaultValue.at(-1)!
  }

  if (defaultValue && !Array.isArray(defaultValue)) {
    return defaultValue
  }

  if (defaultPlaceholder) {
    return defaultPlaceholder
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  if (granularity === 'day') {
    return Temporal.PlainDate.from({ year, month, day })
  }
  else {
    // For time-based granularities, create PlainDateTime
    return Temporal.PlainDateTime.from({ year, month, day, hour: 0, minute: 0, second: 0 })
  }
}

export function getDefaultTime(props: {
  defaultValue?: TemporalTime
  defaultPlaceholder?: TemporalTime
}): TemporalTime {
  const { defaultValue, defaultPlaceholder } = props

  if (defaultValue) {
    return defaultValue
  }

  if (defaultPlaceholder) {
    return defaultPlaceholder
  }

  return Temporal.PlainTime.from({ hour: 0, minute: 0, second: 0 })
}

// Array utilities
export function areAllDaysBetweenValid(
  start: TemporalDate,
  end: TemporalDate,
  isUnavailable: Matcher | undefined,
  isDisabled: Matcher | undefined,
  isHighlightable?: Matcher | undefined,
): boolean {
  if (isUnavailable === undefined && isDisabled === undefined && isHighlightable === undefined) {
    return true
  }

  const startDate = toPlainDate(start)
  const endDate = toPlainDate(end)
  let dCurrent = startDate.add({ days: 1 })
  if ((isDisabled?.(dCurrent) || isUnavailable?.(dCurrent)) && !isHighlightable?.(dCurrent)) {
    return false
  }

  while (Temporal.PlainDate.compare(dCurrent, endDate) < 0) {
    dCurrent = dCurrent.add({ days: 1 })
    if ((isDisabled?.(dCurrent) || isUnavailable?.(dCurrent)) && !isHighlightable?.(dCurrent)) {
      return false
    }
  }
  return true
}
