<script lang="ts">
import type { Ref } from 'vue'
import type { ColorFieldChangeReason } from './useColorField'
import type { PrimitiveProps } from '@/Primitive'
import type { ChangeEventDetails } from '@/shared'
import type { Color, ColorChannel, ColorSpace } from '@/shared/color'
import type { FormFieldProps } from '@/shared/types'
import { createContext, useFormControl, useForwardExpose } from '@/shared'

export interface ColorFieldRootProps extends PrimitiveProps, FormFieldProps {
  /** The color value (controlled). Can be a hex string or Color object. */
  modelValue?: string | Color
  /** The default color value (uncontrolled). */
  defaultValue?: string | Color
  /** The color space to operate in when displaying a channel. */
  colorSpace?: ColorSpace
  /** The color channel to display. If not provided, displays hex value. */
  channel?: ColorChannel
  /** Placeholder text when the field is empty. */
  placeholder?: string
  /** When `true`, prevents the user from interacting with the field. */
  disabled?: boolean
  /** When `true`, the field is read-only. */
  readonly?: boolean
  /** When `true`, prevents the value from changing on wheel scroll. */
  disableWheelChange?: boolean
  /** The locale to use for number formatting. */
  locale?: string
  /** Custom step value for increment/decrement. Defaults to channel step or 1 for hex. */
  step?: number
}

export type ColorFieldRootEmits = {
  'beforeUpdate:modelValue': [value: string, details: ChangeEventDetails<ColorFieldChangeReason>]
  'update:modelValue': [value: string, details: ChangeEventDetails<ColorFieldChangeReason>]
  'update:color': [value: Color]
}

export interface ColorFieldRootContext {
  color: Ref<Color>
  inputValue: Ref<string>
  channel: Ref<ColorChannel | undefined>
  colorSpace: Ref<ColorSpace>
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  disableWheelChange: Ref<boolean>
  placeholder: Ref<string | undefined>
  updateValue: (value: string) => void
  commit: (event?: Event) => void
  increment: (event?: Event) => void
  decrement: (event?: Event) => void
  incrementToMax: (event?: Event) => void
  decrementToMin: (event?: Event) => void
  incrementPage: (event?: Event) => void
  decrementPage: (event?: Event) => void
  handleWheel: (event: WheelEvent) => void
}

export const [injectColorFieldRootContext, provideColorFieldRootContext]
  = createContext<ColorFieldRootContext>('ColorFieldRoot')
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { colorToString } from '@/shared/color'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useColorField } from './useColorField'

const props = withDefaults(defineProps<ColorFieldRootProps>(), {
  colorSpace: 'hsl',
  disabled: false,
  readonly: false,
  disableWheelChange: false,
  defaultValue: '#000000',
  as: 'div',
})

const emits = defineEmits<ColorFieldRootEmits>()

const { forwardRef, currentElement } = useForwardExpose()
const isFormControl = useFormControl(currentElement)

const { root, context, color, disabled } = useColorField({
  colorSpace: () => props.colorSpace,
  channel: () => props.channel,
  disabled: () => props.disabled,
  readonly: () => props.readonly,
  disableWheelChange: () => props.disableWheelChange,
  placeholder: () => props.placeholder,
  step: () => props.step,
  modelValue: () => props.modelValue,
  defaultValue: () => props.defaultValue,
  emit: emits,
})

provideColorFieldRootContext(context)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="root.attrs.value"
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
  </Primitive>
</template>
