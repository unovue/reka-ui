<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { FieldValidateFn, FieldValidationMode } from './useFieldValidation'
import type { PrimitiveProps } from '@/Primitive'
import { createContext, useForwardExpose, useId } from '@/shared'

export interface FieldRootProps extends PrimitiveProps {
  /**
   * The name of the field. Submitted with its owning form as part of a
   * name/value pair, and used to match server `errors` on a `FormRoot`.
   * Takes precedence over the `name` of the control.
   */
  name?: string
  /** When `true`, prevents the user from interacting with the field's control. Takes precedence over the `disabled` of the control. */
  disabled?: boolean
  /** When `true`, indicates that the user must set the value before the owning form can be submitted. */
  required?: boolean
  /**
   * When `true`, marks the field invalid regardless of its own validation.
   * Useful when the field state is controlled by an external library.
   */
  invalid?: boolean
  /**
   * Custom validation function. Return an error message (or array of
   * messages) when invalid, or `null`/`undefined` when valid. Receives the
   * control's value and the values of every named field in the owning form.
   *
   * Can be async, but an async `validate` does not prevent form submission
   * when `validationMode` is `onSubmit`.
   */
  validate?: FieldValidateFn
  /**
   * When the field (re-)runs validation. Takes precedence over the
   * `validationMode` of an ancestor `FormRoot`.
   * - `onSubmit`: when the form is submitted, then on every change after that.
   * - `onBlur`: when the control loses focus.
   * - `onChange`: on every change to the control's value.
   * @defaultValue "onSubmit"
   */
  validationMode?: FieldValidationMode
  /** How long to wait (in ms) between `validate` calls when validating on change. */
  validationDebounceTime?: number
}

export type FieldRootEmits = object

/**
 * Optional override passed to `handleControlBlur`/`handleControlInput`, for a
 * control that knows its new value before it's readable through the
 * registered `getValue` (e.g. a controlled component whose prop updates on
 * the next render).
 */
export interface FieldControlDetail {
  value: unknown
}

/**
 * How a control participates in its `FieldRoot`. Registered with
 * `registerControl` by `FieldControl` and by participating Reka components.
 */
export interface FieldControlRegistration {
  /** The element focused when this is the first invalid field on submit. */
  element: () => HTMLElement | null | undefined
  /** The control's current value, passed to `validate` and collected by `FormRoot`. */
  getValue: () => unknown
  /**
   * A native form element whose `ValidityState` drives constraint validation.
   * Omit for non-native controls: their `valueMissing` is derived from
   * `required` and `isFilled` instead.
   */
  validityElement?: () => HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null | undefined
  /** Whether the control itself is marked required. Only used without a `validityElement`. */
  required?: () => boolean
  /** Whether a value counts as filled. Defaults to anything but `null`/`undefined`/`''`/`[]`. */
  isFilled?: (value: unknown) => boolean
}

export interface FieldRootContext {
  /** Id to associate the control with `FieldLabel` (`for`/`id`). */
  fieldId: Ref<string>
  /** Id of the `FieldLabel`. */
  labelId: Ref<string>
  name: Ref<string | undefined>
  disabled: Ref<boolean>
  required: Ref<boolean>
  /** `null` until the field has a validity to report, then whether it's valid. */
  valid: ComputedRef<boolean | null>
  /** Shorthand for `valid === false`. */
  invalid: ComputedRef<boolean>
  /** All current error messages (native, custom `validate`, then server errors). */
  errors: Ref<string[]>
  /** The control's current `ValidityState` (native, or derived for non-native controls). */
  validity: Ref<ValidityState | undefined>
  touched: Ref<boolean>
  dirty: Ref<boolean>
  filled: Ref<boolean>
  focused: Ref<boolean>
  /** Accumulated `aria-describedby` value from registered `FieldDescription`/`FieldError` parts. */
  describedBy: Ref<string | undefined>
  /** Registers a description/error part's id. Returns an unregister function. */
  registerDescription: (id: string) => () => void
  /** Registers the field's control. Returns an unregister function. */
  registerControl: (control: FieldControlRegistration) => () => void
  reportControlState: (state: { focused?: boolean, filled?: boolean, dirty?: boolean, touched?: boolean }) => void
  /** Called by the control on focus. */
  handleControlFocus: () => void
  /** Called by the control on blur. */
  handleControlBlur: (detail?: FieldControlDetail) => void
  /** Called by the control on a user-driven value change. */
  handleControlInput: (detail?: FieldControlDetail) => void
  /** Runs validation immediately regardless of `validationMode`. Returns whether the field is valid. */
  validate: () => boolean
  /** Clears touched/dirty/filled/errors/validity — used on native `<form>` reset. */
  resetField: () => void
}

