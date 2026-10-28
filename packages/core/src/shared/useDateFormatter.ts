/*
  * Implementation ported from https://github.com/melt-ui/melt-ui/blob/develop/src/lib/internal/helpers/date/formatter.ts
*/

import type { DateValue } from '@/date/types'
import { ref } from 'vue'
import { hasTime } from '@/date/comparators'
import { isPlainDate, isPlainDateTime, isPlainTime, isZonedDateTime, today } from '@/date/temporal'

export interface DateFormatterOptions extends Intl.DateTimeFormatOptions {
  calendar?: string
}

/**
 * What the formatter accepts: a native `Date` (an instant, shown in the
 * formatter's `timeZone`), or a Temporal value. A `PlainDate` /
 * `PlainDateTime` / `PlainTime` is shown as its wall-clock fields, a
 * `ZonedDateTime` in its own zone, and a non-ISO value in its own calendar.
 */
export type FormattableDate = Date | DateValue | Temporal.PlainTime

export type Formatter = {
  getLocale: () => string
  setLocale: (newLocale: string) => void
  custom: (date: FormattableDate, options: DateFormatterOptions) => string
  selectedDate: (date: DateValue, includeTime?: boolean) => string
  dayOfWeek: (date: FormattableDate, length?: DateFormatterOptions['weekday']) => string
  fullMonthAndYear: (date: FormattableDate, options?: DateFormatterOptions) => string
  fullMonth: (date: FormattableDate, options?: DateFormatterOptions) => string
  fullYear: (date: FormattableDate, options?: DateFormatterOptions) => string
  dayPeriod: (date: FormattableDate, timeZone?: string) => string
  part: (dateObj: DateValue | Temporal.PlainTime, type: Intl.DateTimeFormatPartTypes, options?: DateFormatterOptions) => string
  toParts: (date: DateValue | Temporal.PlainTime, options?: DateFormatterOptions) => Intl.DateTimeFormatPart[]
  getMonths: () => { label: string, value: number }[]
}

const formatterCache = new Map<string, Intl.DateTimeFormat>()

function serializeOptions(options: DateFormatterOptions): string {
  return Object.entries(options)
    .filter(([, value]) => value !== undefined)
    .sort((a, b) => a[0] < b[0] ? -1 : 1)
    .join()
}

/**
 * The serialized options of an options object. A frozen object is memoised by
 * identity: the calendar adapters pass the same frozen constants on every
 * call, so their key is built once rather than per formatted cell. Any other
 * object may be mutated between calls, so it is serialized each time.
 */
const optionKeys = new WeakMap<DateFormatterOptions, string>()
function optionsKey(options: DateFormatterOptions): string {
  if (!Object.isFrozen(options))
    return serializeOptions(options)
  let key = optionKeys.get(options)
  if (key === undefined) {
    key = serializeOptions(options)
    optionKeys.set(options, key)
  }
  return key
}

/**
 * Formatters by `locale | formatter opts | call options | calendar | zone`.
 * Two different splits of the same options may land on two keys; each still
 * maps to the formatter of exactly those options.
 */
const resolvedFormatterCache = new Map<string, Intl.DateTimeFormat>()

/**
 * The UTC instant whose UTC wall clock shows the fields of a plain value: what
 * `value.toPlainDateTime().toZonedDateTime('UTC').epochMilliseconds` gives,
 * without the intermediate Temporal objects (sub-millisecond fields are
 * dropped, as `epochMilliseconds` drops them).
 */
function plainToUtcDate(value: Temporal.PlainDate | Temporal.PlainDateTime): Date {
  const iso = value.calendarId === 'iso8601' ? value : value.withCalendar('iso8601')
  const out = new Date(0)
  out.setUTCFullYear(iso.year, iso.month - 1, iso.day)
  if (isPlainDateTime(iso))
    out.setUTCHours(iso.hour, iso.minute, iso.second, iso.millisecond)
  return out
}

let buggyHour12: boolean | undefined
/**
 * Chrome (and ECMA-402 before the fix) resolves `hour12: false` to `h24`
 * (`24:00` – `23:59`) in English and some other locales.
 * @see https://github.com/tc39/ecma402/issues/402
 */
function hasBuggyHour12Behavior() {
  buggyHour12 ??= new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'UTC' })
    .format(new Date(Date.UTC(2020, 2, 3, 0))) === '24'
  return buggyHour12
}

