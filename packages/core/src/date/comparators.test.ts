import { describe, expect, it } from 'vitest'
import { areAllDaysBetweenValid, getMonthsBetween } from './comparators'
import { isSameDateValue, toCalendar } from './temporal'

describe('isSameDateValue', () => {
  it('matches a copy of the same value', () => {
    const date = new Temporal.PlainDateTime(2024, 1, 20, 12, 30)
    expect(isSameDateValue(date, date)).toBe(true)
  })

  it('does not match a different time on the same day', () => {
    const date = new Temporal.PlainDateTime(2024, 1, 20, 12, 30)
    expect(isSameDateValue(date, date.with({ minute: 31 }))).toBe(false)
  })

  it('does not match the same instant in another time zone', () => {
    const newYork = new Temporal.PlainDateTime(2024, 1, 20, 12, 30).toZonedDateTime('America/New_York')
    expect(isSameDateValue(newYork, newYork.withTimeZone('Asia/Tokyo'))).toBe(false)
  })

  it('does not match the same day in another calendar system', () => {
    const gregorian = new Temporal.PlainDate(2024, 1, 20)
    expect(isSameDateValue(gregorian, toCalendar(gregorian, 'buddhist'))).toBe(false)
  })
})

describe('areAllDaysBetweenValid', () => {
  const d20 = new Temporal.PlainDate(2024, 1, 20)
  const d22 = new Temporal.PlainDate(2024, 1, 22)

  it('returns true when no matcher is given', () => {
    expect(areAllDaysBetweenValid(d20, d22, undefined, undefined)).toBe(true)
  })

  it('does not look at the day after a single-day range', () => {
    expect(areAllDaysBetweenValid(d20, d20, (d: any) => d.day === 21, undefined)).toBe(true)
  })

  it('fails on an unavailable day between start and end', () => {
    expect(areAllDaysBetweenValid(d20, d22, (d: any) => d.day === 21, undefined)).toBe(false)
  })

  it('keeps the end day included', () => {
    expect(areAllDaysBetweenValid(d20, d22, (d: any) => d.day === 22, undefined)).toBe(false)
  })

  it('never looks past the end', () => {
    expect(areAllDaysBetweenValid(d20, d22, (d: any) => d.day === 23, undefined)).toBe(true)
  })

  it('does not check the start day itself', () => {
    expect(areAllDaysBetweenValid(d20, d22, (d: any) => d.day === 20, undefined)).toBe(true)
  })

  it('fails on a disabled day in between', () => {
    expect(areAllDaysBetweenValid(d20, d22, undefined, (d: any) => d.day === 21)).toBe(false)
  })

  it('lets highlightable days through', () => {
    expect(areAllDaysBetweenValid(d20, d22, (d: any) => d.day === 21, undefined, (d: any) => d.day === 21)).toBe(true)
  })
})

describe('getMonthsBetween', () => {
  const hebrew = (year: number, month: number) => Temporal.PlainDate.from({ calendar: 'hebrew', year, month, day: 1 })
  const japanese = (era: string, eraYear: number, month: number) => Temporal.PlainDate.from({ calendar: 'japanese', era, eraYear, month, day: 1 })

  it('counts the months inclusively across Gregorian years', () => {
    expect(getMonthsBetween(new Temporal.PlainDate(2024, 11, 1), new Temporal.PlainDate(2025, 2, 1))).toBe(4)
    expect(getMonthsBetween(new Temporal.PlainDate(2024, 3, 1), new Temporal.PlainDate(2024, 3, 31))).toBe(1)
    expect(getMonthsBetween(new Temporal.PlainDate(2025, 2, 1), new Temporal.PlainDate(2024, 11, 1))).toBe(-2)
  })

  it('counts the thirteenth month of a Hebrew leap year', () => {
    const start = hebrew(5784, 12)
    const end = hebrew(5785, 1)
    expect(getMonthsBetween(start, end)).toBe(3)
    expect(getMonthsBetween(end, start)).toBe(-1)
  })

  it('counts across the first year of a Japanese era', () => {
    const start = japanese('reiwa', 1, 12)
    const end = japanese('reiwa', 2, 1)
    expect(getMonthsBetween(start, end)).toBe(2)
    expect(getMonthsBetween(end, start)).toBe(0)
    expect(getMonthsBetween(japanese('heisei', 31, 4), japanese('reiwa', 1, 5))).toBe(2)
  })
})
