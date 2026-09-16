import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'
import { areAllDaysBetweenValid, areAllMonthsBetweenValid, areAllYearsBetweenValid, compareTemporalDate, compareYearMonth, getMonthsBetween, getYearsBetween, isMonthBetweenInclusive, isSameYear, isSameYearMonth, isYearBetweenInclusive } from './comparators'

describe('areAllDaysBetweenValid', () => {
  const alwaysDisabled = () => true
  const alwaysUnavailable = () => true
  const neverDisabled = () => false

  it('returns true when start === end (regression: off-by-one)', () => {
    const date = Temporal.PlainDate.from('2024-01-15')
    expect(areAllDaysBetweenValid(date, date, alwaysDisabled, neverDisabled)).toBe(true)
  })

  it('returns true when start + 1 day === end (adjacent, no days between)', () => {
    const start = Temporal.PlainDate.from('2024-01-15')
    const end = Temporal.PlainDate.from('2024-01-16')
    expect(areAllDaysBetweenValid(start, end, alwaysDisabled, neverDisabled)).toBe(true)
  })

  it('returns false when a day between start and end is disabled', () => {
    const start = Temporal.PlainDate.from('2024-01-15')
    const end = Temporal.PlainDate.from('2024-01-18')
    const disabledOn17 = (d: Temporal.PlainDate) => d.day === 17
    expect(areAllDaysBetweenValid(start, end, neverDisabled, disabledOn17)).toBe(false)
  })

  it('returns true when only endDate is disabled (should not validate endDate)', () => {
    const start = Temporal.PlainDate.from('2024-01-15')
    const end = Temporal.PlainDate.from('2024-01-20')
    const disabledOn20 = (d: Temporal.PlainDate) => d.day === 20
    expect(areAllDaysBetweenValid(start, end, neverDisabled, disabledOn20)).toBe(true)
  })

  it('returns true when only startDate is disabled (should not validate startDate)', () => {
    const start = Temporal.PlainDate.from('2024-01-15')
    const end = Temporal.PlainDate.from('2024-01-20')
    const disabledOn15 = (d: Temporal.PlainDate) => d.day === 15
    expect(areAllDaysBetweenValid(start, end, neverDisabled, disabledOn15)).toBe(true)
  })

  it('allows disabled date when isHighlightable overrides', () => {
    const start = Temporal.PlainDate.from('2024-01-15')
    const end = Temporal.PlainDate.from('2024-01-18')
    const alwaysHighlightable = () => true
    expect(areAllDaysBetweenValid(start, end, alwaysDisabled, neverDisabled, alwaysHighlightable)).toBe(true)
  })

  it('returns true when all matchers are undefined', () => {
    const start = Temporal.PlainDate.from('2024-01-15')
    const end = Temporal.PlainDate.from('2024-01-20')
    expect(areAllDaysBetweenValid(start, end, undefined, undefined)).toBe(true)
  })
})

