// `compare` / `valueComparator` moved to `@/shared/compare` (#2824); re-exported so existing imports keep working.
export { compare, valueComparator } from '@/shared'

export function queryCheckedElement(parentEl: HTMLElement | null) {
  return parentEl?.querySelector('[data-state=checked]') as HTMLElement | null
}

const BEFORE_UPDATE_MODEL_VALUE_LISTENER = /^onBeforeUpdate:model-?value$/i

/**
 * `$attrs` for a root that renders `ListboxRoot` internally (Combobox,
 * Autocomplete) without the `beforeUpdate:modelValue` listener. Those roots do
 * not declare the event yet, so a consumer listener would otherwise fall
 * through `$attrs` onto the inner `ListboxRoot` and see only part of the
 * changes (item presses, never a clear) with the listbox's value and reasons.
 * Their own cancellable model lands when they route every write through the
 * selection pipeline (#2824).
 */
export function omitBeforeUpdateModelValue(attrs: Record<string, unknown>) {
  const result: Record<string, unknown> = {}
  for (const key in attrs) {
    if (!BEFORE_UPDATE_MODEL_VALUE_LISTENER.test(key))
      result[key] = attrs[key]
  }
  return result
}
