/*
 * The Temporal helpers of the date components (#2183), public through
 * `reka-ui/date`. The global itself is read through `getTemporal()` in
 * `./runtime`, which is internal.
 *
 * Values are recognised by their `Symbol.toStringTag` brand rather than with
 * `instanceof`, so values created by another polyfill instance, another realm,
 * or the native implementation are all accepted.
 */

import type { DateValue } from './types'
import { getTemporal } from './runtime'

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

/** @deprecated Use `isPlainDateTime`: `CalendarDateTime` is `Temporal.PlainDateTime` in v3. */
export const isCalendarDateTime = isPlainDateTime

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
 * Week data per region, for runtimes without `Intl.Locale#getWeekInfo()` (or
 * the older `weekInfo` getter). From CLDR 48 (cldr-core/supplemental/weekData),
 * as ICU 78 reports it: only the regions that differ from the world default
 * (`001`: the week starts on Monday, the weekend is Saturday and Sunday) are
 * listed. Days are Temporal's: Monday = 1 … Sunday = 7.
 */
function regions<T>(list: string, value: T) {
  return list.split(' ').map(region => [region, value] as const)
}

const WEEK_START_BY_REGION: Record<string, number> = Object.fromEntries([
  ...regions('AG AS BD BR BS BT BW BZ CA CO DM DO ET GT GU HK HN ID IL IN IS JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW', 7),
  ...regions('AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY', 6),
  ...regions('MV', 5),
])

const WEEKEND_BY_REGION: Record<string, number[]> = Object.fromEntries([
  ...regions('BH DZ EG IL IQ JO KW LY OM QA SA SD SY YE', [5, 6]),
  ...regions('AF', [4, 5]),
  ...regions('IR', [5]),
  ...regions('IN UG', [7]),
])

interface WeekInfo { firstDay: number, weekend: number[] }

type WeekInfoLocale = Intl.Locale & {
  getWeekInfo?: () => Partial<WeekInfo>
  weekInfo?: Partial<WeekInfo>
}

const weekInfoCache = new Map<string, WeekInfo>()

/**
 * The week of `locale`, in Temporal's day numbers (Monday = 1 … Sunday = 7).
 * Reads `Intl.Locale#getWeekInfo()` (which honours a `-u-fw-` extension), then
 * the older `weekInfo` getter, then the CLDR tables above keyed by the
 * locale's likely region.
 */
function getWeekInfo(locale: string): WeekInfo {
  let info = weekInfoCache.get(locale)
  if (info)
    return info

  let intlLocale: WeekInfoLocale | undefined
  try {
    intlLocale = new Intl.Locale(locale) as WeekInfoLocale
  }
  catch {
    // An invalid locale tag: use the world default.
  }
  const fromIntl = typeof intlLocale?.getWeekInfo === 'function' ? intlLocale.getWeekInfo() : intlLocale?.weekInfo
  const region = intlLocale?.maximize().region ?? '001'
  info = {
    firstDay: typeof fromIntl?.firstDay === 'number' ? fromIntl.firstDay : (WEEK_START_BY_REGION[region] ?? 1),
    weekend: Array.isArray(fromIntl?.weekend) ? fromIntl.weekend : (WEEKEND_BY_REGION[region] ?? [6, 7]),
  }
  weekInfoCache.set(locale, info)
  return info
}

/** The first day of the week for `locale`: 0 = Sunday … 6 = Saturday. */
export function getLocaleWeekStart(locale: string): number {
  return getWeekInfo(locale).firstDay % 7
}

/**
 * Whether `value` falls on a weekend day in `locale`: Saturday and Sunday in
 * most regions, Friday and Saturday in `he-IL`, `ar-SA` or `ar-EG`, Friday
 * alone in `fa-IR`. Reads `Intl.Locale#getWeekInfo()`, with a CLDR fallback.
 */
