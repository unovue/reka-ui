/**
 * Granularity adapters for day, month, and year range selection.
 *
 * Each adapter implements the GranularityAdapter interface for a specific
 * temporal unit, providing comparison, arithmetic, and iteration primitives
 * that the shared range selection state machine consumes.
 */

import type { GranularityAdapter } from './range-selection-state'
import type { TemporalDate } from '@/temporal/types'
import { areAllDaysBetweenValid, areAllMonthsBetweenValid, areAllYearsBetweenValid, compareYearMonth, getMonthsBetween, getYearsBetween, isBefore, isBetweenInclusive, isSameDay, isSameYear, isSameYearMonth, toPlainDate } from '@/temporal/comparators'

/**
 * Day granularity adapter. Uses Temporal.PlainDate comparison for day-level range selection.
 *
 * getSpanCount returns an inclusive count: getDaysBetween (exclusive) + 1.
 * This normalizes the off-by-one in the existing RangeCalendar implementation
 * to match the inclusive Maximum span semantics.
 */
export const dayAdapter: GranularityAdapter<TemporalDate> = {
  areEqual(a, b) {
    return isSameDay(a, b)
  },

  compare(a, b) {
    return isBefore(a, b) ? -1 : isSameDay(a, b) ? 0 : 1
  },

  isBetweenInclusive(date, start, end) {
    return isBetweenInclusive(date, start, end)
  },

  getSpanCount(start, end) {
    // Calculate inclusive day count using Temporal.until()
    const startDate = toPlainDate(start)
    const endDate = toPlainDate(end)
    const diffDays = Math.abs(startDate.until(endDate).days)
    return diffDays + 1 // inclusive
  },

  addUnits(date, amount) {
    return toPlainDate(date).add({ days: amount })
  },

  areAllInteriorUnitsValid(start, end, isBlocked) {
    return areAllDaysBetweenValid(
      start,
      end,
      undefined, // isUnavailable handled by isBlocked in the caller
      isBlocked,
    )
  },
}

/**
 * Month granularity adapter. Uses year+month comparison for month-level range selection.
 *
 * getSpanCount returns the inclusive count from getMonthsBetween (already inclusive).
 */
export const monthAdapter: GranularityAdapter<TemporalDate> = {
  areEqual(a, b) {
    return isSameYearMonth(a, b)
  },

  compare(a, b) {
    return compareYearMonth(a, b)
  },

  isBetweenInclusive(date, start, end) {
    return compareYearMonth(date, start) >= 0 && compareYearMonth(date, end) <= 0
  },

  getSpanCount(start, end) {
    return getMonthsBetween(start, end) // already inclusive
  },

  addUnits(date, amount) {
    return toPlainDate(date).add({ months: amount })
  },

  areAllInteriorUnitsValid(start, end, isBlocked) {
    return areAllMonthsBetweenValid(start, end, undefined, isBlocked)
  },
}

/**
 * Year granularity adapter. Uses year comparison for year-level range selection.
 *
 * getSpanCount returns the inclusive count from getYearsBetween (already inclusive).
 */
export const yearAdapter: GranularityAdapter<TemporalDate> = {
  areEqual(a, b) {
    return isSameYear(a, b)
  },

  compare(a, b) {
    const ya = toPlainDate(a).year
    const yb = toPlainDate(b).year
    return ya - yb
  },

  isBetweenInclusive(date, start, end) {
    const y = toPlainDate(date).year
    const ys = toPlainDate(start).year
    const ye = toPlainDate(end).year
    return y >= ys && y <= ye
  },

  getSpanCount(start, end) {
    return getYearsBetween(start, end) // already inclusive
  },

  addUnits(date, amount) {
    return toPlainDate(date).add({ years: amount })
  },

  areAllInteriorUnitsValid(start, end, isBlocked) {
    return areAllYearsBetweenValid(start, end, undefined, isBlocked)
  },
}
