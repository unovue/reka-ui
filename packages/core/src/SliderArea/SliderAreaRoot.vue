<script lang="ts">
import type { Ref } from 'vue'
import type { Direction, FormFieldProps } from '../shared/types'
import type { SliderAreaPoint } from './utils'
import type { PrimitiveProps } from '@/Primitive'
import { useCollection } from '@/Collection'
import { clamp, createContext, useDirection, useFormControl, useForwardExpose } from '@/shared'

export interface SliderAreaRootProps extends PrimitiveProps, FormFieldProps {
  /** The value of the slider area when initially rendered. Use when you do not need to control the state. */
  defaultValue?: SliderAreaPoint[]
  /** The controlled value of the slider area. Can be bind as `v-model`. */
  modelValue?: SliderAreaPoint[] | null
  /** When `true`, prevents the user from interacting with the slider area. */
  disabled?: boolean
  /** The reading direction. If omitted, inherits globally from `ConfigProvider` or assumes LTR. */
  dir?: Direction
  /** Whether the X axis is visually inverted. */
  invertX?: boolean
  /** Whether the Y axis is visually inverted. */
  invertY?: boolean
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
}

export type SliderAreaRootEmits = {
  /** Event handler called when the slider area value changes */
  'update:modelValue': [payload: SliderAreaPoint[] | undefined]
  /** Event handler called when the value changes at the end of an interaction. */
  'valueCommit': [payload: SliderAreaPoint[]]
}

export interface SliderAreaRootContext {
  disabled: Ref<boolean>
  minX: Ref<number>
  maxX: Ref<number>
  minY: Ref<number>
  maxY: Ref<number>
  modelValue?: Readonly<Ref<SliderAreaPoint[] | null | undefined>>
  currentModelValue: Ref<SliderAreaPoint[]>
  valueIndexToChangeRef: Ref<number>
  thumbElements: Ref<HTMLElement[]>
  isSlidingFromLeft: Ref<boolean>
  isSlidingFromTop: Ref<boolean>
}

export const [injectSliderAreaRootContext, provideSliderAreaRootContext]
  = createContext<SliderAreaRootContext>('SliderAreaRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, ref, toRaw, toRefs } from 'vue'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { ARROW_KEYS, getDecimalCount, linearScale, PAGE_KEYS, roundValue } from '../Slider/utils'
import SliderAreaImpl from './SliderAreaImpl.vue'
import { getClosestThumbIndex } from './utils'

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
  defaultValue: () => [{ x: 0, y: 0 }],
  invertX: false,
  invertY: false,
  as: 'span',
})
const emits = defineEmits<SliderAreaRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current slider area values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { minX, maxX, minY, maxY, stepX, stepY, disabled, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)
const { forwardRef, currentElement } = useForwardExpose()
const isFormControl = useFormControl(currentElement)
const { CollectionSlot } = useCollection({ isProvider: true })

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: (props.modelValue === undefined) as false,
}) as Ref<SliderAreaPoint[] | null>

const currentModelValue = computed(() => Array.isArray(modelValue.value) ? [...modelValue.value] : [])

const valueIndexToChangeRef = ref(0)
const valuesBeforeSlideStartRef = ref(currentModelValue.value)
const rectRef = ref<DOMRect>()

// Determine axis directions
const isSlidingFromLeft = computed(() => {
  return (dir.value !== 'rtl' && !props.invertX) || (dir.value !== 'ltr' && props.invertX)
})
const isSlidingFromTop = computed(() => !props.invertY)

function getPointFromPointerEvent(event: PointerEvent, slideStart?: boolean): SliderAreaPoint {
  const rect = rectRef.value || currentElement.value!.getBoundingClientRect()
  rectRef.value = rect

  const inputX: [number, number] = [0, rect.width]
  const outputX: [number, number] = isSlidingFromLeft.value ? [minX.value, maxX.value] : [maxX.value, minX.value]
  const scaleX = linearScale(inputX, outputX)

  const inputY: [number, number] = [0, rect.height]
  const outputY: [number, number] = isSlidingFromTop.value ? [minY.value, maxY.value] : [maxY.value, minY.value]
  const scaleY = linearScale(inputY, outputY)

  const posX = event.clientX - rect.left
  const posY = event.clientY - rect.top

  return {
    x: scaleX(posX),
    y: scaleY(posY),
  }
}

function handleSlideStart(event: PointerEvent) {
  const point = getPointFromPointerEvent(event, true)
  const closestIndex = getClosestThumbIndex(currentModelValue.value, point, minX.value, maxX.value, minY.value, maxY.value)
  updateValues(point, closestIndex)
}

function handleSlideMove(event: PointerEvent) {
  const point = getPointFromPointerEvent(event)
  updateValues(point, valueIndexToChangeRef.value)
}

