import type { Temporal } from 'temporal-polyfill'

// Union type for all date values - replaces DateValue
export type TemporalDate
  = | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime

// Time-only value - replaces Time
export type TemporalTime = Temporal.PlainTime

// Union type for all values with time properties (hour, minute, second)
export type TemporalDateTime
  = | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime

// Date range type
export type DateRange = {
  start: TemporalDate | undefined
  end: TemporalDate | undefined
}

// Matcher function type
export type Matcher = (date: TemporalDate) => boolean
