import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { CheckboxGroupRootContext } from './CheckboxGroupRoot.vue'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { AcceptableValue } from '@/shared/types'
import { computed, toValue } from 'vue'
import { useControllableState } from '@/shared'
import { toggleArrayValue } from './utils'

/**
 * Why the group's value changed; carried as `details.reason` on every change
 * (#2828). `'item-press'` is a press on one of the group's checkboxes.
 */
export type CheckboxGroupChangeReason = 'item-press'

export interface UseCheckboxGroupProps<T extends AcceptableValue = AcceptableValue> {
  /**
   * Controlled value. A getter/ref resolving to `undefined` is uncontrolled; a
   * writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<T[] | undefined>
  /** Initial value when uncontrolled, default `[]`. */
  defaultValue?: T[]
  /** When `true`, every checkbox in the group is disabled. */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** When `false`, arrow-key navigation between the items is disabled, default `true`. */
  rovingFocus?: MaybeRefOrGetter<boolean | undefined>
  /** Component `emit`; receives `beforeUpdate:modelValue` then `update:modelValue`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: T[], details: ChangeEventDetails<CheckboxGroupChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: T[], details: ChangeEventDetails<CheckboxGroupChangeReason>) => void
}

export interface UseCheckboxGroupReturn<T extends AcceptableValue = AcceptableValue> {
  modelValue: ComputedRef<T[]>
  disabled: ComputedRef<boolean>
  rovingFocus: ComputedRef<boolean>
  /** Replace the whole value; returns `false` when unchanged or cancelled. */
  changeModelValue: (value: T[], reason?: CheckboxGroupChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Add `value` when absent, remove it when present (ohash `isEqual`); returns `false` when cancelled. */
  toggleValue: (value: T, reason?: CheckboxGroupChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Details of the last change attempt; initially `{ reason: 'none' }`. */
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<CheckboxGroupChangeReason>>>
  isControlled: ComputedRef<boolean>
  context: CheckboxGroupRootContext
}

/**
 * Headless CheckboxGroup logic. The `.vue` shell composes this; a standalone
 * consumer pairs it with `useCheckbox({ group: context })` per item. Roving
 * focus (arrow-key navigation) is the `RovingFocusGroup` component family and
 * stays a wrapper — this composable only exposes the `rovingFocus` flag.
 *
 * SSR-safe (no `document`/`window` at call scope) and reactive — props are
 * read with `toValue`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useCheckboxGroup<T extends AcceptableValue = AcceptableValue>(props: UseCheckboxGroupProps<T> = {}): UseCheckboxGroupReturn<T> {
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<T[], CheckboxGroupChangeReason>({
    prop: props.modelValue,
    defaultValue: () => props.defaultValue ?? [],
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const rovingFocus = computed(() => toValue(props.rovingFocus) ?? true)

  function changeModelValue(value: T[], reason: CheckboxGroupChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setState(value, reason, event)
  }

  function toggleValue(value: T, reason: CheckboxGroupChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return changeModelValue(toggleArrayValue(modelValue.value, value), reason, event)
  }

  const context: CheckboxGroupRootContext = {
    modelValue: modelValue as Ref<AcceptableValue[]>,
    rovingFocus: rovingFocus as Ref<boolean>,
    disabled: disabled as Ref<boolean>,
    changeModelValue: changeModelValue as CheckboxGroupRootContext['changeModelValue'],
  }

  return { modelValue, disabled, rovingFocus, changeModelValue, toggleValue, lastChangeDetails, isControlled, context }
}
