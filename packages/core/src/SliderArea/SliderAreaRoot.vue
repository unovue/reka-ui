<script lang="ts">
import type { Ref } from 'vue'
import type { Direction, FormFieldProps } from '../shared/types'
import type { PrimitiveProps } from '@/Primitive'
import { useCollection } from '@/Collection'
import { createContext, useDirection, useFormControl, useForwardExpose } from '@/shared'

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
  /** Event handler called when the slider area value changes */
  'update:modelValue': [payload: number[][] | undefined]
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
  thumbElements: Ref<HTMLElement[]>
  isSlidingFromLeft: Ref<boolean>
  isSlidingFromTop: Ref<boolean>
  thumbAlignment: Ref<ThumbAlignment>
}

export const [injectSliderAreaRootContext, provideSliderAreaRootContext]
  = createContext<SliderAreaRootContext>('SliderAreaRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, ref, toRaw, toRefs } from 'vue'
import { Primitive } from '@/Primitive'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { ARROW_KEYS, hasMinStepsBetweenValues, linearScale } from '../Slider/utils'
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
    modelValue: typeof modelValue.value
  }) => any
}>()

const { minX, maxX, minY, maxY, stepX, stepY, minXStepsBetweenThumbs, minYStepsBetweenThumbs, disabled, thumbAlignment, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)
const { forwardRef, currentElement } = useForwardExpose()
const isFormControl = useFormControl(currentElement)
const { CollectionSlot } = useCollection({ isProvider: true })

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: (props.modelValue === undefined) as false,
}) as Ref<number[][] | null>

const currentModelValue = computed(() => Array.isArray(modelValue.value) ? [...modelValue.value] : [])

const valueIndexToChangeRef = ref(0)
const valuesBeforeSlideStartRef = ref(currentModelValue.value)
const rectRef = ref<DOMRect>()
const offsetPosition = ref<{ x: number, y: number }>()

// Determine axis directions
const isSlidingFromLeft = computed(() => {
  return (dir.value !== 'rtl' && !props.invertedX) || (dir.value !== 'ltr' && props.invertedX)
})
const isSlidingFromTop = computed(() => !props.invertedY)

function valuesEqual(a: number[][] | null | undefined, b: number[][]): boolean {
  if (!a || a.length !== b.length)
    return false
  return a.every((v, i) => v[0] === b[i][0] && v[1] === b[i][1])
}

function getPointFromPointerEvent(event: PointerEvent, slideStart?: boolean): number[] {
  const rect = rectRef.value || currentElement.value!.getBoundingClientRect()
  rectRef.value = rect

  const thumb = thumbElements.value[valueIndexToChangeRef.value]
  const thumbWidth = thumbAlignment.value === 'contain' && thumb ? thumb.clientWidth : 0
  const thumbHeight = thumbAlignment.value === 'contain' && thumb ? thumb.clientHeight : 0

  // Calculate grab offset on first slideMove after a thumb-initiated drag
  if (!offsetPosition.value && !slideStart && thumbAlignment.value === 'contain' && thumb) {
    const thumbRect = thumb.getBoundingClientRect()
    offsetPosition.value = {
      x: event.clientX - thumbRect.left,
      y: event.clientY - thumbRect.top,
    }
  }

  const inputX: [number, number] = [0, rect.width - thumbWidth]
  const outputX: [number, number] = isSlidingFromLeft.value ? [minX.value, maxX.value] : [maxX.value, minX.value]
  const scaleX = linearScale(inputX, outputX)

  const inputY: [number, number] = [0, rect.height - thumbHeight]
  const outputY: [number, number] = isSlidingFromTop.value ? [minY.value, maxY.value] : [maxY.value, minY.value]
  const scaleY = linearScale(inputY, outputY)

  const posX = slideStart
    ? event.clientX - rect.left - thumbWidth / 2
    : event.clientX - rect.left - (offsetPosition.value?.x ?? 0)
  const posY = slideStart
    ? event.clientY - rect.top - thumbHeight / 2
    : event.clientY - rect.top - (offsetPosition.value?.y ?? 0)

  return [scaleX(posX), scaleY(posY)]
}

function handleSlideStart(event: PointerEvent) {
  const point = getPointFromPointerEvent(event, true)
  const closestIndex = getClosestThumbIndex(currentModelValue.value, point, minX.value, maxX.value, minY.value, maxY.value)
  if (closestIndex === -1)
    return
  updateValues(point, closestIndex)
}

function handleSlideMove(event: PointerEvent) {
  const point = getPointFromPointerEvent(event)
  updateValues(point, valueIndexToChangeRef.value)
}

