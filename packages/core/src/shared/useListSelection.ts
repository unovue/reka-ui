import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { By } from './compare'
import type { BaseChangeReason, ChangeEventDetails } from './types'
import { ref, toValue } from 'vue'
import { compare, valueComparator } from './compare'
import { useControllableState } from './useControllableState'

export interface UseListSelectionOptions<T, R extends string = string> {
  /**
   * Controlled value. A getter/ref resolving to `undefined` is uncontrolled;
   * a writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<T | T[] | undefined>
  /** Initial value when uncontrolled. Defaults to `[]` when `multiple`, else `undefined`. */
  defaultValue?: T | T[]
  /** Whether several values can be selected at once. @defaultValue `false` */
  multiple?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Identity strategy (a key or an equality function; a function runs for
   * every value, strings included). A plain value read once at setup, NOT a
   * getter: a comparison function would otherwise be mistaken for a getter by
   * `toValue`.
   */
  by?: By<T>
  /**
   * `'toggle'` adds/removes the value (and clears a single selection when it
   * is re-selected); `'replace'` always selects the value.
   * @defaultValue `'toggle'`
   */
  selectionBehavior?: MaybeRefOrGetter<'toggle' | 'replace' | undefined>
  /** Model name for the emits. @defaultValue `'modelValue'` */
  name?: string
  /** Component `emit`; receives `beforeUpdate:<name>` then `update:<name>`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: T | T[] | undefined, details: ChangeEventDetails<R>) => void
  /** Called after a change commits. */
  onUpdate?: (value: T | T[] | undefined, details: ChangeEventDetails<R>) => void
}

export interface UseListSelectionReturn<T, R extends string = string> {
  modelValue: ComputedRef<T | T[] | undefined>
  /** Write the whole model; returns `false` when unchanged or cancelled. */
  setModelValue: (value: T | T[] | undefined, reason?: R | BaseChangeReason, event?: Event) => boolean
  /**
   * Select a value following `multiple` / `selectionBehavior`; returns `false`
   * when unchanged or cancelled.
   */
  select: (value: T, reason?: R | BaseChangeReason, event?: Event) => boolean
  /** Whether `value` is (part of) the current selection, matched with `by`. */
  isSelected: (value: T) => boolean
  /** Anchor of a `'replace'` selection — the value the last replace selected (range selections start here). */
  firstValue: Ref<T | undefined>
  isControlled: ComputedRef<boolean>
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<R>>>
}

/** `Object.is`, applied entry by entry to two arrays — the change-only rule for a multiple selection. */
function isSameSelection<T>(a: T | T[] | undefined, b: T | T[] | undefined) {
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((value, index) => Object.is(value, b[index]))
  return Object.is(a, b)
}

/**
 * The single/multiple selection model shared by Listbox (and later Combobox
 * and Select, #2824), on top of `useControllableState`. `select` is ported
 * verbatim from `ListboxRoot.vue`'s `onValueChange`: multiple + toggle
 * adds/removes the value, multiple + replace selects `[value]` and records it
 * as the range anchor, single + toggle clears a re-selected value.
 *
 * A multiple selection is compared entry by entry (`Object.is` on each), so
 * re-selecting the current value in `'replace'` mode emits nothing — the same
 * change-only rule as a single value (v2 emitted a fresh array every time).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useListSelection<T, R extends string = string>(options: UseListSelectionOptions<T, R> = {}): UseListSelectionReturn<T, R> {
  const { by } = options
  const selectionBehavior = () => toValue(options.selectionBehavior) ?? 'toggle'
  const multiple = () => toValue(options.multiple) ?? false

  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<T | T[] | undefined, R>({
    prop: options.modelValue,
    // Evaluated once, like the SFC's `props.defaultValue ?? (multiple.value ? [] : undefined)`.
    defaultValue: () => options.defaultValue ?? (multiple() ? [] : undefined),
    name: options.name ?? 'modelValue',
    emit: options.emit,
    onBeforeUpdate: options.onBeforeUpdate,
    onUpdate: options.onUpdate,
    isEqual: isSameSelection,
  })

  const firstValue = ref<T>() as Ref<T | undefined>

  function setModelValue(value: T | T[] | undefined, reason: R | BaseChangeReason = 'imperative-action', event?: Event) {
    return setState(value, reason, event)
  }

  function select(val: T, reason: R | BaseChangeReason = 'imperative-action', event?: Event) {
    if (multiple()) {
      const modelArray = Array.isArray(modelValue.value) ? [...modelValue.value] : []
      const index = modelArray.findIndex(i => compare(i, val, by))
      if (selectionBehavior() === 'toggle') {
        index === -1 ? modelArray.push(val) : modelArray.splice(index, 1)
        return setState(modelArray, reason, event)
      }
      else {
        const changed = setState([val], reason, event)
        // The range anchor follows a committed replace only — a cancelled
        // `beforeUpdate` keeps the previous anchor with the previous selection.
        if (changed)
          firstValue.value = val
        return changed
      }
    }
    else {
      if (selectionBehavior() === 'toggle') {
        if (compare(modelValue.value as T | undefined, val, by))
          return setState(undefined, reason, event)
        else
          return setState(val, reason, event)
      }
      else {
        return setState(val, reason, event)
      }
    }
  }

  function isSelected(value: T) {
    return valueComparator(modelValue.value, value, by)
  }

  return { modelValue, setModelValue, select, isSelected, firstValue, isControlled, lastChangeDetails }
}
