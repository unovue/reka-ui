<script lang="ts">
import type { HTMLAttributes, Ref } from 'vue'
import type { NumberFieldChangeReason } from './useNumberField'
import type { FieldControlBinding } from '@/Field/useFieldControl'
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
  /** Emitted when the user finishes a change: on blur or Enter after typing, when a held step button is released, and together with `update:modelValue` for keyboard and wheel steps. `update:modelValue` fires on each keystroke whose parsed value differs from the current one. */
  'valueCommit': [val: number | undefined]
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
  /** Live update from typed text: moves the model when the text parses, leaves the text as typed. */
  handleInputText: (val: string, event?: Event) => void
  /** `true` while the input holds typed text that blur or Enter has not committed yet. */
  isEditing: Readonly<Ref<boolean>>
  /** Emits `valueCommit` when a change has not been committed yet (or always, with `force`). */
  commitValue: (force?: boolean) => void
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

/** @internal The root's Field binding, for `NumberFieldInput`. Only provided inside a `FieldRoot`. */
export const [injectNumberFieldFieldControl, provideNumberFieldFieldControl]
  = createContext<FieldControlBinding | null>('NumberFieldRoot', 'NumberFieldFieldControl')
</script>

<script setup lang="ts">
import { mergeProps, ref, toRef, watch } from 'vue'
import { createPendingFieldInput } from '@/Field/pendingFieldInput'
import { useFieldControl } from '@/Field/useFieldControl'
import { renderAs } from '@/Primitive/renderAs'
import { vFormReset } from '@/shared/formReset'
import { VisuallyHidden, VisuallyHiddenInput } from '@/VisuallyHidden'
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

// Optional Field participation (Base UI parity): `null` outside a `FieldRoot`,
// so every binding below is inert without a Field. The input takes the field's
// id and label; the value is `number | null`. A hidden `type="number"` input
// mirrors the value with `min`/`max`/`required`, so its `ValidityState` drives
// the field's constraint validation (`rangeUnderflow`/`rangeOverflow` for an
// `allowInvalid` value out of range).
const nativeInput = ref<InstanceType<typeof VisuallyHidden>>()
const field = useFieldControl({
  // The input renders `id` (or its own), else the field's.
  id: () => context.inputEl.value?.id || props.id,
  element: () => context.inputEl.value,
  getValue: () => modelValue.value ?? null,
  validityElement: () => nativeInput.value?.$el as HTMLInputElement | undefined,
})
const resolvedName = () => field ? field.name(props.name) : props.name
const resolvedRequired = () => field ? field.required(props.required) : props.required
// The value of a user change the field committed (typing, a step, the wheel),
// as opposed to a programmatic or parent-driven one; read once the hidden
// input has updated. Only in a Field.
const pendingInput = field ? createPendingFieldInput<number | undefined>() : undefined

const { modelValue, textValue, readonly, disabled, root, context, resetValue } = useNumberField({
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
  disabled: () => field ? field.disabled(props.disabled) : props.disabled,
  readonly: () => props.readonly,
  disableWheelChange: () => props.disableWheelChange,
  invertWheelChange: () => props.invertWheelChange,
  id: () => field ? field.id() : props.id,
  startingValue: () => props.startingValue,
  emit: emits,
  onUpdate: pendingInput?.record,
})

provideNumberFieldRootContext(context)

// A native reset of the owning form puts the value back to `defaultValue`.
function onFormReset(event: Event) { resetValue(event) }

if (field) {
  provideNumberFieldFieldControl(field)
  // Flushed after render, so the hidden input's validity reflects the new value.
  watch(modelValue, (value) => {
    const pending = pendingInput!.take()
    if (pending && Object.is(pending.value, value))
      field.input(value ?? null)
    else
      field.sync(value ?? null)
  }, { flush: 'post' })
}

function focusInput() {
  context.inputEl.value?.focus()
}
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-bind="field ? mergeProps(field.dataAttributes(), $attrs, root.attrs.value) : mergeProps($attrs, root.attrs.value)"
    :ref="forwardRef"
    v-form-reset="onFormReset"
  >
    <slot
      :model-value="modelValue"
      :text-value="textValue"
      :readonly="readonly"
    />

    <VisuallyHidden
      v-if="field"
      ref="nativeInput"
      as="input"
      feature="focusable"
      aria-hidden="true"
      tabindex="-1"
      type="number"
      step="any"
      :value="modelValue ?? ''"
      :name="resolvedName()"
      :min="context.min.value"
      :max="context.max.value"
      :disabled="disabled"
      :readonly="readonly"
      :required="resolvedRequired()"
      @focus="focusInput"
    />
    <VisuallyHiddenInput
      v-else-if="isFormControl && name"
      type="text"
      :value="modelValue"
      :name="name"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
    />
  </component>
</template>
