import { Temporal as BasicTemporal } from 'temporal-polyfill-lite'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDefaultCalendar, getDefaultDate } from '@/shared/date/comparators'
import { useDateFormatter } from '@/shared/useDateFormatter'
import { createMonth, getWeekStartsOn } from './calendar'
import * as dateEntry from './index'
import { getTemporal } from './runtime'
import {
  compareDateValues,
  cycleField,
  getFieldValue,
  getLocaleWeekStart,
  isDateValue,
  isPlainDate,
  isPlainDateTime,
  isPlainTime,
  isSameDateValue,
  isWeekend,
  isZonedDateTime,
  setFields,
  toDate,
  toIsoString,
} from './temporal'
import { getUnitAdapter } from './units'

describe('the Temporal global', () => {
  const temporal = globalThis.Temporal

  afterEach(() => {
    globalThis.Temporal = temporal
  })

  it('is read from globalThis, not bundled', () => {
    expect(getTemporal()).toBe(temporal)
  })

  it('throws a descriptive error in development when it is missing', () => {
    // @ts-expect-error simulate a runtime without Temporal and without a polyfill
    delete globalThis.Temporal
    expect(() => getTemporal()).toThrow(/need the Temporal API.*temporal-polyfill-lite/)
  })

  it('throws a one-line error in production when it is missing', () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      // @ts-expect-error simulate a runtime without Temporal and without a polyfill
      delete globalThis.Temporal
      expect(() => getTemporal()).toThrow('[Reka UI] Temporal is not defined: load a polyfill. https://reka-ui.com/docs/guides/dates')
    }
    finally {
      vi.unstubAllEnvs()
    }
  })
})

describe('brand checks', () => {
  it('recognises each Temporal type by its brand', () => {
    const date = new Temporal.PlainDate(2026, 9, 5)
    const dateTime = new Temporal.PlainDateTime(2026, 9, 5, 10, 30)
    const zoned = dateTime.toZonedDateTime('Europe/Paris')
    const time = new Temporal.PlainTime(10, 30)

    expect([isPlainDate(date), isPlainDateTime(date), isZonedDateTime(date)]).toEqual([true, false, false])
    expect([isPlainDate(dateTime), isPlainDateTime(dateTime), isZonedDateTime(dateTime)]).toEqual([false, true, false])
    expect([isPlainDate(zoned), isPlainDateTime(zoned), isZonedDateTime(zoned)]).toEqual([false, false, true])
    expect(isPlainTime(time)).toBe(true)
    expect([date, dateTime, zoned].every(isDateValue)).toBe(true)
    expect(isDateValue(time)).toBe(false)
  })

  it('does not accept look-alike objects', () => {
    expect(isPlainDate({ year: 2026, month: 9, day: 5, calendarId: 'iso8601' })).toBe(false)
    expect(isDateValue(new Date(2026, 8, 5))).toBe(false)
    expect(isDateValue('2026-09-05')).toBe(false)
  })
})

describe('comparison', () => {
  it('orders mixed types as wall-clock date-times, a PlainDate counting as midnight', () => {
    const date = new Temporal.PlainDate(2026, 9, 5)
    expect(compareDateValues(date, new Temporal.PlainDateTime(2026, 9, 5))).toBe(0)
    expect(compareDateValues(date, new Temporal.PlainDateTime(2026, 9, 5, 0, 0, 1))).toBeLessThan(0)
    expect(compareDateValues(new Temporal.PlainDateTime(2026, 9, 5, 12), date)).toBeGreaterThan(0)
  })

  it('orders two ZonedDateTimes by instant', () => {
    const paris = Temporal.ZonedDateTime.from('2026-09-05T10:00[Europe/Paris]')
    const newYork = Temporal.ZonedDateTime.from('2026-09-05T05:00[America/New_York]')
    // 10:00 in Paris is 04:00 in New York.
    expect(compareDateValues(paris, newYork)).toBeLessThan(0)
  })

  it('ignores the calendar system', () => {
    const iso = new Temporal.PlainDate(2026, 9, 5)
    expect(compareDateValues(iso, iso.withCalendar('hebrew'))).toBe(0)
    expect(isSameDateValue(iso, iso.withCalendar('hebrew'))).toBe(false)
    expect(isSameDateValue(iso, new Temporal.PlainDate(2026, 9, 5))).toBe(true)
  })

  it('treats different Temporal types as different values', () => {
    expect(isSameDateValue(new Temporal.PlainDate(2026, 9, 5), new Temporal.PlainDateTime(2026, 9, 5))).toBe(false)
  })
})

