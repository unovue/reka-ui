/*
 * Tests for the internal Temporal conversion policy.
 *
 * The conversion policy is the single internal seam for turning
 * TemporalDate values into native Date objects. Timezone authority
 * follows this precedence:
 *
 *   1. ZonedDateTime's own timezone
 *   2. Caller-provided explicit timezone option
 *   3. System timezone fallback (Temporal.Now.timeZoneId())
 *
 * These tests verify the seam, not the formatter or calendar consumers.
 */

import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'
import { getDefaultDate, getDefaultTime, toNativeDate, toPublicTimeValue, toShellDateTime } from './conversion-policy'

describe('toNativeDate', () => {
  describe('zonedDateTime — value timezone authority', () => {
    it('uses the ZonedDateTime timezone, not system timezone', () => {
      // June 15, 2024 00:00:00 in Tokyo (UTC+9) = 2024-06-14T15:00:00Z
      const zoned = Temporal.ZonedDateTime.from('2024-06-15T00:00:00[Asia/Tokyo]')
      const date = toNativeDate(zoned)
      expect(date.getTime()).toBe(zoned.toInstant().epochMilliseconds)
      // Verify the Date's UTC hour corresponds to Tokyo's offset (UTC+9 → 15:00 UTC previous day)
      expect(date.getUTCHours()).toBe(15)
      expect(date.getUTCDate()).toBe(14)
    })

    it('ignores an explicit timezone option passed by caller', () => {
      // A ZonedDateTime in Tokyo — the explicit 'America/New_York' must NOT be used
      const zoned = Temporal.ZonedDateTime.from('2024-06-15T00:00:00[Asia/Tokyo]')
      const date = toNativeDate(zoned, { timeZone: 'America/New_York' })
      // The epoch milliseconds should still correspond to Tokyo time, not New York
      expect(date.getTime()).toBe(zoned.toInstant().epochMilliseconds)
      expect(date.getUTCHours()).toBe(15) // Tokyo UTC+9 → 15:00 UTC
    })

    it('preserves sub-millisecond precision as whole milliseconds', () => {
      const zoned = Temporal.ZonedDateTime.from('2024-06-15T12:30:45.123456789[Asia/Tokyo]')
      const date = toNativeDate(zoned)
      // Temporal epochMilliseconds truncates toward zero, so we just check consistency
      expect(date.getTime()).toBe(zoned.toInstant().epochMilliseconds)
    })
  })

  describe('plainDate — explicit timezone option', () => {
    it('converts using the provided timezone', () => {
      // June 15, 2024 as a plain date, interpreted as midnight in Tokyo
      const plainDate = Temporal.PlainDate.from('2024-06-15')
      const date = toNativeDate(plainDate, { timeZone: 'Asia/Tokyo' })
      // Tokyo midnight = June 14, 15:00 UTC
      expect(date.getUTCFullYear()).toBe(2024)
      expect(date.getUTCMonth()).toBe(5) // June is month 5 (0-indexed)
      expect(date.getUTCDate()).toBe(14)
      expect(date.getUTCHours()).toBe(15)
    })

    it('produces different instants for different timezones on the same plain date', () => {
      const plainDate = Temporal.PlainDate.from('2024-06-15')
      const tokyo = toNativeDate(plainDate, { timeZone: 'Asia/Tokyo' })
      const newYork = toNativeDate(plainDate, { timeZone: 'America/New_York' })
      // Midnight in Tokyo ≠ midnight in New York (9-hour offset difference)
      expect(newYork.getTime()).not.toBe(tokyo.getTime())
      // New York is UTC-4 in June, so midnight EDT = 04:00 UTC
      expect(newYork.getUTCHours()).toBe(4)
    })
  })

  describe('plainDateTime — explicit timezone option', () => {
    it('converts using the provided timezone', () => {
      const dt = Temporal.PlainDateTime.from('2024-06-15T18:30:00')
      const date = toNativeDate(dt, { timeZone: 'Asia/Tokyo' })
      // 18:30 Tokyo (UTC+9) = 09:30 UTC
      expect(date.getUTCHours()).toBe(9)
      expect(date.getUTCMinutes()).toBe(30)
    })
  })

  describe('fallback — system timezone (no option)', () => {
    it('plainDate falls back to system timezone (US/Eastern in test env)', () => {
      // System TZ is US/Eastern — EDT (UTC-4) in June
      const plainDate = Temporal.PlainDate.from('2024-06-15')
      const date = toNativeDate(plainDate)
      // Midnight EDT = 04:00 UTC
      expect(date.getUTCHours()).toBe(4)
    })

    it('plainDateTime falls back to system timezone', () => {
      const dt = Temporal.PlainDateTime.from('2024-06-15T12:00:00')
      const date = toNativeDate(dt)
      // Noon EDT (UTC-4) = 16:00 UTC
      expect(date.getUTCHours()).toBe(16)
    })

    it('zonedDateTime still uses its own timezone even without explicit option', () => {
      // System TZ is US/Eastern, but ZonedDateTime in Tokyo must use Tokyo
      const zoned = Temporal.ZonedDateTime.from('2024-06-15T00:00:00[Asia/Tokyo]')
      const date = toNativeDate(zoned)
      expect(date.getUTCHours()).toBe(15) // Tokyo UTC+9 → 15:00 UTC
      // Not 4:00 (EDT midnight)
      expect(date.getUTCHours()).not.toBe(4)
    })
  })

  describe('plainTime — explicit anchor required', () => {
    it('converts PlainTime with explicit anchor date in the resolved timezone', () => {
      // 14:30 time-only, anchored to June 15, 2024 in Tokyo
      const plainTime = Temporal.PlainTime.from('14:30:00')
      const anchor = Temporal.PlainDate.from('2024-06-15')
      const date = toNativeDate(plainTime, {
        plainTimeAnchor: anchor,
        timeZone: 'Asia/Tokyo',
      })
      // 2024-06-15T14:30:00 in Tokyo (UTC+9) = 2024-06-15T05:30:00Z
      expect(date.getUTCFullYear()).toBe(2024)
      expect(date.getUTCMonth()).toBe(5) // June is month 5 (0-indexed)
      expect(date.getUTCDate()).toBe(15)
      expect(date.getUTCHours()).toBe(5)
      expect(date.getUTCMinutes()).toBe(30)
    })

    it('different timezones produce different instants for the same PlainTime and anchor', () => {
      const plainTime = Temporal.PlainTime.from('10:00:00')
      const anchor = Temporal.PlainDate.from('2024-06-15')

      // Same time + anchor, different timezones
      const tokyo = toNativeDate(plainTime, {
        plainTimeAnchor: anchor,
        timeZone: 'Asia/Tokyo',
      })
      const newYork = toNativeDate(plainTime, {
        plainTimeAnchor: anchor,
        timeZone: 'America/New_York',
      })

      // 10:00 Tokyo = 01:00 UTC; 10:00 New York = 14:00 UTC
      expect(tokyo.getTime()).not.toBe(newYork.getTime())
      expect(newYork.getTime()).toBeGreaterThan(tokyo.getTime())
    })

    it('throws a descriptive error when PlainTime is passed without plainTimeAnchor', () => {
      const plainTime = Temporal.PlainTime.from('14:30:00')

      // Cast to bypass type-level enforcement — this tests the runtime guard
      expect(() => toNativeDate(plainTime as any)).toThrow(
        'toNativeDate: PlainTime conversion requires a plainTimeAnchor option',
      )
    })

    it('throws even when timezone is provided but anchor is missing', () => {
      const plainTime = Temporal.PlainTime.from('14:30:00')

      expect(() => toNativeDate(plainTime as any, { timeZone: 'Asia/Tokyo' })).toThrow(
        'toNativeDate: PlainTime conversion requires a plainTimeAnchor option',
      )
    })

    it('falls back to system timezone when no timezone option is provided', () => {
      const plainTime = Temporal.PlainTime.from('08:00:00')
      const anchor = Temporal.PlainDate.from('2024-06-15')

      // System TZ is US/Eastern — EDT (UTC-4) in June
      const date = toNativeDate(plainTime, { plainTimeAnchor: anchor })

      // 08:00 EDT = 12:00 UTC
      expect(date.getUTCHours()).toBe(12)
      expect(date.getUTCMinutes()).toBe(0)
    })

    it('different anchor dates produce different native Date instants for the same PlainTime', () => {
      const plainTime = Temporal.PlainTime.from('12:00:00')
      const anchorJune = Temporal.PlainDate.from('2024-06-15')
      const anchorJuly = Temporal.PlainDate.from('2024-07-04')

      const juneDate = toNativeDate(plainTime, {
        plainTimeAnchor: anchorJune,
        timeZone: 'US/Eastern',
      })
      const julyDate = toNativeDate(plainTime, {
        plainTimeAnchor: anchorJuly,
        timeZone: 'US/Eastern',
      })

      // Different calendar days → different epoch milliseconds
      expect(julyDate.getTime()).not.toBe(juneDate.getTime())
      // Verify which is which: July 4 noon is after June 15 noon
      expect(julyDate.getTime()).toBeGreaterThan(juneDate.getTime())
      // Both should be noon in EDT = 16:00 UTC
      expect(juneDate.getUTCHours()).toBe(16)
      expect(julyDate.getUTCHours()).toBe(16)
      // But different dates
      expect(juneDate.getUTCMonth()).toBe(5) // June
      expect(julyDate.getUTCMonth()).toBe(6) // July
    })

    it('produces the same instant as the equivalent PlainDateTime', () => {
      const plainTime = Temporal.PlainTime.from('18:30:00')
      const anchor = Temporal.PlainDate.from('2024-06-15')

      // Via PlainTime + anchor
      const fromTime = toNativeDate(plainTime, {
        plainTimeAnchor: anchor,
        timeZone: 'Asia/Tokyo',
      })

      // Via PlainDateTime directly
      const dt = Temporal.PlainDateTime.from('2024-06-15T18:30:00')
      const fromDt = toNativeDate(dt, { timeZone: 'Asia/Tokyo' })

      // Both should represent the same instant
      expect(fromTime.getTime()).toBe(fromDt.getTime())
    })
  })

  describe('regression — ticket 0001 timezone authority unchanged', () => {
    it('zonedDateTime still uses its own timezone', () => {
      const zoned = Temporal.ZonedDateTime.from('2024-06-15T00:00:00[Asia/Tokyo]')
      const date = toNativeDate(zoned)
      expect(date.getUTCHours()).toBe(15)
    })

    it('plainDate with explicit timezone still works', () => {
      const plainDate = Temporal.PlainDate.from('2024-06-15')
      const date = toNativeDate(plainDate, { timeZone: 'Asia/Tokyo' })
      expect(date.getUTCHours()).toBe(15)
      expect(date.getUTCDate()).toBe(14)
    })

    it('plainDateTime with explicit timezone still works', () => {
      const dt = Temporal.PlainDateTime.from('2024-06-15T18:30:00')
      const date = toNativeDate(dt, { timeZone: 'Asia/Tokyo' })
      expect(date.getUTCHours()).toBe(9)
      expect(date.getUTCMinutes()).toBe(30)
    })
  })

  describe('edge cases', () => {
    it('handles dates at timezone boundaries (DST transitions)', () => {
      // March 10, 2024 — US DST transition: clocks spring forward at 2:00 AM
      // 2024-03-10 02:30 in US/Eastern doesn't exist (gap), but 00:00 is fine
      const dt = Temporal.PlainDate.from('2024-03-10')
      // Midnight EST (UTC-5) before DST = 05:00 UTC
      // Midnight EDT (UTC-4) after DST = 04:00 UTC
      // The conversion should use the timezone's rules at that date for midnight
      const date = toNativeDate(dt, { timeZone: 'America/New_York' })
      // March 10, 2024 at 00:00 EST = March 10, 05:00 UTC
      expect(date.getUTCHours()).toBe(5)
    })

    it('handles dates far in the past and future', () => {
      const farPast = Temporal.PlainDate.from('0001-01-01')
      const pastDate = toNativeDate(farPast)
      expect(pastDate.getTime()).toBeTypeOf('number')
      expect(Number.isNaN(pastDate.getTime())).toBe(false)

      const farFuture = Temporal.PlainDate.from('9999-12-31')
      const futureDate = toNativeDate(farFuture)
      expect(futureDate.getTime()).toBeTypeOf('number')
      expect(Number.isNaN(futureDate.getTime())).toBe(false)
    })
  })
})