describe('compareTemporalDate', () => {
  it('returns 0 for equal PlainDate values', () => {
    const a = Temporal.PlainDate.from('2024-01-15')
    const b = Temporal.PlainDate.from('2024-01-15')
    expect(compareTemporalDate(a, b)).toBe(0)
  })

  it('returns negative when PlainDate a is before b', () => {
    const a = Temporal.PlainDate.from('2024-01-15')
    const b = Temporal.PlainDate.from('2024-01-20')
    expect(compareTemporalDate(a, b)).toBeLessThan(0)
  })

  it('returns positive when PlainDate a is after b', () => {
    const a = Temporal.PlainDate.from('2024-01-20')
    const b = Temporal.PlainDate.from('2024-01-15')
    expect(compareTemporalDate(a, b)).toBeGreaterThan(0)
  })

  it('returns 0 for equal PlainDateTime values', () => {
    const a = Temporal.PlainDateTime.from('2024-01-15T12:00:00')
    const b = Temporal.PlainDateTime.from('2024-01-15T12:00:00')
    expect(compareTemporalDate(a, b)).toBe(0)
  })

  it('uses date-time ordering: 09:00 < 12:00 on the same day', () => {
    // This is the key behavior that supports TimeField invalidity at the shared seam:
    // min and max are time-of-day, so we must compare full date-times, not just dates.
    const earlier = Temporal.PlainDateTime.from('2024-01-15T09:00:00')
    const later = Temporal.PlainDateTime.from('2024-01-15T12:00:00')
    expect(compareTemporalDate(earlier, later)).toBeLessThan(0)
    expect(compareTemporalDate(later, earlier)).toBeGreaterThan(0)
  })

  it('uses date ordering when one side is PlainDate and the other is PlainDateTime (preserves DateField semantics)', () => {
    // Existing DateField behavior: a PlainDateTime and a PlainDate on the same day are
    // considered equal because DateField only validates the calendar day.
    const date = Temporal.PlainDate.from('2024-01-15')
    const sameDayDateTime = Temporal.PlainDateTime.from('2024-01-15T23:59:00')
    expect(compareTemporalDate(date, sameDayDateTime)).toBe(0)
    expect(compareTemporalDate(sameDayDateTime, date)).toBe(0)
  })
})

describe('isSameYear', () => {
  it('returns true when both dates share the same year', () => {
    const a = Temporal.PlainDate.from('2024-06-15')
    const b = Temporal.PlainDate.from('2024-01-01')
    expect(isSameYear(a, b)).toBe(true)
  })

  it('returns false when dates are in different years', () => {
    const a = Temporal.PlainDate.from('2024-06-15')
    const b = Temporal.PlainDate.from('2025-01-01')
    expect(isSameYear(a, b)).toBe(false)
  })

  it('handles PlainDateTime inputs', () => {
    const a = Temporal.PlainDateTime.from('2024-06-15T10:00:00')
    const b = Temporal.PlainDateTime.from('2024-12-31T23:59:59')
    expect(isSameYear(a, b)).toBe(true)
  })

  it('handles cross-type inputs (PlainDate and PlainDateTime)', () => {
    const a = Temporal.PlainDate.from('2024-06-15')
    const b = Temporal.PlainDateTime.from('2024-12-31T23:59:59')
    expect(isSameYear(a, b)).toBe(true)
  })
})

describe('isSameYearMonth', () => {
  it('returns true when both dates share the same year and month', () => {
    const a = Temporal.PlainDate.from('2024-06-15')
    const b = Temporal.PlainDate.from('2024-06-01')
    expect(isSameYearMonth(a, b)).toBe(true)
  })

  it('returns false when same year but different month', () => {
    const a = Temporal.PlainDate.from('2024-06-15')
    const b = Temporal.PlainDate.from('2024-07-01')
    expect(isSameYearMonth(a, b)).toBe(false)
  })

  it('returns false when same month but different year', () => {
    const a = Temporal.PlainDate.from('2024-06-15')
    const b = Temporal.PlainDate.from('2025-06-01')
    expect(isSameYearMonth(a, b)).toBe(false)
  })

  it('handles cross-type inputs', () => {
    const a = Temporal.PlainDate.from('2024-06-15')
    const b = Temporal.PlainDateTime.from('2024-06-01T12:00:00')
    expect(isSameYearMonth(a, b)).toBe(true)
  })
})

