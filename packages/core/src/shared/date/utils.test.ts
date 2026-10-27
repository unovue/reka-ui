import { describe, expect, it } from 'vitest'
import { getOptsByGranularity, normalizeDateStep } from './utils'

// #2789: direct tests for the step and format helpers the date and time fields share.

describe('normalizeDateStep', () => {
  it('defaults every unit to 1', () => {
    const all = { year: 1, month: 1, day: 1, hour: 1, minute: 1, second: 1, millisecond: 1 }
    expect(normalizeDateStep()).toEqual(all)
    expect(normalizeDateStep({})).toEqual(all)
    expect(normalizeDateStep({ step: undefined })).toEqual(all)
  })

  it('keeps the units that are given and fills the rest', () => {
    expect(normalizeDateStep({ step: { minute: 15, hour: 2 } })).toEqual({
      year: 1,
      month: 1,
      day: 1,
      hour: 2,
      minute: 15,
      second: 1,
      millisecond: 1,
    })
  })

  it('does not mutate the given step', () => {
    const step = { minute: 15 }
    normalizeDateStep({ step })
    expect(step).toEqual({ minute: 15 })
  })
})

describe('getOptsByGranularity', () => {
  it('day: the date parts only', () => {
    const opts = getOptsByGranularity('day', undefined)
    expect(Object.keys(opts).filter(k => opts[k as keyof typeof opts] !== undefined)).toEqual(['year', 'month', 'day'])
  })

  it('minute: drops the seconds, keeps the zone name', () => {
    const opts = getOptsByGranularity('minute', 24)
    expect(opts.second).toBeUndefined()
    expect(opts).toMatchObject({ hour: '2-digit', minute: '2-digit', timeZoneName: 'short', hourCycle: 'h23', hour12: false })
  })

  it('a time value has no date parts', () => {
    const opts = getOptsByGranularity('second', 12, true)
    expect(opts.year).toBeUndefined()
    expect(opts.month).toBeUndefined()
    expect(opts.day).toBeUndefined()
    expect(opts.hour12).toBe(true)
  })
})