describe('calendar systems', () => {
  const reiwa = (eraYear: number, month = 5, day = 1) =>
    Temporal.PlainDate.from({ calendar: 'japanese', era: 'reiwa', eraYear, month, day })

  it('reads and writes the year of the era in calendars with eras', () => {
    const date = reiwa(6)
    expect(getFieldValue(date, 'year')).toBe(6)
    expect(date.year).toBe(2024)

    const typed = setFields(date, { year: 2 })
    expect(typed.era).toBe('reiwa')
    expect(typed.eraYear).toBe(2)
    expect(toIsoString(typed)).toBe('2020-05-01')
  })

  it('serialises any calendar as plain ISO, as form inputs and data-value need', () => {
    expect(reiwa(6).toString()).toBe('2024-05-01[u-ca=japanese]')
    expect(toIsoString(reiwa(6))).toBe('2024-05-01')
    expect(toIsoString(Temporal.ZonedDateTime.from('2024-05-01T10:00[Asia/Tokyo][u-ca=japanese]'))).toBe('2024-05-01T10:00:00+09:00[Asia/Tokyo]')
    expect(toIsoString(new Temporal.PlainTime(9, 5))).toBe('09:05:00')
  })

  it('reads the arithmetic year in calendars without eras', () => {
    const date = new Temporal.PlainDate(2026, 9, 5)
    expect(getFieldValue(date, 'year')).toBe(2026)
    expect(toIsoString(setFields(date, { year: 2030 }))).toBe('2030-09-05')
  })

  it('cycles fields within their range', () => {
    const date = new Temporal.PlainDate(2026, 1, 31)
    expect(cycleField(date, 'day', 1).day).toBe(1)
    expect(cycleField(date, 'month', -1).month).toBe(12)
    expect(cycleField(date, 'month', -1).year).toBe(2026)
    // A Hebrew leap year has 13 months.
    const adarII = Temporal.PlainDate.from({ calendar: 'hebrew', year: 5784, month: 13, day: 1 })
    expect(cycleField(adarII, 'month', 1).month).toBe(1)
    expect(cycleField(adarII, 'month', 1).year).toBe(5784)
    const time = new Temporal.PlainDateTime(2026, 1, 1, 23, 59)
    expect(cycleField(time, 'hour', 1).hour).toBe(0)
    expect(cycleField(time, 'minute', 15).minute).toBe(14)
  })

  it('defaults new dates to the locale calendar, ISO for Gregorian locales', () => {
    expect(getDefaultCalendar('en-US')).toBe('iso8601')
    expect(getDefaultCalendar('de-DE')).toBe('iso8601')
    expect(getDefaultCalendar('th-TH')).toBe('buddhist')
    expect(getDefaultCalendar('en-US-u-ca-hebrew')).toBe('hebrew')
    expect(getDefaultDate({ locale: 'th-TH' }).calendarId).toBe('buddhist')
    expect(getDefaultDate({ locale: 'en-US' }).calendarId).toBe('iso8601')
    expect(isPlainDateTime(getDefaultDate({ locale: 'en-US', granularity: 'minute' }))).toBe(true)
  })

  it('formats a value in its own calendar', () => {
    const formatter = useDateFormatter('en-US')
    // Month 7 of a Hebrew leap year is the inserted month, Adar II.
    const hebrew = Temporal.PlainDate.from({ calendar: 'hebrew', year: 5784, month: 7, day: 1 })
    expect(hebrew.monthCode).toBe('M06')
    expect(formatter.fullMonthAndYear(hebrew)).toBe('Adar II 5784')
    expect(formatter.fullMonthAndYear(new Temporal.PlainDate(2024, 4, 9))).toBe('April 2024')
    expect(formatter.custom(reiwa(6), { era: 'long', year: 'numeric' })).toMatch(/Reiwa/)
  })

  it('builds a month grid in a non-ISO calendar', () => {
    const date = Temporal.PlainDate.from({ calendar: 'persian', year: 1403, month: 12, day: 1 })
    const grid = createMonth({ dateObj: date, weekStartsOn: 6, fixedWeeks: false, locale: 'fa-IR' })
    const inMonth = grid.cells.filter(cell => cell.month === 12)
    expect(inMonth).toHaveLength(date.daysInMonth)
    expect(grid.rows.every(row => row[0].dayOfWeek === 6)).toBe(true)
    expect(grid.cells.every(cell => cell.calendarId === 'persian')).toBe(true)
  })
})

