import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { RatingRootContext } from './RatingRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface, SelectionState } from '@/shared'
import { computed, ref, toValue } from 'vue'
import { createPartSurface, selectionState, useControllableState } from '@/shared'

/**
 * Why the value changed; carried as `details.reason` on every change (#2828).
 * `'item-press'`: an indicator was selected — by pointer, `Space`, or arrow-key
 * navigation (the radio group checks the focused item) — including the press on
 * the current value that clears a `clearable` rating to `0`.
 */
export type RatingChangeReason = 'item-press'

export type RatingRootState = { disabled: boolean }
export type RatingItemIndicatorState = { state: SelectionState, disabled: boolean }

export interface UseRatingProps {
  /**
   * Controlled value. A getter/ref resolving to `undefined` is uncontrolled; a
   * writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<number | undefined>
  /** Initial value when uncontrolled. */
  defaultValue?: number
  /** Number of rating items. @defaultValue `5` */
  length?: MaybeRefOrGetter<number | undefined>
  /** Granularity of each item. @defaultValue `1` */
  step?: MaybeRefOrGetter<number | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** Pressing the current value resets it to `0`. */
  clearable?: MaybeRefOrGetter<boolean | undefined>
  /** Hovering an indicator previews its value. */
  hoverable?: MaybeRefOrGetter<boolean | undefined>
  /** Component `emit`; receives `beforeUpdate:modelValue` then `update:modelValue`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: number, details: ChangeEventDetails<RatingChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: number, details: ChangeEventDetails<RatingChangeReason>) => void
}

export interface UseRatingReturn {
  modelValue: ComputedRef<number | undefined>
  /** `[1, …, length]`. */
  items: ComputedRef<number[]>
  /** The previewed value while hovering a `hoverable` rating, else `0`. */
  hoveredRating: Ref<number>
  disabled: ComputedRef<boolean>
  /**
   * Select `rating` (or clear to `0` when `clearable` and it is the current
   * value). Returns `false` when disabled, unchanged or cancelled.
   */
  changeModelValue: (rating: number, reason?: RatingChangeReason | BaseChangeReason, event?: Event) => boolean
  changeHoveredRating: (rating: number) => void
  resetHoveredRating: () => void
  /** The step values of the 1-based `item`, e.g. `[2.5, 3]` for item 3 with `step: 0.5`. */
  getItemSteps: (item: number) => number[]
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<RatingChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** The `role="radiogroup"` surface; its `onMouseleave` ends a hover preview. */
  root: PartSurface<RatingRootState>
  /**
   * A standalone indicator: `role="radio"`, `aria-checked`, selection on click,
   * hover preview and the step CSS variables. The `RatingItemIndicator` shell
   * gets the radio semantics from `RadioGroupItem` instead.
   */
  getItemIndicatorSurface: (step: MaybeRefOrGetter<number>) => PartSurface<RatingItemIndicatorState>
  context: RatingRootContext
}

/** The step values one 1-based rating item covers. */
export function getRatingItemSteps(item: number, stepSize: number): number[] {
  const groupStartValue = item - 1
  const groupEndValue = item
  const numberOfSteps = Math.ceil((groupEndValue - groupStartValue) / stepSize)
  return Array.from({ length: numberOfSteps }, (_, index) =>
    Number((groupStartValue + (index + 1) * stepSize).toFixed(2)))
}

export interface RatingItemIndicatorSurfaceOptions {
  /** Whether the indicator has focus; a focused partial step stays visible. */
  isFocused?: MaybeRefOrGetter<boolean>
  /** The steps of the indicator's item (for the stacking order); derived from `step` when omitted. */
  steps?: MaybeRefOrGetter<number[]>
}

/**
 * The indicator's Rating-specific surface — `data-state` (hover-aware), the step
 * CSS variables and the hover handler — derived from `(context, step)`. Shared
 * by `RatingItemIndicator.vue` (layered over `RadioGroupItem`) and
 * `useRating().getItemIndicatorSurface`.
 *
 * @internal
 */