function handleSlideEnd() {
  rectRef.value = undefined
  offsetPosition.value = undefined
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

function updateValues(point: number[], atIndex: number, { commit } = { commit: false }) {
  const nextX = snapToStep(point[0], minX.value, maxX.value, stepX.value)
  const nextY = snapToStep(point[1], minY.value, maxY.value, stepY.value)

  const finalX = clampAxis(nextX, 0, atIndex, minXStepsBetweenThumbs.value * stepX.value)
  const finalY = clampAxis(nextY, 1, atIndex, minYStepsBetweenThumbs.value * stepY.value)

  const nextValues = [...currentModelValue.value]
  nextValues[atIndex] = [finalX, finalY]

  valueIndexToChangeRef.value = atIndex

  const hasChanged = !valuesEqual(modelValue.value, nextValues)
  if (hasChanged && commit)
    emits('valueCommit', nextValues)

  if (hasChanged) {
    thumbElements.value[valueIndexToChangeRef.value]?.focus()
    modelValue.value = nextValues
  }
}

type StepAxis = 'x' | 'y'

const STEP_KEY_DELTAS: Record<string, { axis: StepAxis, sign: number }> = {
  ArrowRight: { axis: 'x', sign: 1 },
  ArrowLeft: { axis: 'x', sign: -1 },
  ArrowDown: { axis: 'y', sign: 1 },
  ArrowUp: { axis: 'y', sign: -1 },
}

function handleStepKeyDown(event: KeyboardEvent) {
  const delta = STEP_KEY_DELTAS[event.key]
  if (!delta)
    return

  const atIndex = valueIndexToChangeRef.value
  const value = currentModelValue.value[atIndex]
  if (!value)
    return

  const multiplier = (event.shiftKey && ARROW_KEYS.includes(event.key)) ? 10 : 1

  const dirMultiplier = delta.axis === 'x'
    ? (isSlidingFromLeft.value ? 1 : -1)
    : (isSlidingFromTop.value ? 1 : -1)
  const step = delta.axis === 'x' ? stepX.value : stepY.value
  const offset = step * multiplier * delta.sign * dirMultiplier

  const point: number[] = delta.axis === 'x'
    ? [value[0] + offset, value[1]]
    : [value[0], value[1] + offset]

  updateValues(point, atIndex, { commit: true })
}

function handleBoundaryKey(axis: StepAxis, boundaryValue: number) {
  const atIndex = valueIndexToChangeRef.value
  const value = currentModelValue.value[atIndex]
  if (!value)
    return

  let effectiveValue = boundaryValue
  if (axis === 'x' && !isSlidingFromLeft.value) {
    effectiveValue = boundaryValue === minX.value ? maxX.value : minX.value
  }
  else if (axis === 'y' && !isSlidingFromTop.value) {
    effectiveValue = boundaryValue === minY.value ? maxY.value : minY.value
  }

  const point = axis === 'x'
    ? [effectiveValue, value[1]]
    : [value[0], effectiveValue]
  updateValues(point, atIndex, { commit: true })
}

function handleKeyDown(event: KeyboardEvent) {
  if (disabled.value)
    return

  if (event.key === 'Home') {
    handleBoundaryKey('x', minX.value)
    event.preventDefault()
  }
  else if (event.key === 'End') {
    handleBoundaryKey('x', maxX.value)
    event.preventDefault()
  }
  else if (event.key === 'PageUp') {
    handleBoundaryKey('y', minY.value)
    event.preventDefault()
  }
  else if (event.key === 'PageDown') {
    handleBoundaryKey('y', maxY.value)
    event.preventDefault()
  }
  else if (ARROW_KEYS.includes(event.key)) {
    handleStepKeyDown(event)
    event.preventDefault()
  }
}

function handlePointerDown(event: PointerEvent) {
  if (disabled.value)
    return

  const target = event.target as HTMLElement
  target.setPointerCapture(event.pointerId)
  event.preventDefault()

  valuesBeforeSlideStartRef.value = currentModelValue.value

  if (thumbElements.value.includes(target)) {
    target.focus()
  }
  else {
    handleSlideStart(event)
  }
}

function handlePointerMove(event: PointerEvent) {
  if (disabled.value)
    return
  const target = event.target as HTMLElement
  if (target.hasPointerCapture(event.pointerId))
    handleSlideMove(event)
}

function handlePointerUp(event: PointerEvent) {
  const target = event.target as HTMLElement
  if (target.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId)
    if (!disabled.value)
      handleSlideEnd()
  }
}

const thumbElements = ref<HTMLElement[]>([])

provideSliderAreaRootContext({
  modelValue,
  currentModelValue,
  valueIndexToChangeRef,
  thumbElements,
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
  <CollectionSlot>
    <Primitive
      v-bind="$attrs"
      :ref="forwardRef"
      :as-child="asChild"
      :as="as"
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
    >
      <slot :model-value="modelValue" />

      <VisuallyHiddenInput
        v-if="isFormControl && name"
        type="hidden"
        :value="JSON.stringify(modelValue)"
        :name="name"
        :required="required"
        :disabled="disabled"
      />
    </Primitive>
  </CollectionSlot>
</template>