export const [injectFieldRootContext, provideFieldRootContext]
  = createContext<FieldRootContext>('FieldRoot')
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, toRefs, watch } from 'vue'
import { injectFormRootContext } from '@/Form/FormRoot.vue'
import { Primitive } from '@/Primitive'
import { createValidityState, useFieldValidation } from './useFieldValidation'

const props = withDefaults(defineProps<FieldRootProps>(), {
  // Vue casts an omitted `Boolean`-typed prop to `false` rather than leaving
  // it `undefined` ("boolean casting"). An explicit `undefined` default here
  // keeps it `undefined` so `validationMode` can fall back to the form's.
  validationMode: undefined,
  invalid: undefined,
})

defineSlots<{
  default?: (props: {
    /** Whether the field is currently invalid. */
    invalid: boolean
    /** All current error messages. */
    errors: string[]
  }) => any
}>()

const { disabled, required, name } = toRefs(props)

const fieldId = ref(useId(undefined, 'reka-field'))
const labelId = ref(useId(undefined, 'reka-field-label'))

const touched = ref(false)
const dirty = ref(false)
const filled = ref(false)
const focused = ref(false)

// --- Optional participation in a `FormRoot` ancestor ---
const formContext = injectFormRootContext(null)

const validationMode = computed(() => props.validationMode ?? formContext?.validationMode.value ?? 'onSubmit')

const control = shallowRef<FieldControlRegistration>()

const {
  customErrors,
  validity,
  hasValidated,
  pending,
  invalid: validationInvalid,
  triggerValidation,
  setNativeValidity,
  reset: resetValidation,
} = useFieldValidation({
  validate: computed(() => props.validate),
  validationMode,
  validationDebounceTime: computed(() => props.validationDebounceTime),
  getFormValues: () => formContext?.getValues() ?? {},
})

const clearedServerError = ref(false)
const serverError = computed(() => {
  if (!formContext || !name.value)
    return undefined
  return formContext.serverErrors.value[name.value]
})

// A new/changed server error (e.g. after a fresh submit) should show again
// even if a previous instance of it was dismissed by editing the field.
//
// Watching `serverError` alone isn't enough: a repeat submit with the *same*
// message for this field (a new `errors` object, identical string value)
// leaves `serverError` unchanged by value, so that watcher alone would never
// fire. Also watch the parent `errors` object's identity so a fresh object —
// even with identical contents — re-shows the error.
watch([serverError, () => formContext?.serverErrors.value], () => {
  clearedServerError.value = false
})

const activeServerErrors = computed(() => {
  if (clearedServerError.value || !serverError.value)
    return []
  return Array.isArray(serverError.value) ? serverError.value : [serverError.value]
})

const errors = computed(() => [...customErrors.value, ...activeServerErrors.value])
const hasServerError = computed(() => activeServerErrors.value.length > 0)

// App-controlled invalidity (the `invalid` prop and server errors) applies even
// while disabled. Computed validity (native constraints and `validate`) doesn't,
// matching how `:disabled` controls are barred from constraint validation.
const valid = computed<boolean | null>(() => {
  if (props.invalid === true || hasServerError.value)
    return false
  if (disabled.value || !hasValidated.value)
    return null
  if (validationInvalid.value)
    return false
  return pending.value ? null : true
})
const invalid = computed(() => valid.value === false)

// --- Description / error id accumulation (deterministic: registration order) ---
const describedByIds = ref<string[]>([])
const describedBy = computed(() => describedByIds.value.length ? describedByIds.value.join(' ') : undefined)

function registerDescription(id: string) {
  describedByIds.value.push(id)
  return () => {
    const index = describedByIds.value.indexOf(id)
    if (index !== -1)
      describedByIds.value.splice(index, 1)
  }
}

function reportControlState(state: { focused?: boolean, filled?: boolean, dirty?: boolean, touched?: boolean }) {
  if (state.focused !== undefined)
    focused.value = state.focused
  if (state.filled !== undefined)
    filled.value = state.filled
  if (state.dirty !== undefined)
    dirty.value = state.dirty
  if (state.touched !== undefined)
    touched.value = state.touched
}

