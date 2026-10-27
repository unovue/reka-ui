import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { StepperItemContext, StepperState } from './StepperItem.vue'
import type { StepperRootContext } from './StepperRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { DataOrientation, Direction } from '@/shared/types'
import { computed, nextTick, ref, toValue, watch } from 'vue'
import { createPartSurface, getActiveElement, useArrowNavigation, useControllableState, useKbd } from '@/shared'

/**
 * Why the step changed; carried as `details.reason` on every change (#2828).
 *
 * - `'trigger-press'`: a `StepperTrigger` was pressed (mousedown).
 * - `'trigger-keydown'`: Enter or Space on a `StepperTrigger`.
 * - `'next-step'` / `'prev-step'`: the root's `nextStep()` / `prevStep()`
 *   (slot props and template ref).
 *
 * `goToStep(step)` reports `'imperative-action'`.
 */
export type StepperChangeReason = 'trigger-press' | 'trigger-keydown' | 'next-step' | 'prev-step'

/** Semantic state of the root (`data-linear`, `data-orientation`). */
export type StepperRootState = { linear: boolean, orientation: DataOrientation }
/** Semantic state of an item or trigger (`data-state`, `data-disabled`, `data-orientation`). */
export type StepperItemState = { state: StepperState, disabled: boolean, orientation: DataOrientation }

/** Standalone `useStepper()` calls without a `baseId` draw `reka-stepper-<n>` from here. */
let stepperCount = 0

export interface StepperItemContextOptions {
  step: MaybeRefOrGetter<number>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  completed?: MaybeRefOrGetter<boolean | undefined>
  /** Read on every access, so a getter keeps the id in step with a reactive `step`. */
  titleId: MaybeRefOrGetter<string>
  descriptionId: MaybeRefOrGetter<string>
}

/**
 * The per-item context (state, focusability, ids), derived purely from the
 * root context. `StepperItem` provides it; `useStepper().getItem` builds the
 * same object for standalone use.
 */
export function getStepperItemContext(context: StepperRootContext, options: StepperItemContextOptions): StepperItemContext {
  const step = computed(() => toValue(options.step))
  const disabled = computed(() => toValue(options.disabled) ?? false)
  const completed = computed(() => toValue(options.completed) ?? false)

  const state = computed<StepperState>(() => {
    if (completed.value)
      return 'completed'
    if (context.modelValue.value === step.value)
      return 'current'
    if (context.modelValue.value! > step.value)
      return 'completed'
    return 'upcoming'
  })

  const isFocusable = computed(() => {
    if (disabled.value)
      return false
    if (context.linear.value)
      return step.value <= context.modelValue.value! || step.value === context.modelValue.value! + 1
    return true
  })

  return {
    get titleId() {
      return toValue(options.titleId)
    },
    get descriptionId() {
      return toValue(options.descriptionId)
    },
    step,
    state,
    disabled,
    isFocusable,
  }
}

function itemState(context: StepperRootContext, item: StepperItemContext): StepperItemState {
  return {
    state: item.state.value,
    disabled: item.disabled.value || !item.isFocusable.value,
    orientation: context.orientation.value,
  }
}

/** The `StepperItem` surface: `aria-current` and the `'' | undefined` `disabled` shape. */
export function getStepperItemSurface(context: StepperRootContext, item: StepperItemContext): PartSurface<StepperItemState> {
  return createPartSurface<StepperItemState>(
    () => ({
      'aria-current': item.state.value === 'current' ? 'true' : undefined,
      'disabled': item.disabled.value || !item.isFocusable.value ? '' : undefined,
    }),
    () => itemState(context, item),
  )
}

/**
 * The `StepperTrigger` surface: roving `tabindex`, title/description wiring,
 * and the mousedown/keydown handlers ported verbatim from `StepperTrigger.vue`.
 * Registration in `totalStepperItems` stays with the caller (the SFC does it
 * on mount), since arrow navigation walks the registered elements. Also set
 * `context.itemDisabled.set(el, () => item.disabled.value)` so `goToStep`
 * reads the item's current state instead of the last-rendered attribute.
 */
