import type { DateValue } from '@internationalized/date'
import type { Matcher } from './types'
import { CalendarDateTime, getDayOfWeek, getLocalTimeZone, parseDate, parseDateTime, parseZonedDateTime, startOfMonth, startOfYear, toCalendar, toCalendarDate, ZonedDateTime } from '@internationalized/date'

/**
 * Given a date string and a reference `DateValue` object, parse the
 * string to the same type as the reference object.
 *
 * Useful for parsing strings from data attributes, which are always
 * strings, to the same type being used by the date component.
 */
export function parseStringToDateValue(dateStr: string, referenceVal: DateValue): DateValue {
  let dateValue: DateValue
  if (isZonedDateTime(referenceVal))
    dateValue = parseZonedDateTime(dateStr)

  else if (isCalendarDateTime(referenceVal))
    dateValue = parseDateTime(dateStr)

  else
    dateValue = parseDate(dateStr)

  return dateValue.calendar !== referenceVal.calendar ? toCalendar(dateValue, referenceVal.calendar) : dateValue
}

/**
 * Given a `DateValue` object, convert it to a native `Date` object.
 * If a timezone is provided, the date will be converted to that timezone.
 * If no timezone is provided, the date will be converted to the local timezone.
 */
export function toDate(dateValue: DateValue, tz: string = getLocalTimeZone()) {
  if (isZonedDateTime(dateValue))
    return dateValue.toDate()
  else
    return dateValue.toDate(tz)
}

export function isCalendarDateTime(dateValue: DateValue): dateValue is CalendarDateTime {
  return dateValue instanceof CalendarDateTime
}

export function isZonedDateTime(dateValue: DateValue): dateValue is ZonedDateTime {
  return dateValue instanceof ZonedDateTime
}

export function hasTime(dateValue: DateValue) {
  return isCalendarDateTime(dateValue) || isZonedDateTime(dateValue)
}

/**
 * Given a date, return the number of days in the month.
 */
export function getDaysInMonth(date: Date | DateValue) {
  if (date instanceof Date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    /**
     * By using zero as the day, we get the
     * last day of the previous month, which
     * is the month we originally passed in.
     */
    return new Date(year, month, 0).getDate()
  }
  else {
    return date.set({ day: 100 }).day
  }
}

/**
 * Determine if a date is before the reference date.
 * @param dateToCompare - is this date before the `referenceDate`
 * @param referenceDate - is the `dateToCompare` before this date
 *
 * @see {@link isBeforeOrSame} for inclusive
 */
export function isBefore(dateToCompare: DateValue, referenceDate: DateValue) {
  return dateToCompare.compare(referenceDate) < 0
}

/**
 * Determine if a date is after the reference date.
 * @param dateToCompare - is this date after the `referenceDate`
 * @param referenceDate - is the `dateToCompare` after this date
 *
 * @see {@link isAfterOrSame} for inclusive
 */
export function isAfter(dateToCompare: DateValue, referenceDate: DateValue) {
  return dateToCompare.compare(referenceDate) > 0
}

/**
 * Determine if a date is before or the same as the reference date.
 *
 * @param dateToCompare - the date to compare
 * @param referenceDate - the reference date to make the comparison against
 *
 * @see {@link isBefore} for non-inclusive
 */
export function isBeforeOrSame(dateToCompare: DateValue, referenceDate: DateValue) {
  return dateToCompare.compare(referenceDate) <= 0
}

/**
 * Determine if a date is after or the same as the reference date.
 *
 * @param dateToCompare - is this date after or the same as the `referenceDate`
 * @param referenceDate - is the `dateToCompare` after or the same as this date
 *
 * @see {@link isAfter} for non-inclusive
 */
export function isAfterOrSame(dateToCompare: DateValue, referenceDate: DateValue) {
  return dateToCompare.compare(referenceDate) >= 0
}

/**
 * Determine if a date is inclusively between a start and end reference date.
 *
 * @param date - is this date inclusively between the `start` and `end` dates
 * @param start - the start reference date to make the comparison against
 * @param end - the end reference date to make the comparison against
 *
 * @see {@link isBetween} for non-inclusive
 */