export function getRatingItemIndicatorSurface(
  context: RatingRootContext,
  step: MaybeRefOrGetter<number>,
  options: RatingItemIndicatorSurfaceOptions = {},
): PartSurface<RatingItemIndicatorState> {
  const isActive = computed(() => {
    const value = toValue(step)
    const hovered = context.hoveredRating.value
    return (hovered > 0 && value <= hovered) || (hovered === 0 && value <= context.modelValue.value)
  })

  const isVisible = computed(() => {
    const value = toValue(step)
    return !!toValue(options.isFocused) || context.step.value === 1 || value % 1 === 0 || value === context.hoveredRating.value || value === context.modelValue.value
  })

  return createPartSurface<RatingItemIndicatorState>(
    () => {
      const value = toValue(step)
      const steps = toValue(options.steps) ?? getRatingItemSteps(Math.ceil(value), context.step.value)
      return {
        style: {
          '--reka-rating-item-step-width': `${((value % 1 || 1) * 100)}%`,
          '--reka-rating-item-step-opacity': isVisible.value ? 1 : 0,
          '--reka-rating-item-step-z-index': steps.length - steps.indexOf(value),
        },
        onMouseenter: () => context.changeHoveredRating(value),
      }
    },
    () => ({ state: selectionState(isActive.value), disabled: context.disabled.value }),
  )
}

/**
 * Headless Rating logic. The `.vue` shells compose this over `RadioGroup`; a
 * standalone consumer gets the model, hover preview and per-indicator
 * surfaces (`role="radio"` with click selection), but arrow-key navigation
 * needs `RovingFocusGroup` — a component family a pure composable cannot absorb.
 *
 * SSR-safe and callable outside `setup()` (computed-only).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useRating(props: UseRatingProps = {}): UseRatingReturn {
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<number | undefined, RatingChangeReason>({
    prop: props.modelValue,
    defaultValue: () => props.defaultValue,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate as ((value: number | undefined, details: ChangeEventDetails<RatingChangeReason>) => void) | undefined,
    onUpdate: props.onUpdate as ((value: number | undefined, details: ChangeEventDetails<RatingChangeReason>) => void) | undefined,
  })

  const length = computed(() => toValue(props.length) ?? 5)
  const step = computed(() => toValue(props.step) ?? 1)
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const clearable = computed(() => toValue(props.clearable) ?? false)
  const hoverable = computed(() => toValue(props.hoverable) ?? false)

  const items = computed(() => Array.from({ length: length.value }, (_, i) => i + 1))
  const hoveredRating = ref(0)

  function changeModelValue(rating: number, reason: RatingChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    if (disabled.value)
      return false

    if (clearable.value && modelValue.value === rating) {
      const changed = setState(0, reason, event)
      if (changed)
        hoveredRating.value = 0
      return changed
    }
    return setState(rating, reason, event)
  }

  function changeHoveredRating(rating: number) {
    if (disabled.value || !hoverable.value)
      return
    hoveredRating.value = rating
  }

  // Unconditional, so a preview left over from a `hoverable`/`disabled` toggle
  // mid-hover still clears once the pointer leaves.
  function resetHoveredRating() {
    hoveredRating.value = 0
  }

  const context: RatingRootContext = {
    modelValue: modelValue as Readonly<Ref<number>>,
    items,
    hoveredRating,
    disabled,
    step,
    changeModelValue,
    changeHoveredRating,
  }

  const root = createPartSurface<RatingRootState>(
    () => ({
      'role': 'radiogroup',
      'aria-disabled': disabled.value || undefined,
      'onMouseleave': resetHoveredRating,
    }),
    () => ({ disabled: disabled.value }),
  )

  function getItemIndicatorSurface(indicatorStep: MaybeRefOrGetter<number>): PartSurface<RatingItemIndicatorState> {
    const base = getRatingItemIndicatorSurface(context, indicatorStep)
    return createPartSurface<RatingItemIndicatorState>(
      () => ({
        ...base.props.value,
        'role': 'radio',
        'aria-checked': modelValue.value === toValue(indicatorStep),
        'disabled': disabled.value || undefined,
        'onClick': (event: MouseEvent) => changeModelValue(toValue(indicatorStep), 'item-press', event),
      }),
      base.state,
    )
  }

  return {
    modelValue,
    items,
    hoveredRating,
    disabled,
    changeModelValue,
    changeHoveredRating,
    resetHoveredRating,
    getItemSteps: item => getRatingItemSteps(item, step.value),
    lastChangeDetails,
    isControlled,
    root,
    getItemIndicatorSurface,
    context,
  }
}
