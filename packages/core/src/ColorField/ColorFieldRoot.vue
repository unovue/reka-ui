<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { ColorFieldChangeReason } from './useColorField'
import type { PrimitiveProps } from '@/Primitive'
import type { ChangeEventDetails } from '@/shared'
import type { Color, ColorChannel, ColorSpace } from '@/shared/color'
import type { FormFieldProps } from '@/shared/types'
import { createContext, useFormControl, useForwardElement } from '@/shared'

export interface ColorFieldRootProps extends PrimitiveProps, FormFieldProps {
  /** The color value (controlled). A string is parsed once; emitted values are always `Color` objects. */
  modelValue?: string | Color
  /** The default color value (uncontrolled). A string is parsed once. */
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
  /** Event handler called before the color value changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [value: Color, details: ChangeEventDetails<ColorFieldChangeReason>]
  /** Event handler called when the color value changes. */
  'update:modelValue': [value: Color, details: ChangeEventDetails<ColorFieldChangeReason>]
  /** Event handler called with the same `Color` as `update:modelValue`, after it. */
  'update:color': [value: Color]
  /** Event handler called with the hex serialization of the new color, after `update:modelValue`. Lossy: drops the hue of greys and sub-byte precision. */
  'update:hex': [value: string]
  /** Event handler called when a committed edit, step or wheel change changes the color. Typing does not change the color until it is committed. */
  'change': [value: Color]
  /** Event handler called after each committed change once the model holds it: every field change is a complete interaction. With a controlled `modelValue` it fires after the parent applies the update, and not at all if the parent rejects it. */
  'changeEnd': [value: Color]
}

export interface ColorFieldRootContext {
  color: ComputedRef<Color>
  inputValue: Ref<string>
  /** `true` once a commit rejected text that does not parse (the text reverts), until an edit parses or a change commits. */
  invalid: ComputedRef<boolean>
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

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
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
