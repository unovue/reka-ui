<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { FieldValidateFn, FieldValidationMode, FieldValidityState } from './useFieldValidation'
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
   * Whether the field's value has changed from its initial value.
   * Useful when the field state is controlled by an external library.
   */
  dirty?: boolean
  /**
   * Whether the field has been touched (its control blurred).
   * Useful when the field state is controlled by an external library.
   */
  touched?: boolean
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
  /** The control's id, which `FieldLabel` points `for` at. Defaults to the field's generated id. */
  id?: () => string | undefined
  /** The element focused when this is the first invalid field on submit, or its label is clicked. */
  element: () => HTMLElement | null | undefined
  /** The control's current value, passed to `validate` and collected by `FormRoot`. */
  getValue: () => unknown
  /**
   * A native form element whose `ValidityState` drives constraint validation,
   * and which receives custom errors through `setCustomValidity`. Omit for
   * non-native controls: their `valueMissing` is derived from `required` and
   * `isFilled` instead.
   */
  validityElement?: () => HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null | undefined
  /** Whether the control itself is marked required. Only used without a `validityElement`. */
  required?: () => boolean
  /** Whether a value counts as filled. Defaults to anything but `null`/`undefined`/`''`/`[]`. */
  isFilled?: (value: unknown) => boolean
}

export type FieldDataAttributes = Record<`data-${'disabled' | 'valid' | 'invalid' | 'dirty' | 'touched' | 'filled' | 'focused'}`, '' | undefined>

export interface FieldRootContext {
  /** Generated id a control uses unless it has its own. */
  fieldId: Ref<string>
  /** The registered control's id (its own, or `fieldId`), for `FieldLabel`'s `for`. */
  getControlId: () => string
  /** Id of the mounted `FieldLabel`, if any. */
  labelId: ComputedRef<string | undefined>
  name: Ref<string | undefined>
  disabled: Ref<boolean>
  required: Ref<boolean>
  /** `null` until the field has a validity to report, then whether it's valid. */
  valid: ComputedRef<boolean | null>
  /** Shorthand for `valid === false`. */
  invalid: ComputedRef<boolean>
  /** The field's validity, including external invalidity (`invalid` prop, server errors). */
  validity: ComputedRef<FieldValidityState>
  /** All current error messages: validation errors, then server errors. */
  errors: ComputedRef<string[]>
  /** Native or custom `validate` messages, while the field is invalid. */
  validationErrors: Ref<string[]>
  /** Server errors from an ancestor `FormRoot`, until the user edits the field. */
  serverErrors: ComputedRef<string[]>
  /** The value validity was last computed for. */
  value: Ref<unknown>
  /** The control's value when it registered. */
  initialValue: Ref<unknown>
  touched: ComputedRef<boolean>
  dirty: ComputedRef<boolean>
  filled: Ref<boolean>
  focused: Ref<boolean>
  /** The field's state as data attributes, for every part to render. */
  dataAttributes: ComputedRef<FieldDataAttributes>
  /** Accumulated `aria-describedby` value from registered `FieldDescription`/`FieldError` parts. */
  describedBy: Ref<string | undefined>
  /** Registers a description/error part's id. Returns an unregister function. */
  registerDescription: (id: string) => () => void
  /** Registers the `FieldLabel`. Returns an unregister function. */
  registerLabel: () => () => void
  /** Registers the field's control. Returns an unregister function. */
  registerControl: (control: FieldControlRegistration) => () => void
  /** Moves focus to the registered control. */
  focusControl: () => void
  reportControlState: (state: { focused?: boolean, filled?: boolean, dirty?: boolean, touched?: boolean }) => void
  /** Called by the control on focus. */
  handleControlFocus: () => void
  /** Called by the control on blur. */
  handleControlBlur: (detail?: FieldControlDetail) => void
  /** Called by the control on a value change. */
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
import { isEqual } from 'ohash'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, toRefs, watch } from 'vue'
import { injectFormRootContext } from '@/Form/FormRoot.vue'
import { Primitive } from '@/Primitive'
import { createValidityState, useFieldValidation } from './useFieldValidation'