describe('getDefaultDate', () => {
  it('returns a single value as-is', () => {
    const date = Temporal.PlainDate.from('2024-06-15')
    expect(getDefaultDate({ defaultValue: date })).toBe(date)
  })

  it('returns the first element from an array (range-array behaviour)', () => {
    const start = Temporal.PlainDate.from('2024-06-01')
    const end = Temporal.PlainDate.from('2024-07-15')
    const result = getDefaultDate({ defaultValue: [start, end] })
    expect(result).toBe(start)
    expect(result).not.toBe(end)
  })

  it('favours defaultValue over defaultPlaceholder', () => {
    const date = Temporal.PlainDate.from('2024-06-15')
    const placeholder = Temporal.PlainDate.from('2024-01-01')
    expect(getDefaultDate({ defaultValue: date, defaultPlaceholder: placeholder })).toBe(date)
  })

  it('falls back to defaultPlaceholder when defaultValue is undefined', () => {
    const placeholder = Temporal.PlainDate.from('2024-01-01')
    expect(getDefaultDate({ defaultPlaceholder: placeholder })).toBe(placeholder)
  })

  it('falls back to today as PlainDate when granularity is day', () => {
    const now = new Date()
    // We can't know the exact date, but we know the type and year at least
    const result = getDefaultDate({})
    expect(result).toBeInstanceOf(Temporal.PlainDate)
    expect(result.year).toBe(now.getFullYear())
    expect(result.month).toBe(now.getMonth() + 1)
    expect(result.day).toBe(now.getDate())
  })

  it('falls back to today as PlainDateTime when granularity is hour/minute/second', () => {
    const result = getDefaultDate({ granularity: 'hour' })
    expect(result).toBeInstanceOf(Temporal.PlainDateTime)
    expect(result.hour).toBe(0)
    expect(result.minute).toBe(0)
    expect(result.second).toBe(0)

    const resultMinute = getDefaultDate({ granularity: 'minute' })
    expect(resultMinute).toBeInstanceOf(Temporal.PlainDateTime)

    const resultSecond = getDefaultDate({ granularity: 'second' })
    expect(resultSecond).toBeInstanceOf(Temporal.PlainDateTime)
  })

  it('returns placeholder even when granularity is set (placeholder takes priority over today)', () => {
    const placeholder = Temporal.PlainDate.from('2023-12-25')
    expect(getDefaultDate({ defaultPlaceholder: placeholder, granularity: 'hour' })).toBe(placeholder)
  })

  it('uses day granularity by default', () => {
    const result = getDefaultDate({})
    expect(result).toBeInstanceOf(Temporal.PlainDate)
  })

  it('returns PlainDateTime for unknown granularity values (non-day any non-day value defaults to datetime)', () => {
    // @ts-expect-error — testing runtime behaviour with invalid granularity
    const result = getDefaultDate({ granularity: 'invalid' })
    expect(result).toBeInstanceOf(Temporal.PlainDateTime)
  })

  describe('getDefaultDate — edge cases', () => {
    it('handles empty defaultValue array gracefully (falls through to placeholder)', () => {
      const placeholder = Temporal.PlainDate.from('2024-01-01')
      expect(getDefaultDate({ defaultValue: [], defaultPlaceholder: placeholder })).toBe(placeholder)
    })

    it('handles empty defaultValue array without placeholder falls back to today', () => {
      const result = getDefaultDate({ defaultValue: [] })
      expect(result).toBeInstanceOf(Temporal.PlainDate)
    })

    it('returns PlainDateTime for hour granularity regardless of locale', () => {
      const resultEn = getDefaultDate({ granularity: 'hour', locale: 'en-US' })
      const resultJa = getDefaultDate({ granularity: 'hour', locale: 'ja-JP' })
      expect(resultEn).toBeInstanceOf(Temporal.PlainDateTime)
      expect(resultJa).toBeInstanceOf(Temporal.PlainDateTime)
    })
  })
})

