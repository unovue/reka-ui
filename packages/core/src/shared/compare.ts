import { isEqual } from 'ohash'

/**
 * How two values are matched: a key both objects are compared by, or a custom
 * equality function. The single identity strategy shared by Listbox, Combobox
 * and Select (#2824).
 */
export type By<T> = string | ((a: T, b: T) => boolean)

export function valueComparator<T>(value: T | T[] | undefined, currentValue: T, comparator?: By<T>) {
  if (value === undefined)
    return false
  else if (Array.isArray(value))
    return value.some(val => compare(val, currentValue, comparator))
  else
    return compare(value, currentValue, comparator)
}

export function compare<T>(value?: T, currentValue?: T, comparator?: By<T>) {
  if (value === undefined || currentValue === undefined)
    return false

  // A comparison function is the caller's whole identity strategy, so it runs
  // for every value, strings included (v2 skipped it for strings).
  if (typeof comparator === 'function')
    return comparator(value, currentValue)

  if (typeof value === 'string')
    return value === currentValue

  if (typeof comparator === 'string')
    return value?.[comparator as keyof T] === currentValue?.[comparator as keyof T]

  return isEqual(value, currentValue)
}
