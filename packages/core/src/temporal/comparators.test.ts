import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'
import { areAllDaysBetweenValid, compareTemporalDate } from './comparators'

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