const props = withDefaults(defineProps<FieldRootProps>(), {
  // Vue casts an omitted `Boolean`-typed prop to `false` rather than leaving
  // it `undefined` ("boolean casting"). An explicit `undefined` default keeps
  // "not controlled" distinguishable from an explicit `false`.
  validationMode: undefined,
  invalid: undefined,
  dirty: undefined,
  touched: undefined,
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
const labelIdBase = useId(undefined, 'reka-field-label')
const labelMounted = ref(false)
const labelId = computed(() => labelMounted.value ? labelIdBase : undefined)

const touchedState = ref(false)
const dirtyState = ref(false)
const filled = ref(false)
const focused = ref(false)
const touched = computed(() => props.touched ?? touchedState.value)
const dirty = computed(() => props.dirty ?? dirtyState.value)
// Set once the value has been changed (or validation forced); until then a
// `valueMissing`-only failure is suppressed.
const markedDirty = ref(false)
watch(() => props.dirty, (value) => {
  if (value !== undefined)
    markedDirty.value = value
}, { immediate: true })

// --- Optional participation in a `FormRoot` ancestor ---
const formContext = injectFormRootContext(null)

const validationMode = computed(() => props.validationMode ?? formContext?.validationMode.value ?? 'onSubmit')

function shouldValidateOnChange() {
  return validationMode.value === 'onChange'
    || (validationMode.value === 'onSubmit' && (formContext?.submitCount.value ?? 0) > 0)
}

const control = shallowRef<FieldControlRegistration>()
const initialValue = ref<unknown>(null)
let initialValueCaptured = false

const {
  validity: validationValidity,
  errors: validationErrors,
  value,
  commit,
  change,
  reset: resetValidation,
} = useFieldValidation({
  validate: computed(() => props.validate),
  validationMode,
  validationDebounceTime: computed(() => props.validationDebounceTime),
  getFormValues: () => formContext?.getValues() ?? {},
  shouldValidateOnChange,
  markedDirty,
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

const serverErrors = computed(() => {
  if (clearedServerError.value || !serverError.value)
    return []
  return (Array.isArray(serverError.value) ? serverError.value : [serverError.value]).filter(Boolean)
})

const errors = computed(() => [...validationErrors.value, ...serverErrors.value])

// App-controlled invalidity (the `invalid` prop and server errors) applies even
// while disabled. Computed validity (native constraints and `validate`) doesn't,
// matching how `:disabled` controls are barred from constraint validation.
const externalInvalid = computed(() => props.invalid === true || serverErrors.value.length > 0)
const valid = computed<boolean | null>(() => {
  if (externalInvalid.value)
    return false
  return disabled.value ? null : validationValidity.value.valid
})
const invalid = computed(() => valid.value === false)
const validity = computed<FieldValidityState>(() => ({ ...validationValidity.value, valid: valid.value }))

const dataAttributes = computed<FieldDataAttributes>(() => ({
  'data-disabled': disabled.value ? '' : undefined,
  'data-valid': valid.value === true ? '' : undefined,
  'data-invalid': valid.value === false ? '' : undefined,
  'data-dirty': dirty.value ? '' : undefined,
  'data-touched': touched.value ? '' : undefined,
  'data-filled': filled.value ? '' : undefined,
  'data-focused': focused.value ? '' : undefined,
}))

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

function registerLabel() {
  labelMounted.value = true
  return () => {
    labelMounted.value = false
  }
}

function setDirty(next: boolean) {
  // A controlled `dirty` prop owns the state.
  if (props.dirty !== undefined)
    return
  if (next)
    markedDirty.value = true
  dirtyState.value = next
}

function setTouched(next: boolean) {
  if (props.touched !== undefined)
    return
  touchedState.value = next
}

function reportControlState(state: { focused?: boolean, filled?: boolean, dirty?: boolean, touched?: boolean }) {
  if (state.focused !== undefined)
    focused.value = state.focused
  if (state.filled !== undefined)
    filled.value = state.filled
  if (state.dirty !== undefined)
    setDirty(state.dirty)
  if (state.touched !== undefined)
    setTouched(state.touched)
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

function getValiditySource() {
  const current = control.value
  if (!current)
    return {}
  if (current.validityElement)
    return { element: current.validityElement() ?? undefined }
  return {
    getValidity: (value: unknown) => createValidityState({
      valueMissing: (required.value || Boolean(current.required?.())) && !isFilled(value),
    }),
  }
}

function handleControlFocus() {
  focused.value = true
}

// Validation timing is governed by `validationMode`; plain state bookkeeping
// (touched/dirty/filled/focused) is not, and always reflects every interaction.
function handleControlBlur(detail?: FieldControlDetail) {
  if (detail)
    lastReportedValue.value = detail.value
  const current = resolveValue(detail)

  focused.value = false
  setTouched(true)
  filled.value = isFilled(current)

  if (validationMode.value === 'onBlur' && !disabled.value)
    commit(current, getValiditySource())
}

function handleControlInput(detail?: FieldControlDetail) {
  if (detail)
    lastReportedValue.value = detail.value
  const current = resolveValue(detail)

  // Dirty means "differs from the initial value", so reverting a change clears it.
  setDirty(!isEqual(current ?? '', initialValue.value ?? ''))
  filled.value = isFilled(current)

  // Editing the field dismisses a previously shown server error for it.
  clearedServerError.value = true

  if (!disabled.value)
    change(current, getValiditySource())
}

function registerControl(registration: FieldControlRegistration) {
  control.value = registration
  const current = registration.getValue()
  // The baseline belongs to the field, not to a control instance: a control
  // that remounts must not turn its current value into the initial one.
  if (!initialValueCaptured) {
    initialValueCaptured = true
    initialValue.value = current
  }
  // A control mounted with a value (e.g. `<input value="…">`) is filled from the start.
  filled.value = isFilled(current)
  return () => {
    if (control.value === registration)
      control.value = undefined
  }
}

// A function rather than a computed: a control's own `id` can be a
// non-reactive attribute, so it's read fresh on every render.
function getControlId() {
  return control.value?.id?.() ?? fieldId.value
}

function focusControl() {
  control.value?.element()?.focus()
}

function validate(): boolean {
  // Disabled controls are barred from constraint validation; skip `validate` too.
  if (!disabled.value) {
    // Forced validation reports `valueMissing` even on an untouched field.
    markedDirty.value = true
    commit(resolveValue(), getValiditySource())
  }
  return valid.value !== false
}

defineExpose({
  /** Validates the field immediately, regardless of `validationMode`. Returns whether it's valid. */
  validate,
})
useForwardExpose()

function resetField() {
  touchedState.value = false
  dirtyState.value = false
  markedDirty.value = props.dirty ?? false
  filled.value = false
  focused.value = false
  clearedServerError.value = true
  lastReportedValue.value = undefined
  resetValidation()
  // A native reset restores default values after the `reset` event.
  setTimeout(() => {
    if (control.value)
      filled.value = isFilled(control.value.getValue())
  })
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
  getControlId,
  labelId,
  name,
  disabled,
  required,
  valid,
  invalid,
  validity,
  errors,
  validationErrors,
  serverErrors,
  value,
  initialValue,
  touched,
  dirty,
  filled,
  focused,
  dataAttributes,
  describedBy,
  registerDescription,
  registerLabel,
  registerControl,
  focusControl,
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
    v-bind="dataAttributes"
  >
    <slot
      :invalid="invalid"
      :errors="errors"
    />
  </Primitive>
</template>
