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
