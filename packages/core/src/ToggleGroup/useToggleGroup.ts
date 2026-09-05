import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { ToggleGroupRootContext } from './ToggleGroupRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface, SelectionState } from '@/shared'
import type { AcceptableValue, DataOrientation, Direction, SingleOrMultipleType } from '@/shared/types'
import { isEqual } from 'ohash'
import { computed, toValue } from 'vue'
import { createPartSurface, isValueEqualOrExist, selectionState, useControllableState } from '@/shared'

/** Why the value changed; carried as `details.reason` on every change (#2828). */
export type ToggleGroupChangeReason = 'item-press'

export type ToggleGroupItemState = { state: SelectionState, disabled: boolean }

type ToggleGroupValue = AcceptableValue | AcceptableValue[]

/**
 * The per-item surface, derived purely from `(context, value)`. The
 * `ToggleGroupItem` SFC (which injects the context) and a standalone
 * `useToggleGroup()` consumer share ONE derivation of pressed/disabled — no
 * drift between the two.
 */
export function getToggleGroupItemSurface(
  context: ToggleGroupRootContext,
  value: MaybeRefOrGetter<AcceptableValue>,
  disabled?: MaybeRefOrGetter<boolean | undefined>,
): PartSurface<ToggleGroupItemState> {
  const pressed = computed(() => isValueEqualOrExist(context.modelValue.value, toValue(value)))
  // `group || item` as in ToggleGroupItem.vue; normalised to a boolean for the state.
  const isDisabled = computed(() => (context.disabled?.value || toValue(disabled)) ?? false)

  return createPartSurface<ToggleGroupItemState>(
    () => ({
      'aria-pressed': pressed.value,
      'disabled': isDisabled.value,
      'onClick': (event: MouseEvent) => context.changeModelValue(toValue(value), 'item-press', event),
    }),
    () => ({ state: selectionState(pressed.value), disabled: isDisabled.value }),
  )
}

export interface UseToggleGroupProps {
  /**
   * `'single'` or `'multiple'`. Overrides the type inferred from
   * `modelValue` / `defaultValue` (an array infers `'multiple'`).
   */
  type?: MaybeRefOrGetter<SingleOrMultipleType | undefined>
  /**
   * Controlled value. A getter/ref resolving to `undefined` is uncontrolled;
   * a writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<ToggleGroupValue | undefined>
  /**
   * Initial value when uncontrolled. Defaults to `undefined` when `type` is
   * `'single'`, else `[]` (the `useSingleOrMultipleValue` rule).
   */
  defaultValue?: ToggleGroupValue
  /** Component `emit`; receives `beforeUpdate:modelValue` then `update:modelValue`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: ToggleGroupValue | undefined, details: ChangeEventDetails<ToggleGroupChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: ToggleGroupValue | undefined, details: ChangeEventDetails<ToggleGroupChangeReason>) => void
  /** Disables the group and every item. */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** Snapshot, like the context field it feeds (arrow-key orientation lives in `RovingFocusGroup`). */
  orientation?: DataOrientation
  /** @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** @defaultValue `true` */
  loop?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `true` */
  rovingFocus?: MaybeRefOrGetter<boolean | undefined>
}

export interface UseToggleGroupReturn {
  modelValue: ComputedRef<ToggleGroupValue | undefined>
  isSingle: ComputedRef<boolean>
  /**
   * Press an item by value: single mode selects it (or clears the selection
   * when it is already selected), multiple mode adds/removes it. Returns
   * `false` when unchanged or cancelled.
   */
  changeModelValue: (value: AcceptableValue, reason?: ToggleGroupChangeReason | BaseChangeReason, event?: Event) => boolean
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<ToggleGroupChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** The `role="group"` surface. */
  root: PartSurface<Record<string, never>>
  /** Per-item surface built from `(context, value)`. */
  getItemSurface: (value: MaybeRefOrGetter<AcceptableValue>, disabled?: MaybeRefOrGetter<boolean | undefined>) => PartSurface<ToggleGroupItemState>
  context: ToggleGroupRootContext
}

/**
 * Headless ToggleGroup logic. The `.vue` shells compose this; a standalone
 * consumer gets the single/multiple model, `aria-pressed` and `data-state` per
 * item, but must still wrap items in `RovingFocusGroup`/`RovingFocusItem` for
 * arrow-key navigation — a component family a pure composable cannot absorb.
 *
 * The model semantics are ported verbatim from `useSingleOrMultipleValue`
 * (type inference, default value, single-mode toggle-off, multiple-mode
 * add/remove with deep equality), now routed through `useControllableState`
 * so `beforeUpdate:modelValue` can cancel a press.
 *
 * SSR-safe (no `document`/`window` at call scope) and callable outside
 * `setup()` (computed-only).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useToggleGroup(props: UseToggleGroupProps = {}): UseToggleGroupReturn {
  // `getDefaultType`: an explicit `type` wins; otherwise infer from whichever
  // of `modelValue || defaultValue` is set (array → 'multiple'), else 'single'.
  const type = computed<SingleOrMultipleType>(() => {
    const explicit = toValue(props.type)
    if (explicit)
      return explicit
    const modelValue = toValue(props.modelValue)
    const defaultValue = props.defaultValue
    const value = modelValue || defaultValue
    const canTypeBeInferred = modelValue !== undefined || defaultValue !== undefined
    if (canTypeBeInferred)
      return Array.isArray(value) ? 'multiple' : 'single'
    return 'single'
  })
  const isSingle = computed(() => type.value === 'single')

  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<ToggleGroupValue | undefined, ToggleGroupChangeReason>({
    prop: props.modelValue,
    // `getDefaultValue`: reads the raw `type` option (not the inferred one), so
    // a group with neither `type` nor `defaultValue` starts as `[]`.
    defaultValue: () => {
      if (props.defaultValue !== undefined)
        return props.defaultValue
      return toValue(props.type) === 'single' ? undefined : []
    },
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })

  const disabled = computed(() => toValue(props.disabled) ?? false)
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const loop = computed(() => toValue(props.loop) ?? true)
  const rovingFocus = computed(() => toValue(props.rovingFocus) ?? true)

  function changeModelValue(value: AcceptableValue, reason: ToggleGroupChangeReason | BaseChangeReason = 'imperative-action', event?: Event): boolean {
    if (type.value === 'single')
      return setState(isEqual(value, modelValue.value) ? undefined : value, reason, event)

    const current = modelValue.value
    const modelValueArray = Array.isArray(current) ? [...(current as AcceptableValue[] || [])] : [current as AcceptableValue].filter(Boolean)
    if (isValueEqualOrExist(modelValueArray, value)) {
      const index = modelValueArray.findIndex(i => isEqual(i, value))
      modelValueArray.splice(index, 1)
    }
    else {
      modelValueArray.push(value)
    }
    return setState(modelValueArray, reason, event)
  }

  const context: ToggleGroupRootContext = {
    isSingle,
    modelValue: modelValue as unknown as Ref<ToggleGroupValue | undefined>,
    changeModelValue,
    dir: dir as unknown as Ref<Direction>,
    orientation: props.orientation,
    loop: loop as unknown as Ref<boolean>,
    rovingFocus: rovingFocus as unknown as Ref<boolean>,
    disabled: disabled as unknown as Ref<boolean>,
  }

  const root = createPartSurface<Record<string, never>>(
    () => ({ role: 'group' }),
    () => ({}),
  )

  return {
    modelValue,
    isSingle,
    changeModelValue,
    lastChangeDetails,
    isControlled,
    root,
    getItemSurface: (value, disabled) => getToggleGroupItemSurface(context, value, disabled),
    context,
  }
}
