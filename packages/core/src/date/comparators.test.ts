import type { DateValue } from '@internationalized/date'
import { BuddhistCalendar, CalendarDate, CalendarDateTime, toCalendar, toTimeZone, toZoned } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { areAllDaysBetweenValid, isSameDateValue } from './comparators'

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

describe('areAllDaysBetweenValid', () => {
  // 2024-01-19 is a Friday, 2024-01-20 a Saturday.
  const friday = new CalendarDate(2024, 1, 19)
  const isSaturday = (date: DateValue) => date.day === 20
  const isMonday = (date: DateValue) => date.day === 22

  it('returns true when no matcher is given', () => {
    expect(areAllDaysBetweenValid(friday, friday.add({ days: 3 }), undefined, undefined)).toBe(true)
  })

  it('does not check the day after a single-day range', () => {
    expect(areAllDaysBetweenValid(friday, friday, isSaturday, undefined)).toBe(true)
    expect(areAllDaysBetweenValid(friday, friday, undefined, isSaturday)).toBe(true)
  })

  it('does not check the start day itself', () => {
    expect(areAllDaysBetweenValid(friday, friday.add({ days: 1 }), (date: DateValue) => date.day === 19, undefined)).toBe(true)
  })

  it('fails on an unavailable or disabled day after the start, up to and including the end', () => {
    const monday = friday.add({ days: 3 })
    expect(areAllDaysBetweenValid(friday, monday, isSaturday, undefined)).toBe(false)
    expect(areAllDaysBetweenValid(friday, monday, undefined, isSaturday)).toBe(false)
    expect(areAllDaysBetweenValid(friday, monday, isMonday, undefined)).toBe(false)
  })

  it('never checks past the end', () => {
    expect(areAllDaysBetweenValid(friday.subtract({ days: 4 }), friday, isSaturday, undefined)).toBe(true)
  })

  it('lets highlightable days through', () => {
    expect(areAllDaysBetweenValid(friday, friday.add({ days: 3 }), isSaturday, undefined, isSaturday)).toBe(true)
  })

  it.each([
    ['CalendarDateTime', (hour: number) => new CalendarDateTime(2024, 1, 15, hour)],
    ['ZonedDateTime', (hour: number) => toZoned(new CalendarDateTime(2024, 1, 15, hour), 'America/New_York')],
  ])('walks whole days of a %s range, whatever the times of day', (_, mondayAt) => {
    const fridayAt = (hour: number) => mondayAt(hour).add({ days: 4 })
    // Monday 09:00 to Friday 17:00: Saturday is after the range.
    expect(areAllDaysBetweenValid(mondayAt(9), fridayAt(17), isSaturday, undefined)).toBe(true)
    expect(areAllDaysBetweenValid(fridayAt(9), fridayAt(17), isSaturday, undefined)).toBe(true)
    // Monday 17:00 to Friday 09:00: Friday is still in the range.
    expect(areAllDaysBetweenValid(mondayAt(17), fridayAt(9), (date: DateValue) => date.day === 19, undefined)).toBe(false)
  })
})
