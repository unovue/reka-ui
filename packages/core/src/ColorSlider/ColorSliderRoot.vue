<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { ColorSliderChangeReason } from './useColorSlider'
import type { PrimitiveProps } from '@/Primitive'
import type { ChangeEventDetails } from '@/shared'
import type { Color, ColorChannel, ColorSpace } from '@/shared/color'
import type { DataOrientation, Direction, FormFieldProps } from '@/shared/types'
import { createContext, useDirection, useFormControl, useForwardExpose } from '@/shared'

export interface ColorSliderRootProps extends PrimitiveProps, FormFieldProps {
  /** The color value (controlled). Can be a hex string or Color object. */
  modelValue?: string | Color
  /** The default color value (uncontrolled). */
  defaultValue?: string | Color
  /** The color space to operate in. */
  colorSpace?: ColorSpace
  /** The color channel that this slider manipulates. */
  channel: ColorChannel
  /** The orientation of the slider. */
  orientation?: DataOrientation
  /** The reading direction of the slider. */
  dir?: Direction
  /** Whether the slider is visually inverted. */
  inverted?: boolean
  /** When `true`, prevents the user from interacting with the slider. */
  disabled?: boolean
  /** Custom step value for increment/decrement. Defaults to the channel's natural step. */
  step?: number
}

export type ColorSliderRootEmits = {
  'beforeUpdate:modelValue': [value: string | Color, details: ChangeEventDetails<ColorSliderChangeReason>]
  'update:modelValue': [value: string | Color, details: ChangeEventDetails<ColorSliderChangeReason>]
  'update:color': [value: Color]
  'change': [value: string]
  'changeEnd': [value: string]
}

export interface ColorSliderRootContext {
  color: Ref<Color>
  channelValue: ComputedRef<number>
  channel: Ref<ColorChannel>
  colorSpace: Ref<ColorSpace>
  orientation: Ref<DataOrientation>
  disabled: Ref<boolean>
  inverted: Ref<boolean>
  min: ComputedRef<number>
  max: ComputedRef<number>
  step: ComputedRef<number>
}

export const [injectColorSliderRootContext, provideColorSliderRootContext]
  = createContext<ColorSliderRootContext>('ColorSliderRoot')
</script>

<script setup lang="ts">
import { mergeProps, toRefs } from 'vue'
import { colorToString } from '@/shared/color'
import { SliderRoot } from '@/Slider'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useColorSlider } from './useColorSlider'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<ColorSliderRootProps>(), {
  colorSpace: 'hsl',
  orientation: 'horizontal',
  disabled: false,
  inverted: false,
  defaultValue: '#000000',
  as: 'span',
})

const emits = defineEmits<ColorSliderRootEmits>()

const { forwardRef, currentElement } = useForwardExpose()
const isFormControl = useFormControl(currentElement)
const { dir: propDir } = toRefs(props)
const dir = useDirection(propDir)

const { root, context, color, disabled } = useColorSlider({
  orientation: () => props.orientation,
  disabled: () => props.disabled,
  inverted: () => props.inverted,
  channel: () => props.channel,
  colorSpace: () => props.colorSpace,
  step: () => props.step,
  modelValue: () => props.modelValue,
  defaultValue: () => props.defaultValue,
  emit: emits,
})

provideColorSliderRootContext(context)
</script>

<template>
  <SliderRoot
    v-bind="mergeProps(root.attrs.value, $attrs)"
    :ref="forwardRef"
    :dir="dir"
    :as="as"
    :as-child="asChild"
  >
    <slot />

    <VisuallyHiddenInput
      v-if="isFormControl && name"
      type="text"
      :value="colorToString(color, 'hex')"
      :name="name"
      :disabled="disabled"
      :required="required"
    />
  </SliderRoot>
</template>