describe('getDefaultTime', () => {
  it('returns the provided defaultValue', () => {
    const time = Temporal.PlainTime.from('14:30:00')
    expect(getDefaultTime({ defaultValue: time })).toBe(time)
  })

  it('favours defaultValue over defaultPlaceholder', () => {
    const time = Temporal.PlainTime.from('14:30:00')
    const placeholder = Temporal.PlainTime.from('08:00:00')
    expect(getDefaultTime({ defaultValue: time, defaultPlaceholder: placeholder })).toBe(time)
  })

  it('falls back to defaultPlaceholder when defaultValue is undefined', () => {
    const placeholder = Temporal.PlainTime.from('08:00:00')
    expect(getDefaultTime({ defaultPlaceholder: placeholder })).toBe(placeholder)
  })

  it('falls back to midnight (00:00:00) when nothing is provided', () => {
    const result = getDefaultTime({})
    expect(result).toBeInstanceOf(Temporal.PlainTime)
    expect(result.hour).toBe(0)
    expect(result.minute).toBe(0)
    expect(result.second).toBe(0)
  })

  it('accepts PlainDateTime as defaultValue (broader TemporalDateTime type)', () => {
    const dt = Temporal.PlainDateTime.from('2024-06-15T14:30:00')
    const result = getDefaultTime({ defaultValue: dt })
    expect(result).toBeInstanceOf(Temporal.PlainDateTime)
    expect(result.hour).toBe(14)
    expect(result.minute).toBe(30)
  })

  it('accepts ZonedDateTime as defaultValue (broader TemporalDateTime type)', () => {
    const zoned = Temporal.ZonedDateTime.from('2024-06-15T14:30:00[Asia/Tokyo]')
    const result = getDefaultTime({ defaultValue: zoned })
    expect(result).toBeInstanceOf(Temporal.ZonedDateTime)
    expect(result.hour).toBe(14)
    expect(result.minute).toBe(30)
  })

  // ── Range-array support (symmetric with getDefaultDate) ──

  it('returns the first element from an array (range-array behaviour)', () => {
    const start = Temporal.PlainTime.from('09:00:00')
    const end = Temporal.PlainTime.from('17:00:00')
    const result = getDefaultTime({ defaultValue: [start, end] })
    expect(result).toBe(start)
    expect(result).not.toBe(end)
  })

  it('handles empty defaultValue array gracefully (falls through to placeholder)', () => {
    const placeholder = Temporal.PlainTime.from('12:00:00')
    expect(getDefaultTime({ defaultValue: [], defaultPlaceholder: placeholder })).toBe(placeholder)
  })

  it('handles empty defaultValue array without placeholder falls back to midnight', () => {
    const result = getDefaultTime({ defaultValue: [] })
    expect(result).toBeInstanceOf(Temporal.PlainTime)
    expect(result.hour).toBe(0)
    expect(result.minute).toBe(0)
    expect(result.second).toBe(0)
  })

  it('accepts an array of PlainDateTime values and returns the first element', () => {
    const start = Temporal.PlainDateTime.from('2024-06-15T14:30:00')
    const end = Temporal.PlainDateTime.from('2024-06-16T09:00:00')
    const result = getDefaultTime({ defaultValue: [start, end] })
    expect(result).toBe(start)
    expect(result).toBeInstanceOf(Temporal.PlainDateTime)
    expect(result.hour).toBe(14)
  })

  it('accepts an array of ZonedDateTime values and returns the first element', () => {
    const start = Temporal.ZonedDateTime.from('2024-06-15T14:30:00[Asia/Tokyo]')
    const end = Temporal.ZonedDateTime.from('2024-06-16T09:00:00[Asia/Tokyo]')
    const result = getDefaultTime({ defaultValue: [start, end] })
    expect(result).toBe(start)
    expect(result).toBeInstanceOf(Temporal.ZonedDateTime)
    expect(result.hour).toBe(14)
  })
})

