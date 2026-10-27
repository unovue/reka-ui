/*
 * The Temporal seam of the date components (#2183).
 *
 * Reka does not bundle a Temporal implementation: it reads the global
 * `Temporal` the app provides (native, or a polyfill the app loads), and types
 * against TypeScript 6's built-in `Temporal` lib. Every static `Temporal.*`
 * access goes through `getTemporal()` so a missing global fails with a clear
 * message in development instead of a bare `ReferenceError`.
 *
 * Values are recognised by their `Symbol.toStringTag` brand rather than with
 * `instanceof`, so values created by another polyfill instance, another realm,
 * or the native implementation are all accepted.
 */

import type { DateValue } from './types'

type TemporalNamespace = typeof Temporal

const MISSING_TEMPORAL_MESSAGE = '[Reka UI] The date components need the Temporal API, but `globalThis.Temporal` is not defined. '
  + 'Load a polyfill before mounting them on runtimes without native Temporal, e.g. '
  + '`import { install } from \'temporal-polyfill-lite/shim\'; install(false)` '
  + '(`temporal-polyfill-lite/calendars-full/shim` for non-Gregorian calendars). See https://reka-ui.com/docs/guides/dates'

/**
 * The global `Temporal` namespace. In development, throws a descriptive error
 * when the runtime has none (no native support and no polyfill loaded).
 *
 * @internal
 */
export function getTemporal(): TemporalNamespace {
  const temporal = (globalThis as { Temporal?: TemporalNamespace }).Temporal
  // `process.env.NODE_ENV`, not `import.meta.env.DEV`, which is neutered in dist.
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV !== 'production' && !temporal)
    throw new Error(MISSING_TEMPORAL_MESSAGE)
  return temporal as TemporalNamespace
}

/**
 * Throws the "Temporal is missing" error in development. The date composables
 * call it on setup so the failure points at the component, not at the first
 * date computation.
 *
 * @internal
 */
export function assertTemporal() {
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV !== 'production')
    getTemporal()
}

// =============================================================================
// Brand checks
// =============================================================================

function brand(value: unknown): string {
  return Object.prototype.toString.call(value)
}

export function isPlainDate(value: unknown): value is Temporal.PlainDate {
  return brand(value) === '[object Temporal.PlainDate]'
}

export function isPlainDateTime(value: unknown): value is Temporal.PlainDateTime {
  return brand(value) === '[object Temporal.PlainDateTime]'
}

export function isZonedDateTime(value: unknown): value is Temporal.ZonedDateTime {
  return brand(value) === '[object Temporal.ZonedDateTime]'
}

export function isPlainTime(value: unknown): value is Temporal.PlainTime {
  return brand(value) === '[object Temporal.PlainTime]'
}

/** `true` for the three Temporal types a `DateValue` can be. */
export function isDateValue(value: unknown): value is DateValue {
  return isPlainDate(value) || isPlainDateTime(value) || isZonedDateTime(value)
}

// =============================================================================
// Conversions
// =============================================================================

/** The calendar date of `value` (time and zone dropped), in its calendar. */
export function toPlainDate(value: DateValue): Temporal.PlainDate {
  return isPlainDate(value) ? value : value.toPlainDate()
}

/** The wall-clock date-time of `value`: a `PlainDate` is placed at midnight, a `ZonedDateTime` drops its zone. */
export function toPlainDateTime(value: DateValue): Temporal.PlainDateTime {
  if (isPlainDateTime(value))
    return value
  return value.toPlainDateTime()
}

/** `value` in another calendar system (`'gregory'`, `'japanese'`, `'hebrew'`, …). */
export function toCalendar<T extends DateValue>(value: T, calendar: string): T {
  return (value.calendarId === calendar ? value : value.withCalendar(calendar)) as T
}

/** The time zone of the runtime (`Temporal.Now.timeZoneId()`). */
export function getLocalTimeZone(): string {
  return getTemporal().Now.timeZoneId()
}

/** Today's date in `timeZone` (the local zone by default), in the ISO calendar. */
export function today(timeZone: string = getLocalTimeZone()): Temporal.PlainDate {
  return getTemporal().Now.plainDateISO(timeZone)
}

/**
 * The instant `value` describes, as a native `Date`. A `ZonedDateTime` uses its
 * own zone; plain values are read as wall-clock time in `timeZone` (the local
 * zone by default). A plain date is the start of that day, which is not always
 * midnight on a DST transition day.
 */
export function toDate(value: DateValue, timeZone: string = getLocalTimeZone()): Date {
  if (isZonedDateTime(value))
    return new Date(value.epochMilliseconds)
  if (isPlainDateTime(value))
    return new Date(value.toZonedDateTime(timeZone).epochMilliseconds)
  return new Date(value.toZonedDateTime({ timeZone }).epochMilliseconds)
}

/**
 * The ISO 8601 string of `value` without a calendar annotation: `2026-09-05`,
 * `2026-09-05T10:30:00`, `2026-09-05T10:30:00-04:00[America/New_York]`.
 * A `PlainTime` gives `10:30:00`. Used for `data-value` attributes, DOM
 * lookups and hidden form inputs, so it is the same for a date in any
 * calendar system (as `@internationalized/date`'s `toString()` was).
 */
