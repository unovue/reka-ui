<script lang="ts">
import type { ComputedRef, CSSProperties, Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import type { Color, ColorChannel, ColorSpace } from '@/shared/color'
import type { FormFieldProps } from '@/shared/types'
import { createContext, useFormControl, useForwardExpose } from '@/shared'

export interface ColorAreaRootProps extends PrimitiveProps, FormFieldProps {
  /** The color value (controlled). Can be a hex string or Color object. */
  modelValue?: string | Color
  /** The default color value (uncontrolled). */
  defaultValue?: string | Color
  /** The color space to operate in. */
  colorSpace?: ColorSpace
  /** Color channel for the horizontal (x) axis. */
  xChannel?: ColorChannel
  /** Color channel for the vertical (y) axis. */
  yChannel?: ColorChannel
  /** When `true`, prevents the user from interacting with the area. */
  disabled?: boolean
  /** The name of the x channel input element for form submission. */
  xName?: string
  /** The name of the y channel input element for form submission. */
  yName?: string
}

export type ColorAreaRootEmits = {
  'update:modelValue': [value: string]
  'update:color': [value: Color]
  'change': [value: string]
  'changeEnd': [value: string]
}

export interface ColorAreaRootContext {
  color: Ref<Color>
  xValue: Ref<number>
  yValue: Ref<number>
  xChannel: Ref<ColorChannel>
  yChannel: Ref<ColorChannel>
  colorSpace: Ref<ColorSpace>
  disabled: Ref<boolean>
  xRange: ComputedRef<{ min: number, max: number, step: number }>
  yRange: ComputedRef<{ min: number, max: number, step: number }>
  thumbRef: Ref<HTMLElement | undefined>
  updateValues: (x: number, y: number) => void
  commitValues: () => void
}

export const [injectColorAreaRootContext, provideColorAreaRootContext]
  = createContext<ColorAreaRootContext>('ColorAreaRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, nextTick, ref, toRefs, watch } from 'vue'
import { Primitive } from '@/Primitive'
import {
  colorToString,
  convertToHsb,
  convertToHsl,
  convertToOklch,
  convertToRgb,
  getAreaBackgroundStyle,
  getChannelRange,
  getChannelValue,
  normalizeColor,
  setChannelValues,
} from '@/shared/color'
import { VisuallyHiddenInput } from '@/VisuallyHidden'

const props = withDefaults(defineProps<ColorAreaRootProps>(), {
  colorSpace: 'hsl',
  xChannel: 'hue',
  yChannel: 'saturation',
  disabled: false,
  defaultValue: '#ff0000',
  as: 'div',
})

const emits = defineEmits<ColorAreaRootEmits>()

defineSlots<{
  default?: (props: {
    /** CSS styles for the color area background gradient */
    style: CSSProperties
  }) => any
}>()

const { colorSpace, xChannel, yChannel, disabled } = toRefs(props)
const { forwardRef, currentElement } = useForwardExpose()
const isFormControl = useFormControl(currentElement)

// Normalize the model value to a Color object
const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: (props.modelValue === undefined) as false,
})

function toColorSpace(value: Color): Color {
  switch (colorSpace.value) {
    case 'rgb':
      return convertToRgb(value)
    case 'hsl':
      return convertToHsl(value)
    case 'hsb':
      return convertToHsb(value)
    case 'oklch':
      return convertToOklch(value)
  }
}

// Keep all axes precise internally while preserving the existing hex v-model API.
const internalColor = ref(toColorSpace(normalizeColor(modelValue.value ?? '#000000')))
const color = computed({
  get: () => internalColor.value,
  set: (newColor: Color) => {
    internalColor.value = newColor
    modelValue.value = colorToString(newColor, 'hex')
    emits('update:color', newColor)
  },
})

watch(() => modelValue.value, (newValue) => {
  if (newValue == null)
    return
  const parsed = normalizeColor(newValue)
  if (typeof newValue !== 'string' || !newValue.startsWith('#') || colorToString(parsed, 'hex') !== colorToString(internalColor.value, 'hex'))
    internalColor.value = toColorSpace(parsed)
})
watch(colorSpace, () => {
  internalColor.value = toColorSpace(internalColor.value)
})

// Get channel ranges
const xRange = computed(() => getChannelRange(xChannel.value))
const yRange = computed(() => getChannelRange(yChannel.value))

function normalizeChannelValue(value: number, channel: ColorChannel): number {
  if (colorSpace.value === 'oklch')
    return value
  return channel === 'chroma' ? Number(value.toFixed(3)) : Math.round(value)
}

// Store exact channel values as refs to avoid floating-point drift.
const xValue = ref(normalizeChannelValue(getChannelValue(color.value, xChannel.value), xChannel.value))
const yValue = ref(normalizeChannelValue(getChannelValue(color.value, yChannel.value), yChannel.value))

