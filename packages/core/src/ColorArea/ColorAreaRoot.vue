<script lang="ts">
import type { ComputedRef, CSSProperties, Ref } from 'vue'
import type { ColorAreaChangeReason } from './useColorArea'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
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
  'beforeUpdate:modelValue': [value: string, details: ChangeEventDetails<ColorAreaChangeReason>]
  'update:modelValue': [value: string, details: ChangeEventDetails<ColorAreaChangeReason>]
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
  updateValues: (x: number, y: number, reason?: ColorAreaChangeReason | BaseChangeReason, event?: Event) => void
  commitValues: () => void
}

export const [injectColorAreaRootContext, provideColorAreaRootContext]
  = createContext<ColorAreaRootContext>('ColorAreaRoot')
</script>

<script setup lang="ts">
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

const { forwardRef, currentElement } = useForwardExpose()
const isFormControl = useFormControl(currentElement)

const { root, context, areaStyles, xValue, yValue } = useColorArea({
  colorSpace: () => props.colorSpace,
  xChannel: () => props.xChannel,
  yChannel: () => props.yChannel,
  disabled: () => props.disabled,
  modelValue: () => props.modelValue,
  defaultValue: () => props.defaultValue,
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