// `filled` has to survive non-string values: non-native controls report
// arrays (multi-`Select`) and numbers, and `Boolean(value)` gets both ends
// wrong — `Boolean([])` is `true` for an empty multi-select, and `Boolean(0)`
// is `false` for a legitimately selected `0`. Only `''`/`null`/`undefined`
// (and an empty array) count as empty.
function isFilledValue(value: unknown) {
  if (Array.isArray(value))
    return value.length > 0
  return value !== undefined && value !== null && value !== ''
}

function isFilled(value: unknown) {
  return (control.value?.isFilled ?? isFilledValue)(value)
}

// The value last reported through `FieldControlDetail`, for a field whose
// control can't be read through a registration (e.g. a custom control that
// only reports values).
const lastReportedValue = ref<unknown>(undefined)

function resolveValue(detail?: FieldControlDetail) {
  if (detail)
    return detail.value
  return control.value ? control.value.getValue() : lastReportedValue.value
}

function readValidity(value: unknown): ValidityState | undefined {
  const current = control.value
  if (!current)
    return undefined

  if (current.validityElement) {
    const element = current.validityElement()
    // A control barred from constraint validation (disabled, `type="button"`,
    // …) reports `validity.valid === true` vacuously — don't trust it.
    return element?.willValidate ? element.validity : undefined
  }

  const isRequired = required.value || Boolean(current.required?.())
  return createValidityState({ valueMissing: isRequired && !isFilled(value) })
}

function runValidation(value: unknown, immediate: boolean) {
  setNativeValidity(readValidity(value))
  triggerValidation(value, immediate)
}

function shouldValidateOnChange() {
  return validationMode.value === 'onChange'
    || (validationMode.value === 'onSubmit' && (formContext?.submitCount.value ?? 0) > 0)
}

function handleControlFocus() {
  reportControlState({ focused: true })
}

// Validation timing is governed by `validationMode`; plain state bookkeeping
// (touched/dirty/filled/focused) is not, and always reflects every interaction.
function handleControlBlur(detail?: FieldControlDetail) {
  if (detail)
    lastReportedValue.value = detail.value
  const value = resolveValue(detail)

  reportControlState({ focused: false, touched: true, filled: isFilled(value) })

  if (validationMode.value === 'onBlur' && !disabled.value)
    runValidation(value, true)
}

function handleControlInput(detail?: FieldControlDetail) {
  if (detail)
    lastReportedValue.value = detail.value
  const value = resolveValue(detail)

  reportControlState({ dirty: true, filled: isFilled(value) })

  // Editing the field dismisses a previously shown server error for it.
  clearedServerError.value = true

  if (shouldValidateOnChange() && !disabled.value)
    runValidation(value, false)
}

function registerControl(registration: FieldControlRegistration) {
  control.value = registration
  // A control mounted with a value (e.g. `<input value="…">`) is filled from the start.
  filled.value = isFilled(registration.getValue())
  return () => {
    if (control.value === registration)
      control.value = undefined
  }
}

function validate(): boolean {
  // Disabled controls are barred from constraint validation; skip `validate` too.
  if (!disabled.value)
    runValidation(resolveValue(), true)
  return valid.value !== false
}

defineExpose({
  /** Validates the field immediately, regardless of `validationMode`. Returns whether it's valid. */
  validate,
})
useForwardExpose()

function resetField() {
  touched.value = false
  dirty.value = false
  filled.value = false
  focused.value = false
  clearedServerError.value = true
  lastReportedValue.value = undefined
  resetValidation()
}

let unregisterFromForm: (() => void) | undefined
onMounted(() => {
  unregisterFromForm = formContext?.registerField({
    name,
    validate,
    invalid,
    getValue: () => resolveValue(),
    getControlElement: () => control.value?.element() ?? undefined,
    resetField,
  })
})
onBeforeUnmount(() => unregisterFromForm?.())

provideFieldRootContext({
  fieldId,
  labelId,
  name,
  disabled,
  required,
  valid,
  invalid,
  errors,
  validity,
  touched,
  dirty,
  filled,
  focused,
  describedBy,
  registerDescription,
  registerControl,
  reportControlState,
  handleControlFocus,
  handleControlBlur,
  handleControlInput,
  validate,
  resetField,
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :data-disabled="disabled ? '' : undefined"
    :data-valid="valid === true ? '' : undefined"
    :data-invalid="valid === false ? '' : undefined"
    :data-dirty="dirty ? '' : undefined"
    :data-touched="touched ? '' : undefined"
    :data-filled="filled ? '' : undefined"
    :data-focused="focused ? '' : undefined"
  >
    <slot
      :invalid="invalid"
      :errors="errors"
    />
  </Primitive>
</template>
