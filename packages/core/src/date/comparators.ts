import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { toCalendar } from '@/temporal/calendar'
import { areAllDaysBetweenValid, endOfMonth, endOfYear, getDayOfWeek, getDaysInMonth, isAfter, isAfterOrSame, isBefore, isBeforeOrSame, isBetween, isBetweenInclusive, isPlainDateTime, isZonedDateTime, startOfMonth, startOfYear, toPlainDate } from '@/temporal/comparators'
import { toNativeDate } from '@/temporal/conversion-policy'

/**
 * Given a date string and a reference `DateValue` object, parse the
 * string to the same type as the reference object.
 *
 * Useful for parsing strings from data attributes, which are always
 * strings, to the same type being used by the date component.
 */
export function parseStringToDateValue(dateStr: string, referenceVal: TemporalDate): TemporalDate {
  let dateValue: TemporalDate
  if (isZonedDateTime(referenceVal))
    dateValue = Temporal.ZonedDateTime.from(dateStr)
  else if (isPlainDateTime(referenceVal))
    dateValue = Temporal.PlainDateTime.from(dateStr)
  else
    dateValue = Temporal.PlainDate.from(dateStr)

  return dateValue.calendarId !== referenceVal.calendarId
    ? toCalendar(dateValue, referenceVal.calendarId as Parameters<typeof toCalendar>[1])
    : dateValue
}

/**
 * Given a `DateValue` object, convert it to a native `Date` object.
 * If a timezone is provided, the date will be converted to that timezone.
 * If no timezone is provided, the date will be converted to the local timezone.
 *
 * Delegates to the canonical {@link toNativeDate} from the conversion policy seam.
 */
export function toDate(dateValue: TemporalDate, tz?: string) {
  return toNativeDate(dateValue, tz ? { timeZone: tz } : undefined)
}

export function isSameYear(date1: TemporalDate, date2: TemporalDate) {
  return toPlainDate(date1).year === toPlainDate(date2).year
}

export function isSameYearMonth(date1: TemporalDate, date2: TemporalDate) {
  const d1 = toPlainDate(date1)
  const d2 = toPlainDate(date2)
  return d1.year === d2.year && d1.month === d2.month
}

export function compareYearMonth(date1: TemporalDate, date2: TemporalDate) {
  const d1 = toPlainDate(date1)
  const d2 = toPlainDate(date2)
  if (d1.year !== d2.year)
    return d1.year - d2.year
  return d1.month - d2.month
}

export function getMonthsBetween(start: TemporalDate, end: TemporalDate) {
  const s = toPlainDate(start)
  const e = toPlainDate(end)
  return Math.abs((e.year - s.year) * 12 + (e.month - s.month)) + 1
}

export function getYearsBetween(start: TemporalDate, end: TemporalDate) {
  return Math.abs(toPlainDate(end).year - toPlainDate(start).year) + 1
}

export function isMonthBetweenInclusive(date: TemporalDate, start: TemporalDate, end: TemporalDate) {
  return compareYearMonth(date, start) >= 0 && compareYearMonth(date, end) <= 0
}

export function isYearBetweenInclusive(date: TemporalDate, start: TemporalDate, end: TemporalDate) {
  const y = toPlainDate(date).year
  const ys = toPlainDate(start).year
  const ye = toPlainDate(end).year
  return y >= ys && y <= ye
}

export function areAllMonthsBetweenValid(
  start: TemporalDate,
  end: TemporalDate,
  isUnavailable: ((date: TemporalDate) => boolean) | undefined,
  isDisabled: ((date: TemporalDate) => boolean) | undefined,
) {
  let current = startOfMonth(start).add({ months: 1 })
  const endMonth = startOfMonth(end)

  while (Temporal.PlainDate.compare(current, endMonth) < 0) {
    if (isUnavailable?.(current) || isDisabled?.(current))
      return false
    current = current.add({ months: 1 })
  }

  return true
}

export function areAllYearsBetweenValid(
  start: TemporalDate,
  end: TemporalDate,
  isUnavailable: ((date: TemporalDate) => boolean) | undefined,
  isDisabled: ((date: TemporalDate) => boolean) | undefined,
) {
  let current = startOfYear(start).add({ years: 1 })
  const endYearDate = startOfYear(end)

  while (Temporal.PlainDate.compare(current, endYearDate) < 0) {
    if (isUnavailable?.(current) || isDisabled?.(current))
      return false
    current = current.add({ years: 1 })
  }

  return true
}

export { areAllDaysBetweenValid, endOfMonth, endOfYear, getDayOfWeek, getDaysInMonth, isAfter, isAfterOrSame, isBefore, isBeforeOrSame, isBetween, isBetweenInclusive, startOfMonth, startOfYear, toPlainDate }
