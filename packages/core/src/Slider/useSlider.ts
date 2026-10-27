import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { SliderRootContext } from './SliderRoot.vue'
import type { SliderOrientation } from './utils'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { DataOrientation, Direction } from '@/shared/types'
import { computed, ref, toRaw, toValue } from 'vue'
import { clamp, createPartSurface, useControllableState } from '@/shared'
import {
  ARROW_KEYS,
  BACK_KEYS,
  convertValueToPercentage,
  getClosestValueIndex,
  getDecimalCount,
  getLabel,
  getNextSortedValues,
  getSliderOrientationGeometry,
  getSliderThumbTransform,
  getThumbInBoundsOffset,
  hasMinStepsBetweenValues,
  PAGE_KEYS,
  roundValue,
} from './utils'

/**
 * Why the value changed; carried as `details.reason` on every change (#2828).
 * - `'track-press'`: a pointer press anywhere in the slider except on a thumb
 *   (the track, the range or the root itself) moved the thumb closest to the
 *   pointer there. A press on a thumb only focuses it and changes nothing.
 * - `'drag'`: a pointer move while pressed, whether the press started on a thumb
 *   or on the track.
 * - `'keyboard'`: an arrow (with or without Shift), Page Up / Page Down, Home or
 *   End key on a focused thumb.
 */
export type SliderChangeReason = 'track-press' | 'drag' | 'keyboard'

type ThumbAlignment = 'contain' | 'overflow'

/** Semantic state of every Slider part: `data-disabled` and `data-orientation`. */
export type SliderRootState = { disabled: boolean, orientation: DataOrientation }
export type SliderTrackState = SliderRootState
export type SliderRangeState = SliderRootState
export type SliderThumbState = SliderRootState

function partState(context: Pick<SliderRootContext, 'disabled' | 'orientation'>): SliderRootState {
  return { disabled: context.disabled.value, orientation: context.orientation.value }
}

function isSameValues(a: number[] | null | undefined, b: number[] | null | undefined) {
  if (a === b)
    return true
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
    return false
  return a.every((value, index) => Object.is(value, b[index]))
}

/**
 * Track surface derived from the root context — shared by `useSlider().track`
 * and `SliderTrack.vue`.
 * @internal
 */
export function getSliderTrackSurface(context: Pick<SliderRootContext, 'disabled' | 'orientation'>): PartSurface<SliderTrackState> {
  return createPartSurface<SliderTrackState>(() => ({}), () => partState(context))
}

/**
 * Range surface derived from the root context and the orientation geometry —
 * shared by `useSlider().range` and `SliderRange.vue`.
 * @internal
 */
export function getSliderRangeSurface(
  context: Pick<SliderRootContext, 'disabled' | 'orientation' | 'currentModelValue' | 'min' | 'max'>,
  orientation: Pick<SliderOrientation, 'startEdge' | 'endEdge'>,
): PartSurface<SliderRangeState> {
  const percentages = computed(() => context.currentModelValue.value.map(value =>
    convertValueToPercentage(value, context.min.value, context.max.value),
  ))
  const offsetStart = computed(() => context.currentModelValue.value.length > 1 ? Math.min(...percentages.value) : 0)
  const offsetEnd = computed(() => 100 - Math.max(...percentages.value, 0))

  return createPartSurface<SliderRangeState>(
    () => ({
      style: {
        [orientation.startEdge.value]: `${offsetStart.value}%`,
        [orientation.endEdge.value]: `${offsetEnd.value}%`,
      },
    }),
    () => partState(context),
  )
}

export interface SliderThumbSurfaceOptions {
  /** The thumb's position among the thumbs (`-1` while unknown). */
  index: MaybeRefOrGetter<number>
  /** The thumb's rendered size along the orientation axis, for in-bounds offsetting. Default `0` (no offset). */
  size?: MaybeRefOrGetter<number | undefined>
  /** `false` before mount: a thumb without a value is hidden so SSR does not paint it at the wrong spot. Default `true`. */
  isMounted?: MaybeRefOrGetter<boolean>
  /** A consumer `aria-label`; wins over the generated "Minimum" / "Maximum" / "Value n of m". */
  ariaLabel?: MaybeRefOrGetter<string | undefined>
}

/**
 * Thumb surface derived from `(context, orientation, index)` — shared by
 * `useSlider().getThumbSurface` and `SliderThumbImpl.vue`. Pure: computed-only.
 * @internal
 */
