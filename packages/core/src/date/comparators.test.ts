import { BuddhistCalendar, CalendarDate, CalendarDateTime, toCalendar, toTimeZone, toZoned } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { isSameDateValue } from './comparators'

describe('isSameDateValue', () => {
  it('matches a copy of the same value', () => {
    const date = new CalendarDateTime(2024, 1, 20, 12, 30)
    expect(isSameDateValue(date, date.copy())).toBe(true)
  })

  it('does not match a different time on the same day', () => {
    const date = new CalendarDateTime(2024, 1, 20, 12, 30)
    expect(isSameDateValue(date, date.set({ minute: 31 }))).toBe(false)
  })

  it('does not match the same instant in another time zone', () => {
    const newYork = toZoned(new CalendarDateTime(2024, 1, 20, 12, 30), 'America/New_York')
    expect(isSameDateValue(newYork, toTimeZone(newYork, 'Asia/Tokyo'))).toBe(false)
  })

  it('does not match the same day in another calendar system', () => {
    const gregorian = new CalendarDate(2024, 1, 20)
    expect(isSameDateValue(gregorian, toCalendar(gregorian, new BuddhistCalendar()))).toBe(false)
  })
})