describe('compareYearMonth', () => {
  it('returns 0 for the same year and month', () => {
    const a = Temporal.PlainDate.from('2024-06-15')
    const b = Temporal.PlainDate.from('2024-06-01')
    expect(compareYearMonth(a, b)).toBe(0)
  })

  it('returns negative when first date has an earlier year', () => {
    const a = Temporal.PlainDate.from('2023-12-01')
    const b = Temporal.PlainDate.from('2024-01-01')
    expect(compareYearMonth(a, b)).toBeLessThan(0)
  })

  it('returns positive when first date has a later year', () => {
    const a = Temporal.PlainDate.from('2025-01-01')
    const b = Temporal.PlainDate.from('2024-12-01')
    expect(compareYearMonth(a, b)).toBeGreaterThan(0)
  })

  it('orders by month within the same year', () => {
    const june = Temporal.PlainDate.from('2024-06-15')
    const july = Temporal.PlainDate.from('2024-07-01')
    expect(compareYearMonth(june, july)).toBeLessThan(0)
    expect(compareYearMonth(july, june)).toBeGreaterThan(0)
  })

  it('handles PlainDateTime inputs', () => {
    const a = Temporal.PlainDateTime.from('2024-06-15T10:00:00')
    const b = Temporal.PlainDateTime.from('2024-07-01T00:00:00')
    expect(compareYearMonth(a, b)).toBeLessThan(0)
  })
})

describe('getMonthsBetween', () => {
  it('returns 1 when start and end are in the same month', () => {
    const a = Temporal.PlainDate.from('2024-06-01')
    const b = Temporal.PlainDate.from('2024-06-30')
    expect(getMonthsBetween(a, b)).toBe(1)
  })

  it('returns 2 for adjacent months', () => {
    const a = Temporal.PlainDate.from('2024-06-01')
    const b = Temporal.PlainDate.from('2024-07-01')
    expect(getMonthsBetween(a, b)).toBe(2)
  })

  it('returns 12 for a full year span', () => {
    const a = Temporal.PlainDate.from('2024-01-01')
    const b = Temporal.PlainDate.from('2024-12-31')
    expect(getMonthsBetween(a, b)).toBe(12)
  })

  it('returns the same inclusive count regardless of argument order', () => {
    const a = Temporal.PlainDate.from('2024-01-15')
    const b = Temporal.PlainDate.from('2024-03-10')
    expect(getMonthsBetween(a, b)).toBe(3)
    expect(getMonthsBetween(b, a)).toBe(3)
  })

  it('handles multi-year spans', () => {
    const a = Temporal.PlainDate.from('2024-06-15')
    const b = Temporal.PlainDate.from('2026-06-15')
    expect(getMonthsBetween(a, b)).toBe(25)
  })
})

describe('getYearsBetween', () => {
  it('returns 1 when start and end are in the same year', () => {
    const a = Temporal.PlainDate.from('2024-01-01')
    const b = Temporal.PlainDate.from('2024-12-31')
    expect(getYearsBetween(a, b)).toBe(1)
  })

  it('returns 2 for adjacent years', () => {
    const a = Temporal.PlainDate.from('2024-01-01')
    const b = Temporal.PlainDate.from('2025-12-31')
    expect(getYearsBetween(a, b)).toBe(2)
  })

  it('returns the same inclusive count regardless of argument order', () => {
    const a = Temporal.PlainDate.from('2024-06-15')
    const b = Temporal.PlainDate.from('2026-03-10')
    expect(getYearsBetween(a, b)).toBe(3)
    expect(getYearsBetween(b, a)).toBe(3)
  })

  it('handles decade spans', () => {
    const a = Temporal.PlainDate.from('2020-01-01')
    const b = Temporal.PlainDate.from('2029-12-31')
    expect(getYearsBetween(a, b)).toBe(10)
  })
})

