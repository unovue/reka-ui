import { serialize } from 'ohash'
import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { findValuesBetween } from './arrays'
import { compare, isEqual, serializeValue, valueComparator } from './compare'
import { isValueEqualOrExist } from './isValueEqualOrExist'

describe('compare', () => {
  it('returns false when either side is undefined', () => {
    expect(compare(undefined, 'a')).toBe(false)
    expect(compare('a', undefined)).toBe(false)
    expect(compare(undefined, undefined)).toBe(false)
  })

  it('never passes null to a comparison function or key comparator', () => {
    const byId = (a: { id: number }, b: { id: number }) => a.id === b.id
    expect(() => compare<{ id: number }>(null as any, { id: 1 }, byId)).not.toThrow()
    expect(compare<{ id: number }>(null as any, { id: 1 }, byId)).toBe(false)
    expect(compare<{ id: number }>({ id: 1 }, null as any, byId)).toBe(false)
    expect(compare<{ id: number }>(null as any, { id: 1 }, 'id')).toBe(false)
    expect(compare(null, null)).toBe(true)
    expect(valueComparator<{ id: number }>(null as any, { id: 1 }, byId)).toBe(false)
  })

  it('compares strings strictly, ignoring a key comparator', () => {
    expect(compare('a', 'a', 'id')).toBe(true)
    expect(compare('a', 'b')).toBe(false)
  })

  it('runs a comparison function for strings too', () => {
    const caseInsensitive = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
    expect(compare('Apple', 'apple', caseInsensitive)).toBe(true)
    expect(compare('Apple', 'apple')).toBe(false)
  })

  it('compares objects structurally by default', () => {
    expect(compare({ id: 1, label: 'One' }, { id: 1, label: 'One' })).toBe(true)
    expect(compare({ id: 1, label: 'One' }, { id: 1, label: 'Uno' })).toBe(false)
  })

  it('compares by a key when `by` is a string', () => {
    expect(compare({ id: 1, label: 'One' }, { id: 1, label: 'Uno' }, 'id')).toBe(true)
    expect(compare({ id: 1 }, { id: 2 }, 'id')).toBe(false)
  })

  it('delegates to a comparison function when `by` is a function', () => {
    const byLength = (a: { name: string }, b: { name: string }) => a.name.length === b.name.length
    expect(compare({ name: 'ab' }, { name: 'cd' }, byLength)).toBe(true)
    expect(compare({ name: 'ab' }, { name: 'cde' }, byLength)).toBe(false)
  })

  it('treats null as a value (structural equality)', () => {
    expect(compare(null, null)).toBe(true)
    expect(compare(null, { id: 1 })).toBe(false)
  })
})

describe('valueComparator', () => {
  it('returns false for an undefined selection', () => {
    expect(valueComparator(undefined, 'a')).toBe(false)
  })

  it('matches a single value', () => {
    expect(valueComparator('a', 'a')).toBe(true)
    expect(valueComparator({ id: 1 }, { id: 1, extra: true }, 'id')).toBe(true)
  })

  it('matches any entry of an array selection', () => {
    expect(valueComparator(['a', 'b'], 'b')).toBe(true)
    expect(valueComparator(['a', 'b'], 'c')).toBe(false)
    expect(valueComparator([{ id: 1 }, { id: 2 }], { id: 2 }, 'id')).toBe(true)
  })
})

describe('isValueEqualOrExist with `by`', () => {
  it('keeps the structural behavior when `by` is omitted', () => {
    expect(isValueEqualOrExist({ id: 1, label: 'One' }, { id: 1, label: 'Uno' })).toBe(false)
    expect(isValueEqualOrExist([{ id: 1 }], { id: 1 })).toBe(true)
    expect(isValueEqualOrExist(null as unknown as undefined, 'a')).toBe(false)
  })

  it('routes through `compare` when `by` is given', () => {
    expect(isValueEqualOrExist({ id: 1, label: 'One' }, { id: 1, label: 'Uno' }, 'id')).toBe(true)
    expect(isValueEqualOrExist([{ id: 1 }, { id: 2 }], { id: 2, label: 'Two' }, 'id')).toBe(true)
    expect(isValueEqualOrExist([{ id: 1 }], { id: 3 }, 'id')).toBe(false)
    expect(isValueEqualOrExist(undefined, { id: 1 }, 'id')).toBe(false)
  })
})

