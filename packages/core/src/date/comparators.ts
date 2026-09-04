import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { toCalendar } from '@/temporal/calendar'
import { areAllDaysBetweenValid, areAllMonthsBetweenValid, areAllYearsBetweenValid, compareYearMonth, endOfMonth, endOfYear, getDayOfWeek, getDaysInMonth, getMonthsBetween, getYearsBetween, isAfter, isAfterOrSame, isBefore, isBeforeOrSame, isBetween, isBetweenInclusive, isMonthBetweenInclusive, isPlainDateTime, isSameYear, isSameYearMonth, isYearBetweenInclusive, isZonedDateTime, startOfMonth, startOfYear, toPlainDate } from '@/temporal/comparators'
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

// Compatibility shim — re-exports moved helpers from temporal/comparators.
// These were previously defined here; new code should import from temporal.
export {
  areAllDaysBetweenValid,
  areAllMonthsBetweenValid,
  areAllYearsBetweenValid,
  compareYearMonth,
  endOfMonth,
  endOfYear,
  getDayOfWeek,
  getDaysInMonth,
  getMonthsBetween,
  getYearsBetween,
  isAfter,
  isAfterOrSame,
  isBefore,
  isBeforeOrSame,
  isBetween,
  isBetweenInclusive,
  isMonthBetweenInclusive,
  isSameYear,
  isSameYearMonth,
  isYearBetweenInclusive,
  startOfMonth,
  startOfYear,
  toPlainDate,
}