export function getStepperTriggerSurface(context: StepperRootContext, item: StepperItemContext): PartSurface<StepperItemState> {
  const kbd = useKbd()
  const stepperItems = computed(() => Array.from(context.totalStepperItems.value))

  // `@mousedown.left`
  function onMousedown(event: MouseEvent) {
    if (event.button !== 0)
      return
    if (item.disabled.value)
      return
    if (context.linear.value) {
      if (item.step.value <= context.modelValue.value! || item.step.value === context.modelValue.value! + 1) {
        if (event.ctrlKey === false) {
          context.changeModelValue(item.step.value, 'trigger-press', event)
          return
        }
      }
    }
    else {
      if (event.ctrlKey === false) {
        context.changeModelValue(item.step.value, 'trigger-press', event)
        return
      }
    }

    // prevent focus to avoid accidental activation
    event.preventDefault()
  }

  // `@keydown.enter.space.left.right.up.down`
  const HANDLED_KEYS = [kbd.ENTER, kbd.SPACE, kbd.ARROW_LEFT, kbd.ARROW_RIGHT, kbd.ARROW_UP, kbd.ARROW_DOWN]
  function onKeydown(event: KeyboardEvent) {
    if (!HANDLED_KEYS.includes(event.key))
      return
    event.preventDefault()

    if (item.disabled.value)
      return

    if ((event.key === kbd.ENTER || event.key === kbd.SPACE) && !event.ctrlKey && !event.shiftKey)
      context.changeModelValue(item.step.value, 'trigger-keydown', event)

    if ([kbd.ARROW_LEFT, kbd.ARROW_RIGHT, kbd.ARROW_UP, kbd.ARROW_DOWN].includes(event.key)) {
      useArrowNavigation(event, getActiveElement() as HTMLElement, undefined, {
        itemsArray: stepperItems.value,
        focus: true,
        loop: false,
        arrowKeyOptions: context.orientation.value,
        dir: context.dir.value,
      })
    }
  }

  return createPartSurface<StepperItemState>(
    () => ({
      'disabled': item.disabled.value || !item.isFocusable.value ? '' : undefined,
      'tabindex': item.isFocusable.value ? 0 : -1,
      'aria-describedby': item.descriptionId,
      'aria-labelledby': item.titleId,
      onMousedown,
      onKeydown,
    }),
    () => itemState(context, item),
  )
}

/** The `StepperTitle` surface (its id). */
export function getStepperTitleSurface(item: StepperItemContext): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(() => ({ id: item.titleId }), () => ({}))
}

/** The `StepperDescription` surface (its id). */
export function getStepperDescriptionSurface(item: StepperItemContext): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(() => ({ id: item.descriptionId }), () => ({}))
}

