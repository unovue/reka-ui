<script lang="ts">
import type { Ref } from 'vue'
import type { Direction, FormFieldProps } from '../shared/types'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { useCollection, useCollectionSlot } from '@/Collection'
import { createRekaContext, useDirection, useFormControl, useForwardElement } from '@/shared'

/**
 * Why the value changed; carried as `details.reason` on every change.
 * - `'track-press'`: a pointer press anywhere in the slider area except on a
 *   thumb moved the thumb closest to the pointer there. A press on a thumb only
 *   focuses it and changes nothing.
 * - `'drag'`: a pointer move while pressed, whether the press started on a thumb
 *   or on the area.
 * - `'keyboard'`: an arrow (with or without Shift), Page Up / Page Down, Home or
 *   End key on a focused thumb.
 */
export type SliderAreaChangeReason = 'track-press' | 'drag' | 'keyboard'

type ThumbAlignment = 'contain' | 'overflow'

export interface SliderAreaRootProps extends PrimitiveProps, FormFieldProps {
  /** The value of the slider area when initially rendered. Use when you do not need to control the state. */
  defaultValue?: number[][]
  /** The controlled value of the slider area. Can be bind as `v-model`. */
  modelValue?: number[][] | null
  /** When `true`, prevents the user from interacting with the slider area. */
  disabled?: boolean
  /** The reading direction. If omitted, inherits globally from `ConfigProvider` or assumes LTR. */
  dir?: Direction
  /** Whether the X axis is visually inverted. */
  invertedX?: boolean
  /** Whether the Y axis is visually inverted. */
  invertedY?: boolean
  /** The minimum value for the X axis. */
  minX?: number
  /** The maximum value for the X axis. */
  maxX?: number
  /** The minimum value for the Y axis. */
  minY?: number
  /** The maximum value for the Y axis. */
  maxY?: number
  /** The stepping interval for the X axis. */
  stepX?: number
  /** The stepping interval for the Y axis. */
  stepY?: number
  /** The minimum permitted steps between multiple thumbs on the X axis. */
  minXStepsBetweenThumbs?: number
  /** The minimum permitted steps between multiple thumbs on the Y axis. */
  minYStepsBetweenThumbs?: number
  /**
   * The alignment of the slider area thumb.
   * - `contain`: thumbs will be contained within the bounds of the track.
   * - `overflow`: thumbs will not be bound by the track. No extra offset will be added.
   * @defaultValue 'overflow'
   */
  thumbAlignment?: ThumbAlignment
}

export type SliderAreaRootEmits = {
  /** Event handler called before the slider area value changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [payload: number[][], details: ChangeEventDetails<SliderAreaChangeReason>]
  /** Event handler called when the slider area value changes */
  'update:modelValue': [payload: number[][], details: ChangeEventDetails<SliderAreaChangeReason>]
  /** Event handler called when the value changes at the end of an interaction. */
  'valueCommit': [payload: number[][]]
}

export interface SliderAreaRootContext {
  disabled: Ref<boolean>
  minX: Ref<number>
  maxX: Ref<number>
  minY: Ref<number>
  maxY: Ref<number>
  modelValue?: Readonly<Ref<number[][] | null | undefined>>
  currentModelValue: Ref<number[][]>
  valueIndexToChangeRef: Ref<number>
  isSlidingFromLeft: Ref<boolean>
  isSlidingFromTop: Ref<boolean>
  thumbAlignment: Ref<ThumbAlignment>
}

export const [injectSliderAreaRootContext, provideSliderAreaRootContext]
  = createRekaContext<SliderAreaRootContext>('SliderAreaRoot')
</script>

<script setup lang="ts">
import { computed, ref, toRaw, toRefs } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { formResetBinder } from '@/shared/formReset'
import { resetControllableState, useControllableState } from '@/shared/useControllableState'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { ARROW_KEYS, hasMinStepsBetweenValues, linearScale, PAGE_KEYS } from '../Slider/utils'
import { getClosestThumbIndex, snapToStep } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SliderAreaRootProps>(), {
  minX: 0,
  maxX: 100,
  minY: 0,
  maxY: 100,
  stepX: 1,
  stepY: 1,
  disabled: false,
  defaultValue: () => [[0, 0]] as number[][],
  invertedX: false,
  invertedY: false,
  minXStepsBetweenThumbs: 0,
  minYStepsBetweenThumbs: 0,
  thumbAlignment: 'overflow',
  as: 'div',
})
const emits = defineEmits<SliderAreaRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current slider area values */
    modelValue: number[][] | null
  }) => any
}>()
const emit = emits as (event: string, ...args: any[]) => void

