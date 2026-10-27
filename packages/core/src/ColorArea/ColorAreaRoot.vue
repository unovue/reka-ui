<script lang="ts">
import type { ComputedRef, CSSProperties, Ref } from 'vue'
import type { ColorAreaAxis, ColorAreaChangeReason } from './useColorArea'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { Color, ColorChannel, ColorSpace } from '@/shared/color'
import type { Direction, FormFieldProps } from '@/shared/types'
import { createContext, useDirection, useFormControl, useForwardElement } from '@/shared'

export interface ColorAreaRootProps extends PrimitiveProps, FormFieldProps {
  /** The color value (controlled). A string is parsed once; emitted values are always `Color` objects. */
  modelValue?: string | Color
  /** The default color value (uncontrolled). A string is parsed once. */
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
  /** The reading direction of the area. In `rtl` the x axis runs right to left. If omitted, inherits from `ConfigProvider` or assumes `ltr`. */
  dir?: Direction
}

export type ColorAreaRootEmits = {
  /** Event handler called before the color value changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [value: Color, details: ChangeEventDetails<ColorAreaChangeReason>]
  /** Event handler called when the color value changes. */
  'update:modelValue': [value: Color, details: ChangeEventDetails<ColorAreaChangeReason>]
  /** Event handler called with the same `Color` as `update:modelValue`, after it. */
  'update:color': [value: Color]
  /** Event handler called with the hex serialization of the new color, after `update:modelValue`. Lossy: drops the hue of greys and sub-byte precision. */
  'update:hex': [value: string]
  /** Event handler called on every pointer move or keyboard step that changes the color. */
  'change': [value: Color]
  /** Event handler called when an interaction that changed the color ends: on pointer release and after each keyboard step. */
  'changeEnd': [value: Color]
}

export interface ColorAreaRootContext {
  color: ComputedRef<Color>
  xValue: ComputedRef<number>
  yValue: ComputedRef<number>
  xChannel: Ref<ColorChannel>
  yChannel: Ref<ColorChannel>
  colorSpace: Ref<ColorSpace>
  disabled: Ref<boolean>
  dir: Ref<Direction>
  xRange: ComputedRef<{ min: number, max: number, step: number }>
  yRange: ComputedRef<{ min: number, max: number, step: number }>
  thumbRef: Ref<HTMLElement | undefined>
  /** The hidden range input of each axis, rendered by `ColorAreaThumb`. */
  xInputRef: Ref<HTMLInputElement | undefined>
  yInputRef: Ref<HTMLInputElement | undefined>
  /** The axis whose input last had focus; it holds the area's single tab stop. */
  focusedAxis: Ref<ColorAreaAxis>
  /** Focuses the input of `axis` (default: the last focused axis), or the thumb when no input is rendered. */
  focusInput: (axis?: ColorAreaAxis) => void
  updateValues: (x: number, y: number, reason?: ColorAreaChangeReason | BaseChangeReason, event?: Event) => boolean
  commitValues: () => void
}

export const [injectColorAreaRootContext, provideColorAreaRootContext]
  = createContext<ColorAreaRootContext>('ColorAreaRoot')
</script>

<script setup lang="ts">
import { toRefs } from 'vue'
import { Primitive } from '@/Primitive'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useColorArea } from './useColorArea'

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

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const isFormControl = useFormControl(currentElement)
const { dir: propDir } = toRefs(props)
const dir = useDirection(propDir)

const { root, context, areaStyles, xValue, yValue } = useColorArea({
  colorSpace: () => props.colorSpace,
  xChannel: () => props.xChannel,
  yChannel: () => props.yChannel,
  disabled: () => props.disabled,
  modelValue: () => props.modelValue,
  defaultValue: () => props.defaultValue,
  dir: () => dir.value,
  emit: emits,
})

provideColorAreaRootContext(context)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="root.attrs.value"
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