describe('toShellDateTime', () => {
  it('returns undefined for null input', () => {
    expect(toShellDateTime(null)).toBeUndefined()
  })

  it('returns undefined for undefined input', () => {
    expect(toShellDateTime(undefined)).toBeUndefined()
  })

  it('returns a PlainDateTime for PlainTime input (using getDefaultDate anchor)', () => {
    const plainTime = Temporal.PlainTime.from('14:30:00')
    const result = toShellDateTime(plainTime)
    expect(result).toBeInstanceOf(Temporal.PlainDateTime)
    // Time parts preserved
    expect(result!.hour).toBe(14)
    expect(result!.minute).toBe(30)
    expect(result!.second).toBe(0)
    // Date anchor from getDefaultDate (today)
    const now = new Date()
    expect(result!.year).toBe(now.getFullYear())
    expect(result!.month).toBe(now.getMonth() + 1)
  })

  it('returns a PlainDateTime for PlainDateTime input (preserves date parts)', () => {
    const dt = Temporal.PlainDateTime.from('2024-06-15T09:30:00')
    const result = toShellDateTime(dt)
    expect(result).toBeInstanceOf(Temporal.PlainDateTime)
    expect(result!.year).toBe(2024)
    expect(result!.month).toBe(6)
    expect(result!.day).toBe(15)
    expect(result!.hour).toBe(9)
    expect(result!.minute).toBe(30)
  })

  it('returns a PlainDateTime for ZonedDateTime input (loses zone, preserves date+time)', () => {
    const zoned = Temporal.ZonedDateTime.from('2024-06-15T18:30:00[Asia/Tokyo]')
    const result = toShellDateTime(zoned)
    expect(result).toBeInstanceOf(Temporal.PlainDateTime)
    // The PlainDateTime value (instant in Tokyo → calendar date/time in Tokyo)
    expect(result!.year).toBe(2024)
    expect(result!.month).toBe(6)
    expect(result!.day).toBe(15)
    expect(result!.hour).toBe(18)
    expect(result!.minute).toBe(30)
  })

  it('routes PlainTime anchor through getDefaultDate (not direct Temporal.Now)', () => {
    // This is a behavioural assertion: the function should use the policy's
    // getDefaultDate for the anchor rather than calling Temporal.Now directly.
    // We verify by checking the result is a PlainDateTime with today's date.
    const plainTime = Temporal.PlainTime.from('07:00:00')
    const result = toShellDateTime(plainTime)
    const now = new Date()
    expect(result!.year).toBe(now.getFullYear())
    expect(result!.month).toBe(now.getMonth() + 1)
    expect(result!.day).toBe(now.getDate())
    expect(result!.hour).toBe(7)
  })
})