watch([xChannel, yChannel], () => {
  xValue.value = normalizeChannelValue(getChannelValue(color.value, xChannel.value), xChannel.value)
  yValue.value = normalizeChannelValue(getChannelValue(color.value, yChannel.value), yChannel.value)
})

// Store the hue separately to preserve it when saturation is 0 (grayscale)
const hueValue = ref(colorSpace.value === 'hsl'
  ? convertToHsl(color.value).h
  : colorSpace.value === 'hsb'
    ? convertToHsb(color.value).h
    : colorSpace.value === 'oklch'
      ? convertToOklch(color.value).h
      : 0)

// Track when we're in the middle of an update to prevent circular sync
let isUpdating = false

// Sync channel values when color changes externally
watch(() => color.value, (newColor) => {
  // Skip if we just triggered this update ourselves
  if (isUpdating)
    return

  const newX = normalizeChannelValue(getChannelValue(newColor, xChannel.value), xChannel.value)
  const newY = normalizeChannelValue(getChannelValue(newColor, yChannel.value), yChannel.value)

  // OKLCH state stays exact; legacy spaces retain their rounded external sync.
  if (normalizeChannelValue(xValue.value, xChannel.value) !== newX)
    xValue.value = newX
  if (normalizeChannelValue(yValue.value, yChannel.value) !== newY)
    yValue.value = newY

  // Update hue if saturation is not 0 (to preserve hue for grayscale colors)
  if (colorSpace.value === 'hsl') {
    const hsl = convertToHsl(newColor)
    if (hsl.s > 0)
      hueValue.value = hsl.h
  }
  else if (colorSpace.value === 'hsb') {
    const hsb = convertToHsb(newColor)
    if (hsb.s > 0)
      hueValue.value = hsb.h
  }
  else if (colorSpace.value === 'oklch') {
    const oklch = convertToOklch(newColor)
    if (oklch.c > 0.000004)
      hueValue.value = oklch.h
  }
}, { immediate: true })

// Background styles for the color area
// Use preserved hue to ensure background doesn't change when saturation is 0
const areaStyles = computed(() => {
  // Create a color with the preserved hue for background computation
  let bgColor = color.value
  if (colorSpace.value === 'hsl') {
    bgColor = { space: 'hsl', h: hueValue.value, s: 100, l: 50, alpha: 1 }
  }
  else if (colorSpace.value === 'hsb') {
    bgColor = { space: 'hsb', h: hueValue.value, s: 100, b: 100, alpha: 1 }
  }
  else if (colorSpace.value === 'oklch') {
    bgColor = convertToOklch(bgColor)
  }
  return getAreaBackgroundStyle(bgColor, xChannel.value, yChannel.value, colorSpace.value)
})

function updateValues(x: number, y: number) {
  const clampedX = Math.max(xRange.value.min, Math.min(xRange.value.max, x))
  const clampedY = Math.max(yRange.value.min, Math.min(yRange.value.max, y))

  // Update exact values
  xValue.value = clampedX
  yValue.value = clampedY

  // Prevent watch from syncing back to xValue/yValue
  isUpdating = true

  // Update color from exact values (with preserved hue)
  const channels: Array<{ channel: ColorChannel, value: number }> = [
    { channel: xChannel.value, value: clampedX },
    { channel: yChannel.value, value: clampedY },
  ]

  // Preserve hue only when it is NOT directly controlled by an axis
  const usesHueAxis = xChannel.value === 'hue' || yChannel.value === 'hue'
  if (!usesHueAxis && (colorSpace.value === 'hsl' || colorSpace.value === 'hsb' || colorSpace.value === 'oklch')) {
    channels.push({ channel: 'hue', value: color.value.space === 'oklch' ? color.value.h : hueValue.value })
  }

  color.value = setChannelValues(color.value, channels)

  // Re-enable watch sync after Vue has processed the update
  nextTick(() => {
    isUpdating = false
  })
}

function commitValues() {
  emits('changeEnd', colorToString(color.value, 'hex'))
}

const thumbRef = ref<HTMLElement>()

provideColorAreaRootContext({
  color: computed(() => color.value) as Ref<Color>,
  xValue,
  yValue,
  xChannel,
  yChannel,
  colorSpace,
  disabled,
  xRange,
  yRange,
  thumbRef,
  updateValues,
  commitValues,
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    role="group"
    :aria-disabled="disabled ? 'true' : undefined"
    :data-disabled="disabled ? '' : undefined"
  >
    <slot :style="areaStyles" />

    <VisuallyHiddenInput
      v-if="isFormControl && xName"
      type="text"
      :value="xValue"
      :name="xName"
      :disabled="disabled"
    />
    <VisuallyHiddenInput
      v-if="isFormControl && yName"
      type="text"
      :value="yValue"
      :name="yName"
      :disabled="disabled"
    />
  </Primitive>
</template>
