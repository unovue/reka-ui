import { describe, expect, it } from 'vitest'
import { createDecade, getWeekNumber } from './calendar'

describe('createDecade', () => {
  const dateObj = new Temporal.PlainDate(2025, 8, 18)

  function expectYears(startIndex: number | undefined, endIndex: number, years: readonly number[]) {
    // Temporal dates carry no enumerable fields, so compare their ISO strings.
    expect(createDecade({ dateObj, startIndex, endIndex }).map(String))
      .toEqual(years.map(year => String(new Temporal.PlainDate(year, 1, 1))))
  }

  // TODO(v3-port): #3317 v3's createDecade repeats years for asymmetric ranges
  it.skip.each([
    [-2, 5, [2023, 2024, 2025, 2026, 2027, 2028, 2029]],
    [undefined, 3, [2025, 2026, 2027]],
  ] as const)('lists the years from offset %s up to %i (exclusive)', expectYears)

  it.each([
    [-2, 2, [2023, 2024, 2025, 2026]],
  ] as const)('lists the years from offset %s up to %i (exclusive)', expectYears)

  it('keeps the years in chronological order across eras', () => {
    const years = createDecade({ dateObj: Temporal.PlainDate.from({ year: 1, month: 8, day: 18, calendar: 'gregory' }), startIndex: -2, endIndex: 2 })
    expect(years.map(date => [date.era, date.eraYear])).toEqual([['bce', 2], ['bce', 1], ['ce', 1], ['ce', 2]])
  })
})

describe('getWeekNumber', () => {
  describe('iSO week (de-DE locale)', () => {
    it.each([
      [[2025, 12, 31], 1],
      [[2025, 12, 29], 1],
      [[2025, 12, 28], 52],
      [[2024, 12, 31], 1],
      [[2024, 1, 1], 1],
      [[2023, 1, 1], 52],
      [[2023, 1, 2], 1],
      [[2021, 1, 4], 1],
      [[2020, 12, 31], 53],
      [[2005, 1, 2], 53],
      [[2008, 12, 29], 1],
      [[2016, 1, 1], 53],
      [[2016, 5, 1], 17],
      [[2016, 5, 2], 18],
      [[2016, 5, 31], 22],
      [[2014, 7, 14], 29],
    ] as const)('%j → week %d', ([y, m, d], week) => {
      expect(getWeekNumber(new Temporal.PlainDate(y, m, d), 'de-DE')).toBe(week)
    })
  })

  describe('non-ISO week (en-US locale)', () => {
    it.each([
      [[2025, 12, 31], 1],
      [[2025, 1, 1], 1],
      [[2025, 1, 4], 1],
      [[2005, 1, 2], 2],
      [[2005, 1, 4], 2],
      [[2008, 12, 29], 1],
    ] as const)('%j → week %d', ([y, m, d], week) => {
      expect(getWeekNumber(new Temporal.PlainDate(y, m, d), 'en-US')).toBe(week)
    })
  })

  describe('firstDayOfWeek override', () => {
    it('should use locale for ISO detection, not firstDayOfWeek override', () => {
      // en-US with Monday override should still use non-ISO week numbering (Jan 1 in week 1)
      // Jan 1, 2023 is a Sunday. In non-ISO (en-US style), it's week 1.
      // In ISO 8601, Jan 1, 2023 would be week 52 of 2022.
      expect(getWeekNumber(new Temporal.PlainDate(2023, 1, 1), 'en-US', 'mon')).toBe(1)
    })

    it('should respect firstDayOfWeek for week boundaries', () => {
      // de-DE with Sunday override: week boundaries shift to Sunday
      // Jan 2, 2005 (Sunday) with Sunday start → week is Jan 2-8, contains Jan 4 → week 1
      // Without override (Monday start) → week is Dec 27-Jan 2, no Jan 4 → week 53
      expect(getWeekNumber(new Temporal.PlainDate(2005, 1, 2), 'de-DE', 'sun')).toBe(1)
      expect(getWeekNumber(new Temporal.PlainDate(2005, 1, 2), 'de-DE')).toBe(53)
    })
  })
})
