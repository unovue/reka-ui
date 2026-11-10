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

  it('tells Temporal types apart when their strings are the same', () => {
    const date = Temporal.PlainDate.from({ year: 2024, month: 1, day: 1, calendar: 'gregory' })
    const yearMonth = Temporal.PlainYearMonth.from({ year: 2024, month: 1, calendar: 'gregory' })
    expect(String(yearMonth)).toBe(String(date))
    expect(isEqual(date, yearMonth)).toBe(false)
    expect(isEqual([date], [yearMonth])).toBe(false)
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

  it('tells a class named Map or Set holding a Temporal value from the built-in', () => {
    const date = Temporal.PlainDate.from('2024-01-15')
    const Named = {
      Map: class Map { key = date },
      Set: class Set { 0 = date },
    }
    const map = new globalThis.Map([['key', date]])
    expect(isEqual(new Named.Map(), map)).toBe(false)
    expect(isEqual(map, new Named.Map())).toBe(false)
    expect(isEqual(new Named.Set(), new globalThis.Set([['0', date]]))).toBe(false)
    expect(isEqual(new Named.Map(), new Named.Map())).toBe(true)
  })

  it('tells a class named Object holding a Temporal value from a plain object', () => {
    const date = Temporal.PlainDate.from('2024-01-15')
    const Named = { Object: class Object { date = date } }
    expect(new Named.Object().constructor.name).toBe('Object')
    expect(isEqual(new Named.Object(), { date })).toBe(false)
    expect(isEqual({ date }, new Named.Object())).toBe(false)
    expect(isEqual([new Named.Object()], [{ date }])).toBe(false)
    expect(isEqual(new Named.Object(), new Named.Object())).toBe(true)
    expect(isEqual({ date }, { date })).toBe(true)
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

  // Far above what linear work needs and far below what re-walking a shared node
  // per path takes, so load can't flake it and a regression can't pass it.
  const TIME_BOUND = 5000

  function timed<T>(run: () => T): T {
    const start = performance.now()
    const result = run()
    expect(performance.now() - start).toBeLessThan(TIME_BOUND)
    return result
  }

  it('walks a node shared by many paths once', () => {
    const dag = (day: number, depth = 19) => {
      let value: unknown = [Temporal.PlainDate.from({ year: 2024, month: 1, day })]
      for (let i = 0; i < depth; i++)
        value = [value, value]
      return value
    }
    expect(timed(() => isEqual(dag(1), dag(1)))).toBe(true)
    expect(timed(() => isEqual(dag(1), dag(2)))).toBe(false)
    expect(timed(() => isEqual(dag(1, 30), dag(1, 30)))).toBe(false)
    // A shared node and two equal copies of it read the same.
    const date = Temporal.PlainDate.from('2024-01-15')
    const shared = { date }
    expect(isEqual([shared, shared], [{ date }, { date }])).toBe(true)
  })

  describe('past the budget of one call', () => {
    const dag = (depth: number, day = 15) => {
      let value: unknown = [Temporal.PlainDate.from({ year: 2024, month: 1, day })]
      for (let i = 0; i < depth; i++)
        value = [value, value]
      return value
    }

    it('compares the whole value by identity', () => {
      // Depth 19 spends about 37M characters, depth 20 about 73M.
      expect(isEqual(dag(19), dag(19))).toBe(true)
      expect(isEqual(dag(20), dag(20))).toBe(false)
      const value = dag(20)
      expect(isEqual(value, value)).toBe(true)
      expect(isEqual([value], [value])).toBe(false)
      expect(serializeValue(dag(23)).length).toBeLessThan(100)
    })

    it('counts every form of the call, not one at a time', () => {
      const chain = (wrappers: number) => {
        let value: unknown = { pad: 'x'.repeat(30_000_000), date: Temporal.PlainDate.from('2024-01-15') }
        for (let i = 0; i < wrappers; i++)
          value = [value, 0]
        return value
      }
      // No single form passes 31M characters, but each wrapper is a new copy of them.
      expect(isEqual(chain(1), chain(1))).toBe(true)
      expect(isEqual(chain(2), chain(2))).toBe(false)
      expect(serializeValue(chain(1000)).length).toBeLessThan(100)
    })

    it('gives a value the same form whatever another call walked', () => {
      const large = dag(20)
      const small = dag(2)
      const forms = [serializeValue(large), serializeValue(small)]
      serializeValue(dag(21))
      expect([serializeValue(large), serializeValue(small)]).toEqual(forms)
    })

    it('reaches the same outcome whatever the order of siblings', () => {
      const compareOrders = (x: unknown, y: unknown) => [
        isEqual({ x, y }, { x, y }),
        isEqual({ x, y }, { y, x }),
        isEqual(new Set([x, y]), new Set([x, y])),
        isEqual(new Set([x, y]), new Set([y, x])),
      ]
      expect(compareOrders(dag(17, 15), dag(17, 16))).toEqual([true, true, true, true])
      // Together they pass the budget, though each fits.
      expect(compareOrders(dag(19, 15), dag(19, 16))).toEqual([false, false, false, false])
      // One fits and the other doesn't: never by value up to the budget, then by identity.
      expect(compareOrders(dag(18, 15), dag(20, 16))).toEqual([false, false, false, false])
    })
  })

  it('compares flat data under the budget by value', () => {
    const dates = () => Array.from({ length: 100_000 }, () => Temporal.PlainDate.from('2024-01-15'))
    expect(isEqual(dates(), dates())).toBe(true)
  }, 60_000)

  it('walks a graph with many paths through its cycles once', () => {
    const grid = (day: number) => {
      const date = Temporal.PlainDate.from({ year: 2024, month: 1, day })
      const rows = Array.from({ length: 6 }, (_, y) => Array.from({ length: 6 }, (_, x): Record<string, unknown> => ({ x, y, date })))
      rows.forEach((row, y) => row.forEach((cell, x) => {
        cell.right = row[x + 1]
        cell.left = row[x - 1]
        cell.up = rows[y - 1]?.[x]
        cell.down = rows[y + 1]?.[x]
      }))
      return rows[0][0]
    }
    const value = grid(1)
    expect(timed(() => isEqual([value], [value]))).toBe(true)
    expect(timed(() => isEqual(grid(1), grid(2)))).toBe(false)
  })

  it('compares a cycle with two back-links by its links and contents', () => {
    const cycle = (day: number) => {
      const value: Record<string, unknown> = { date: Temporal.PlainDate.from({ year: 2024, month: 1, day }) }
      value.first = { back: value }
      value.second = { back: value }
      return value
    }
    const value = cycle(1)
    expect(isEqual(value, value)).toBe(true)
    expect(isEqual([value], [value])).toBe(true)
    expect(isEqual({ a: value }, { a: value })).toBe(true)
    // A link back reads as that object's identity, so a separate copy is not equal.
    expect(isEqual(value, cycle(1))).toBe(false)
    expect(isEqual(cycle(1), cycle(2))).toBe(false)
  })

  it('walks a deep value to its end, and falls back to identity past the stack limit', () => {
    const nest = (leaf: unknown, depth: number) => {
      let deep = leaf
      for (let i = 0; i < depth; i++)
        deep = [deep]
      return deep
    }
    const date = () => Temporal.PlainDate.from('2024-01-15')
    expect(isEqual(nest(date(), 120), nest(date(), 120))).toBe(true)
    expect(isEqual(nest(date(), 120), nest(date().add({ days: 1 }), 120))).toBe(false)
    const deep = nest(new Blob([]), 100_000)
    expect(isEqual(deep, nest(new Blob([]), 100_000))).toBe(false)
    expect(isEqual(deep, deep)).toBe(true)
  }, 60_000)

  it('reads a Temporal value through a deep reactive baseline', () => {
    const date = Temporal.PlainDate.from('2024-01-15')
    expect(isEqual(reactive([date]), [Temporal.PlainDate.from('2024-01-15')])).toBe(true)
    expect(isEqual(reactive({ start: date }), { start: Temporal.PlainDate.from('2024-01-15') })).toBe(true)
  })

  it('keeps comparing ordinary values by structure', () => {
    expect(isEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
    expect(isEqual([1, 'x'], [1, 'x'])).toBe(true)
    expect(isEqual([1, 2], [2, 1])).toBe(false)
    expect(isEqual(1, '1')).toBe(false)
    expect(isEqual(1n, 1)).toBe(false)
    expect(isEqual(Number.NaN, Number.NaN)).toBe(true)
    expect(isEqual(new Date(0), new Date(0))).toBe(true)
    expect(isEqual(new Set([1, 2]), new Set([2, 1]))).toBe(true)
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

describe('isEqual with primitives', () => {
  const pairs: [unknown, unknown, boolean][] = [
    ['a', 'a', true],
    ['a', 'b', false],
    ['', '', true],
    ['', ' ', false],
    ['1', 1, false],
    ['true', true, false],
    [1, 1, true],
    [1, 2, false],
    [0, -0, true],
    [Number.NaN, Number.NaN, true],
    [1, Number.NaN, false],
    [Infinity, -Infinity, false],
    [true, true, true],
    [true, false, false],
    [false, 0, false],
    [null, null, true],
    [null, undefined, false],
    [undefined, undefined, true],
    [1n, 1n, true],
    [1n, 1, false],
    ['a', { a: 1 }, false],
    [1, [1], false],
    [{ a: 1 }, { a: 1 }, true],
    [{ a: 1 }, { a: 2 }, false],
    [['a'], ['a'], true],
  ]

  it.each(pairs)('isEqual(%o, %o) is %s', (a, b, expected) => {
    expect(isEqual(a, b)).toBe(expected)
  })
})
