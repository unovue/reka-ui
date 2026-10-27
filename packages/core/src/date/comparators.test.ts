import { describe, expect, it } from 'vitest'
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
