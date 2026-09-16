/*
 * Tests for the public {@link toDate} compat shim in {@link date/comparators.ts}.
 *
 * {@link toDate} is the public `@/date` helper for converting TemporalDate to
 * native Date. It must produce results equivalent to the canonical internal
 * {@link toNativeDate} from the conversion policy seam.
 */

import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'
import { toNativeDate } from '@/temporal/conversion-policy'
import { toDate } from './comparators'

describe('toDate (compat shim)', () => {
  it('converts PlainDate to native Date using system timezone', () => {
    const plainDate = Temporal.PlainDate.from('2024-06-15')
    const result = toDate(plainDate)
    const expected = toNativeDate(plainDate)
    expect(result.getTime()).toBe(expected.getTime())
  })

  it('converts PlainDate with explicit timezone', () => {
    const plainDate = Temporal.PlainDate.from('2024-06-15')
    const result = toDate(plainDate, 'Asia/Tokyo')
    const expected = toNativeDate(plainDate, { timeZone: 'Asia/Tokyo' })
    expect(result.getTime()).toBe(expected.getTime())
  })

  it('converts PlainDateTime to native Date', () => {
    const dt = Temporal.PlainDateTime.from('2024-06-15T18:30:00')
    const result = toDate(dt)
    const expected = toNativeDate(dt)
    expect(result.getTime()).toBe(expected.getTime())
  })

  it('converts PlainDateTime with explicit timezone', () => {
    const dt = Temporal.PlainDateTime.from('2024-06-15T18:30:00')
    const result = toDate(dt, 'Asia/Tokyo')
    const expected = toNativeDate(dt, { timeZone: 'Asia/Tokyo' })
    expect(result.getTime()).toBe(expected.getTime())
  })

  it('converts ZonedDateTime using its own timezone', () => {
    const zoned = Temporal.ZonedDateTime.from('2024-06-15T00:00:00[Asia/Tokyo]')
    const result = toDate(zoned)
    const expected = toNativeDate(zoned)
    // Both should use Tokyo time, not system timezone
    expect(result.getTime()).toBe(expected.getTime())
    expect(result.getUTCHours()).toBe(15) // Tokyo UTC+9 → 15:00 UTC
  })

  it('ignores explicit timezone when value is a ZonedDateTime', () => {
    const zoned = Temporal.ZonedDateTime.from('2024-06-15T00:00:00[Asia/Tokyo]')
    const result = toDate(zoned, 'America/New_York')
    const expected = toNativeDate(zoned, { timeZone: 'America/New_York' })
    // Both should still use Tokyo time—the explicit timezone is ignored for ZonedDateTime
    expect(result.getTime()).toBe(expected.getTime())
    expect(result.getUTCHours()).toBe(15)
  })

  it('produces different instants for different timezones on same PlainDate', () => {
    const plainDate = Temporal.PlainDate.from('2024-06-15')
    const tokyo = toDate(plainDate, 'Asia/Tokyo')
    const newYork = toDate(plainDate, 'America/New_York')
    expect(newYork.getTime()).not.toBe(tokyo.getTime())
  })

  it('handles dates far in the past and future', () => {
    const past = Temporal.PlainDate.from('0001-01-01')
    const future = Temporal.PlainDate.from('9999-12-31')
    expect(() => toDate(past)).not.toThrow()
    expect(() => toDate(future)).not.toThrow()
    expect(Number.isNaN(toDate(past).getTime())).toBe(false)
    expect(Number.isNaN(toDate(future).getTime())).toBe(false)
  })
})