export function toIsoString(value: DateValue | Temporal.PlainTime): string {
  return isPlainTime(value) ? value.toString() : value.toString({ calendarName: 'never' })
}

// =============================================================================
// Comparison
// =============================================================================

/**
 * Orders two dates. Two `ZonedDateTime`s compare by instant; otherwise both
 * sides compare as wall-clock date-times, a `PlainDate` counting as midnight.
 * Calendar systems do not affect the order.
 */
export function compareDateValues(a: DateValue, b: DateValue): number {
  const temporal = getTemporal()
  if (isZonedDateTime(a) && isZonedDateTime(b))
    return temporal.ZonedDateTime.compare(a, b)
  if (isPlainDate(a) && isPlainDate(b))
    return temporal.PlainDate.compare(a, b)
  return temporal.PlainDateTime.compare(toPlainDateTime(a), toPlainDateTime(b))
}

/** Orders the calendar days of two dates, ignoring time, zone and type. */
export function compareDays(a: DateValue, b: DateValue): number {
  return getTemporal().PlainDate.compare(toPlainDate(a), toPlainDate(b))
}

/** Whether both dates fall on the same calendar day. */
export function isSameDay(a: DateValue, b: DateValue): boolean {
  return compareDays(a, b) === 0
}

/** Whether `b` falls in the same month (and year) as `a`, read in `a`'s calendar. */
export function isSameMonth(a: DateValue, b: DateValue): boolean {
  const other = toCalendar(toPlainDate(b), a.calendarId)
  return a.year === other.year && a.month === other.month
}

/** Whether `b` falls in the same year as `a`, read in `a`'s calendar. */
export function isSameYearOf(a: DateValue, b: DateValue): boolean {
  return a.year === toCalendar(toPlainDate(b), a.calendarId).year
}

/** Whether `value` is today in `timeZone` (the local zone by default). */
export function isToday(value: DateValue, timeZone: string = getLocalTimeZone()): boolean {
  return isSameDay(value, today(timeZone))
}

/**
 * Whether two values are the exact same value: same Temporal type, calendar,
 * fields, offset and time zone. `compareDateValues()` alone treats the same
 * instant in two zones (and the same day in two calendars) as equal.
 */
export function isSameDateValue(a: DateValue | Temporal.PlainTime, b: DateValue | Temporal.PlainTime): boolean {
  if (brand(a) !== brand(b))
    return false
  return (a as Temporal.PlainDate).equals(b as Temporal.PlainDate)
}

// =============================================================================
// Boundaries
// =============================================================================

/** The first day of the month of `value`. Keeps the type and the time. */
export function startOfMonth<T extends DateValue>(value: T): T {
  return value.with({ day: 1 }) as T
}

/** The last day of the month of `value`. Keeps the type and the time. */
export function endOfMonth<T extends DateValue>(value: T): T {
  return value.with({ day: value.daysInMonth }) as T
}

/** The first day of the year of `value`. Keeps the type and the time. */
export function startOfYear<T extends DateValue>(value: T): T {
  return value.with({ month: 1, day: 1 }) as T
}

/** The last day of the year of `value` (the 13th month in a Hebrew leap year). */
export function endOfYear<T extends DateValue>(value: T): T {
  const lastMonth = value.with({ month: value.monthsInYear, day: 1 })
  return lastMonth.with({ day: lastMonth.daysInMonth }) as T
}

/** The first day of the week containing `value`. */
export function startOfWeek<T extends DateValue>(value: T, locale: string, firstDayOfWeek?: DayOfWeekName): T {
  const dayOfWeek = getDayOfWeek(value, locale, firstDayOfWeek)
  return value.subtract({ days: dayOfWeek }) as T
}

// =============================================================================
// Week info
// =============================================================================

export type DayOfWeekName = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

const DAY_INDEX: Record<DayOfWeekName, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

/*
 * First day of the week per region, for runtimes without
 * `Intl.Locale#getWeekInfo()` (or the older `weekInfo` getter).
 * Data from CLDR (cldr-core/supplemental/weekData.json), as compressed in
 * @internationalized/date (Apache-2.0, Copyright 2020 Adobe): regions that
 * start on Sunday are left out, with AE moved to Monday as in CLDR 42+.
 * 1 = Monday, 5 = Friday, 6 = Saturday.
 */
const WEEK_START_BY_REGION: Record<string, number> = Object.fromEntries([
  ...'001 AD AE AI AL AM AN AR AT AU AX AZ BA BE BG BM BN BY CH CL CM CN CR CY CZ DE DK EC EE ES FI FJ FO FR GB GE GF GP GR HR HU IE IS IT KG KZ LB LI LK LT LU LV MC MD ME MK MN MQ MY NL NO NZ PL RE RO RS RU SE SI SK SM TJ TM TR UA UY UZ VA VN XK'
    .split(' ')
    .map(region => [region, 1]),
  ...'AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'.split(' ').map(region => [region, 6]),
  ['MV', 5],
])

