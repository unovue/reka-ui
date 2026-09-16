import type { TemporalDate } from './types'
import { Temporal } from 'temporal-polyfill'

export type CalendarId
  = | 'gregory'
    | 'iso8601'
    | 'persian'
    | 'hebrew'
    | 'buddhist'
    | 'japanese'
    | 'roc'
    | 'indian'
    | 'islamic'
    | 'ethiopic'
    | 'coptic'

export function toCalendar(date: TemporalDate, calendarId: CalendarId): TemporalDate {
  if (date instanceof Temporal.PlainDate) {
    return date.withCalendar(calendarId)
  }

  if (date instanceof Temporal.PlainDateTime) {
    return date.withCalendar(calendarId)
  }

  if (date instanceof Temporal.ZonedDateTime) {
    return date.withCalendar(calendarId)
  }

  return date
}