/**
 * A cached `Intl.DateTimeFormat`. Works around the `hour12` bug above by
 * switching to `hourCycle` (only where the bug is detected, since `hourCycle`
 * is itself buggy in WebKit), as `@internationalized/date`'s `DateFormatter`
 * did. Japanese is the one locale using `h11` for 12-hour time.
 */
function getDateTimeFormat(locale: string, options: DateFormatterOptions): Intl.DateTimeFormat {
  if (typeof options.hour12 === 'boolean' && hasBuggyHour12Behavior()) {
    options = { ...options }
    options.hourCycle = options.hour12 ? (locale.split('-')[0] === 'ja' ? 'h11' : 'h12') : 'h23'
    delete options.hour12
  }

  const key = locale + serializeOptions(options)
  let formatter = formatterCache.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options)
    formatterCache.set(key, formatter)
  }
  return formatter
}

/**
 * The `Date` and options that make `Intl.DateTimeFormat` show a Temporal
 * value. Temporal values are converted rather than passed to `format()`
 * directly: only a native Temporal guarantees that `Intl` accepts them, and
 * `Intl` rejects a value whose calendar differs from the formatter's. A plain
 * value is read as its wall-clock fields in UTC (no local-zone or DST shift),
 * a zoned value keeps its zone, and a value always sets `calendar` so its
 * fields are shown in its own calendar (`gregory` for an `iso8601` value).
 */
function toFormatInput(date: FormattableDate, options: DateFormatterOptions): [Date, DateFormatterOptions] {
  // `iso8601` is not a display calendar, but its fields are Gregorian ones: show
  // them as such, never in the locale's default calendar (Persian in `fa-IR`,
  // Buddhist in `th-TH`), which would label a Gregorian grid with other months.
  const resolved = options.calendar === 'iso8601' ? { ...options, calendar: 'gregory' } : options
  if (date instanceof Date)
    return [date, resolved]

  const calendarId = isPlainTime(date) ? 'iso8601' : date.calendarId
  const calendar = resolved.calendar ?? (calendarId === 'iso8601' ? 'gregory' : calendarId)

  if (isZonedDateTime(date))
    return [new Date(date.epochMilliseconds), { ...resolved, calendar, timeZone: date.timeZoneId }]

  const wallClock = isPlainTime(date)
    ? today('UTC').toPlainDateTime(date)
    : isPlainDate(date) ? date.toPlainDateTime() : date
  return [new Date(wallClock.toZonedDateTime('UTC').epochMilliseconds), { ...resolved, calendar, timeZone: 'UTC' }]
}

/**
 * Creates a wrapper around {@link Intl.DateTimeFormat} that the date
 * components use to format dates consistently. It accepts native `Date`s and
 * the Temporal values the components work with (see `FormattableDate`).
 */
