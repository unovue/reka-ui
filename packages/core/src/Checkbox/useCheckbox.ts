import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { CheckboxGroupRootContext } from './CheckboxGroupRoot.vue'
import type { CheckboxRootContext } from './CheckboxRoot.vue'
import type { CheckboxGroupChangeReason } from './useCheckboxGroup'
import type { CheckedState } from './utils'
import type { BaseChangeReason, ChangeEventDetails, PartSurface, TriSelectionState } from '@/shared'
import type { AcceptableValue } from '@/shared/types'
import { isEqual } from 'ohash'
import { computed, toValue } from 'vue'
import { createPartSurface, isNullish, isValueEqualOrExist, selectionState, useControllableState } from '@/shared'
import { isIndeterminate, toggleArrayValue } from './utils'

/** Why the checkbox value changed; carried as `details.reason` on every change (#2828). */
export type CheckboxChangeReason = 'trigger-press'

export type CheckboxState = { state: TriSelectionState, disabled: boolean }

export interface UseCheckboxProps<T = boolean> {
  /**
   * Controlled value. A getter/ref resolving to `undefined` is uncontrolled; a
   * writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<T | 'indeterminate' | null | undefined>
  /** Initial value when uncontrolled, default `falseValue`. */
  defaultValue?: T | 'indeterminate'
  /** When `true`, the checkbox is disabled (a disabled `group` also disables it). */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  required?: MaybeRefOrGetter<boolean | undefined>
  /** Form submission value and group membership token, default `'on'`. */
  value?: MaybeRefOrGetter<AcceptableValue | undefined>
  /** Value when checked, default `true`. */
  trueValue?: MaybeRefOrGetter<T>
  /** Value when unchecked, default `false`. */
  falseValue?: MaybeRefOrGetter<T>
  /** Component `emit`; receives `beforeUpdate:modelValue` then `update:modelValue`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: T | 'indeterminate', details: ChangeEventDetails<CheckboxChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: T | 'indeterminate', details: ChangeEventDetails<CheckboxChangeReason>) => void
  /**
   * The enclosing `useCheckboxGroup()` context, if any. While the group holds a
   * non-nullish value the checkbox reads its checked state from membership of
   * `value` in the group and a press toggles that membership (through
   * `group.changeModelValue`) instead of the local model.
   */
  group?: CheckboxGroupRootContext | null
}