export function isBetweenInclusive(date: DateValue, start: DateValue, end: DateValue) {
  return isAfterOrSame(date, start) && isBeforeOrSame(date, end)
}

/**
 * Determine if a date is between a start and end reference date.
 *
 * @param date - is this date between the `start` and `end` dates
 * @param start - the start reference date to make the comparison against
 * @param end - the end reference date to make the comparison against
 *
 * @see {@link isBetweenInclusive} for inclusive
 */
export function isBetween(date: DateValue, start: DateValue, end: DateValue) {
  return isAfter(date, start) && isBefore(date, end)
}

export function getLastFirstDayOfWeek<T extends DateValue = DateValue>(
  date: T,
  firstDayOfWeek: number,
  locale: string,
): T {
  /**
   * "firstDayOfWeek" is fixed to 0(Sunday) to avoid confusion regarding locales.
   * This also aligns with other date libraries, e.g., date-fns.
   *
   * #see https://github.com/unovue/reka-ui/issues/2157
   */
  const day = getDayOfWeek(date, locale, 'sun')

  if (firstDayOfWeek > day)
    return date.subtract({ days: day + 7 - firstDayOfWeek }) as T

  if (firstDayOfWeek === day)
    return date as T

  return date.subtract({ days: day - firstDayOfWeek }) as T
}

export function getNextLastDayOfWeek<T extends DateValue = DateValue>(
  date: T,
  firstDayOfWeek: number,
  locale: string,
): T {
  /**
   * "firstDayOfWeek" is fixed to 0(Sunday) to avoid confusion regarding locales.
   * This also aligns with other date libraries, e.g., date-fns.
   *
   * #see https://github.com/unovue/reka-ui/issues/2157
   */
  const day = getDayOfWeek(date, locale, 'sun')

  const lastDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  if (day === lastDayOfWeek)
    return date as T

  if (day > lastDayOfWeek)
    return date.add({ days: 7 - day + lastDayOfWeek }) as T

  return date.add({ days: lastDayOfWeek - day }) as T
}

export type DateSelection = DateValue | DateValue[] | null | undefined

/**
 * Whether two controlled selections describe the same period.
 * A new object for the same day, month, or year is still the same selection.
 */
export function isSameDateSelection(
  left: DateSelection,
  right: DateSelection,
  isSame: (a: DateValue, b: DateValue) => boolean,
) {
  if (left === right)
    return true

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length)
      return false

    return left.every((item, index) => {
      const other = right[index]
      return !!other && isSame(item, other)
    })
  }

  if (!left || !right)
    return false

  return isSame(left, right)
}

/**
 * Whether two dates are the exact same value, including calendar system, time, offset, and time zone.
 * `compare()` alone treats the same instant in two zones as equal, and `toString()`
 * serializes every calendar system as Gregorian.
 */
export function isSameDateValue(a: DateValue, b: DateValue) {
  return a.calendar.identifier === b.calendar.identifier
    && a.toString() === b.toString()
}

/** The date that should drive the visible page: the last multiple value, otherwise the value itself. */
export function focusedDateValue(value: DateSelection) {
  if (Array.isArray(value))
    return value.at(-1)

  return value
}

/**
 * The first day of the month / year containing `date`, as a `CalendarDate`
 * (time and zone dropped). Comparing these instead of the raw `year` / `month`
 * fields is era-safe (Japanese eras, BC dates) and works across calendars.
 */
function monthStart(date: DateValue) {
  return toCalendarDate(startOfMonth(date))
}

function yearStart(date: DateValue) {
  return toCalendarDate(startOfYear(date))
}

/**
 * Inclusive number of `unit`s from `start` to `end`. Counted by stepping, so
 * eras and calendars with a varying number of months per year are handled.
 * When `end` is before `start` the result is `2 - count(end..start)`, the same
 * as subtracting the field values.
 */
function countPeriods(start: DateValue, end: DateValue, unit: 'months' | 'years') {
  const toStart = unit === 'months' ? monthStart : yearStart
  const step = unit === 'months' ? { months: 1 } : { years: 1 }
  const from = toStart(start)
  const to = toStart(end)
  const forward = to.compare(from) >= 0
  const [low, high] = forward ? [from, to] : [to, from]
  let count = 1
  let current = low
  while (current.compare(high) < 0) {
    current = toStart(current.add(step))
    count++
  }
  return forward ? count : 2 - count
}