describe('time zones and DST', () => {
  it('converts a plain date to the start of that day, which is not always midnight', () => {
    // São Paulo moved its clocks from 00:00 to 01:00 on 2018-11-04.
    const date = new Temporal.PlainDate(2018, 11, 4)
    expect(toDate(date, 'America/Sao_Paulo').toISOString()).toBe('2018-11-04T03:00:00.000Z')
  })

  it('resolves a wall-clock time inside the spring-forward gap forwards', () => {
    const skipped = new Temporal.PlainDateTime(2024, 3, 10, 2, 30)
    expect(toDate(skipped, 'America/New_York').toISOString()).toBe('2024-03-10T07:30:00.000Z')
  })

  it('keeps a ZonedDateTime in its own zone', () => {
    const tokyo = Temporal.ZonedDateTime.from('2024-03-10T02:30[Asia/Tokyo]')
    expect(toDate(tokyo, 'America/New_York').toISOString()).toBe('2024-03-09T17:30:00.000Z')
  })

  it('counts whole days across a DST change', () => {
    const start = Temporal.ZonedDateTime.from('2024-03-09T12:00[America/New_York]')
    const end = Temporal.ZonedDateTime.from('2024-03-11T12:00[America/New_York]')
    expect(getUnitAdapter('day').distance(start, end)).toBe(3)
  })

  it('builds a DST month of zoned days with one cell per day', () => {
    const march = Temporal.ZonedDateTime.from('2024-03-01T00:30[America/New_York]')
    const grid = createMonth({ dateObj: march, weekStartsOn: 0, fixedWeeks: false, locale: 'en-US' })
    const days = grid.cells.filter(cell => cell.month === 3).map(cell => cell.day)
    expect(days).toEqual(Array.from({ length: 31 }, (_, i) => i + 1))
    expect(grid.cells.every(cell => isZonedDateTime(cell) && cell.timeZoneId === 'America/New_York')).toBe(true)
  })

  it('formats a plain value as its wall-clock fields whatever the local zone', () => {
    const formatter = useDateFormatter('en-US', { timeZone: 'Pacific/Kiritimati' })
    const date = new Temporal.PlainDateTime(2024, 3, 10, 2, 30)
    expect(formatter.custom(date, { hour: 'numeric', minute: '2-digit', day: 'numeric' })).toBe('10, 2:30 AM')
  })

  it('formats a ZonedDateTime in its own zone', () => {
    const formatter = useDateFormatter('en-US')
    const zoned = Temporal.ZonedDateTime.from('2024-03-10T03:30[America/New_York]')
    expect(formatter.part(zoned, 'hour')).toBe('3')
    // 03:30 EDT is 16:30 in Tokyo.
    expect(formatter.part(zoned.withTimeZone('Asia/Tokyo'), 'hour')).toBe('4')
  })
})

