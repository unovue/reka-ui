<script lang="ts">
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import type { ColorFieldChangeReason } from './useColorField'
import type { FieldControlBinding } from '@/Field/useFieldControl'
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

/** @internal The root's Field binding, for `ColorFieldInput`. Only provided inside a `FieldRoot`. */
export interface ColorFieldFieldControl {
  binding: FieldControlBinding
  /** Set by `ColorFieldInput`: the field's control and, when the consumer gave it one, its own id. */
  input: ShallowRef<{ element: () => HTMLElement | undefined, id: () => string | undefined } | undefined>
}

/** @internal */
export const [injectColorFieldFieldControl, provideColorFieldFieldControl]
  = createContext<ColorFieldFieldControl | null>('ColorFieldRoot', 'ColorFieldFieldControl')
</script>

<script setup lang="ts">
import { mergeProps, shallowRef, watch } from 'vue'
import { useFieldControl } from '@/Field/useFieldControl'
import { renderAs } from '@/Primitive/renderAs'
import { colorToString } from '@/shared/color'
import { formResetBinder } from '@/shared/formReset'
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

// Optional Field participation: `null` outside a `FieldRoot`, so every binding
// below is inert without a Field. The input is the field's control (id, label,
// focus); the value collected is the `Color`, as emitted. A color field always
// holds a color, so `required` never fails.
// The ref is only created inside a Field, so a standalone field allocates nothing.
let fieldInput: ColorFieldFieldControl['input'] | undefined
const field = useFieldControl({
  id: () => fieldInput?.value?.id(),
  element: () => fieldInput?.value?.element(),
  getValue: () => color.value,
  required: () => props.required,
})
if (field)
  fieldInput = shallowRef()

const { root, context, color, disabled, resetValue } = useColorField({
  colorSpace: () => props.colorSpace,
  channel: () => props.channel,
  disabled: () => field ? field.disabled(props.disabled) : props.disabled,
  readonly: () => props.readonly,
  disableWheelChange: () => props.disableWheelChange,
  placeholder: () => props.placeholder,
  step: () => props.step,
  modelValue: () => props.modelValue,
  defaultValue: () => props.defaultValue,
  emit: emits,
  // The Field hears its own commits by reason (`change`): user input, or, for
  // a programmatic one (`setModelValue` and the like), only the watcher below,
  // which also reports a parent-driven change.
  onUpdate: field?.change,
})

provideColorFieldRootContext(context)

// A native reset of the owning form puts the value back to `defaultValue`.
function onFormReset(event: Event) { resetValue(event) }

if (field) {
  provideColorFieldFieldControl({ binding: field, input: fieldInput! })
  watch(color, value => field.sync(value))
}

const bindFormReset = formResetBinder(onFormReset)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="field ? mergeProps(field.dataAttributes(), root.attrs.value) : root.attrs.value"
    @vue:mounted="bindFormReset"
  >
    <slot />

    <VisuallyHiddenInput
      v-if="isFormControl && (field ? field.name(name) : name)"
      type="text"
      :value="colorToString(color, 'hex')"
      :name="(field ? field.name(name) : name)!"
      :disabled="disabled"
      :required="field ? field.required(required) : required"
    />
  </component>
</template>
