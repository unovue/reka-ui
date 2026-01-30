import { CalendarDate } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { getWeekNumber } from './calendar'

describe('getWeekNumber', () => {
  it.each([
  // ISO 8601 (de-DE)
    ['de-DE', 2025, 12, 31, 1],
    ['de-DE', 2025, 12, 29, 1],
    ['de-DE', 2025, 12, 28, 52],
    ['de-DE', 2024, 12, 31, 1],
    ['de-DE', 2024, 1, 1, 1],
    ['de-DE', 2023, 1, 1, 52],
    ['de-DE', 2023, 1, 2, 1],
    ['de-DE', 2021, 1, 4, 1],
    ['de-DE', 2020, 12, 31, 53],
    // US (en-US)
    ['en-US', 2025, 12, 31, 53],
    ['en-US', 2025, 1, 1, 1],
    ['en-US', 2025, 1, 4, 1],
  ])('%s %d-%d-%d → week %d', (locale, y, m, d, week) => {
    expect(getWeekNumber(new CalendarDate(y, m, d), locale)).toBe(week)
  })
})
