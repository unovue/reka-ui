export type CheckedState = boolean | 'indeterminate'

export function isIndeterminate(checked?: CheckedState): checked is 'indeterminate' {
  return checked === 'indeterminate'
}

export function getState(checked: CheckedState) {
  return isIndeterminate(checked) ? 'indeterminate' : checked ? 'checked' : 'unchecked'
}

export function getParentState<T>(childValues: T[], selectedValues: T[]): boolean | 'indeterminate' {
  const selectedSet = new Set(selectedValues)

  let hasSome = false
  let hasAll = true

  for (const value of childValues) {
    if (selectedSet.has(value)) {
      hasSome = true
    }
    else {
      hasAll = false
    }
  }

  if (hasAll)
    return true
  if (hasSome)
    return 'indeterminate'
  return false
}