export interface UseStepperProps {
  /**
   * Controlled step. A getter/ref resolving to `undefined` is uncontrolled;
   * a writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<number | undefined>
  /** Initial step when uncontrolled. @defaultValue `1` */
  defaultValue?: number
  /** @defaultValue `'horizontal'` */
  orientation?: MaybeRefOrGetter<DataOrientation | undefined>
  /** Resolved reading direction (the SFC hands its `useDirection` ref). @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** Whether the steps must be completed in order. @defaultValue `true` */
  linear?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Base id the standalone item title/description ids derive from. Defaults to
   * `reka-stepper-<n>` from a per-call counter, which is NOT stable across
   * server and client: SSR consumers must pass a stable `baseId`.
   */
  baseId?: string
  /** Component `emit`; receives `beforeUpdate:modelValue` then `update:modelValue`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: number | undefined, details: ChangeEventDetails<StepperChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: number | undefined, details: ChangeEventDetails<StepperChangeReason>) => void
}

/** Everything a standalone consumer binds for one step. */
export interface StepperItemParts {
  context: StepperItemContext
  item: PartSurface<StepperItemState>
  trigger: PartSurface<StepperItemState>
  title: PartSurface<Record<string, never>>
  description: PartSurface<Record<string, never>>
}

export interface UseStepperReturn {
  modelValue: ComputedRef<number | undefined>
  totalSteps: ComputedRef<number>
  isFirstStep: ComputedRef<boolean>
  isLastStep: ComputedRef<boolean>
  isNextDisabled: ComputedRef<boolean>
  isPrevDisabled: ComputedRef<boolean>
  /** Go to a step, honouring `linear` and the step count. Returns `false` when blocked, unchanged or cancelled. */
  goToStep: (step: number, reason?: StepperChangeReason | BaseChangeReason, event?: Event) => boolean
  nextStep: () => boolean
  prevStep: () => boolean
  hasNext: () => boolean
  hasPrev: () => boolean
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<StepperChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** The `role="group"` root surface. */
  root: PartSurface<StepperRootState>
  /**
   * The item/trigger/title/description surfaces of one step. Bind
   * `trigger.attrs` on an element and add it to `context.totalStepperItems`
   * (in DOM order) for arrow navigation and the step count. Also call
   * `context.itemDisabled.set(el, () => parts.context.disabled.value)` so
   * `goToStep` reads the item's current disabled state; without it, a linear
   * stepper falls back to the rendered `disabled` attribute, which lags a
   * render, so a second synchronous `nextStep()` can return `false`.
   */
  getItem: (step: MaybeRefOrGetter<number>, options?: { disabled?: MaybeRefOrGetter<boolean | undefined>, completed?: MaybeRefOrGetter<boolean | undefined> }) => StepperItemParts
  context: StepperRootContext
}

/**
 * Headless Stepper logic. The `.vue` shells compose this; a standalone
 * consumer gets the step model, `linear` gating, per-step state and the
 * trigger keyboard handling, but must register each trigger element in
 * `context.totalStepperItems` itself (the `StepperTrigger` SFC does it on mount).
 *
 * Owns the watchers that track the next/previous trigger's disabled state,
 * so call it inside `setup()` (or an effect scope you dispose).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup
 */
export function useStepper(props: UseStepperProps = {}): UseStepperReturn {
  const baseId = props.baseId ?? `reka-stepper-${++stepperCount}`
  const orientation = computed<DataOrientation>(() => toValue(props.orientation) ?? 'horizontal')
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const linear = computed(() => toValue(props.linear) ?? true)

  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<number | undefined, StepperChangeReason>({
    prop: props.modelValue,
    defaultValue: props.defaultValue ?? 1,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })

  const totalStepperItems = ref<Set<HTMLElement>>(new Set())
  const totalStepperItemsArray = computed(() => Array.from(totalStepperItems.value))
  const itemDisabled = new WeakMap<HTMLElement, () => boolean>()

  const isFirstStep = computed(() => modelValue.value === 1)
  const isLastStep = computed(() => modelValue.value === totalStepperItemsArray.value.length)
  const totalSteps = computed(() => totalStepperItems.value.size)

  function changeModelValue(value: number, reason: StepperChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setState(value, reason, event)
  }

  function goToStep(step: number, reason: StepperChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    if (step > totalSteps.value)
      return false

    if (step < 1)
      return false

    // Block a step whose item is disabled. This reads the item's own state at
    // call time, not the trigger's `disabled` attribute: that attribute also
    // encodes linear reachability and only updates on the next render, so two
    // synchronous `nextStep()` calls would read it stale. (v2 read the wrong
    // index and tested the empty attribute for truthiness, so it never blocked.)
    const target = totalStepperItemsArray.value[step - 1]
    const isTargetDisabled = target && itemDisabled.get(target)
    if (isTargetDisabled ? isTargetDisabled() : target?.hasAttribute('disabled'))
      return false

    if (linear.value) {
      if (step > (modelValue.value ?? 1) + 1)
        return false
    }

    return changeModelValue(step, reason, event)
  }

  function nextStep() {
    return goToStep((modelValue.value ?? 1) + 1, 'next-step')
  }

  function prevStep() {
    return goToStep((modelValue.value ?? 1) - 1, 'prev-step')
  }

  function hasNext() {
    return (modelValue.value ?? 1) < totalSteps.value
  }

  function hasPrev() {
    return (modelValue.value ?? 1) > 1
  }

  const nextStepperItem = ref<HTMLElement | null>(null)
  const prevStepperItem = ref<HTMLElement | null>(null)
  const isNextDisabled = computed(() => nextStepperItem.value ? nextStepperItem.value.getAttribute('disabled') === '' : true)
  const isPrevDisabled = computed(() => prevStepperItem.value ? prevStepperItem.value.getAttribute('disabled') === '' : true)

  // The neighbours' `disabled` attribute is only up to date after the render
  // that follows a step change, so it is read on the next tick.
  function syncNeighbours() {
    nextTick(() => {
      nextStepperItem.value = totalStepperItemsArray.value.length && modelValue.value! < totalStepperItemsArray.value.length ? totalStepperItemsArray.value[modelValue.value!] : null
      prevStepperItem.value = totalStepperItemsArray.value.length && modelValue.value! > 1 ? totalStepperItemsArray.value[modelValue.value! - 2] : null
    })
  }
  watch(modelValue, syncNeighbours)
  watch(totalStepperItemsArray, syncNeighbours)

  const context: StepperRootContext = {
    modelValue,
    changeModelValue,
    orientation: orientation as Ref<DataOrientation>,
    dir: dir as Ref<Direction>,
    linear: linear as Ref<boolean>,
    totalStepperItems,
    itemDisabled,
  }

  const root = createPartSurface<StepperRootState>(
    () => ({ 'role': 'group', 'aria-label': 'progress' }),
    () => ({ linear: linear.value, orientation: orientation.value }),
  )

  function getItem(step: MaybeRefOrGetter<number>, options: { disabled?: MaybeRefOrGetter<boolean | undefined>, completed?: MaybeRefOrGetter<boolean | undefined> } = {}): StepperItemParts {
    const itemContext = getStepperItemContext(context, {
      step,
      disabled: options.disabled,
      completed: options.completed,
      titleId: () => `${baseId}-item-${toValue(step)}-title`,
      descriptionId: () => `${baseId}-item-${toValue(step)}-description`,
    })
    return {
      context: itemContext,
      item: getStepperItemSurface(context, itemContext),
      trigger: getStepperTriggerSurface(context, itemContext),
      title: getStepperTitleSurface(itemContext),
      description: getStepperDescriptionSurface(itemContext),
    }
  }

  return {
    modelValue,
    totalSteps,
    isFirstStep,
    isLastStep,
    isNextDisabled,
    isPrevDisabled,
    goToStep,
    nextStep,
    prevStep,
    hasNext,
    hasPrev,
    lastChangeDetails,
    isControlled,
    root,
    getItem,
    context,
  }
}