describe('isMonthBetweenInclusive', () => {
  it('returns true when date is between start and end inclusive', () => {
    const date = Temporal.PlainDate.from('2024-06-15')
    const start = Temporal.PlainDate.from('2024-03-01')
    const end = Temporal.PlainDate.from('2024-09-30')
    expect(isMonthBetweenInclusive(date, start, end)).toBe(true)
  })

  it('returns true when date equals start', () => {
    const date = Temporal.PlainDate.from('2024-06-15')
    const start = Temporal.PlainDate.from('2024-06-01')
    const end = Temporal.PlainDate.from('2024-09-30')
    expect(isMonthBetweenInclusive(date, start, end)).toBe(true)
  })

  it('returns true when date equals end', () => {
    const date = Temporal.PlainDate.from('2024-09-15')
    const start = Temporal.PlainDate.from('2024-03-01')
    const end = Temporal.PlainDate.from('2024-09-30')
    expect(isMonthBetweenInclusive(date, start, end)).toBe(true)
  })

  it('returns false when date is before start', () => {
    const date = Temporal.PlainDate.from('2024-02-15')
    const start = Temporal.PlainDate.from('2024-03-01')
    const end = Temporal.PlainDate.from('2024-09-30')
    expect(isMonthBetweenInclusive(date, start, end)).toBe(false)
  })

  it('returns false when date is after end', () => {
    const date = Temporal.PlainDate.from('2024-10-15')
    const start = Temporal.PlainDate.from('2024-03-01')
    const end = Temporal.PlainDate.from('2024-09-30')
    expect(isMonthBetweenInclusive(date, start, end)).toBe(false)
  })

  it('handles cross-year ranges', () => {
    const date = Temporal.PlainDate.from('2025-01-15')
    const start = Temporal.PlainDate.from('2024-11-01')
    const end = Temporal.PlainDate.from('2025-03-31')
    expect(isMonthBetweenInclusive(date, start, end)).toBe(true)
  })
})

describe('isYearBetweenInclusive', () => {
  it('returns true when year is between start and end inclusive', () => {
    const date = Temporal.PlainDate.from('2025-06-15')
    const start = Temporal.PlainDate.from('2024-01-01')
    const end = Temporal.PlainDate.from('2027-12-31')
    expect(isYearBetweenInclusive(date, start, end)).toBe(true)
  })

  it('returns true when date equals start year', () => {
    const date = Temporal.PlainDate.from('2024-06-15')
    const start = Temporal.PlainDate.from('2024-01-01')
    const end = Temporal.PlainDate.from('2027-12-31')
    expect(isYearBetweenInclusive(date, start, end)).toBe(true)
  })

  it('returns true when date equals end year', () => {
    const date = Temporal.PlainDate.from('2027-06-15')
    const start = Temporal.PlainDate.from('2024-01-01')
    const end = Temporal.PlainDate.from('2027-12-31')
    expect(isYearBetweenInclusive(date, start, end)).toBe(true)
  })

  it('returns false when year is before start', () => {
    const date = Temporal.PlainDate.from('2023-06-15')
    const start = Temporal.PlainDate.from('2024-01-01')
    const end = Temporal.PlainDate.from('2027-12-31')
    expect(isYearBetweenInclusive(date, start, end)).toBe(false)
  })

  it('returns false when year is after end', () => {
    const date = Temporal.PlainDate.from('2028-06-15')
    const start = Temporal.PlainDate.from('2024-01-01')
    const end = Temporal.PlainDate.from('2027-12-31')
    expect(isYearBetweenInclusive(date, start, end)).toBe(false)
  })
})