export interface UseCheckboxReturn<T = boolean> {
  modelValue: ComputedRef<T | 'indeterminate'>
  /** `true` when `modelValue` equals `trueValue` (ohash `isEqual`). */
  checked: ComputedRef<boolean>
  /** Group membership when grouped, else `'indeterminate'` or `checked`. */
  checkedState: ComputedRef<CheckedState>
  disabled: ComputedRef<boolean>
  /** Press semantics: indeterminate → checked, otherwise flip; returns `false` when unchanged or cancelled. */
  toggle: (reason?: CheckboxChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Set the checked state explicitly; returns `false` when unchanged or cancelled. */
  setChecked: (checked: CheckedState, reason?: CheckboxChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Details of the last local change attempt; initially `{ reason: 'none' }`. Group-mode changes are recorded on the group. */
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<CheckboxChangeReason>>>
  isControlled: ComputedRef<boolean>
  root: PartSurface<CheckboxState>
  indicator: PartSurface<CheckboxState>
  context: CheckboxRootContext
}

function checkboxStateOf(context: CheckboxRootContext): CheckboxState {
  return { state: selectionState(context.state.value), disabled: context.disabled.value }
}

/**
 * Indicator surface derived from the root context — the single derivation shared
 * by `useCheckbox().indicator` and `CheckboxIndicator.vue` (recipe rule: one
 * derivation, two callers). State only: the `Presence` wrapper and the
 * `pointer-events` style stay in the SFC.
 */
export function getCheckboxIndicatorSurface(context: CheckboxRootContext): PartSurface<CheckboxState> {
  return createPartSurface<CheckboxState>(() => ({}), () => checkboxStateOf(context))
}

/** A press on a grouped checkbox reaches the group as an item press. */
function toGroupReason(reason: CheckboxChangeReason | BaseChangeReason): CheckboxGroupChangeReason | BaseChangeReason {
  return reason === 'trigger-press' ? 'item-press' : reason
}

/**
 * Headless Checkbox logic. The `.vue` shell composes this; standalone consumers
 * can drive a checkbox entirely from JS, optionally inside a
 * `useCheckboxGroup()` via the `group` option. Keep this SSR-safe (no
 * `document` at call scope) and reactive — read props with `toValue`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useCheckbox<T = boolean>(props: UseCheckboxProps<T> = {}): UseCheckboxReturn<T> {
  const group = props.group ?? null
  const trueValue = () => (props.trueValue !== undefined ? toValue(props.trueValue) : (true as unknown as T))
  const falseValue = () => (props.falseValue !== undefined ? toValue(props.falseValue) : (false as unknown as T))
  // `null` is a legitimate form value (`AcceptableValue`); only `undefined` falls back to `'on'`.
  const value = () => {
    const resolved = toValue(props.value)
    return resolved === undefined ? 'on' : resolved
  }

  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<T | 'indeterminate', CheckboxChangeReason>({
    // Passed as-is (not wrapped in a getter) so a writable `Ref` keeps ref-owned mode.
    prop: props.modelValue as MaybeRefOrGetter<T | 'indeterminate' | undefined>,
    defaultValue: () => props.defaultValue ?? falseValue(),
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  const disabled = computed(() => (group?.disabled.value || toValue(props.disabled)) ?? false)
  const checked = computed(() => isEqual(modelValue.value, trueValue()))

  const checkedState = computed<CheckedState>(() => {
    if (!isNullish(group?.modelValue.value)) {
      return isValueEqualOrExist(group.modelValue.value, value())
    }
    else {
      if (modelValue.value === 'indeterminate')
        return 'indeterminate'
      return checked.value
    }
  })

  function toggle(reason: CheckboxChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    // Ported verbatim from CheckboxRoot.vue's `handleClick` — no disabled guard
    // (a disabled native button never fires the click). Group writes go through
    // the group's `changeModelValue` so its `beforeUpdate` can veto them.
    if (!isNullish(group?.modelValue.value))
      return group.changeModelValue(toggleArrayValue(group.modelValue.value, value()), toGroupReason(reason), event)

    if (modelValue.value === 'indeterminate')
      return setState(trueValue(), reason, event)
    return setState(checked.value ? falseValue() : trueValue(), reason, event)
  }

  function setChecked(next: CheckedState, reason: CheckboxChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    if (!isNullish(group?.modelValue.value)) {
      // A group has no indeterminate member; only a membership change is a change.
      if (next === 'indeterminate' || isValueEqualOrExist(group.modelValue.value, value()) === next)
        return false
      return group.changeModelValue(toggleArrayValue(group.modelValue.value, value()), toGroupReason(reason), event)
    }
    return setState(next === 'indeterminate' ? 'indeterminate' : next ? trueValue() : falseValue(), reason, event)
  }

  function onKeydown(event: KeyboardEvent) {
    // Ported verbatim from CheckboxRoot.vue's `@keydown.enter.prevent`:
    // according to WAI ARIA, Checkboxes don't activate on enter keypress.
    if (event.key === 'Enter')
      event.preventDefault()
  }

  const context: CheckboxRootContext = {
    disabled,
    state: checkedState,
  }

  const root = createPartSurface<CheckboxState>(
    () => ({
      'role': 'checkbox',
      'aria-checked': isIndeterminate(checkedState.value) ? 'mixed' : checkedState.value,
      // Pass-through (not `|| undefined`) to match CheckboxRoot's `:aria-required`
      // exactly: undefined omits, `false` renders "false".
      'aria-required': toValue(props.required),
      // Boolean pass-through, like CheckboxRoot's `:disabled="disabled"`.
      'disabled': disabled.value,
      'onClick': (event: MouseEvent) => toggle('trigger-press', event),
      'onKeydown': onKeydown,
    }),
    () => checkboxStateOf(context),
  )
  const indicator = getCheckboxIndicatorSurface(context)

  return { modelValue, checked, checkedState, disabled, toggle, setChecked, lastChangeDetails, isControlled, root, indicator, context }
}