describe('toPublicTimeValue', () => {
  const shell = Temporal.PlainDateTime.from('2024-06-15T14:30:00')

  it('returns a PlainTime when original was PlainTime', () => {
    const original = Temporal.PlainTime.from('09:15:00')
    const result = toPublicTimeValue(shell, original)
    expect(result).toBeInstanceOf(Temporal.PlainTime)
    // Should use shell time, not original time
    expect(result.hour).toBe(14)
    expect(result.minute).toBe(30)
    expect(result.second).toBe(0)
  })

  it('returns a PlainDateTime when original was PlainDateTime (preserving original date, updated time)', () => {
    const original = Temporal.PlainDateTime.from('2024-01-20T09:15:00')
    const result = toPublicTimeValue(shell, original)
    expect(result).toBeInstanceOf(Temporal.PlainDateTime)
    // Original date preserved
    expect((result as Temporal.PlainDateTime).year).toBe(2024)
    expect((result as Temporal.PlainDateTime).month).toBe(1)
    expect((result as Temporal.PlainDateTime).day).toBe(20)
    // Shell time applied
    expect(result.hour).toBe(14)
    expect(result.minute).toBe(30)
  })

  it('returns a ZonedDateTime when original was ZonedDateTime (preserving zone and date, updated time)', () => {
    const original = Temporal.ZonedDateTime.from('2024-01-20T09:15:00[America/New_York]')
    const result = toPublicTimeValue(shell, original)
    expect(result).toBeInstanceOf(Temporal.ZonedDateTime)
    // Zone preserved
    expect((result as Temporal.ZonedDateTime).timeZoneId).toBe('America/New_York')
    // Original date preserved
    expect((result as Temporal.ZonedDateTime).year).toBe(2024)
    expect((result as Temporal.ZonedDateTime).month).toBe(1)
    expect((result as Temporal.ZonedDateTime).day).toBe(20)
    // Shell time applied
    expect(result.hour).toBe(14)
    expect(result.minute).toBe(30)
  })

  it('returns PlainTime when original is undefined (no date-bearing shape to preserve)', () => {
    const result = toPublicTimeValue(shell, undefined)
    expect(result).toBeInstanceOf(Temporal.PlainTime)
    expect(result.hour).toBe(14)
    expect(result.minute).toBe(30)
  })

  it('preserves millisecond precision in output', () => {
    const withMs = Temporal.PlainDateTime.from('2024-06-15T10:20:30.456')
    const original = Temporal.PlainTime.from('09:00:00')
    const result = toPublicTimeValue(withMs, original)
    expect(result).toBeInstanceOf(Temporal.PlainTime)
    expect(result.hour).toBe(10)
    expect(result.minute).toBe(20)
    expect(result.second).toBe(30)
    expect(result.millisecond).toBe(456)
  })
})