describe('isEqual on values ohash cannot serialize', () => {
  const temporals: Array<[string, () => unknown, () => unknown]> = [
    ['PlainDate', () => Temporal.PlainDate.from('2024-01-15'), () => Temporal.PlainDate.from('2024-01-16')],
    ['PlainDateTime', () => Temporal.PlainDateTime.from('2024-01-15T10:30:00.000000001'), () => Temporal.PlainDateTime.from('2024-01-15T10:30:00.000000002')],
    ['ZonedDateTime', () => Temporal.ZonedDateTime.from('2024-01-15T10:30[Asia/Tokyo]'), () => Temporal.ZonedDateTime.from('2024-01-15T10:30[Asia/Seoul]')],
    ['PlainTime', () => Temporal.PlainTime.from('10:30'), () => Temporal.PlainTime.from('10:31')],
    ['Instant', () => Temporal.Instant.from('2024-01-15T00:00Z'), () => Temporal.Instant.from('2024-01-15T00:01Z')],
    ['PlainYearMonth', () => Temporal.PlainYearMonth.from('2024-01'), () => Temporal.PlainYearMonth.from('2024-02')],
    ['PlainMonthDay', () => Temporal.PlainMonthDay.from('01-15'), () => Temporal.PlainMonthDay.from('01-16')],
    // No `.equals` at all.
    ['Duration', () => Temporal.Duration.from('P1D'), () => Temporal.Duration.from('P2D')],
  ]

  it.each(temporals)('compares %s by value', (_, make, other) => {
    expect(isEqual(make(), make())).toBe(true)
    expect(isEqual(make(), other())).toBe(false)
    expect(isEqual([make()], [make()])).toBe(true)
    expect(isEqual({ value: make() }, { value: other() })).toBe(false)
  })

  it('never matches across Temporal types, even at the same wall-clock time', () => {
    const date = Temporal.PlainDate.from('2024-01-15')
    expect(isEqual(date, date.toPlainDateTime('00:00'))).toBe(false)
    expect(isEqual(date.toPlainDateTime('00:00'), date.toZonedDateTime('UTC'))).toBe(false)
    expect(isEqual(Temporal.PlainTime.from('00:00'), date.toPlainDateTime('00:00'))).toBe(false)
  })

  it('never matches a Temporal value and a non-Temporal one', () => {
    const date = Temporal.PlainDate.from('2024-01-15')
    for (const other of ['2024-01-15', null, undefined, '', 0, {}, [], [date], { start: date }, new Date('2024-01-15'), new Blob(['x'])]) {
      expect(isEqual(date, other)).toBe(false)
      expect(isEqual(other, date)).toBe(false)
    }
  })

  it('tells calendars and time zones apart', () => {
    const date = Temporal.PlainDate.from('2024-01-15')
    expect(isEqual(date, date.withCalendar('gregory'))).toBe(false)
    const zoned = Temporal.ZonedDateTime.from('2024-01-15T10:30[Asia/Tokyo]')
    expect(isEqual(zoned, zoned.withTimeZone('Asia/Seoul'))).toBe(false)
  })

  it('compares ranges, nested objects, Maps and Sets holding Temporal values', () => {
    const d = (day: number) => Temporal.PlainDate.from({ year: 2024, month: 1, day })
    expect(isEqual({ start: d(1), end: d(2) }, { end: d(2), start: d(1) })).toBe(true)
    expect(isEqual({ start: d(1), end: d(2) }, { start: d(1), end: d(3) })).toBe(false)
    expect(isEqual({ start: d(1), end: undefined }, { start: d(1) })).toBe(false)
    expect(isEqual([d(1), d(2)], [d(1), d(2)])).toBe(true)
    expect(isEqual([d(1), d(2)], [d(2), d(1)])).toBe(false)
    expect(isEqual([[{ at: { date: d(1) } }]], [[{ at: { date: d(1) } }]])).toBe(true)
    expect(isEqual(new Set([d(1), d(2)]), new Set([d(2), d(1)]))).toBe(true)
    expect(isEqual(new Set([d(1)]), new Set([d(2)]))).toBe(false)
    expect(isEqual(new Map([['a', d(1)]]), new Map([['a', d(1)]]))).toBe(true)
    expect(isEqual(new Map([['a', d(1)]]), new Map([['a', d(2)]]))).toBe(false)
    expect(isEqual(new Map([[d(1), 'a']]), new Map([[d(1), 'a']]))).toBe(true)
    // The same object twice is not a cycle.
    const shared = { date: d(1) }
    expect(isEqual([shared, shared], [{ date: d(1) }, { date: d(1) }])).toBe(true)
  })

  it('compares a class instance holding a Temporal value by its class and fields', () => {
    class A { constructor(public date: unknown) {} }
    class B { constructor(public date: unknown) {} }
    const date = Temporal.PlainDate.from('2024-01-15')
    expect(isEqual(new A(date), new A(Temporal.PlainDate.from('2024-01-15')))).toBe(true)
    expect(isEqual(new A(date), new B(date))).toBe(false)
  })

  it('compares a Blob or File by identity, alone or nested', () => {
    const file = new File(['x'], 'a.txt', { lastModified: 1 })
    const same = new File(['x'], 'a.txt', { lastModified: 1 })
    const blob = new Blob(['x'])
    expect(isEqual(file, file)).toBe(true)
    expect(isEqual(file, same)).toBe(false)
    expect(isEqual(blob, new Blob(['x']))).toBe(false)
    expect(isEqual([file], [file])).toBe(true)
    expect(isEqual([file], [same])).toBe(false)
    expect(isEqual({ blob }, { blob })).toBe(true)
    expect(isEqual(file, null)).toBe(false)
    expect(isEqual(file, undefined)).toBe(false)
  })

  it('never throws, whatever the value', () => {
    const cycle = (date: unknown) => {
      const value: Record<string, unknown> = { date }
      value.self = value
      return value
    }
    const { proxy: revoked, revoke } = Proxy.revocable({}, {})
    revoke()
    const hostile = [
      new WeakMap(),
      new WeakSet(),
      Promise.resolve(),
      document.createElement('div'),
      revoked,
      cycle(new Blob([])),
      { get boom() { throw new Error('getter') } },
      { toJSON() { throw new Error('toJSON') } },
      { [Symbol.toStringTag]: 'Temporal.Fake', toString() { throw new Error('toString') } },
      { [Symbol.toStringTag]: 'Fake' },
      Temporal.Now,
    ]
    for (const a of hostile) {
      for (const b of [...hostile, null, undefined, '', Temporal.PlainDate.from('2024-01-15')]) {
        expect(() => isEqual(a, b)).not.toThrow()
        expect(() => isEqual(b, a)).not.toThrow()
      }
      expect(isEqual(a, a)).toBe(true)
    }
    expect(isEqual(new Map([[new Blob([]), 1]]), new Map([[new Blob([]), 1]]))).toBe(false)
  })

  it('gives up on an absurdly deep value by identity, quickly', () => {
    const nest = (leaf: unknown) => {
      let deep = leaf
      for (let i = 0; i < 100_000; i++)
        deep = [deep]
      return deep
    }
    const deep = nest(new Blob([]))
    expect(isEqual(deep, nest(new Blob([])))).toBe(false)
    expect(isEqual(deep, deep)).toBe(true)
  })

  it('reads a Temporal value through a deep reactive baseline', () => {
    const date = Temporal.PlainDate.from('2024-01-15')
    expect(isEqual(reactive([date]), [Temporal.PlainDate.from('2024-01-15')])).toBe(true)
    expect(isEqual(reactive({ start: date }), { start: Temporal.PlainDate.from('2024-01-15') })).toBe(true)
  })

  it('keeps the ohash form of everything ohash can serialize', () => {
    for (const value of ['a', 1, 0, Number.NaN, 1n, true, null, undefined, { b: 1, a: [2] }, [1, 'x'], new Date(0), new Set([1]), new Map([['k', 1]]), new Uint8Array(1), () => 1])
      expect(serializeValue(value)).toBe(serialize(value))
    expect(isEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
    expect(isEqual(null, undefined)).toBe(false)
    expect(isEqual('', null)).toBe(false)
  })

  it('backs compare, isValueEqualOrExist and findValuesBetween', () => {
    const d = (day: number) => Temporal.PlainDate.from({ year: 2024, month: 1, day })
    expect(compare(d(1), d(1))).toBe(true)
    expect(compare(d(1), d(2))).toBe(false)
    expect(valueComparator([d(1), d(2)], d(2))).toBe(true)
    expect(isValueEqualOrExist(d(1), d(1))).toBe(true)
    expect(isValueEqualOrExist([d(1), d(2)], d(2))).toBe(true)
    expect(isValueEqualOrExist([d(1), d(2)], d(3))).toBe(false)
    expect(findValuesBetween([d(1), d(2), d(3), d(4)], d(3), d(2)).map(String)).toEqual([String(d(2)), String(d(3))])
    const file = new File([], 'a')
    expect(compare(file, file)).toBe(true)
    expect(isValueEqualOrExist([file], new File([], 'a'))).toBe(false)
  })
})