const { minX, maxX, minY, maxY, stepX, stepY, minXStepsBetweenThumbs, minYStepsBetweenThumbs, disabled, thumbAlignment, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const isFormControl = useFormControl(currentElement)
const { getItems } = useCollection({ isProvider: true })
useCollectionSlot(currentElement)

// Thumb indexes come from the collection's DOM order, so look thumbs up by that same order.
function getThumbElements(): HTMLElement[] {
  return getItems(true).map(item => item.ref)
}

function valuesEqual(a: number[][] | null | undefined, b: number[][] | null | undefined): boolean {
  if (a === b)
    return true
  if (!a || !b || a.length !== b.length)
    return false
  return a.every((v, i) => v[0] === b[i][0] && v[1] === b[i][1])
}

// What v2 did before writing the model (`valueCommit` for a keyboard step, then
// focusing the moved thumb). It runs from the `update:` phase: after
// `beforeUpdate:modelValue` could cancel, before `update:modelValue`. It
// belongs to the value it was proposed with: another change made from a
// `beforeUpdate` listener (a form reset) does not run it.
let pending: { value: number[][], commit: boolean, focusIndex: number } | null = null
function flushPending(value: unknown) {
  if (!pending || pending.value !== value)
    return
  const { commit, focusIndex } = pending
  pending = null
  if (commit)
    emits('valueCommit', value as number[][])
  getThumbElements()[focusIndex]?.focus()
}

const { state: modelValue, setState, isControlled } = useControllableState<number[][] | null | undefined, SliderAreaChangeReason>({
  prop: () => props.modelValue,
  defaultValue: props.defaultValue,
  name: 'modelValue',
  emit: (event: string, ...args: any[]) => {
    if (event === 'update:modelValue')
      flushPending(args[0])
    emit(event, ...args)
  },
  isEqual: valuesEqual,
})

// A native reset of the owning form puts the value back to `defaultValue`.
function onFormReset(event: Event) { resetControllableState(isControlled, event) }
const bindFormReset = formResetBinder(onFormReset)

const currentModelValue = computed(() => Array.isArray(modelValue.value) ? [...modelValue.value] : [])

const valueIndexToChangeRef = ref(0)
const valuesBeforeSlideStartRef = ref(currentModelValue.value)
const rectRef = ref<DOMRect>()
// Each pressed pointer keeps the point of the thumb it grabbed, so one pointer
// ending its slide leaves another one's grab where it was.
const offsetPositions = new Map<number, { x: number, y: number }>()

// Determine axis directions
const isSlidingFromLeft = computed(() => {
  return (dir.value !== 'rtl' && !props.invertedX) || (dir.value !== 'ltr' && props.invertedX)
})
const isSlidingFromTop = computed(() => !props.invertedY)

function getPointFromPointerEvent(event: PointerEvent, slideStart?: boolean): number[] {
  const rect = rectRef.value || currentElement.value!.getBoundingClientRect()
  rectRef.value = rect

  const thumb = getThumbElements()[valueIndexToChangeRef.value]
  const thumbWidth = thumbAlignment.value === 'contain' && thumb ? thumb.clientWidth : 0
  const thumbHeight = thumbAlignment.value === 'contain' && thumb ? thumb.clientHeight : 0

  // Calculate grab offset on first slideMove after a thumb-initiated drag
  let offsetPosition = offsetPositions.get(event.pointerId)
  if (!offsetPosition && !slideStart && thumbAlignment.value === 'contain' && thumb) {
    const thumbRect = thumb.getBoundingClientRect()
    offsetPosition = {
      x: event.clientX - thumbRect.left,
      y: event.clientY - thumbRect.top,
    }
    offsetPositions.set(event.pointerId, offsetPosition)
  }

  const inputX: [number, number] = [0, rect.width - thumbWidth]
  const outputX: [number, number] = isSlidingFromLeft.value ? [minX.value, maxX.value] : [maxX.value, minX.value]
  const scaleX = linearScale(inputX, outputX)

  const inputY: [number, number] = [0, rect.height - thumbHeight]
  const outputY: [number, number] = isSlidingFromTop.value ? [minY.value, maxY.value] : [maxY.value, minY.value]
  const scaleY = linearScale(inputY, outputY)

  const posX = slideStart
    ? event.clientX - rect.left - thumbWidth / 2
    : event.clientX - rect.left - (offsetPosition?.x ?? 0)
  const posY = slideStart
    ? event.clientY - rect.top - thumbHeight / 2
    : event.clientY - rect.top - (offsetPosition?.y ?? 0)

  return [scaleX(posX), scaleY(posY)]
}

function handleSlideStart(event: PointerEvent) {
  const point = getPointFromPointerEvent(event, true)
  const closestIndex = getClosestThumbIndex(currentModelValue.value, point, minX.value, maxX.value, minY.value, maxY.value)
  if (closestIndex === -1)
    return
  updateValues(point, closestIndex, { reason: 'track-press', event })
}

function handleSlideMove(event: PointerEvent) {
  const point = getPointFromPointerEvent(event)
  updateValues(point, valueIndexToChangeRef.value, { reason: 'drag', event })
}

// Commits each pointer's slide when it ends, as the Slider does.
function handleSlideEnd() {
  if (disabled.value)
    return
  const prevValue = valuesBeforeSlideStartRef.value[valueIndexToChangeRef.value]
  const nextValue = currentModelValue.value[valueIndexToChangeRef.value]
  const hasChanged = prevValue?.[0] !== nextValue?.[0] || prevValue?.[1] !== nextValue?.[1]
  if (hasChanged)
    emits('valueCommit', toRaw(currentModelValue.value))
}

function clampAxis(nextValue: number, axisIndex: number, atIndex: number, minGap: number): number {
  if (minGap <= 0)
    return nextValue
  const testValues = currentModelValue.value.map((v, i) => i === atIndex ? nextValue : v[axisIndex])
  if (!hasMinStepsBetweenValues([...testValues].sort((a, b) => a - b), minGap))
    return currentModelValue.value[atIndex][axisIndex]
  return nextValue
}

function updateValues(point: number[], atIndex: number, options: { commit?: boolean, reason?: SliderAreaChangeReason | BaseChangeReason, event?: Event } = {}) {
  const nextX = snapToStep(point[0], minX.value, maxX.value, stepX.value)
  const nextY = snapToStep(point[1], minY.value, maxY.value, stepY.value)

  const finalX = clampAxis(nextX, 0, atIndex, minXStepsBetweenThumbs.value * stepX.value)
  const finalY = clampAxis(nextY, 1, atIndex, minYStepsBetweenThumbs.value * stepY.value)

  const nextValues = [...currentModelValue.value]
  nextValues[atIndex] = [finalX, finalY]

  const previousIndex = valueIndexToChangeRef.value
  valueIndexToChangeRef.value = atIndex

  if (valuesEqual(modelValue.value, nextValues))
    return

  pending = { value: nextValues, commit: !!options.commit, focusIndex: atIndex }
  const changed = setState(nextValues, options.reason ?? 'imperative-action', options.event)
  pending = null
  // Cancelled: no thumb moved or took focus, so the keyboard stays on the thumb it was on.
  if (!changed)
    valueIndexToChangeRef.value = previousIndex
}

type StepAxis = 'x' | 'y'

const STEP_KEY_DELTAS: Record<string, { axis: StepAxis, sign: number }> = {
  ArrowRight: { axis: 'x', sign: 1 },
  ArrowLeft: { axis: 'x', sign: -1 },
  ArrowDown: { axis: 'y', sign: 1 },
  ArrowUp: { axis: 'y', sign: -1 },
  PageDown: { axis: 'y', sign: 1 },
  PageUp: { axis: 'y', sign: -1 },
}

function handleStepKeyDown(event: KeyboardEvent) {
  const delta = STEP_KEY_DELTAS[event.key]
  if (!delta)
    return

  const atIndex = valueIndexToChangeRef.value
  const value = currentModelValue.value[atIndex]
  if (!value)
    return

  const isPageKey = PAGE_KEYS.includes(event.key)
  const isSkipKey = isPageKey || (event.shiftKey && ARROW_KEYS.includes(event.key))
  const multiplier = isSkipKey ? 10 : 1

  const dirMultiplier = delta.axis === 'x'
    ? (isSlidingFromLeft.value ? 1 : -1)
    : (isSlidingFromTop.value ? 1 : -1)
  const step = delta.axis === 'x' ? stepX.value : stepY.value
  const offset = step * multiplier * delta.sign * dirMultiplier

  const point: number[] = delta.axis === 'x'
    ? [value[0] + offset, value[1]]
    : [value[0], value[1] + offset]

  updateValues(point, atIndex, { commit: true, reason: 'keyboard', event })
}

// Home/End always go to the X axis min/max, whatever the reading direction or inversion.
function handleBoundaryKey(boundaryValue: number, event: KeyboardEvent) {
  const atIndex = valueIndexToChangeRef.value
  const value = currentModelValue.value[atIndex]
  if (!value)
    return
  updateValues([boundaryValue, value[1]], atIndex, { commit: true, reason: 'keyboard', event })
}

function handleKeyDown(event: KeyboardEvent) {
  if (disabled.value)
    return

  if (event.key === 'Home') {
    handleBoundaryKey(minX.value, event)
    event.preventDefault()
  }
  else if (event.key === 'End') {
    handleBoundaryKey(maxX.value, event)
    event.preventDefault()
  }
  else if (PAGE_KEYS.concat(ARROW_KEYS).includes(event.key)) {
    handleStepKeyDown(event)
    event.preventDefault()
  }
}

// The browser can release capture before `pointerup` arrives, so either one ends a pointer's slide, once.
const slidingPointerIds = new Set<number>()
function endSlide(event: PointerEvent) {
  if (!slidingPointerIds.delete(event.pointerId))
    return
  offsetPositions.delete(event.pointerId)
  // The area is measured once per gesture, and read again once no pointer is left pressed.
  if (!slidingPointerIds.size)
    rectRef.value = undefined
  handleSlideEnd()
}

function handlePointerDown(event: PointerEvent) {
  if (disabled.value)
    return

  const target = event.target as HTMLElement
  target.setPointerCapture(event.pointerId)
  slidingPointerIds.add(event.pointerId)
  event.preventDefault()

  valuesBeforeSlideStartRef.value = currentModelValue.value

  const matchedThumb = getThumbElements().find(thumb => thumb.contains(target))
  if (matchedThumb) {
    matchedThumb.focus()
  }
  else {
    handleSlideStart(event)
  }
}

function handlePointerMove(event: PointerEvent) {
  if (disabled.value)
    return
  const target = event.target as HTMLElement
  if (target.hasPointerCapture(event.pointerId)) {
    // Touch and pen keep the capture of a press made while disabled, so such a slide starts on its first move.
    if (!slidingPointerIds.has(event.pointerId)) {
      slidingPointerIds.add(event.pointerId)
      valuesBeforeSlideStartRef.value = currentModelValue.value
    }
    handleSlideMove(event)
  }
}

function handlePointerUp(event: PointerEvent) {
  const target = event.target as HTMLElement
  if (target.hasPointerCapture(event.pointerId))
    target.releasePointerCapture(event.pointerId)
  endSlide(event)
}

provideSliderAreaRootContext({
  modelValue,
  currentModelValue,
  valueIndexToChangeRef,
  minX,
  maxX,
  minY,
  maxY,
  disabled,
  isSlidingFromLeft,
  isSlidingFromTop,
  thumbAlignment,
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="$attrs"
    :dir="dir"
    :aria-disabled="disabled"
    :data-disabled="disabled ? '' : undefined"
    :style="{
      ['--reka-slider-area-thumb-transform' as any]: `translate(${!isSlidingFromLeft && thumbAlignment === 'overflow' ? '50%' : '-50%'}, ${!isSlidingFromTop && thumbAlignment === 'overflow' ? '50%' : '-50%'})`,
    }"
    @keydown="handleKeyDown"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @lostpointercapture="endSlide"
    @vue:mounted="bindFormReset"
  >
    <slot :model-value="modelValue ?? null" />

    <VisuallyHiddenInput
      v-if="isFormControl && name"
      type="hidden"
      :value="JSON.stringify(modelValue)"
      :name="name"
      :required="required"
      :disabled="disabled"
    />
  </component>
</template>