export function useDateFormatter(initialLocale: string, opts: DateFormatterOptions = {}): Formatter {
  const locale = ref(initialLocale)

  function getLocale() {
    return locale.value
  }

  function setLocale(newLocale: string) {
    locale.value = newLocale
  }

  const optsKey = serializeOptions(opts)

  /**
   * `toFormatInput` + `getDateTimeFormat`, keyed without building the merged
   * options on a hit: what the calendar grids call once per cell.
   */
  function resolve(date: FormattableDate, options: DateFormatterOptions): [Date, Intl.DateTimeFormat] {
    if (date instanceof Date || isPlainTime(date)) {
      const [input, resolved] = toFormatInput(date, { ...opts, ...options })
      return [input, getDateTimeFormat(locale.value, resolved)]
    }
    const requested = 'calendar' in options ? options.calendar : opts.calendar
    const calendar = requested === 'iso8601' || (requested === undefined && date.calendarId === 'iso8601')
      ? 'gregory'
      : requested ?? date.calendarId
    const zoned = isZonedDateTime(date)
    const timeZone = zoned ? date.timeZoneId : 'UTC'
    const key = `${locale.value}|${optsKey}|${optionsKey(options)}|${calendar}|${timeZone}`
    let formatter = resolvedFormatterCache.get(key)
    if (!formatter) {
      formatter = getDateTimeFormat(locale.value, { ...opts, ...options, calendar, timeZone })
      resolvedFormatterCache.set(key, formatter)
    }
    return [zoned ? new Date(date.epochMilliseconds) : plainToUtcDate(date), formatter]
  }

  function format(date: FormattableDate, options: DateFormatterOptions) {
    const [input, formatter] = resolve(date, options)
    return formatter.format(input)
  }

  function custom(date: FormattableDate, options: DateFormatterOptions) {
    return format(date, options)
  }

  function selectedDate(date: DateValue, includeTime = true) {
    if (hasTime(date) && includeTime) {
      return custom(date, {
        dateStyle: 'long',
        // A plain date-time has no zone to name.
        timeStyle: isZonedDateTime(date) ? 'long' : 'medium',
      })
    }
    else {
      return custom(date, {
        dateStyle: 'long',
      })
    }
  }

  function fullMonthAndYear(date: FormattableDate, options: DateFormatterOptions = {}) {
    return format(date, { month: 'long', year: 'numeric', ...options })
  }

  function fullMonth(date: FormattableDate, options: DateFormatterOptions = {}) {
    return format(date, { month: 'long', ...options })
  }

  function getMonths() {
    const defaultDate = today().with({ day: 1 })
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    return months.map(item => ({ label: fullMonth(defaultDate.with({ month: item })), value: item }))
  }

  function fullYear(date: FormattableDate, options: DateFormatterOptions = {}) {
    return format(date, { year: 'numeric', ...options })
  }

  function toParts(date: DateValue | Temporal.PlainTime, options: DateFormatterOptions = {}) {
    const [input, formatter] = resolve(date, options)
    return formatter.formatToParts(input)
  }

  function dayOfWeek(date: FormattableDate, length: DateFormatterOptions['weekday'] = 'narrow') {
    return format(date, { weekday: length })
  }

  /**
   * Resolves the internal `'AM'` / `'PM'` token for a date.
   *
   * A Temporal value carries its wall-clock hour, which is used directly (a
   * `PlainDate` has no time and reads as midnight). For a native `Date` the
   * token is derived from the 24-hour clock rather than from the formatted
   * `dayPeriod` part, because locales render that part in forms that cannot be
   * matched reliably: `p. m.` in `es-ES`, `午後` in `ja-JP`, `下午` in `zh-CN`,
   * `오후` in `ko-KR`, and so on. Matching on those strings made every such
   * locale silently fall back to `'AM'`, which then made editing the hour
   * segment convert a PM time into an AM one.
   *
   * `hourCycle`, `hour12` and `numberingSystem` are pinned so the hour always
   * comes back as a Latin-digit 0-23 value, whatever `opts` the caller passed
   * to `useDateFormatter`. `hour12` in particular takes precedence over
   * `hourCycle` in `Intl`, so it has to be cleared rather than just overridden.
   *
   * Pass a `timeZone` to read a `Date` on that zone's clock rather than the
   * formatter's (or the runtime's) one.
   *
   * @see https://github.com/unovue/reka-ui/issues/2956
   */
  function dayPeriod(date: FormattableDate, timeZone?: string) {
    if (!(date instanceof Date))
      return !isPlainDate(date) && date.hour >= 12 ? 'PM' : 'AM'

    const parts = getDateTimeFormat(locale.value, {
      ...opts,
      hour: 'numeric',
      hourCycle: 'h23',
      hour12: undefined,
      numberingSystem: 'latn',
      ...(timeZone ? { timeZone } : {}),
    }).formatToParts(date)
    const hour = Number(parts.find(p => p.type === 'hour')?.value)

    return !Number.isNaN(hour) && hour >= 12 ? 'PM' : 'AM'
  }

  const defaultPartOptions: DateFormatterOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }

  function part(
    dateObj: DateValue | Temporal.PlainTime,
    type: Intl.DateTimeFormatPartTypes,
    options: DateFormatterOptions = {},
  ) {
    const opts = { ...defaultPartOptions, ...options }
    const parts = toParts(dateObj, opts)
    const part = parts.find(p => p.type === type)
    return part ? part.value : ''
  }

  return {
    setLocale,
    getLocale,
    fullMonth,
    fullYear,
    fullMonthAndYear,
    toParts,
    custom,
    part,
    dayPeriod,
    selectedDate,
    dayOfWeek,
    getMonths,
  }
}
