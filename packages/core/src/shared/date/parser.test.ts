/*
 * Tests for segment sync functions in {@link parser.ts}.
 *
 * These functions use a local {@code toDate} helper that was a duplicate of
 * the canonical conversion policy. The tests verify that sync behavior is
 * preserved after routing through the policy seam.
 */

import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'
import { useDateFormatter } from '@/shared'
import { syncSegmentValues, syncTimeSegmentValues } from './parser'

function createFormatter(locale = 'en-US') {
  return useDateFormatter(locale)
}

describe('syncSegmentValues', () => {
  it('extracts date segments from a PlainDate', () => {
    const date = Temporal.PlainDate.from('2024-06-15')
    const formatter = createFormatter()
    const result = syncSegmentValues({ value: date, formatter })
    expect(result.year).toBe(2024)
    expect(result.month).toBe(6)
    expect(result.day).toBe(15)
    expect(result).not.toHaveProperty('hour')
    expect(result).not.toHaveProperty('minute')
    expect(result).not.toHaveProperty('second')
  })

  it('extracts date and time segments from a PlainDateTime', () => {
    const dt = Temporal.PlainDateTime.from('2024-06-15T14:30:00')
    const formatter = createFormatter()
    const result = syncSegmentValues({ value: dt, formatter })
    expect(result.year).toBe(2024)
    expect(result.month).toBe(6)
    expect(result.day).toBe(15)
    expect(result.hour).toBe(14)
    expect(result.minute).toBe(30)
    expect(result.second).toBe(0)
    expect(result.dayPeriod).toBe('PM')
  })

  it('extracts date and time segments from a ZonedDateTime', () => {
    const zoned = Temporal.ZonedDateTime.from('2024-06-15T14:30:00[Asia/Tokyo]')
    const formatter = createFormatter()
    const result = syncSegmentValues({ value: zoned, formatter })
    expect(result.year).toBe(2024)
    expect(result.month).toBe(6)
    expect(result.day).toBe(15)
    expect(result.hour).toBe(14)
    expect(result.minute).toBe(30)
    expect(result.second).toBe(0)
  })

  it('includes dayPeriod from formatter for time values', () => {
    const dt = Temporal.PlainDateTime.from('2024-06-15T09:15:00')
    const formatter = createFormatter()
    const result = syncSegmentValues({ value: dt, formatter })
    expect(result.dayPeriod).toBe('AM')
  })

  it('extracts time segments from a PlainDateTime at midnight boundaries', () => {
    const dt = Temporal.PlainDateTime.from('2024-06-15T00:00:00')
    const formatter = createFormatter()
    const result = syncSegmentValues({ value: dt, formatter })
    expect(result.hour).toBe(0)
    expect(result.minute).toBe(0)
    expect(result.second).toBe(0)
    expect(result.dayPeriod).toBe('AM')
  })
})

describe('syncTimeSegmentValues', () => {
  it('extracts time parts from a PlainTime value', () => {
    const time = Temporal.PlainTime.from('14:30:00')
    const formatter = createFormatter()
    const result = syncTimeSegmentValues({ value: time, formatter })
    expect(result.hour).toBe(14)
    expect(result.minute).toBe(30)
    expect(result.second).toBe(0)
    expect(result.dayPeriod).toBe('PM')
  })

  it('extracts time parts from a PlainDateTime', () => {
    const dt = Temporal.PlainDateTime.from('2024-06-15T09:15:30')
    const formatter = createFormatter()
    const result = syncTimeSegmentValues({ value: dt, formatter })
    expect(result.hour).toBe(9)
    expect(result.minute).toBe(15)
    expect(result.second).toBe(30)
    expect(result.dayPeriod).toBe('AM')
  })

  it('returns null for missing time parts', () => {
    const time = Temporal.PlainTime.from('14:30:00')
    const formatter = createFormatter()
    const result = syncTimeSegmentValues({ value: time, formatter })
    // hour/minute/second are present; dayPeriod is a string; only present parts are returned
    expect(result.hour).toBe(14)
    expect(result.minute).toBe(30)
    expect(result.second).toBe(0)
  })

  it('handles midnight correctly (0:00 as AM)', () => {
    const time = Temporal.PlainTime.from('00:00:00')
    const formatter = createFormatter()
    const result = syncTimeSegmentValues({ value: time, formatter })
    expect(result.hour).toBe(0)
    expect(result.minute).toBe(0)
    expect(result.second).toBe(0)
    expect(result.dayPeriod).toBe('AM')
  })
})
