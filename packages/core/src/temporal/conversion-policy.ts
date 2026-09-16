/*
 * Internal conversion policy: Temporal → native Date
 *
 * This is the single internal seam for converting TemporalDate values
 * into native Date objects. Timezone authority follows this precedence:
 *
 *   1. ZonedDateTime's own timezone  (ignores caller-provided option)
 *   2. Caller-provided explicit timezone option
 *   3. System timezone fallback      (Temporal.Now.timeZoneId())
 *
 * This module is NOT part of the public reka-ui API. It is exported from
 * the internal temporal barrel for use by formatter and calendar code.
 */

import type { Granularity, TemporalDate, TemporalDateTime } from './types'
import { Temporal } from 'temporal-polyfill'
import { isNullish } from '@/shared'
import { isPlainTime, isZonedDateTime } from './comparators'

// ──────────────────────────────────────────────
// Public time value shape preservation
// TimeField and TimeRangeField share these helpers
// via the conversion-policy barrel.
// ──────────────────────────────────────────────

/**
 * Normalize a TimeValue (PlainTime, PlainDateTime, or ZonedDateTime)
 * to an internal PlainDateTime shell.
 *
 * - PlainTime → anchored to the date returned by getDefaultDate (today).
 *   The anchor date is an internal detail that never leaks to the public
 *   value — toPublicTimeValue strips it on the way out.
 * - PlainDateTime → converted as-is.
 * - ZonedDateTime → calendar-date/time extracted (zone context is restored
 *   by toPublicTimeValue).
 */
export function toShellDateTime(value: TemporalDateTime | undefined): Temporal.PlainDateTime | undefined {
  if (isNullish(value))
    return undefined
  if ('day' in value)
    return Temporal.PlainDateTime.from(value)
  // PlainTime — anchor via the policy's default-date resolution
  const anchor = getDefaultDate({}) as Temporal.PlainDate
  return Temporal.PlainDateTime.from({
    year: anchor.year,
    month: anchor.month,
    day: anchor.day,
    hour: value.hour,
    minute: value.minute,
    second: value.second,
    millisecond: value.millisecond ?? 0,
  })
}

/**
 * Convert an internal shell PlainDateTime back to the user's original
 * TimeValue shape (PlainTime, PlainDateTime, or ZonedDateTime).
 *
 * - Original was PlainTime → emit PlainTime with shell time parts.
 * - Original was PlainDateTime → emit PlainDateTime with original date
 *   + shell time parts.
 * - Original was ZonedDateTime → emit ZonedDateTime with original zone,
 *   original date, and shell time parts.
 * - Original was undefined (no shape to restore) → emit PlainTime.
 */
export function toPublicTimeValue(value: Temporal.PlainDateTime, original: TemporalDateTime | undefined): TemporalDateTime {
  if (original && 'day' in original) {
    return original.with({
      hour: value.hour,
      minute: value.minute,
      second: value.second,
    }) as TemporalDateTime
  }
  return Temporal.PlainTime.from({
    hour: value.hour,
    minute: value.minute,
    second: value.second,
    millisecond: value.millisecond ?? 0,
  })
}

export interface ConversionOptions {
  /**
   * Explicit timezone identifier (e.g. "America/New_York").
   * Ignored when the value is a ZonedDateTime — those always use
   * their own timezone.
   */
  timeZone?: string

  /**
   * Explicit anchor date required when converting a PlainTime to a native Date.
   * PlainTime has no date component, so the anchor provides the year/month/day
   * context. The hidden "today" fallback has been removed — callers must supply
   * this explicitly.
   *
   * Must be provided when `dateValue` is a `Temporal.PlainTime`.
   */
  plainTimeAnchor?: Temporal.PlainDate
}

/**
 * Convert a TemporalDate to a native Date, applying the timezone
 * authority precedence documented above.
 *
 * - ZonedDateTime → uses `dateValue.timeZoneId` (ignores options.timeZone)
 * - PlainDateTime with `options.timeZone` → interprets in that timezone
 * - PlainDate with `options.timeZone` → interprets as midnight in that timezone
 * - PlainDateTime without timeZone → uses system timezone
 * - PlainDate without timeZone → uses system timezone (midnight)
 * - PlainTime → requires `options.plainTimeAnchor` (throws if missing)
 *   combines anchor date + time in the resolved timezone
 */
