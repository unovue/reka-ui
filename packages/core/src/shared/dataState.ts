/**
 * The two normalised `data-state` axes (#2823). Every family's `state.state`
 * is typed with one of these; the per-family value renames land separately.
 */
export type DisclosureState = 'open' | 'closed'
export type SelectionState = 'checked' | 'unchecked'
export type TriSelectionState = SelectionState | 'indeterminate'

/** `true` → `'open'`, `false` → `'closed'`. */
export function disclosureState(open: boolean): DisclosureState {
  return open ? 'open' : 'closed'
}

/** `true` → `'checked'`, `false` → `'unchecked'`, `'indeterminate'` passes through. */
export function selectionState(checked: boolean | 'indeterminate'): TriSelectionState {
  if (checked === 'indeterminate')
    return 'indeterminate'
  return checked ? 'checked' : 'unchecked'
}
