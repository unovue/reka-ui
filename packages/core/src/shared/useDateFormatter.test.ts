import type { DateFormatterOptions } from './useDateFormatter'
import { describe, expect, it } from 'vitest'
import { useDateFormatter } from './useDateFormatter'

/** Fixed instants, pinned to UTC below so the suite is time-zone independent. */
const HOURS = [
  ['00:30', new Date('2024-01-20T00:30:00Z'), 'AM'],
  ['11:30', new Date('2024-01-20T11:30:00Z'), 'AM'],
  ['12:30', new Date('2024-01-20T12:30:00Z'), 'PM'],
  ['15:30', new Date('2024-01-20T15:30:00Z'), 'PM'],
  ['23:30', new Date('2024-01-20T23:30:00Z'), 'PM'],
] as const

/**
 * Locales whose formatted `dayPeriod` part is not one of `AM`/`PM`/`am`/`pm`/
 * `p.m.`, alongside a few that are. Every one of them must still resolve to the
 * internal `AM`/`PM` token.
 *
 * @see https://github.com/unovue/reka-ui/issues/2956
 */
const LOCALES = ['en-US', 'nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'es-ES', 'ja-JP', 'zh-CN', 'ko-KR', 'ar-EG', 'fa-IR', 'hi-IN', 'th-TH', 'my-MM']

describe('useDateFormatter', () => {
  describe('dayPeriod', () => {
    describe.each(LOCALES)('%s', (locale) => {
      it.each(HOURS)('resolves %s to the %s token', (_label, date, expected) => {
        const formatter = useDateFormatter(locale, { timeZone: 'UTC', hourCycle: 'h12' })
        expect(formatter.dayPeriod(date)).toBe(expected)
      })
    })

    // `hour12` wins over `hourCycle` in `Intl`, so it has to be cleared rather
    // than just overridden, otherwise the hour comes back on a 12-hour clock
    // and every afternoon time reads as AM.
    const optionCases: [string, DateFormatterOptions][] = [
      ['no hour options', {}],
      ['hourCycle h11', { hourCycle: 'h11' }],
      ['hourCycle h12', { hourCycle: 'h12' }],
      ['hourCycle h23', { hourCycle: 'h23' }],
      ['hourCycle h24', { hourCycle: 'h24' }],
      ['hour12 true', { hour12: true }],
      ['hour12 false', { hour12: false }],
      ['a non-gregorian calendar', { calendar: 'buddhist' }],
    ]

    describe.each(optionCases)('with %s', (_name, options) => {
      it.each(HOURS)('resolves %s to the %s token', (_label, date, expected) => {
        const formatter = useDateFormatter('en-US', { ...options, timeZone: 'UTC' })
        expect(formatter.dayPeriod(date)).toBe(expected)
      })
    })

    it('reads the hour in the time zone given to the formatter', () => {
      const midnightUtc = new Date('2024-01-20T00:30:00Z')

      expect(useDateFormatter('en-US', { timeZone: 'UTC' }).dayPeriod(midnightUtc)).toBe('AM')
      // 00:30 UTC is 19:30 the previous day in New York.
      expect(useDateFormatter('en-US', { timeZone: 'America/New_York' }).dayPeriod(midnightUtc)).toBe('PM')
    })

    it('reads the hour in an explicit time zone over the formatter one', () => {
      const midnightUtc = new Date('2024-01-20T00:30:00Z')
      const formatter = useDateFormatter('ja-JP', { timeZone: 'UTC', hourCycle: 'h12' })

      expect(formatter.dayPeriod(midnightUtc)).toBe('AM')
      // 00:30 UTC is 09:30 in Tokyo and 19:30 the previous day in New York.
      expect(formatter.dayPeriod(midnightUtc, 'Asia/Tokyo')).toBe('AM')
      expect(formatter.dayPeriod(midnightUtc, 'America/New_York')).toBe('PM')
    })

    it('follows setLocale', () => {
      const formatter = useDateFormatter('en-US', { timeZone: 'UTC' })
      const afternoon = new Date('2024-01-20T15:30:00Z')

      expect(formatter.dayPeriod(afternoon)).toBe('PM')
      formatter.setLocale('ja-JP')
      expect(formatter.dayPeriod(afternoon)).toBe('PM')
    })
  })
})

// The Temporal path resolves a cached formatter by key and builds the `Date`
// from the value's fields directly. It must give what formatting the value's
// UTC wall clock (or its own zone) in its own calendar gives.
describe('useDateFormatter: cached Temporal formatting', () => {
  const plain = new Temporal.PlainDate(2024, 2, 29)
  const dateTime = new Temporal.PlainDateTime(2024, 2, 29, 23, 45, 12, 345)
  const zoned = Temporal.ZonedDateTime.from('2024-03-10T01:30:00[America/New_York]')
  const japanese = plain.withCalendar('japanese')
  const persian = plain.withCalendar('persian')
  const reference = (value: Temporal.PlainDate | Temporal.PlainDateTime, locale: string, options: DateFormatterOptions) => {
    const calendar = options.calendar ?? (value.calendarId === 'iso8601' ? 'gregory' : value.calendarId)
    const iso = value.withCalendar('iso8601')
    const fields = 'hour' in iso ? iso : iso.toPlainDateTime()
    const instant = new Date(0)
    instant.setUTCFullYear(fields.year, fields.month - 1, fields.day)
    instant.setUTCHours(fields.hour, fields.minute, fields.second, fields.millisecond)
    return new Intl.DateTimeFormat(locale, { ...options, calendar, timeZone: 'UTC' }).format(instant)
  }
  const DATE: DateFormatterOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  const DATE_TIME: DateFormatterOptions = { ...DATE, hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 3 }

  it.each([
    ['a PlainDate', plain, 'en-US', DATE],
    ['a PlainDateTime', dateTime, 'en-US', DATE_TIME],
    ['a Japanese PlainDate', japanese, 'ja-JP', DATE],
    ['a Persian PlainDate', persian, 'fa-IR', DATE],
    ['an ISO PlainDate in a non-Gregorian locale', plain, 'th-TH', DATE],
  ] as const)('formats %s as its wall clock in its own calendar', (_label, value, locale, options) => {
    expect(useDateFormatter(locale).custom(value, options)).toBe(reference(value, locale, options))
  })

  it('formats a year before 100 without the two-digit year shift', () => {
    const early = new Temporal.PlainDate(42, 6, 1)
    expect(useDateFormatter('en-US').custom(early, { year: 'numeric', month: 'short', day: 'numeric' })).toBe('Jun 1, 42')
  })

  it('formats a ZonedDateTime in its own zone', () => {
    const formatted = useDateFormatter('en-US').custom(zoned, { hour: 'numeric', minute: 'numeric', timeZoneName: 'short' })
    expect(formatted).toBe(new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', timeZoneName: 'short', timeZone: 'America/New_York' }).format(new Date(zoned.epochMilliseconds)))
  })

  it('follows a locale change on the same formatter', () => {
    const formatter = useDateFormatter('en-US')
    expect(formatter.fullMonth(plain)).toBe('February')
    formatter.setLocale('fr-FR')
    expect(formatter.fullMonth(plain)).toBe('février')
  })

  it('honours an explicit calendar option over the value\'s calendar', () => {
    const options: DateFormatterOptions = { year: 'numeric', calendar: 'japanese', era: 'short' }
    expect(useDateFormatter('en-US').custom(plain, options)).toBe(reference(plain, 'en-US', options))
  })

  it('reads a mutated options object afresh', () => {
    const formatter = useDateFormatter('en-US')
    const options: DateFormatterOptions = { month: 'long' }
    expect(formatter.custom(plain, options)).toBe('February')
    options.month = 'short'
    expect(formatter.custom(plain, options)).toBe('Feb')
  })

  it('tells an option set to undefined from an omitted one', () => {
    const formatter = useDateFormatter('en-US', { month: 'long' })
    expect(formatter.custom(plain, {})).toBe('February')
    expect(formatter.custom(plain, { month: undefined, day: 'numeric' })).toBe('29')
    expect(formatter.custom(plain, { day: 'numeric' })).toBe('February 29')
  })

  it('reads mutated formatter options afresh', () => {
    const opts: DateFormatterOptions = { month: 'long' }
    const formatter = useDateFormatter('en-US', opts)
    expect(formatter.custom(plain, {})).toBe('February')
    opts.month = 'short'
    expect(formatter.custom(plain, {})).toBe('Feb')
  })
})