function handleSlideEnd() {
  rectRef.value = undefined
  const prevValue = valuesBeforeSlideStartRef.value[valueIndexToChangeRef.value]
  const nextValue = currentModelValue.value[valueIndexToChangeRef.value]
  const hasChanged = prevValue?.x !== nextValue?.x || prevValue?.y !== nextValue?.y
  if (hasChanged)
    emits('valueCommit', toRaw(currentModelValue.value))
}

function updateValues(point: SliderAreaPoint, atIndex: number, { commit } = { commit: false }) {
  const decimalCountX = getDecimalCount(stepX.value)
  const decimalCountY = getDecimalCount(stepY.value)

  const snapX = roundValue(Math.round((point.x - minX.value) / stepX.value) * stepX.value + minX.value, decimalCountX)
  const snapY = roundValue(Math.round((point.y - minY.value) / stepY.value) * stepY.value + minY.value, decimalCountY)

  const nextX = clamp(snapX, minX.value, maxX.value)
  const nextY = clamp(snapY, minY.value, maxY.value)

  const nextValues = [...currentModelValue.value]
  nextValues[atIndex] = { x: nextX, y: nextY }

  valueIndexToChangeRef.value = atIndex

  const hasChanged = JSON.stringify(nextValues) !== JSON.stringify(modelValue.value)
  if (hasChanged && commit)
    emits('valueCommit', nextValues)

  if (hasChanged) {
    thumbElements.value[valueIndexToChangeRef.value]?.focus()
    modelValue.value = nextValues
  }
}

function handleStepKeyDown(event: KeyboardEvent) {
  const isPageKey = PAGE_KEYS.includes(event.key)
  const isShiftKey = event.shiftKey && ARROW_KEYS.includes(event.key)
  const multiplier = (isPageKey || isShiftKey) ? 10 : 1

  const atIndex = valueIndexToChangeRef.value
  const value = currentModelValue.value[atIndex]
  if (!value)
    return

  let dx = 0
  let dy = 0

  const xDir = isSlidingFromLeft.value ? 1 : -1
  const yDir = isSlidingFromTop.value ? 1 : -1

  switch (event.key) {
    case 'ArrowRight':
      dx = stepX.value * multiplier * xDir
      break
    case 'ArrowLeft':
      dx = -stepX.value * multiplier * xDir
      break
    case 'ArrowDown':
      dy = stepY.value * multiplier * yDir
      break
    case 'ArrowUp':
      dy = -stepY.value * multiplier * yDir
      break
    case 'PageDown':
      dy = stepY.value * 10 * yDir
      break
    case 'PageUp':
      dy = -stepY.value * 10 * yDir
      break
  }

  if (dx !== 0 || dy !== 0) {
    updateValues({ x: value.x + dx, y: value.y + dy }, atIndex, { commit: true })
  }
}

function handleHomeKeyDown() {
  const atIndex = valueIndexToChangeRef.value
  const value = currentModelValue.value[atIndex]
  if (!value)
    return
  updateValues({ x: minX.value, y: value.y }, atIndex, { commit: true })
}

function handleEndKeyDown() {
  const atIndex = valueIndexToChangeRef.value
  const value = currentModelValue.value[atIndex]
  if (!value)
    return
  updateValues({ x: maxX.value, y: value.y }, atIndex, { commit: true })
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
})
</script>

<template>
  <CollectionSlot>
    <SliderAreaImpl
      v-bind="$attrs"
      :ref="forwardRef"
      :as-child="asChild"
      :as="as"
      :dir="dir"
      :aria-disabled="disabled"
      :data-disabled="disabled ? '' : undefined"
      :style="{
        ['--reka-slider-area-thumb-transform' as any]: `translate(${isSlidingFromLeft ? '-50%' : '50%'}, ${isSlidingFromTop ? '-50%' : '50%'})`,
      }"
      @pointerdown="() => {
        if (!disabled) valuesBeforeSlideStartRef = currentModelValue
      }"
      @slide-start="!disabled && handleSlideStart($event)"
      @slide-move="!disabled && handleSlideMove($event)"
      @slide-end="!disabled && handleSlideEnd()"
      @home-key-down="!disabled && handleHomeKeyDown()"
      @end-key-down="!disabled && handleEndKeyDown()"
      @step-key-down="(event) => {
        if (!disabled) handleStepKeyDown(event)
      }"
    >
      <slot :model-value="modelValue" />

      <VisuallyHiddenInput
        v-if="isFormControl && name"
        type="text"
        :value="JSON.stringify(modelValue)"
        :name="name"
        :required="required"
        :disabled="disabled"
      />
    </SliderAreaImpl>
  </CollectionSlot>
</template>