describe('week info', () => {
  it('reads the first day of the week from the locale', () => {
    expect(getWeekStartsOn('en-US')).toBe(0)
    expect(getWeekStartsOn('de-DE')).toBe(1)
    expect(getWeekStartsOn('ar-EG')).toBe(6)
  })

  it('falls back to the CLDR region table without week info on Intl.Locale', () => {
    const proto = Intl.Locale.prototype
    const saved = (['getWeekInfo', 'weekInfo'] as const).map(key => [key, Object.getOwnPropertyDescriptor(proto, key)] as const)
    for (const [key] of saved)
      Object.defineProperty(proto, key, { value: undefined, configurable: true, writable: true })
    try {
      // Locales the tests above did not read, so the per-locale cache is cold.
      expect(getLocaleWeekStart('fr-FR')).toBe(1)
      expect(getLocaleWeekStart('ar-AE')).toBe(1)
      expect(getLocaleWeekStart('ar-JO')).toBe(6)
      expect(getLocaleWeekStart('dv-MV')).toBe(5)
      expect(getLocaleWeekStart('en-CA')).toBe(0)
      expect(getLocaleWeekStart('fa')).toBe(6)
    }
    finally {
      restoreWeekInfo(saved)
    }
  })

  // Locales whose region the fallback table does not list, or a macro-region:
  // the table must match Intl's CLDR data so server and browser grids agree.
  const fallbackLocales = ['es-419', 'en-150', 'pt-BR', 'en-001', 'he-IL', 'ar-SA', 'fa-IR', 'ar-EG', 'ps-AF', 'ar-AE', 'hi-IN', 'en-UG']

  it('falls back to week data that agrees with Intl', () => {
    const fromIntl = fallbackLocales.map((locale) => {
      const info = (new Intl.Locale(locale) as Intl.Locale & { getWeekInfo: () => { firstDay: number, weekend: number[] } }).getWeekInfo()
      return [locale, info.firstDay % 7, info.weekend] as const
    })
    const saved = removeWeekInfo()
    try {
      const fromTable = fallbackLocales.map(locale => [
        locale,
        getLocaleWeekStart(locale),
        [1, 2, 3, 4, 5, 6, 7].filter(day => isWeekend(Temporal.PlainDate.from('2024-05-13').add({ days: day - 1 }), locale)),
      ] as const)
      expect(fromTable).toEqual(fromIntl)
    }
    finally {
      restoreWeekInfo(saved)
    }
  })

  it('reads the weekend from the locale', () => {
    const friday = Temporal.PlainDate.from('2024-05-17')
    const saturday = friday.add({ days: 1 })
    const sunday = friday.add({ days: 2 })
    const thursday = friday.subtract({ days: 1 })
    expect([isWeekend(friday, 'en-US'), isWeekend(saturday, 'en-US'), isWeekend(sunday, 'en-US')]).toEqual([false, true, true])
    for (const locale of ['he-IL', 'ar-SA', 'ar-EG'])
      expect([locale, isWeekend(friday, locale), isWeekend(saturday, locale), isWeekend(sunday, locale)]).toEqual([locale, true, true, false])
    expect([isWeekend(friday, 'fa-IR'), isWeekend(saturday, 'fa-IR')]).toEqual([true, false])
    expect([isWeekend(thursday, 'ps-AF'), isWeekend(friday, 'ps-AF'), isWeekend(saturday, 'ps-AF')]).toEqual([true, true, false])
    expect([isWeekend(friday, 'ar-AE'), isWeekend(saturday, 'ar-AE'), isWeekend(sunday, 'ar-AE')]).toEqual([false, true, true])
    // Any calendar: the weekday is the same.
    expect(isWeekend(friday.withCalendar('persian'), 'fa-IR')).toBe(true)
  })
})

function removeWeekInfo() {
  const proto = Intl.Locale.prototype
  const saved = (['getWeekInfo', 'weekInfo'] as const).map(key => [key, Object.getOwnPropertyDescriptor(proto, key)] as const)
  for (const [key] of saved)
    Object.defineProperty(proto, key, { value: undefined, configurable: true, writable: true })
  return saved
}

function restoreWeekInfo(saved: ReturnType<typeof removeWeekInfo>) {
  const proto = Intl.Locale.prototype
  for (const [key, descriptor] of saved) {
    if (descriptor)
      Object.defineProperty(proto, key, descriptor)
    else
      delete (proto as unknown as Record<string, unknown>)[key]
  }
}