describe('areAllMonthsBetweenValid', () => {
  const neverBlocked = () => false
  const alwaysBlocked = () => true

  it('returns true when start === end (no interior months)', () => {
    const date = Temporal.PlainDate.from('2024-06-15')
    expect(areAllMonthsBetweenValid(date, date, neverBlocked, neverBlocked)).toBe(true)
  })

  it('returns true when start and end are adjacent months', () => {
    const start = Temporal.PlainDate.from('2024-06-15')
    const end = Temporal.PlainDate.from('2024-07-15')
    expect(areAllMonthsBetweenValid(start, end, neverBlocked, neverBlocked)).toBe(true)
  })

  it('returns false when an interior month is disabled', () => {
    const start = Temporal.PlainDate.from('2024-06-01')
    const end = Temporal.PlainDate.from('2024-09-30')
    // Block July: 2024-07-01
    const blockedInJuly = (d: Temporal.PlainDate) => d.month === 7
    expect(areAllMonthsBetweenValid(start, end, neverBlocked, blockedInJuly)).toBe(false)
  })

  it('returns true when only start month is blocked', () => {
    const start = Temporal.PlainDate.from('2024-06-15')
    const end = Temporal.PlainDate.from('2024-09-30')
    const blockedJune = (d: Temporal.PlainDate) => d.month === 6
    expect(areAllMonthsBetweenValid(start, end, neverBlocked, blockedJune)).toBe(true)
  })

  it('returns true when only end month is blocked', () => {
    const start = Temporal.PlainDate.from('2024-06-15')
    const end = Temporal.PlainDate.from('2024-09-30')
    const blockedSept = (d: Temporal.PlainDate) => d.month === 9
    expect(areAllMonthsBetweenValid(start, end, neverBlocked, blockedSept)).toBe(true)
  })

  it('returns true when both matchers are undefined', () => {
    const start = Temporal.PlainDate.from('2024-06-01')
    const end = Temporal.PlainDate.from('2024-09-30')
    expect(areAllMonthsBetweenValid(start, end, undefined, undefined)).toBe(true)
  })

  it('returns false when unavailable blocks interior', () => {
    const start = Temporal.PlainDate.from('2024-06-01')
    const end = Temporal.PlainDate.from('2024-09-30')
    const blockedInJuly = (d: Temporal.PlainDate) => d.month === 7
    expect(areAllMonthsBetweenValid(start, end, blockedInJuly, neverBlocked)).toBe(false)
  })
})

describe('areAllYearsBetweenValid', () => {
  const neverBlocked = () => false
  const alwaysBlocked = () => true

  it('returns true when start === end (no interior years)', () => {
    const date = Temporal.PlainDate.from('2024-06-15')
    expect(areAllYearsBetweenValid(date, date, neverBlocked, neverBlocked)).toBe(true)
  })

  it('returns true when start and end are adjacent years', () => {
    const start = Temporal.PlainDate.from('2024-06-15')
    const end = Temporal.PlainDate.from('2025-06-15')
    expect(areAllYearsBetweenValid(start, end, neverBlocked, neverBlocked)).toBe(true)
  })

  it('returns false when an interior year is disabled', () => {
    const start = Temporal.PlainDate.from('2024-06-01')
    const end = Temporal.PlainDate.from('2027-12-31')
    const blocked2026 = (d: Temporal.PlainDate) => d.year === 2026
    expect(areAllYearsBetweenValid(start, end, neverBlocked, blocked2026)).toBe(false)
  })

  it('returns true when only start year is blocked', () => {
    const start = Temporal.PlainDate.from('2024-06-15')
    const end = Temporal.PlainDate.from('2027-12-31')
    const blocked2024 = (d: Temporal.PlainDate) => d.year === 2024
    expect(areAllYearsBetweenValid(start, end, neverBlocked, blocked2024)).toBe(true)
  })

  it('returns true when only end year is blocked', () => {
    const start = Temporal.PlainDate.from('2024-06-15')
    const end = Temporal.PlainDate.from('2027-12-31')
    const blocked2027 = (d: Temporal.PlainDate) => d.year === 2027
    expect(areAllYearsBetweenValid(start, end, neverBlocked, blocked2027)).toBe(true)
  })

  it('returns true when both matchers are undefined', () => {
    const start = Temporal.PlainDate.from('2024-06-01')
    const end = Temporal.PlainDate.from('2027-12-31')
    expect(areAllYearsBetweenValid(start, end, undefined, undefined)).toBe(true)
  })

  it('returns false when unavailable blocks interior', () => {
    const start = Temporal.PlainDate.from('2024-06-01')
    const end = Temporal.PlainDate.from('2027-12-31')
    const blocked2026 = (d: Temporal.PlainDate) => d.year === 2026
    expect(areAllYearsBetweenValid(start, end, blocked2026, neverBlocked)).toBe(false)
  })
})