export function isWeekend(value: DateValue, locale: string): boolean {
  return getWeekInfo(locale).weekend.includes(value.dayOfWeek)
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

const MAX_ISO_YEAR = 9999

/** Whether the year `eraYear` of `era` exists in `date`'s calendar, within the ISO years ±9999. */
function eraHasYear(date: Temporal.PlainDate, era: string, eraYear: number): boolean {
  const temporal = getTemporal()
  const first = temporal.PlainDate.from({ calendar: date.calendarId, era, eraYear, month: 1, day: 1 })
  const firstOfNext = temporal.PlainDate.from({ calendar: date.calendarId, era, eraYear: eraYear + 1, month: 1, day: 1 })
  const last = firstOfNext.subtract({ days: 1 })
  if (first.era !== era && last.era !== era)
    return false
  return Math.abs(first.withCalendar('iso8601').year) <= MAX_ISO_YEAR
}

/** The last year of `era` (or of the ISO range, for an era that has not ended). */
function lastYearOfEra(date: Temporal.PlainDate, era: string): number {
  let low = 1
  let high = MAX_ISO_YEAR
  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    if (eraHasYear(date, era, mid))
      low = mid
    else
      high = mid - 1
  }
  return low
}

/**
 * `value` in year `eraYear` of its era, with the month and day kept. In the
 * first or last year of an era the day is clamped into the era: Heisei 31
 * ends on 30 April, so Heisei 31-05-01 becomes Heisei 31-04-30.
 */
function withEraYear<T extends DateValue>(value: T, era: string, eraYear: number): T {
  let next = (value as Temporal.PlainDate).with({ era, eraYear }) as T
  const step = compareDateValues(next, value) > 0 ? -1 : 1
  for (let guard = 0; next.era !== era && guard < 400; guard++)
    next = next.add({ days: step }) as T
  return next
}

/**
 * The hour of a `ZonedDateTime` moved by `amount` elapsed hours, wrapping
 * within its day. Elapsed rather than wall-clock hours, as
 * `@internationalized/date` did: the hour skipped by a spring-forward change
 * is stepped over (03:30 EDT, then 01:30 EST), and the hour a fall-back change
 * repeats is visited once.
 */
function cycleZonedHour(value: Temporal.ZonedDateTime, amount: number): Temporal.ZonedDateTime {
  const HOUR_MS = 3_600_000
  const dayStart = value.startOfDay()
  const hoursInDay = Math.ceil(value.hoursInDay)
  const elapsed = Math.floor((value.epochMilliseconds - dayStart.epochMilliseconds) / HOUR_MS)

  let target = elapsed
  let next = value
  // A fall-back day repeats a wall-clock hour; skip the repeat so the hour segment moves.
  for (let guard = 0; guard < 3 && next.hour === value.hour; guard++) {
    target = cycleValue(target, amount, 0, hoursInDay - 1)
    next = value.add({ hours: target - elapsed })
  }
  return next
}

/**
 * `value` with one field moved by `amount`, wrapping within the field's range
 * instead of carrying into the next one: day 31 + 1 is day 1 of the same
 * month, 23:00 + 1 hour is 00:00 of the same day. `year` moves through the
 * years of the current era and wraps within it (Heisei 1 - 1 is Heisei 31);
 * calendars without eras wrap within the ISO years 1 … 9999. A
 * `ZonedDateTime`'s hour moves by elapsed time (see `cycleZonedHour`).
 */
export function cycleField<T extends DateValue | Temporal.PlainTime>(value: T, field: DateTimeField, amount: number): T {
  const v = value as Temporal.PlainDateTime
  switch (field) {
    case 'year': {
      const date = value as DateValue
      const era = date.era
      if (era === undefined)
        return setFields(value, { year: cycleValue(date.year, amount, 1, MAX_ISO_YEAR) })
      const plain = toPlainDate(date)
      const eraYear = cycleValue(date.eraYear!, amount, 1, lastYearOfEra(plain, era))
      return withEraYear(date, era, eraYear) as T
    }
    case 'month':
      return v.with({ month: cycleValue(v.month, amount, 1, v.monthsInYear) }) as unknown as T
    case 'day':
      return v.with({ day: cycleValue(v.day, amount, 1, v.daysInMonth) }) as unknown as T
    case 'hour':
      if (isZonedDateTime(value))
        return cycleZonedHour(value, amount) as T
      return v.with({ hour: cycleValue(v.hour, amount, 0, 23) }) as unknown as T
    case 'minute':
      return v.with({ minute: cycleValue(v.minute, amount, 0, 59) }) as unknown as T
    case 'second':
      return v.with({ second: cycleValue(v.second, amount, 0, 59) }) as unknown as T
  }
}
