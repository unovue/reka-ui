import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'
import { areAllDaysBetweenValid } from './comparators'

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