describe('round-trip shape preservation (toShellDateTime → toPublicTimeValue)', () => {
  it('preserves PlainTime shape through round-trip', () => {
    const original = Temporal.PlainTime.from('12:30:00')
    const shell = toShellDateTime(original)!
    const result = toPublicTimeValue(shell, original)
    expect(result).toBeInstanceOf(Temporal.PlainTime)
    expect(result.hour).toBe(12)
    expect(result.minute).toBe(30)
  })

  it('preserves PlainDateTime shape through round-trip', () => {
    const original = Temporal.PlainDateTime.from('2024-06-15T12:30:00')
    const shell = toShellDateTime(original)!
    const result = toPublicTimeValue(shell, original)
    expect(result).toBeInstanceOf(Temporal.PlainDateTime)
    expect((result as Temporal.PlainDateTime).year).toBe(2024)
    expect((result as Temporal.PlainDateTime).month).toBe(6)
    expect((result as Temporal.PlainDateTime).day).toBe(15)
    expect(result.hour).toBe(12)
    expect(result.minute).toBe(30)
  })

  it('preserves ZonedDateTime shape and zone through round-trip', () => {
    const original = Temporal.ZonedDateTime.from('2024-06-15T12:30:00[Asia/Tokyo]')
    const shell = toShellDateTime(original)!
    const result = toPublicTimeValue(shell, original)
    expect(result).toBeInstanceOf(Temporal.ZonedDateTime)
    expect((result as Temporal.ZonedDateTime).timeZoneId).toBe('Asia/Tokyo')
    expect((result as Temporal.ZonedDateTime).year).toBe(2024)
    expect((result as Temporal.ZonedDateTime).month).toBe(6)
    expect((result as Temporal.ZonedDateTime).day).toBe(15)
    expect(result.hour).toBe(12)
    expect(result.minute).toBe(30)
  })
})