const weekStartCache = new Map<string, number>()

type WeekInfoLocale = Intl.Locale & {
  getWeekInfo?: () => { firstDay: number }
  weekInfo?: { firstDay: number }
}

/**
 * The first day of the week for `locale`: 0 = Sunday … 6 = Saturday.
 * Reads `Intl.Locale#getWeekInfo()` (which honours a `-u-fw-` extension), then
 * the older `weekInfo` getter, then a CLDR table keyed by the locale's region.
 */
export function getLocaleWeekStart(locale: string): number {
  const cached = weekStartCache.get(locale)
  if (cached !== undefined)
    return cached

  let weekStart = 0
  try {
    const intlLocale = new Intl.Locale(locale) as WeekInfoLocale
    const info = typeof intlLocale.getWeekInfo === 'function' ? intlLocale.getWeekInfo() : intlLocale.weekInfo
    if (info && typeof info.firstDay === 'number') {
      weekStart = info.firstDay % 7
    }
    else {
      const region = intlLocale.maximize().region
      weekStart = (region && WEEK_START_BY_REGION[region]) || 0
    }
  }
  catch {
    // An invalid locale tag: keep Sunday.
  }

  weekStartCache.set(locale, weekStart)
  return weekStart
}

/**
 * The position of `value` in its week: 0 for the first day of the week. The
 * week starts on `firstDayOfWeek` when given, else on the locale's first day.
 */
export function getDayOfWeek(value: DateValue, locale: string, firstDayOfWeek?: DayOfWeekName): number {
  const weekStart = firstDayOfWeek ? DAY_INDEX[firstDayOfWeek] : getLocaleWeekStart(locale)
  // Temporal: Monday = 1 … Sunday = 7, in every built-in calendar.
  return (value.dayOfWeek % 7 - weekStart + 7) % 7
}

// =============================================================================
// Field edits (the semantics the segmented fields need)
// =============================================================================

export type DateTimeField = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'

export type DateTimeFields = Partial<Record<DateTimeField | 'millisecond', number>>

/**
 * The value of `field` as a user reads and types it. `year` is the year of
 * the era (`eraYear`) in calendars that have eras: `6` for Reiwa 6, `2026` for
 * a Gregorian date; `year` itself in calendars without eras (`iso8601`).
 */
export function getFieldValue(value: DateValue | Temporal.PlainTime, field: DateTimeField): number {
  if (field === 'year')
    return (value as Temporal.PlainDate).eraYear ?? (value as Temporal.PlainDate).year
  return (value as Temporal.PlainDateTime)[field]
}

/**
 * `value` with some fields replaced, as a user edits them: out-of-range values
 * are constrained (day 31 in February becomes 28/29), `year` is the year of the
 * current era (see `getFieldValue`), fields the type does not have and empty
 * (`null`) fields are ignored.
 */
export function setFields<T extends DateValue | Temporal.PlainTime>(value: T, fields: Partial<Record<string, unknown>>): T {
  const next: Record<string, number | string> = {}
  for (const key of ['year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'] as const) {
    const fieldValue = fields[key]
    if (typeof fieldValue !== 'number' || !(key in value))
      continue
    next[key] = fieldValue
  }

  if ('year' in next) {
    const era = (value as Temporal.PlainDate).era
    if (era !== undefined) {
      next.era = era
      next.eraYear = next.year
      delete next.year
    }
  }

  if (Object.keys(next).length === 0)
    return value
  return (value as Temporal.PlainDateTime).with(next) as T
}

function cycleValue(value: number, amount: number, min: number, max: number) {
  value += amount
  if (value < min)
    value = max - (min - value - 1)
  else if (value > max)
    value = min + (value - max - 1)
  return value
}

/**
 * `value` with one field moved by `amount`, wrapping within the field's range
 * instead of carrying into the next one: day 31 + 1 is day 1 of the same
 * month, 23:00 + 1 hour is 00:00 of the same day. `year` moves through the
 * years of the era (1 … 9999).
 */
export function cycleField<T extends DateValue | Temporal.PlainTime>(value: T, field: DateTimeField, amount: number): T {
  const v = value as Temporal.PlainDateTime
  switch (field) {
    case 'year':
      return setFields(value, { year: cycleValue(getFieldValue(value, 'year'), amount, 1, 9999) })
    case 'month':
      return v.with({ month: cycleValue(v.month, amount, 1, v.monthsInYear) }) as unknown as T
    case 'day':
      return v.with({ day: cycleValue(v.day, amount, 1, v.daysInMonth) }) as unknown as T
    case 'hour':
      return v.with({ hour: cycleValue(v.hour, amount, 0, 23) }) as unknown as T
    case 'minute':
      return v.with({ minute: cycleValue(v.minute, amount, 0, 59) }) as unknown as T
    case 'second':
      return v.with({ second: cycleValue(v.second, amount, 0, 59) }) as unknown as T
  }
}
