/**
 * Type-level verification for temporal primitive types.
 *
 * These tests verify that the canonical type definitions in temporal/types.ts
 * have the expected shapes. They serve as a regression guard against accidental
 * changes to the type structure.
 *
 * The types under test are the canonical home for DayOfWeek, Granularity,
 * TimeGranularity, and DateRange — all shared date modules re-export these
 * from here.
 */
import type { DateRange, DayOfWeek, Granularity, TemporalDate, TimeGranularity } from './types'
import { describe, expectTypeOf, it } from 'vitest'

describe('temporal primitive types — canonical definitions', () => {
  describe('granularity', () => {
    it('is a union of day | hour | minute | second', () => {
      expectTypeOf<Granularity>().toEqualTypeOf<'day' | 'hour' | 'minute' | 'second'>()
    })

    it('accepts valid granularity values', () => {
      const day: Granularity = 'day'
      const hour: Granularity = 'hour'
      const minute: Granularity = 'minute'
      const second: Granularity = 'second'
      expect([day, hour, minute, second]).toBeDefined()
    })
  })

  describe('timeGranularity', () => {
    it('is a union of hour | minute | second', () => {
      expectTypeOf<TimeGranularity>().toEqualTypeOf<'hour' | 'minute' | 'second'>()
    })

    it('accepts valid time granularity values', () => {
      const hour: TimeGranularity = 'hour'
      const minute: TimeGranularity = 'minute'
      const second: TimeGranularity = 'second'
      expect([hour, minute, second]).toBeDefined()
    })
  })

  describe('dayOfWeek', () => {
    it('has daysOfWeek property as an array of day numbers 0-6', () => {
      expectTypeOf<DayOfWeek>().toHaveProperty('daysOfWeek')
      expectTypeOf<DayOfWeek['daysOfWeek']>().toEqualTypeOf<(0 | 1 | 2 | 3 | 4 | 5 | 6)[]>()
    })

    it('accepts valid DayOfWeek values', () => {
      const valid: DayOfWeek = { daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }
      const partial: DayOfWeek = { daysOfWeek: [0, 2, 4] }
      expect(valid).toBeDefined()
      expect(partial).toBeDefined()
    })
  })

  describe('dateRange', () => {
    it('has start and end properties as optional TemporalDate', () => {
      expectTypeOf<DateRange>().toHaveProperty('start')
      expectTypeOf<DateRange>().toHaveProperty('end')
      expectTypeOf<DateRange['start']>().toEqualTypeOf<TemporalDate | undefined>()
      expectTypeOf<DateRange['end']>().toEqualTypeOf<TemporalDate | undefined>()
    })
  })
})