describe('cycling the year of an era', () => {
  const japanese = (era: string, eraYear: number, month: number, day: number) => Temporal.PlainDate.from({ calendar: 'japanese', era, eraYear, month, day })

  it('wraps from the first year of an ended era to its last', () => {
    const wrapped = cycleField(japanese('heisei', 1, 4, 30), 'year', -1)
    expect([wrapped.era, wrapped.eraYear, wrapped.toString({ calendarName: 'never' })]).toEqual(['heisei', 31, '2019-04-30'])
  })

  it('clamps a day past the end of the era into it', () => {
    // Heisei 31 ended on 30 April 2019.
    const wrapped = cycleField(japanese('heisei', 1, 12, 31), 'year', -1)
    expect([wrapped.era, wrapped.eraYear, wrapped.toString({ calendarName: 'never' })]).toEqual(['heisei', 31, '2019-04-30'])
    const up = cycleField(japanese('heisei', 30, 6, 1), 'year', 1)
    expect([up.era, up.eraYear, up.toString({ calendarName: 'never' })]).toEqual(['heisei', 31, '2019-04-30'])
  })

  it('wraps from the last year of an era to its first, clamped to its start', () => {
    // Heisei began on 8 January 1989.
    const wrapped = cycleField(japanese('heisei', 31, 1, 2), 'year', 1)
    expect([wrapped.era, wrapped.eraYear, wrapped.toString({ calendarName: 'never' })]).toEqual(['heisei', 1, '1989-01-08'])
  })

  it('keeps an open era within the ISO year 9999', () => {
    const wrapped = cycleField(japanese('reiwa', 1, 5, 1), 'year', -1)
    expect(wrapped.era).toBe('reiwa')
    expect(wrapped.withCalendar('iso8601').year).toBe(9999)
    expect(cycleField(wrapped, 'year', 1).eraYear).toBe(1)
  })

  it('wraps a Gregorian year within 1 and 9999', () => {
    expect(cycleField(Temporal.PlainDate.from('0001-06-01'), 'year', -1).year).toBe(9999)
    expect(cycleField(Temporal.PlainDate.from('9999-06-01'), 'year', 1).year).toBe(1)
  })
})

describe('cycling the hour of a ZonedDateTime', () => {
  const ny = (iso: string) => Temporal.ZonedDateTime.from(`${iso}[America/New_York]`)

  it('steps over the hour a spring-forward change skips', () => {
    expect(cycleField(ny('2024-03-10T03:30-04:00'), 'hour', -1).toString()).toBe('2024-03-10T01:30:00-05:00[America/New_York]')
    expect(cycleField(ny('2024-03-10T01:30-05:00'), 'hour', 1).toString()).toBe('2024-03-10T03:30:00-04:00[America/New_York]')
  })

  it('moves the wall-clock hour on a fall-back day', () => {
    expect(cycleField(ny('2024-11-03T00:30-04:00'), 'hour', 1).toString()).toBe('2024-11-03T01:30:00-04:00[America/New_York]')
    expect(cycleField(ny('2024-11-03T01:30-04:00'), 'hour', 1).toString()).toBe('2024-11-03T02:30:00-05:00[America/New_York]')
    expect(cycleField(ny('2024-11-03T02:30-05:00'), 'hour', -1).hour).toBe(1)
  })

  it('wraps within the day', () => {
    expect(cycleField(ny('2024-03-10T23:30-04:00'), 'hour', 1).toString()).toBe('2024-03-10T00:30:00-05:00[America/New_York]')
    expect(cycleField(ny('2024-03-10T00:30-05:00'), 'hour', -1).toString()).toBe('2024-03-10T23:30:00-04:00[America/New_York]')
  })
})

describe('calendar support of the loaded Temporal', () => {
  it('falls back to iso8601 with a warning when the locale\'s calendar is not supported', () => {
    const temporal = globalThis.Temporal
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      globalThis.Temporal = BasicTemporal as unknown as typeof Temporal
      // A calendar no other test asked about, so the support cache is cold.
      expect(getDefaultCalendar('en-US-u-ca-coptic')).toBe('iso8601')
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('`coptic` calendar'))
    }
    finally {
      globalThis.Temporal = temporal
      warn.mockRestore()
    }
  })
})

describe('public surface of reka-ui/date', () => {
  it('keeps the runtime helpers internal', () => {
    for (const name of ['getTemporal', 'assertTemporal', 'isSameYearOf'])
      expect(dateEntry).not.toHaveProperty(name)
  })

  it('keeps `isCalendarDateTime` as a deprecated alias', () => {
    expect(dateEntry.isCalendarDateTime).toBe(dateEntry.isPlainDateTime)
    expect(dateEntry.isWeekend).toBeTypeOf('function')
  })
})