export function getSliderThumbSurface(
  context: Pick<SliderRootContext, 'disabled' | 'orientation' | 'modelValue' | 'min' | 'max' | 'thumbAlignment' | 'valueIndexToChangeRef'>,
  orientation: Pick<SliderOrientation, 'startEdge' | 'direction'>,
  options: SliderThumbSurfaceOptions,
): PartSurface<SliderThumbState> {
  const index = computed(() => toValue(options.index))
  const value = computed(() => context.modelValue?.value?.[index.value])
  const percent = computed(() => value.value === undefined ? 0 : convertValueToPercentage(value.value, context.min.value ?? 0, context.max.value ?? 100))
  const label = computed(() => getLabel(index.value, context.modelValue?.value?.length ?? 0))
  const thumbInBoundsOffset = computed(() => {
    const size = toValue(options.size)
    if (context.thumbAlignment.value === 'overflow' || !size)
      return 0
    return getThumbInBoundsOffset(size, percent.value, orientation.direction.value)
  })
  const isMounted = computed(() => options.isMounted === undefined ? true : toValue(options.isMounted))

  return createPartSurface<SliderThumbState>(
    () => ({
      'role': 'slider',
      'tabindex': context.disabled.value ? undefined : 0,
      'aria-label': toValue(options.ariaLabel) || label.value,
      'aria-valuenow': value.value,
      'aria-valuemin': context.min.value,
      'aria-valuemax': context.max.value,
      'aria-orientation': context.orientation.value,
      'style': {
        transform: 'var(--reka-slider-thumb-transform)',
        position: 'absolute',
        [orientation.startEdge.value]: `calc(${percent.value}% + ${thumbInBoundsOffset.value}px)`,
        /**
         * There will be no value on initial render while we work out the index so we hide thumbs
         * without a value, otherwise SSR will render them in the wrong position before they
         * snap into the correct position during hydration which would be visually jarring for
         * slower connections.
         */
        display: !isMounted.value && value.value === undefined ? 'none' : undefined,
      },
      'onFocus': () => {
        context.valueIndexToChangeRef.value = index.value
      },
    }),
    () => partState(context),
  )
}

export interface UseSliderProps {
  /**
   * Controlled value. A getter/ref resolving to `undefined` is uncontrolled; a
   * writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<number[] | null | undefined>
  /** Initial value when uncontrolled. @defaultValue `[0]` */
  defaultValue?: MaybeRefOrGetter<number[] | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `'horizontal'` */
  orientation?: MaybeRefOrGetter<DataOrientation | undefined>
  /** Reading direction; the SFC resolves it through `ConfigProvider`. @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  inverted?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `0` */
  min?: MaybeRefOrGetter<number | undefined>
  /** @defaultValue `100` */
  max?: MaybeRefOrGetter<number | undefined>
  /** @defaultValue `1` */
  step?: MaybeRefOrGetter<number | undefined>
  /** @defaultValue `0` */
  minStepsBetweenThumbs?: MaybeRefOrGetter<number | undefined>
  /** @defaultValue `'contain'` */
  thumbAlignment?: MaybeRefOrGetter<ThumbAlignment | undefined>
  /** Component `emit`; receives `beforeUpdate:modelValue`, `valueCommit` and `update:modelValue`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: number[], details: ChangeEventDetails<SliderChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: number[], details: ChangeEventDetails<SliderChangeReason>) => void
  /** Called at the end of an interaction that changed the value (pointer release, each keyboard step). */
  onValueCommit?: (value: number[]) => void
}

export interface UseSliderReturn {
  modelValue: ComputedRef<number[] | null | undefined>
  /** The model as an array (`[]` while the model is `null`). */
  currentModelValue: ComputedRef<number[]>
  disabled: ComputedRef<boolean>
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<SliderChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** Index of the thumb the next keyboard step or drag moves. */
  valueIndexToChangeRef: Ref<number>
  /** Thumb elements, in DOM order; a changed value focuses its thumb. Standalone consumers push their thumbs here. */
  thumbElements: Ref<HTMLElement[]>
  /**
   * Snap `value` to the step, clamp it, and write it at `atIndex` (re-sorted).
   * With `commit`, `valueCommit` fires before `update:modelValue`, and only
   * when the change was not cancelled. Returns `false` when unchanged or cancelled.
   */
  updateValues: (value: number, atIndex: number, options?: { commit?: boolean, reason?: SliderChangeReason | BaseChangeReason, event?: Event }) => boolean
  /** A pointer press at `value` on the track: moves the closest thumb. */
  startSlide: (value: number, event?: Event) => void
  /** A pointer move at `value` while pressed. */
  moveSlide: (value: number, event?: Event) => void
  /** The pointer was released: emits `valueCommit` when the drag changed the value. */
  endSlide: () => void
  /** The orientation geometry (edges, direction) the thumb and range surfaces position against. */
  orientation: SliderOrientation
  /** The slider element surface: `aria-disabled`, the thumb transform, and the keyboard and pointer-down handlers. */
  root: PartSurface<SliderRootState>
  track: PartSurface<SliderTrackState>
  range: PartSurface<SliderRangeState>
  /** Per-thumb surface; see `SliderThumbSurfaceOptions`. */
  getThumbSurface: (options: SliderThumbSurfaceOptions) => PartSurface<SliderThumbState>
  context: SliderRootContext
}

