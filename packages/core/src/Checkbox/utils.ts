import type { AcceptableValue } from '@/shared/types'
import { isNullish, isValueEqualOrExist } from '@/shared'
import { isEqual } from '@/shared/compare'

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

/**
 * The state of a parent checkbox: checked when every value in `allValues` is in `selected`,
 * unchecked when none is (or `allValues` is empty), and indeterminate otherwise.
 */
export function getParentState(allValues: AcceptableValue[], selected: AcceptableValue[]): CheckedState {
  let checkedCount = 0
  for (const value of allValues) {
    if (isValueEqualOrExist(selected, value))
      checkedCount++
  }
  if (checkedCount === 0)
    return false
  return checkedCount === allValues.length ? true : 'indeterminate'
}

/**
 * The model with every enabled value of `allValues` checked (up to `max`). Values outside
 * `allValues` and values of disabled checkboxes are kept as they are.
 */
export function getParentCheckedValue(
  allValues: AcceptableValue[],
  selected: AcceptableValue[],
  isDisabled: (value: AcceptableValue) => boolean,
  max?: number | null,
): AcceptableValue[] {
  const checked = [...selected]
  for (const value of allValues) {
    if (!isNullish(max) && checked.length >= max)
      break
    if (!isDisabled(value) && !isValueEqualOrExist(checked, value))
      checked.push(value)
  }
  return checked
}

/**
 * The model with every enabled value of `allValues` unchecked. Values outside `allValues`
 * and values of disabled checkboxes are kept as they are.
 */
export function getParentUncheckedValue(
  allValues: AcceptableValue[],
  selected: AcceptableValue[],
  isDisabled: (value: AcceptableValue) => boolean,
): AcceptableValue[] {
  return selected.filter(value => !isValueEqualOrExist(allValues, value) || isDisabled(value))
}

/**
 * The model after a click on a parent checkbox. A checked parent unchecks every enabled value;
 * otherwise every enabled value is checked (up to `max`). When that would change nothing,
 * for example because the only unchecked values are disabled, the enabled values are unchecked.
 */
export function getParentToggleValue(
  allValues: AcceptableValue[],
  selected: AcceptableValue[],
  isDisabled: (value: AcceptableValue) => boolean,
  max?: number | null,
): AcceptableValue[] {
  if (getParentState(allValues, selected) !== true) {
    const checked = getParentCheckedValue(allValues, selected, isDisabled, max)
    if (checked.length !== selected.length)
      return checked
  }
  return getParentUncheckedValue(allValues, selected, isDisabled)
}
