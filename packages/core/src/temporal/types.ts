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

// Granularity for date/time resolution — canonical definition
export type Granularity = 'day' | 'hour' | 'minute' | 'second'

// Time-only granularity — canonical definition
export type TimeGranularity = 'hour' | 'minute' | 'second'

// Days of the week, starting with Sunday — canonical definition
const daysOfWeek = [0, 1, 2, 3, 4, 5, 6] as const
export type DayOfWeek = {
  daysOfWeek: (typeof daysOfWeek)[number][]
}

// Date range type
export type DateRange = {
  start: TemporalDate | undefined
  end: TemporalDate | undefined
}

// Matcher function type
export type Matcher = (date: TemporalDate) => boolean
