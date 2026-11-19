import type { AcceptableValue } from '@/shared/types'
import { isNullish, isValueEqualOrExist } from '@/shared'

export type CheckedState = boolean | 'indeterminate'

export function isIndeterminate(checked?: CheckedState): checked is 'indeterminate' {
  return checked === 'indeterminate'
}

export function getState(checked: CheckedState) {
  return isIndeterminate(checked) ? 'indeterminate' : checked ? 'checked' : 'unchecked'
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
 * The model after a click on a parent checkbox. Values outside `allValues` and values of
 * disabled checkboxes are kept as they are. A checked parent unchecks every enabled value;
 * otherwise every enabled value is checked (up to `max`). When that would change nothing,
 * for example because the only unchecked values are disabled, the enabled values are unchecked.
 */
export function getParentToggleValue(
  allValues: AcceptableValue[],
  selected: AcceptableValue[],
  isDisabled: (value: AcceptableValue) => boolean,
  max?: number | null,
): AcceptableValue[] {
  const toggleable = allValues.filter(value => !isDisabled(value))
  const unchecked = selected.filter(value => !isValueEqualOrExist(toggleable, value))

  if (getParentState(allValues, selected) !== true) {
    const checked = [...selected]
    for (const value of toggleable) {
      if (!isNullish(max) && checked.length >= max)
        break
      if (!isValueEqualOrExist(checked, value))
        checked.push(value)
    }
    if (checked.length !== selected.length)
      return checked
  }

  return unchecked
}
