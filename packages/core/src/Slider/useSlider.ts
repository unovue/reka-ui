import type { ComputedRef, MaybeRefOrGetter, Ref, WatchHandle } from 'vue'
import type { SliderRootContext } from './SliderRoot.vue'
import type { SliderOrientation } from './utils'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { DataOrientation, Direction } from '@/shared/types'
import { computed, getCurrentScope, ref, toValue, watch } from 'vue'
import { clamp, createPartSurface, fieldRef, getDecimalCount, getterRef, useControllableState, useTranslations } from '@/shared'
import { resolveDirection } from '@/shared/useDirection'
import {
  ARROW_KEYS,
  BACK_KEYS,
  convertValueToPercentage,
  getClosestValueIndex,
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
 *   or on the track. Also a `min` / `max` change during the drag, which moves
 *   any value outside the new bounds onto the nearest bound.
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
  // One computed for both offsets (they share the percentages).
  const offsets = computed(() => {
    const values = context.currentModelValue.value
    const percentages = values.map(value => convertValueToPercentage(value, context.min.value, context.max.value))
    return {
      start: values.length > 1 ? Math.min(...percentages) : 0,
      end: 100 - Math.max(...percentages, 0),
    }
  })

  return createPartSurface<SliderRangeState>(
    () => ({
      style: {
        [orientation.startEdge.value]: `${offsets.value.start}%`,
        [orientation.endEdge.value]: `${offsets.value.end}%`,
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
 * `useSlider().getThumbSurface` and `SliderThumb.vue`. Pure: computed-only.
 * @internal
 */
export function getSliderThumbSurface(
  context: Pick<SliderRootContext, 'disabled' | 'orientation' | 'modelValue' | 'min' | 'max' | 'thumbAlignment' | 'valueIndexToChangeRef' | 't'>,
  orientation: Pick<SliderOrientation, 'startEdge' | 'direction'>,
  options: SliderThumbSurfaceOptions,
): PartSurface<SliderThumbState> {
  // Plain reads, evaluated with the surface (once per render): each is a few
  // property reads, cheaper than a computed per value per thumb.
  const getIndex = () => toValue(options.index)
  function onFocus() {
    // A thumb that already left the collection (its template ref is null
    // during an out-in leave) has no index: keep the active one valid.
    const index = getIndex()
    if (index >= 0)
      context.valueIndexToChangeRef.value = index
  }

  return createPartSurface<SliderThumbState>(
    () => {
      const index = getIndex()
      const value = context.modelValue?.value?.[index]
      const percent = value === undefined ? 0 : convertValueToPercentage(value, context.min.value ?? 0, context.max.value ?? 100)
      const size = toValue(options.size)
      const thumbInBoundsOffset = context.thumbAlignment.value === 'overflow' || !size
        ? 0
        : getThumbInBoundsOffset(size, percent, orientation.direction.value)
      const isMounted = options.isMounted === undefined ? true : toValue(options.isMounted)
      return {
        'role': 'slider',
        'tabindex': context.disabled.value ? undefined : 0,
        'aria-disabled': context.disabled.value || undefined,
        'aria-label': toValue(options.ariaLabel) || getLabel(index, context.modelValue?.value?.length ?? 0, context.t),
        'aria-valuenow': value,
        'aria-valuemin': context.min.value,
        'aria-valuemax': context.max.value,
        'aria-orientation': context.orientation.value,
        'style': {
          transform: 'var(--reka-slider-thumb-transform)',
          position: 'absolute',
          [orientation.startEdge.value]: `calc(${percent}% + ${thumbInBoundsOffset}px)`,
          /**
           * There will be no value on initial render while we work out the index so we hide thumbs
           * without a value, otherwise SSR will render them in the wrong position before they
           * snap into the correct position during hydration which would be visually jarring for
           * slower connections.
           */
          display: !isMounted && value === undefined ? 'none' : undefined,
        },
        'onFocus': onFocus,
      }
    },
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
  /** Reading direction. Falls back to the nearest `ConfigProvider`, then `'ltr'`. */
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
  /**
   * A pointer press at `value` on the track: moves the closest thumb. Each
   * pointer (by the event's `pointerId`) has its own slide; a call without a
   * pointer event drives the one slide that is open.
   */
  startSlide: (value: number, event?: Event) => void
  /**
   * A pointer move at `value` while pressed: moves the thumb this pointer
   * drives. From the first `startSlide` / `moveSlide` until the last pointer's
   * `endSlide`, every value is kept within `min` / `max`, including when they
   * change mid-drag.
   */
  moveSlide: (value: number, event?: Event) => void
  /** The pointer was released: emits `valueCommit` when this pointer's slide changed the value. */
  endSlide: (event?: Event) => void
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
 * position to a value needs the slider's layout, so it stays in
 * `useSliderPointer` — a standalone consumer computes the value itself and calls
 * `startSlide` / `moveSlide` / `endSlide`.
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
  // Getter refs, not computeds: each is one prop read, tracked by the reader.
  const min = getterRef(() => toValue(props.min) ?? 0)
  const max = getterRef(() => toValue(props.max) ?? 100)
  const step = getterRef(() => toValue(props.step) ?? 1)
  const minStepsBetweenThumbs = getterRef(() => toValue(props.minStepsBetweenThumbs) ?? 0)
  const orientation = getterRef<DataOrientation>(() => toValue(props.orientation) ?? 'horizontal')
  const disabled = getterRef(() => toValue(props.disabled) ?? false)
  const inverted = getterRef(() => toValue(props.inverted) ?? false)
  const dir = resolveDirection(props.dir)
  const thumbAlignment = getterRef<ThumbAlignment>(() => toValue(props.thumbAlignment) ?? 'contain')

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

  function updateValues(value: number, atIndex: number, options: { commit?: boolean, reason?: SliderChangeReason | BaseChangeReason, event?: Event, clampAll?: boolean } = {}): boolean {
    // Steps count from `min`, so a fractional `min` needs its digits kept too.
    const decimalCount = Math.max(getDecimalCount(min.value), getDecimalCount(step.value))
    const snapToStep = roundValue(Math.round((value - min.value) / step.value) * step.value + min.value, decimalCount)
    const nextValue = clamp(snapToStep, min.value, max.value)

    const values = options.clampAll ? clampToBounds(currentModelValue.value) : currentModelValue.value
    const nextValues = getNextSortedValues(values, nextValue, atIndex)

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

  /**
   * Every value clamped to `min` / `max`. When the clamp moved a value and the
   * thumbs end up closer than `minStepsBetweenThumbs`, they are pushed apart
   * inside the range, each as little as it takes, the way a drag keeps them
   * apart. A range too narrow to fit that spacing keeps the clamped values:
   * every value stays within the bounds, and a move that would bring two
   * thumbs closer still is refused until the range is wide enough again.
   */
  function clampToBounds(values: number[]) {
    const clamped = values.map(value => clamp(value, min.value, max.value))
    const gap = minStepsBetweenThumbs.value * step.value
    if (isSameValues(values, clamped) || hasMinStepsBetweenValues(clamped, gap))
      return clamped
    // Push up from `min`, then down from `max`. Rounded like a step, so the
    // gap is not lost to floating point.
    const decimalCount = Math.max(getDecimalCount(min.value), getDecimalCount(max.value), getDecimalCount(step.value))
    const spaced = [...clamped]
    for (let i = 1; i < spaced.length; i++)
      spaced[i] = Math.max(spaced[i], roundValue(spaced[i - 1] + gap, decimalCount))
    for (let i = spaced.length - 1; i >= 0; i--)
      spaced[i] = Math.min(spaced[i], i === spaced.length - 1 ? max.value : roundValue(spaced[i + 1] - gap, decimalCount))
    return spaced[0] >= min.value ? spaced : clamped
  }

  /** One pressed pointer's slide. */
  interface PointerSlide {
    /** The values its slide started from, to tell on release whether it changed them. */
    start: number[]
    /** The thumb this pointer drives. */
    index: number
    /** Whether a change made during this slide was accepted: another pointer's change is not its to commit. */
    changed: boolean
    /** The bounds when the slide started: a press that moves nothing, under unchanged bounds, changes nothing. */
    bounds: [number, number]
  }
  // One entry per pressed pointer (by `pointerId`), so a second pointer
  // pressing or lifting leaves the first one's slide as it was. A call
  // without a pointer event uses `null`.
  const slides = new Map<number | null, PointerSlide>()
  function slideKey(event?: Event): number | null {
    const pointerId = (event as PointerEvent | undefined)?.pointerId
    return typeof pointerId === 'number' ? pointerId : null
  }
  function getSlide(event?: Event): PointerSlide | undefined {
    const key = slideKey(event)
    const slide = slides.get(key)
    if (slide || slides.size !== 1)
      return slide
    // A standalone caller may pass the pointer event to some calls only: a
    // call or a slide without a pointer goes with the one slide that is open.
    const [[openKey, open]] = slides
    return key === null || openKey === null ? open : undefined
  }
  function openSlide(event?: Event): PointerSlide {
    const existing = getSlide(event)
    if (existing)
      return existing
    const slide: PointerSlide = { start: currentModelValue.value, index: valueIndexToChangeRef.value, changed: false, bounds: [min.value, max.value] }
    if (!slides.size)
      trackBounds()
    slides.set(slideKey(event), slide)
    return slide
  }

  // Outside a drag the model is never clamped: a programmatic value outside the
  // bounds stays as it is. During one, the values the slider shows, emits and
  // commits stay within the current bounds, so a bounds change moves them.
  // Started by the first pointer's slide, in the caller's scope, and stopped
  // when the last one ends, so an idle slider holds no watcher.
  const scope = getCurrentScope()
  let stopBoundsWatch: WatchHandle | undefined
  /** `true` when the model was out of bounds and the move into range was accepted. */
  function clampModelToBounds(): boolean {
    const values = currentModelValue.value
    const clamped = clampToBounds(values)
    return !isSameValues(values, clamped) && setState(clamped, 'drag')
  }
  function trackBounds() {
    if (stopBoundsWatch || (scope && !scope.active))
      return
    const start = () => watch(() => [min.value, max.value], () => {
      // A slider disabled mid-drag takes no more changes from it. A move into
      // range happens during every open slide, so each one commits it.
      if (!disabled.value && clampModelToBounds())
        slides.forEach(slide => slide.changed = true)
    })
    stopBoundsWatch = scope ? scope.run(start) : start()
  }

  function startSlide(value: number, event?: Event) {
    if (disabled.value)
      return
    const slide = openSlide(event)
    const closestIndex = getClosestValueIndex(currentModelValue.value, value)
    if (updateValues(value, closestIndex, { reason: 'track-press', event, clampAll: true }))
      slide.changed = true
    slide.index = valueIndexToChangeRef.value
  }

  function moveSlide(value: number, event?: Event) {
    if (disabled.value)
      return
    const slide = openSlide(event)
    // Another pointer may have moved the active thumb since; this pointer drives its own.
    const focusedIndex = valueIndexToChangeRef.value
    valueIndexToChangeRef.value = slide.index
    const changed = updateValues(value, slide.index, { reason: 'drag', event, clampAll: true })
    // A crossing hands the pointer the thumb's new place.
    slide.index = valueIndexToChangeRef.value
    if (changed)
      slide.changed = true
    // A move that changes nothing focuses nothing, so the keyboard stays where it was.
    else
      valueIndexToChangeRef.value = focusedIndex
  }

  function endSlide(event?: Event) {
    const slide = getSlide(event)
    if (!slide)
      return
    slides.forEach((open, key) => open === slide && slides.delete(key))
    // Bounds are tracked until the last pointer lifts.
    if (!slides.size) {
      stopBoundsWatch?.()
      stopBoundsWatch = undefined
    }
    if (disabled.value)
      return
    const boundsChanged = slide.bounds[0] !== min.value || slide.bounds[1] !== max.value
    // A bounds change and the release can land in one tick, before the watcher
    // runs. A controlled model can still hold the old values after an accepted
    // move into range, so that move counts as a change on its own.
    const clamped = boundsChanged && clampModelToBounds()
    if (clamped)
      slides.forEach(open => open.changed = true)
    // Every thumb: a bounds change can move one that was not dragged.
    if (clamped || (slide.changed && !isSameValues(currentModelValue.value, slide.start))) {
      // Still clamped: `beforeUpdate` can veto the model's move into range.
      const committed = clampToBounds(currentModelValue.value)
      props.onValueCommit?.(committed)
      props.emit?.('valueCommit', committed)
    }
  }

  const orientationGeometry = computed(() => getSliderOrientationGeometry(orientation.value, dir.value, inverted.value))
  const orientationContext: SliderOrientation = {
    // Fields of the one geometry computed, not a computed each.
    startEdge: fieldRef(orientationGeometry, 'startEdge'),
    endEdge: fieldRef(orientationGeometry, 'endEdge'),
    direction: fieldRef(orientationGeometry, 'direction'),
    get size() {
      return orientationGeometry.value.size
    },
  }

  function onKeydown(event: KeyboardEvent) {
    // The key's default is prevented even while disabled.
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

  const t = useTranslations()
  const context: SliderRootContext = {
    t,
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
      'onPointerdown': onPointerdown,
    }),
    () => partState(context),
  )
  // Records where a pointer's slide started, so `endSlide` can tell whether it
  // changed anything. A press on a thumb starts a slide too, before any value
  // moves. This runs after a press on the track: a press the model already
  // shows becomes part of the starting values, as it always has; one a
  // controlled parent has not rendered yet still counts as this slide's change.
  function onPointerdown(event?: Event) {
    if (disabled.value)
      return
    const slide = openSlide(event)
    if (!isSameValues(currentModelValue.value, slide.start)) {
      slide.start = currentModelValue.value
      slide.changed = false
    }
    slide.index = valueIndexToChangeRef.value
  }
  // Built on first read: the Root SFC never reads them (Track and Range build their own).
  let track: PartSurface<SliderTrackState> | undefined
  let range: PartSurface<SliderRangeState> | undefined

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
    get track() {
      return track ??= getSliderTrackSurface(context)
    },
    get range() {
      return range ??= getSliderRangeSurface(context, orientationContext)
    },
    getThumbSurface: options => getSliderThumbSurface(context, orientationContext, options),
    context,
  }
}
