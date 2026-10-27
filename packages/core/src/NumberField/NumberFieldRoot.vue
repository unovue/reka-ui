<script lang="ts">
import type { HTMLAttributes, Ref } from 'vue'
import type { NumberFieldChangeReason } from './useNumberField'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { FormFieldProps } from '@/shared/types'
import { createContext, useFormControl, useForwardElement, useLocale } from '@/shared'

export interface NumberFieldRootProps extends PrimitiveProps, FormFieldProps {
  defaultValue?: number
  modelValue?: number | null
  /** The smallest value allowed for the input. */
  min?: number
  /** The largest value allowed for the input. */
  max?: number
  /** The amount that the input value changes with each increment or decrement "tick". */
  step?: number
  /** When `false`, prevents the value from snapping to the nearest increment of the step value */
  stepSnapping?: boolean
  /** When `true`, a typed value is kept as-is even if invalid (out of `min`/`max` range or off the step grid); step interactions still clamp and snap. The field does not flag the value as invalid (no `aria-invalid`/`data-invalid`), so validating and surfacing the error is up to the consumer. */
  allowInvalid?: boolean
  /** When `true`, the input will be focused when the value changes. */
  focusOnChange?: boolean
  /** Formatting options for the value displayed in the number field. This also affects what characters are allowed to be typed by the user. */
  formatOptions?: Intl.NumberFormatOptions
  /** The locale to use for formatting and currencies */
  locale?: string
  /** When `true`, prevents the user from interacting with the Number Field. */
  disabled?: boolean
  /** When `true`, the Number Field is read-only. */
  readonly?: boolean
  /** When `true`, prevents the value from changing on wheel scroll. */
  disableWheelChange?: boolean
  /** When `true`, inverts the direction of the wheel change. */
  invertWheelChange?: boolean
  /** Id of the element */
  id?: string
  /** The value the first increment or decrement sets when the field is empty. It is clamped to `min`/`max` but not snapped to `step`. Defaults to `min`, or `0` when `min` is not set. */
  startingValue?: number
}

// `undefined` is emitted when the input is cleared. Documented here rather than on the member
// itself: the docs generator keys event descriptions by name globally, so a comment on
// `update:modelValue` leaks into every other component that emits it.
export type NumberFieldRootEmits = {
  'beforeUpdate:modelValue': [val: number | undefined, details: ChangeEventDetails<NumberFieldChangeReason>]
  'update:modelValue': [val: number | undefined, details: ChangeEventDetails<NumberFieldChangeReason>]
}

type NumberFieldReason = NumberFieldChangeReason | BaseChangeReason

export interface NumberFieldRootContext {
  /** Writable for v2 compatibility: an assignment goes through the cancellable model update. */
  modelValue: Ref<number | undefined>
  handleIncrease: (multiplier?: number, reason?: NumberFieldReason, event?: Event) => void
  handleDecrease: (multiplier?: number, reason?: NumberFieldReason, event?: Event) => void
  handleMinMaxValue: (type: 'min' | 'max', reason?: NumberFieldReason, event?: Event) => void
  inputEl: Ref<HTMLInputElement | undefined>
  onInputElement: (el: HTMLInputElement) => void
  inputMode: Ref<HTMLAttributes['inputmode']>
  textValue: Ref<string>
  validate: (val: string) => boolean
  /** Returns `false` when the change was cancelled or did not change the value. */
  applyInputValue: (val: string, reason?: NumberFieldReason, event?: Event) => boolean
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  disableWheelChange: Ref<boolean>
  invertWheelChange: Ref<boolean>
  max: Ref<number | undefined>
  min: Ref<number | undefined>
  isDecreaseDisabled: Ref<boolean>
  isIncreaseDisabled: Ref<boolean>
  id: Ref<string | undefined>
}

export const [injectNumberFieldRootContext, provideNumberFieldRootContext] = createContext<NumberFieldRootContext>('NumberFieldRoot')
</script>

<script setup lang="ts">
import { mergeProps, toRef } from 'vue'
import { Primitive } from '@/Primitive'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useNumberField } from './useNumberField'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<NumberFieldRootProps>(), {
  as: 'div',
  defaultValue: undefined,
  step: 1,
  stepSnapping: true,
  focusOnChange: true,
})
const emits = defineEmits<NumberFieldRootEmits>()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// ConfigProvider-aware locale resolution stays in the shell; the composable owns
// the model (`useControllableState`), formatting, clamping and the emits.
const locale = useLocale(toRef(() => props.locale))
const isFormControl = useFormControl(currentElement)

const { modelValue, textValue, readonly, disabled, root, context } = useNumberField({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  min: () => props.min,
  max: () => props.max,
  step: () => props.step,
  stepSnapping: () => props.stepSnapping,
  allowInvalid: () => props.allowInvalid,
  focusOnChange: () => props.focusOnChange,
  formatOptions: () => props.formatOptions,
  locale,
  disabled: () => props.disabled,
  readonly: () => props.readonly,
  disableWheelChange: () => props.disableWheelChange,
  invertWheelChange: () => props.invertWheelChange,
  id: () => props.id,
  startingValue: () => props.startingValue,
  emit: emits,
})

provideNumberFieldRootContext(context)
</script>

<template>
  <Primitive
    v-bind="mergeProps($attrs, root.attrs.value)"
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
  >
    <slot
      :model-value="modelValue"
      :text-value="textValue"
      :readonly="readonly"
    />

    <VisuallyHiddenInput
      v-if="isFormControl && name"
      type="text"
      :value="modelValue"
      :name="name"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
    />
  </Primitive>
</template>
