import type { By } from './compare'
import { isEqual } from 'ohash'
import { compare } from './compare'
import { isNullish } from './nullish'

/**
 * The function `isValueEqualOrExist` checks if a value is equal to or exists in another value or
 * array.
 * @param {T | T[] | undefined} base - It represents the base value that you want to compare with the `current` value.
 * @param {T | T[] | undefined} current - The `current` parameter represents the current value that you want to compare with the `base` value or values.
 * @param {By<T>} [by] - Optional identity strategy (a key or an equality function). When given, the
 * comparison routes through the shared `compare` (#2824); when omitted the structural `isEqual` check applies.
 * @returns The `isValueEqualOrExist` function returns a boolean value. It checks if the `base` value
 * is equal to the `current` value or if the `current` value exists within the `base` value. The
 * function handles cases where `base` can be a single value, an array of values, or undefined.
 */
export function isValueEqualOrExist<T>(base: T | T[] | undefined, current: T | T[] | undefined, by?: By<T>) {
  if (isNullish(base))
    return false
  if (by !== undefined) {
    if (Array.isArray(base))
      return base.some(val => compare(val, current as T, by))
    else
      return compare(base, current as T, by)
  }
  if (Array.isArray(base)) {
    return base.some(val => isEqual(val, current))
  }
  else {
    return isEqual(base, current)
  }
}
