import { isEqual } from 'ohash'
import { isValueEqualOrExist } from '@/shared'

export type CheckedState = boolean | 'indeterminate'

export function isIndeterminate(checked?: CheckedState): checked is 'indeterminate' {
  return checked === 'indeterminate'
}

/**
 * Membership toggle shared by `useCheckbox` (group mode) and
 * `useCheckboxGroup().toggleValue`: removes `value` when an equal item (ohash
 * `isEqual`) already exists, appends it otherwise. Always returns a new array.
 */
export function toggleArrayValue<T>(array: T[] | undefined, value: T): T[] {
  const next = [...(array || [])]
  if (isValueEqualOrExist(next, value)) {
    const index = next.findIndex(i => isEqual(i, value))
    next.splice(index, 1)
  }
  else {
    next.push(value)
  }
  return next
}
