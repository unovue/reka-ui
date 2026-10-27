import { describe, expect, it } from 'vitest'
import { compare, valueComparator } from './compare'
import { isValueEqualOrExist } from './isValueEqualOrExist'

describe('compare', () => {
  it('returns false when either side is undefined', () => {
    expect(compare(undefined, 'a')).toBe(false)
    expect(compare('a', undefined)).toBe(false)
    expect(compare(undefined, undefined)).toBe(false)
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
