import type { SegmentValueObj } from './types'
import { CalendarDate, CalendarDateTime, toZoned } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useDateFormatter } from '@/shared/useDateFormatter'
import { createContent, initializeSegmentValues, initializeTimeSegmentValues, syncSegmentValues, syncTimeSegmentValues } from './parser'

// #2789: direct tests for the segment model the date and time fields share.

describe('initializeSegmentValues', () => {
  it('day granularity: only the date parts, all empty', () => {
    expect(initializeSegmentValues('day')).toEqual({ day: null, month: null, year: null })
  })

  it('hour / minute / second granularity add the time parts down to the granularity, dayPeriod defaulting to AM', () => {
    expect(initializeSegmentValues('hour')).toEqual({ day: null, month: null, year: null, hour: null, dayPeriod: 'AM' })
    expect(initializeSegmentValues('minute')).toEqual({ day: null, month: null, year: null, hour: null, minute: null, dayPeriod: 'AM' })
    expect(initializeSegmentValues('second')).toEqual({ day: null, month: null, year: null, hour: null, minute: null, second: null, dayPeriod: 'AM' })
  })
})

describe('initializeTimeSegmentValues', () => {
  it('has no date parts', () => {
    expect(initializeTimeSegmentValues('hour')).toEqual({ hour: null, dayPeriod: 'AM' })
    expect(initializeTimeSegmentValues('minute')).toEqual({ hour: null, minute: null, dayPeriod: 'AM' })
    expect(initializeTimeSegmentValues('second')).toEqual({ hour: null, minute: null, second: null, dayPeriod: 'AM' })
  })
})

describe('syncSegmentValues', () => {
  const formatter = useDateFormatter('en-US')

  it('reads the date parts of a CalendarDate', () => {
    expect(syncSegmentValues({ value: new CalendarDate(2024, 2, 29), formatter })).toEqual({ day: 29, month: 2, year: 2024 })
  })

  it('adds the time parts and the day period of a CalendarDateTime', () => {
    expect(syncSegmentValues({ value: new CalendarDateTime(2024, 2, 29, 14, 5, 9), formatter })).toEqual({
      day: 29,
      month: 2,
      year: 2024,
      hour: 14,
      minute: 5,
      second: 9,
      dayPeriod: 'PM',
    })
  })

  it('reads the day period in the value\'s own time zone', () => {
    // 18:00 in Tokyo is 09:00 UTC: a formatter that ignored the value's zone
    // would report AM on a UTC runner.
    const zoned = toZoned(new CalendarDateTime(2024, 2, 29, 18, 0), 'Asia/Tokyo')
    expect(syncSegmentValues({ value: zoned, formatter })).toMatchObject({ hour: 18, dayPeriod: 'PM' })
  })
})

describe('syncTimeSegmentValues', () => {
  it('reads only the time parts', () => {
    const formatter = useDateFormatter('en-US')
    const value = new CalendarDateTime(2024, 1, 1, 0, 30, 0)
    expect(syncTimeSegmentValues({ value, formatter })).toEqual({ hour: 0, minute: 30, second: 0, dayPeriod: 'AM' })
  })
})

describe('createContent', () => {
  function content(options: {
    granularity: 'day' | 'hour' | 'minute' | 'second'
    segmentValues: SegmentValueObj
    locale?: string
    dateRef?: CalendarDate | CalendarDateTime
    hourCycle?: 12 | 24
    hideTimeZone?: boolean
  }) {
    const locale = ref(options.locale ?? 'en-US')
    return createContent({
      granularity: options.granularity,
      dateRef: options.dateRef ?? (options.granularity === 'day' ? new CalendarDate(2024, 1, 1) : new CalendarDateTime(2024, 1, 1)),
      formatter: useDateFormatter(locale.value),
      hideTimeZone: options.hideTimeZone ?? false,
      hourCycle: options.hourCycle,
      segmentValues: options.segmentValues,
      locale,
    })
  }

  it('shows the locale placeholders for empty parts, in the locale order', () => {
    const { obj, arr } = content({ granularity: 'day', segmentValues: { day: null, month: null, year: null } })
    expect(obj).toEqual({ day: 'dd', month: 'mm', year: 'yyyy' })
    expect(arr.map(s => s.part)).toEqual(['month', 'literal', 'day', 'literal', 'year'])

    const { arr: de } = content({ granularity: 'day', locale: 'de-DE', segmentValues: { day: null, month: null, year: null } })
    expect(de.map(s => s.part)).toEqual(['day', 'literal', 'month', 'literal', 'year'])
  })

  it('formats the filled parts and keeps placeholders for the rest', () => {
    const { obj } = content({ granularity: 'day', segmentValues: { day: 5, month: null, year: 2024 } })
    expect(obj).toEqual({ day: '5', month: 'mm', year: '2024' })
  })

  it('formats a day the month cannot hold against January, so any day can be typed first', () => {
    const { obj } = content({ granularity: 'day', dateRef: new CalendarDate(2024, 2, 1), segmentValues: { day: 31, month: null, year: null } })
    expect(obj.day).toBe('31')
  })

  it('snaps the day to the filled month', () => {
    const { obj } = content({ granularity: 'day', dateRef: new CalendarDate(2023, 2, 1), segmentValues: { day: 31, month: 2, year: null } })
    expect(obj.day).toBe('28')
  })

  it('time parts: placeholders, hour cycle and day period', () => {
    const empty = content({ granularity: 'minute', segmentValues: { day: null, month: null, year: null, hour: null, minute: null, dayPeriod: null } })
    expect(empty.obj).toMatchObject({ hour: '––', minute: '––', dayPeriod: 'AM' })

    const h12 = content({ granularity: 'minute', hourCycle: 12, segmentValues: { day: 1, month: 1, year: 2024, hour: 13, minute: 7, dayPeriod: 'PM' } })
    expect(h12.obj).toMatchObject({ hour: '1', minute: '07', dayPeriod: 'PM' })
    expect(h12.arr.map(s => s.part)).toContain('dayPeriod')

    const h24 = content({ granularity: 'minute', hourCycle: 24, segmentValues: { day: 1, month: 1, year: 2024, hour: 13, minute: 7, dayPeriod: 'PM' } })
    expect(h24.obj).toMatchObject({ hour: '13', minute: '07' })
    expect(h24.arr.map(s => s.part)).not.toContain('dayPeriod')
  })

  it('drops the time zone segment for a value without a zone', () => {
    const { arr } = content({ granularity: 'minute', segmentValues: { day: 1, month: 1, year: 2024, hour: 9, minute: 0, dayPeriod: 'AM' } })
    expect(arr.map(s => s.part)).not.toContain('timeZoneName')
  })

  it('formats a Time value with no date parts', () => {
    const locale = ref('en-US')
    const { arr } = createContent({
      granularity: 'minute',
      // The time fields format a `Time` through a date-time reference.
      dateRef: new CalendarDateTime(2024, 1, 1, 9, 5),
      formatter: useDateFormatter(locale.value),
      hideTimeZone: true,
      hourCycle: 24,
      isTimeValue: true,
      // The time fields start from the time-only segment values, as `useTimeField` does.
      segmentValues: { ...initializeTimeSegmentValues('minute'), hour: 9, minute: 5 },
      locale,
    })
    expect(arr.filter(s => s.part !== 'literal').map(s => [s.part, s.value])).toEqual([['hour', '09'], ['minute', '05']])
  })
})
