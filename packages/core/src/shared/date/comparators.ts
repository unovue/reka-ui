/*
  * Implementation ported from https://github.com/melt-ui/melt-ui/blob/develop/src/lib/internal/helpers/date/utils.ts
*/

import type { DateValue } from '@/date/types'
import { getTemporal } from '@/date/runtime'
import { today } from '@/date/temporal'

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
  if (!calendar || calendar === 'gregory')
    return 'iso8601'
  return isCalendarSupported(calendar) ? calendar : 'iso8601'
}

const calendarSupport = new Map<string, boolean>()

/**
 * Whether the loaded Temporal implements `calendar`. Polyfill builds without
 * the full calendar data (`temporal-polyfill-lite/shim`) only know `iso8601`
 * and `gregory`; a locale defaulting to another calendar then falls back to
 * ISO dates, with a warning in development, instead of throwing on mount.
 */
function isCalendarSupported(calendar: string): boolean {
  let supported = calendarSupport.get(calendar)
  if (supported === undefined) {
    try {
      getTemporal().PlainDate.from({ year: 2000, month: 1, day: 1 }).withCalendar(calendar)
      supported = true
    }
    catch (error) {
      if (!(error instanceof RangeError))
        throw error
      supported = false
      // eslint-disable-next-line node/prefer-global/process
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[Reka UI] The loaded Temporal implementation does not support the \`${calendar}\` calendar, `
          + 'so new dates use `iso8601`. Load a polyfill build with every calendar '
          + '(e.g. `temporal-polyfill-lite/calendars-full/shim`), or pass a `placeholder` in the calendar you want.')
      }
    }
    calendarSupport.set(calendar, supported)
  }
  return supported
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