export function toNativeDate(dateValue: TemporalDate, options?: ConversionOptions): Date
export function toNativeDate(dateValue: Temporal.PlainTime, options: ConversionOptions & { plainTimeAnchor: Temporal.PlainDate }): Date
export function toNativeDate(dateValue: TemporalDate | Temporal.PlainTime, options?: ConversionOptions): Date {
  // PlainTime — must supply an explicit anchor date; hidden "today" fallback removed
  if (isPlainTime(dateValue)) {
    if (!options?.plainTimeAnchor) {
      throw new Error(
        'toNativeDate: PlainTime conversion requires a plainTimeAnchor option '
        + 'providing the date context (the "today" fallback has been removed).',
      )
    }
    const timeZone = options?.timeZone ?? Temporal.Now.timeZoneId()
    const zoned = options.plainTimeAnchor.toZonedDateTime({
      timeZone,
      plainTime: dateValue,
    })
    return new Date(zoned.toInstant().epochMilliseconds)
  }

  if (isZonedDateTime(dateValue)) {
    // ZonedDateTime always uses its own timezone — caller option is ignored
    return new Date(dateValue.toInstant().epochMilliseconds)
  }

  const timeZone = options?.timeZone ?? Temporal.Now.timeZoneId()

  if (dateValue instanceof Temporal.PlainDateTime) {
    const zoned = dateValue.toZonedDateTime(timeZone)
    return new Date(zoned.toInstant().epochMilliseconds)
  }

  // PlainDate — interpret as midnight in the resolved timezone
  const zoned = dateValue.toZonedDateTime({
    timeZone,
    plainTime: Temporal.PlainTime.from({ hour: 0, minute: 0, second: 0 }),
  })
  return new Date(zoned.toInstant().epochMilliseconds)
}

// ──────────────────────────────────────────────
// Default date/time resolution
// ──────────────────────────────────────────────

/**
 * Resolve a default date value using the provided defaultValue, defaultPlaceholder,
 * and granularity. This is the canonical implementation — all date components
 * use this single rule, not divergent helpers.
 *
 * Priority:
 *   1. Array defaultValue → first element (range-array behaviour picks the start)
 *   2. Single defaultValue → that value
 *   3. defaultPlaceholder → explicit fallback
 *   4. Today's date (PlainDate for day granularity, PlainDateTime at midnight otherwise)
 */
export function getDefaultDate(props: {
  defaultValue?: TemporalDate | TemporalDate[]
  defaultPlaceholder?: TemporalDate
  granularity?: Granularity
  locale?: string
}): TemporalDate {
  const { defaultValue, defaultPlaceholder, granularity = 'day' } = props

  if (Array.isArray(defaultValue) && defaultValue.length) {
    return defaultValue[0]!
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

  return Temporal.PlainDateTime.from({ year, month, day, hour: 0, minute: 0, second: 0 })
}

/**
 * Resolve a default time value using the provided defaultValue and defaultPlaceholder.
 * This is the canonical implementation — all time components use this single rule.
 *
 * Priority:
 *   1. Array defaultValue → first element (range-array behaviour picks the start)
 *   2. Single defaultValue → that value
 *   3. defaultPlaceholder → explicit fallback
 *   4. Midnight (Temporal.PlainTime.from({ hour: 0, minute: 0, second: 0 }))
 */
export function getDefaultTime(props: {
  defaultValue?: TemporalDateTime | TemporalDateTime[]
  defaultPlaceholder?: TemporalDateTime
}): TemporalDateTime {
  const { defaultValue, defaultPlaceholder } = props

  if (Array.isArray(defaultValue) && defaultValue.length) {
    return defaultValue[0]!
  }

  if (defaultValue && !Array.isArray(defaultValue)) {
    return defaultValue
  }

  if (defaultPlaceholder) {
    return defaultPlaceholder
  }

  return Temporal.PlainTime.from({ hour: 0, minute: 0, second: 0 })
}
