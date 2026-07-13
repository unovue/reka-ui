/*
 * Time value normalization at the shared shell seam.
 * Public TimeValue collapses to a single internal PlainDateTime.
 */

import type { TimeValue } from './comparators'
import { Temporal } from 'temporal-polyfill'
import { isNullish } from '@/shared'

/** Time-only values are anchored to today's date in the local zone. */
export function toShellDateTime(value: TimeValue | undefined): Temporal.PlainDateTime | undefined {
  if (isNullish(value))
    return undefined
  if ('day' in value)
    return Temporal.PlainDateTime.from(value)
  const today = Temporal.Now.plainDateISO()
  return Temporal.PlainDateTime.from({
    year: today.year,
    month: today.month,
    day: today.day,
    hour: value.hour,
    minute: value.minute,
    second: value.second,
    millisecond: value.millisecond ?? 0,
  })
}

export function toPublicTimeValue(value: Temporal.PlainDateTime, original: TimeValue | undefined): TimeValue {
  if (original && 'day' in original) {
    return original.with({
      hour: value.hour,
      minute: value.minute,
      second: value.second,
    }) as TimeValue
  }
  return Temporal.PlainTime.from({
    hour: value.hour,
    minute: value.minute,
    second: value.second,
    millisecond: value.millisecond ?? 0,
  })
}