/**
 * Headless Slider logic. The `.vue` shells compose this. A standalone consumer
 * gets the model, keyboard stepping, aria and positioning; mapping a pointer
 * position to a value needs the slider's layout, so it stays in the
 * `SliderHorizontal` / `SliderVertical` shells — a standalone consumer computes
 * the value itself and calls `startSlide` / `moveSlide` / `endSlide`.
 *
 * Event order matches v2: a keyboard step emits `valueCommit` before
 * `update:modelValue` (ColorSlider relies on it). A cancelled step emits
 * neither and does not move focus.
 *
 * SSR-safe (no `document` at call scope) and callable outside `setup()`
 * (computed-only).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useSlider(props: UseSliderProps = {}): UseSliderReturn {
  const min = computed(() => toValue(props.min) ?? 0)
  const max = computed(() => toValue(props.max) ?? 100)
  const step = computed(() => toValue(props.step) ?? 1)
  const minStepsBetweenThumbs = computed(() => toValue(props.minStepsBetweenThumbs) ?? 0)
  const orientation = computed<DataOrientation>(() => toValue(props.orientation) ?? 'horizontal')
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const inverted = computed(() => toValue(props.inverted) ?? false)
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const thumbAlignment = computed<ThumbAlignment>(() => toValue(props.thumbAlignment) ?? 'contain')

  const valueIndexToChangeRef = ref(0)
  const thumbElements = ref<HTMLElement[]>([]) as Ref<HTMLElement[]>

  // The side effects v2 ran before writing the model (`valueCommit` for a
  // keyboard step, then focusing the moved thumb). They run from the
  // `update:` phase — after `beforeUpdate` could cancel, before `update:modelValue`.
  let pending: { commit: number[] | null, focusIndex: number } | null = null
  function flushPending() {
    if (!pending)
      return
    const { commit, focusIndex } = pending
    pending = null
    if (commit) {
      props.onValueCommit?.(commit)
      props.emit?.('valueCommit', commit)
    }
    thumbElements.value[focusIndex]?.focus()
  }

  // Wrap only the callbacks the caller passed, so a bare writable `Ref` stays ref-owned.
  const emit = props.emit
    ? (event: string, ...args: any[]) => {
        if (event === 'update:modelValue')
          flushPending()
        props.emit!(event, ...args)
      }
    : undefined
  const onUpdate = props.onUpdate
    ? (value: number[], details: ChangeEventDetails<SliderChangeReason>) => {
        flushPending()
        props.onUpdate!(value, details)
      }
    : undefined

  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<number[] | null | undefined, SliderChangeReason>({
    prop: props.modelValue,
    defaultValue: () => toValue(props.defaultValue) ?? [0],
    name: 'modelValue',
    emit,
    onBeforeUpdate: props.onBeforeUpdate as ((value: number[] | null | undefined, details: ChangeEventDetails<SliderChangeReason>) => void) | undefined,
    onUpdate: onUpdate as ((value: number[] | null | undefined, details: ChangeEventDetails<SliderChangeReason>) => void) | undefined,
    isEqual: isSameValues,
  })

  const currentModelValue = computed(() => Array.isArray(modelValue.value) ? [...modelValue.value] : [])
  let valuesBeforeSlideStart = currentModelValue.value

  function updateValues(value: number, atIndex: number, options: { commit?: boolean, reason?: SliderChangeReason | BaseChangeReason, event?: Event } = {}): boolean {
    const decimalCount = getDecimalCount(step.value)
    const snapToStep = roundValue(Math.round((value - min.value) / step.value) * step.value + min.value, decimalCount)
    const nextValue = clamp(snapToStep, min.value, max.value)

    const nextValues = getNextSortedValues(currentModelValue.value, nextValue, atIndex)

    if (!hasMinStepsBetweenValues(nextValues, minStepsBetweenThumbs.value * step.value))
      return false

    valueIndexToChangeRef.value = nextValues.indexOf(nextValue)
    const hasChanged = String(nextValues) !== String(modelValue.value)
    if (!hasChanged)
      return false

    pending = { commit: options.commit ? nextValues : null, focusIndex: valueIndexToChangeRef.value }
    const changed = setState(nextValues, options.reason ?? 'imperative-action', options.event)
    if (changed) {
      flushPending() // no listeners to hook: run the side effects now
    }
    else {
      // Cancelled in `beforeUpdate`: the values did not move, so the thumb
      // that was driven keeps driving. Without this a cancelled step that would
      // cross another thumb hands the keyboard/drag over to that thumb.
      valueIndexToChangeRef.value = atIndex
    }
    pending = null
    return changed
  }

  function startSlide(value: number, event?: Event) {
    if (disabled.value)
      return
    const closestIndex = getClosestValueIndex(currentModelValue.value, value)
    updateValues(value, closestIndex, { reason: 'track-press', event })
  }

  function moveSlide(value: number, event?: Event) {
    if (disabled.value)
      return
    updateValues(value, valueIndexToChangeRef.value, { reason: 'drag', event })
  }

  function endSlide() {
    if (disabled.value)
      return
    const prevValue = valuesBeforeSlideStart[valueIndexToChangeRef.value]
    const nextValue = currentModelValue.value[valueIndexToChangeRef.value]
    if (nextValue !== prevValue) {
      const committed = toRaw(currentModelValue.value)
      props.onValueCommit?.(committed)
      props.emit?.('valueCommit', committed)
    }
  }

  const orientationGeometry = computed(() => getSliderOrientationGeometry(orientation.value, dir.value, inverted.value))
  const orientationContext: SliderOrientation = {
    startEdge: computed(() => orientationGeometry.value.startEdge),
    endEdge: computed(() => orientationGeometry.value.endEdge),
    direction: computed(() => orientationGeometry.value.direction),
    get size() {
      return orientationGeometry.value.size
    },
  }

  function onKeydown(event: KeyboardEvent) {
    // Ported from SliderImpl + SliderHorizontal/SliderVertical: the key's default
    // is prevented even while disabled.
    const reason = 'keyboard'
    if (event.key === 'Home') {
      if (!disabled.value)
        updateValues(min.value, 0, { commit: true, reason, event })
      // Prevent scrolling to page start
      event.preventDefault()
    }
    else if (event.key === 'End') {
      if (!disabled.value)
        updateValues(max.value, currentModelValue.value.length - 1, { commit: true, reason, event })
      // Prevent scrolling to page end
      event.preventDefault()
    }
    else if (PAGE_KEYS.concat(ARROW_KEYS).includes(event.key)) {
      if (!disabled.value) {
        const isBackKey = BACK_KEYS[orientationGeometry.value.slideDirection].includes(event.key)
        const direction = isBackKey ? -1 : 1
        const isPageKey = PAGE_KEYS.includes(event.key)
        const isSkipKey = isPageKey || (event.shiftKey && ARROW_KEYS.includes(event.key))
        const multiplier = isSkipKey ? 10 : 1
        const atIndex = valueIndexToChangeRef.value
        const value = currentModelValue.value[atIndex]
        const stepInDirection = step.value * multiplier * direction
        updateValues(value + stepInDirection, atIndex, { commit: true, reason, event })
      }
      // Prevent scrolling for directional key presses
      event.preventDefault()
    }
  }

  const context: SliderRootContext = {
    modelValue,
    currentModelValue,
    valueIndexToChangeRef,
    thumbElements,
    orientation,
    min,
    max,
    disabled,
    thumbAlignment,
  }

  const root = createPartSurface<SliderRootState>(
    () => ({
      'aria-disabled': disabled.value,
      'dir': dir.value,
      'style': {
        '--reka-slider-thumb-transform': getSliderThumbTransform(orientation.value, orientationGeometry.value.isSlidingFromStart, thumbAlignment.value),
      },
      'onKeydown': onKeydown,
      // Records where a drag started, so `endSlide` can tell whether it changed anything.
      'onPointerdown': () => {
        if (!disabled.value)
          valuesBeforeSlideStart = currentModelValue.value
      },
    }),
    () => partState(context),
  )

  return {
    modelValue,
    currentModelValue,
    disabled,
    lastChangeDetails,
    isControlled,
    valueIndexToChangeRef,
    thumbElements,
    updateValues,
    startSlide,
    moveSlide,
    endSlide,
    orientation: orientationContext,
    root,
    track: getSliderTrackSurface(context),
    range: getSliderRangeSurface(context, orientationContext),
    getThumbSurface: options => getSliderThumbSurface(context, orientationContext, options),
    context,
  }
}
