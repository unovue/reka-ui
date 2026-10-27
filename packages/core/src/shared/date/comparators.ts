/*
  * Implementation ported from https://github.com/melt-ui/melt-ui/blob/develop/src/lib/internal/helpers/date/utils.ts
*/

import type { DateValue } from '@/date/types'
import { getTemporal, today } from '@/date/temporal'

/**
 * A time the time fields accept and emit: a Temporal `PlainTime`, or a
 * `PlainDateTime` / `ZonedDateTime` whose date is kept as is.
 */
export type TimeValue = Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime

export type Granularity = 'day' | 'hour' | 'minute' | 'second'
export type TimeGranularity = 'hour' | 'minute' | 'second'

type GetDefaultDateProps = {
  defaultValue?: DateValue | DateValue[] | undefined
  defaultPlaceholder?: DateValue | undefined
  granularity?: Granularity
  locale?: string
}

/**
 * The calendar system to show a new date in for `locale`: the locale's
 * default calendar when it is not Gregorian (`th-TH` → `buddhist`, `fa-IR` →
 * `persian`, …), else `iso8601`. Gregorian locales get ISO dates rather than
 * `gregory` ones: both display the same, and an ISO date has no `[u-ca=…]`
 * annotation and equals the dates apps create with `Temporal.PlainDate.from()`.
 *
 * @internal
 */
export function getDefaultCalendar(locale: string): string {
  let calendar: string | undefined
  try {
    calendar = new Intl.DateTimeFormat(locale).resolvedOptions().calendar
  }
  catch {}
  return !calendar || calendar === 'gregory' ? 'iso8601' : calendar
}

/**
 * A helper function used throughout the various date builders
 * to generate a default `DateValue` using the `defaultValue`,
 * `defaultPlaceholder`, and `granularity` props.
 *
 * It's important to match the `DateValue` type being used
 * elsewhere in the builder, so they behave according to the
 * behavior the user expects based on the props they've provided.
 *
 * Without a value or a placeholder, it is today in the local time zone, in
 * the locale's calendar (see `getDefaultCalendar`): a `PlainDate` for the
 * `'day'` granularity, a `PlainDateTime` at midnight otherwise.
 */
export function getDefaultDate(props: GetDefaultDateProps): DateValue {
  const { defaultValue, defaultPlaceholder, granularity = 'day', locale = 'en' } = props

  if (Array.isArray(defaultValue) && defaultValue.length)
    return defaultValue.at(-1)!

  if (defaultValue && !Array.isArray(defaultValue))
    return defaultValue

  if (defaultPlaceholder)
    return defaultPlaceholder

  const date = today().withCalendar(getDefaultCalendar(locale))

  if (granularity !== 'day')
    return date.toPlainDateTime()

  return date
}

type GetDefaultTimeProps = {
  defaultValue?: TimeValue | undefined
  defaultPlaceholder?: TimeValue | undefined
}

export function getDefaultTime(props: GetDefaultTimeProps): TimeValue {
  const { defaultValue, defaultPlaceholder } = props

  if (defaultValue)
    return defaultValue

  if (defaultPlaceholder)
    return defaultPlaceholder

  return new (getTemporal().PlainTime)(0, 0, 0)
}
