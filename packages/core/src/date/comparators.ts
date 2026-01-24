import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { toCalendar } from '@/temporal/calendar'
import { getDayOfWeek, getDaysInMonth, isAfter, isAfterOrSame, isBefore, isBeforeOrSame, isBetween, isBetweenInclusive, isPlainDateTime, isZonedDateTime } from '@/temporal/comparators'

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
 */
export function toDate(dateValue: TemporalDate, tz: string = Temporal.Now.timeZoneId()) {
  if (isZonedDateTime(dateValue))
    return new Date(dateValue.toInstant().epochMilliseconds)

  if (isPlainDateTime(dateValue)) {
    const zoned = dateValue.toZonedDateTime(tz)
    return new Date(zoned.toInstant().epochMilliseconds)
  }

  const zoned = dateValue.toZonedDateTime({
    timeZone: tz,
    plainTime: Temporal.PlainTime.from({ hour: 0, minute: 0, second: 0 }),
  })
  return new Date(zoned.toInstant().epochMilliseconds)
}

export { getDayOfWeek, getDaysInMonth, isAfter, isAfterOrSame, isBefore, isBeforeOrSame, isBetween, isBetweenInclusive }