/**
 * Check if two dates are in the same year and month.
 */
export function isSameYearMonth(a: DateValue, b: DateValue): boolean {
  return compareYearMonth(a, b) === 0
}

/**
 * Check if two dates are in the same year.
 */
export function isSameYear(a: DateValue, b: DateValue): boolean {
  return compareYear(a, b) === 0
}

export function areAllDaysBetweenValid(
  start: DateValue,
  end: DateValue,
  isUnavailable: Matcher | undefined,
  isDisabled: Matcher | undefined,
  isHighlightable?: Matcher | undefined,
) {
  if (isUnavailable === undefined && isDisabled === undefined && isHighlightable === undefined)
    return true

  let dCurrent = start.add({ days: 1 })
  if ((isDisabled?.(dCurrent, 'day') || isUnavailable?.(dCurrent, 'day'))
    && !isHighlightable?.(dCurrent, 'day')) {
    return false
  }

  const dEnd = end
  while (dCurrent.compare(dEnd) < 0) {
    dCurrent = dCurrent.add({ days: 1 })
    if ((isDisabled?.(dCurrent, 'day') || isUnavailable?.(dCurrent, 'day'))
      && !isHighlightable?.(dCurrent, 'day')) {
      return false
    }
  }
  return true
}

/**
 * Compare two dates by year and month only (ignoring day).
 */
export function compareYearMonth(a: DateValue, b: DateValue): number {
  return monthStart(a).compare(monthStart(b))
}

/**
 * Compare two dates by year only (ignoring month and day). Era-safe.
 */
export function compareYear(a: DateValue, b: DateValue): number {
  return yearStart(a).compare(yearStart(b))
}

/**
 * Check if a date's month is between start and end (inclusive), comparing year+month only.
 */
export function isMonthBetweenInclusive(date: DateValue, start: DateValue, end: DateValue): boolean {
  return compareYearMonth(date, start) >= 0 && compareYearMonth(date, end) <= 0
}

/**
 * Check if a date's year is between start and end (inclusive), comparing year only.
 */
export function isYearBetweenInclusive(date: DateValue, start: DateValue, end: DateValue): boolean {
  return compareYear(date, start) >= 0 && compareYear(date, end) <= 0
}

/**
 * Get the number of months between two dates (inclusive).
 */
export function getMonthsBetween(start: DateValue, end: DateValue): number {
  return countPeriods(start, end, 'months')
}

/**
 * Get the number of years between two dates (inclusive).
 */
export function getYearsBetween(start: DateValue, end: DateValue): number {
  return countPeriods(start, end, 'years')
}

/**
 * Check if all months between start and end are valid (not unavailable/disabled).
 */
export function areAllMonthsBetweenValid(
  start: DateValue,
  end: DateValue,
  isUnavailable: Matcher | undefined,
  isDisabled: Matcher | undefined,
  isHighlightable?: Matcher | undefined,
): boolean {
  if (isUnavailable === undefined && isDisabled === undefined && isHighlightable === undefined)
    return true

  let current = startOfMonth(start)

  while (compareYearMonth(current, end) <= 0) {
    if ((isDisabled?.(current, 'month') || isUnavailable?.(current, 'month')) && !isHighlightable?.(current, 'month'))
      return false
    current = startOfMonth(current.add({ months: 1 }))
  }
  return true
}

/**
 * Check if all years between start and end are valid (not unavailable/disabled).
 */
export function areAllYearsBetweenValid(
  start: DateValue,
  end: DateValue,
  isUnavailable: Matcher | undefined,
  isDisabled: Matcher | undefined,
  isHighlightable?: Matcher | undefined,
): boolean {
  if (isUnavailable === undefined && isDisabled === undefined && isHighlightable === undefined)
    return true

  let current = startOfYear(start)

  while (compareYear(current, end) <= 0) {
    if ((isDisabled?.(current, 'year') || isUnavailable?.(current, 'year')) && !isHighlightable?.(current, 'year'))
      return false
    current = startOfYear(current.add({ years: 1 }))
  }
  return true
}
