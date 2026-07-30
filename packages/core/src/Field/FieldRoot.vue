<script lang="ts">
import type { Ref } from 'vue'
import type { FieldValidateFn, FieldValidationMode } from './useFieldValidation'
import type { PrimitiveProps } from '@/Primitive'
import { createContext, useForwardExpose, useId } from '@/shared'

export interface FieldRootProps extends PrimitiveProps {
  /**
   * The name of the field. Submitted with its owning form as part of a
   * name/value pair, and used to match server `errors` on a `FormRoot`.
   */
  name?: string
  /** When `true`, prevents the user from interacting with the field's control. */
  disabled?: boolean
  /** When `true`, indicates that the user must set the value before the owning form can be submitted. */
  required?: boolean
  /**
   * Controls the invalid state. When provided, it takes precedence over the
   * field's own validation (native `ValidityState` + `validate`) and any
   * server error surfaced by an ancestor `FormRoot`.
   */
  invalid?: boolean
  /**
   * Custom validation function. Return an error message (or array of
   * messages) when invalid, or `null`/`undefined` when valid. Can be async.
   */
  validate?: FieldValidateFn
  /**
   * When the field (re-)runs validation.
   * @defaultValue "onSubmit"
   */
  validationMode?: FieldValidationMode
  /** Debounce (in ms) applied before running validation. */
  validationDebounceMs?: number
}

export type FieldRootEmits = object

/**
 * Describes a control interaction reported to `handleControlBlur`/
 * `handleControlInput`. `element` is used to read `.value`/`ValidityState`
 * for native form elements; `value` lets non-native controls (e.g. `Select`,
 * whose focusable element doesn't carry the selected value) report their
 * actual value directly. When both are omitted, `getElementValue` falls
 * through to `undefined`.
 */
export interface FieldControlDetail {
  element?: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  value?: unknown
}

export interface FieldRootContext {
  /** Id to associate the control with `FieldLabel` (`for`/`id`). */
  fieldId: Ref<string>
  /** Id of the `FieldLabel`. */
  labelId: Ref<string>
  name: Ref<string | undefined>
  disabled: Ref<boolean>
  required: Ref<boolean>
  /** `true` once the field is known to be invalid (controlled, validated, or server error). */
  invalid: Ref<boolean>
  /** `true` once the field has a definitive valid/invalid state to report (gates `data-valid`/`data-invalid`). */
  hasValidated: Ref<boolean>
  /** All current error messages (custom `validate` + server errors), in that order. */
  errors: Ref<string[]>
  /** The control's native `ValidityState`, when the control is a native form element. */
  validity: Ref<ValidityState | undefined>
  touched: Ref<boolean>
  dirty: Ref<boolean>
  filled: Ref<boolean>
  focused: Ref<boolean>
  /** Accumulated `aria-describedby` value from registered `FieldDescription`/`FieldError` parts. */
  describedBy: Ref<string | undefined>
  /** Registers a description/error part's id. Returns an unregister function. */
  registerDescription: (id: string) => () => void
  reportControlState: (state: { focused?: boolean, filled?: boolean, dirty?: boolean, touched?: boolean }) => void
  /** Called by `FieldControl` (or a participating pilot control) on focus. */
  handleControlFocus: () => void
  /**
   * Called on blur. Pass the native element (for `ValidityState` + reading
   * its `.value`), an explicit `value` (for non-native controls, e.g.
   * `Select`), or omit entirely for a "bare" state-only ping — a bare call
   * never touches `filled`.
   */
  handleControlBlur: (detail?: FieldControlDetail) => void
  /** Called on input/value-change. Same `detail` semantics as `handleControlBlur`. */
  handleControlInput: (detail?: FieldControlDetail) => void
  /** Registers the control's element, so the field can focus it (e.g. on invalid submit). */
  setControlElement: (element: HTMLElement | undefined) => void
  /** Runs validation immediately regardless of `validationMode`. Returns whether the field is valid. */
  validateNow: () => Promise<boolean>
  /** Clears touched/dirty/filled/errors/validity — used on native `<form>` reset. */
  resetField: () => void
}

export const [injectFieldRootContext, provideFieldRootContext]
  = createContext<FieldRootContext>('FieldRoot')
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRefs, watch } from 'vue'
import { injectFormRootContext } from '@/Form/FormRoot.vue'
import { Primitive } from '@/Primitive'
import { useFieldValidation } from './useFieldValidation'

const props = withDefaults(defineProps<FieldRootProps>(), {
  validationMode: 'onSubmit',
  // Vue casts an omitted `Boolean`-typed prop to `false` rather than leaving
  // it `undefined` ("boolean casting"). An explicit `undefined` default here
  // suppresses that cast so `props.invalid === undefined` reliably means
  // "uncontrolled" — required to distinguish it from an explicit `false`.
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

useForwardExpose()

const fieldId = ref(useId(undefined, 'reka-field'))
const labelId = ref(useId(undefined, 'reka-field-label'))

const touched = ref(false)
const dirty = ref(false)
const filled = ref(false)
const focused = ref(false)

const controlElement = ref<HTMLElement>()

const validateRef = computed(() => props.validate)
const validationModeRef = computed(() => props.validationMode ?? 'onSubmit')
const validationDebounceMsRef = computed(() => props.validationDebounceMs)

const {
  customErrors,
  validity,
  hasValidated,
  invalid: validationInvalid,
  triggerValidation,
  setNativeValidity,
  reset: resetValidation,
} = useFieldValidation({
  validate: validateRef,
  validationMode: validationModeRef,
  validationDebounceMs: validationDebounceMsRef,
})

// --- Optional participation in a `FormRoot` ancestor (server errors) ---
const formContext = injectFormRootContext(null)

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

const invalid = computed(() => props.invalid ?? (validationInvalid.value || hasServerError.value))
const hasRun = computed(() => props.invalid !== undefined || hasServerError.value || hasValidated.value)

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

function getElementValue(element?: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  if (!element)
    return undefined
  return 'value' in element ? element.value : undefined
}

// A native control (barred from constraint validation — e.g. a plain
// `<button type="button">`, which is what a `Select` trigger renders as)
// reports `validity.valid === true` vacuously. Reading that into
// `setNativeValidity` would stamp a false `data-valid` before any real
// validation ran, so only trust `validity` when the element actually
// participates in constraint validation.
function canReadValidity(element?: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return Boolean(element && 'validity' in element && element.willValidate)
}

function resolveDetailValue(detail?: FieldControlDetail) {
  if (!detail)
    return undefined
  return detail.value ?? getElementValue(detail.element)
}

// The last value seen through `handleControlBlur`/`handleControlInput`.
// Native `FieldControl` inputs don't strictly need this (their live DOM value
// is always readable straight off `controlElement`), but a non-native
// control like `Select` registers its *trigger* (a button) as the control
// element — which doesn't carry the selected value — so `validateNow` (run
// by `FormRoot` on submit, regardless of `validationMode`) needs a value
// reported through this side channel instead.
const lastKnownValue = ref<unknown>(undefined)

function handleControlFocus() {
  reportControlState({ focused: true })
}

// Validation timing (native `ValidityState` sync + custom `validate()`) is
// governed by `validationMode` — plain state bookkeeping (touched/dirty/
// filled/focused) is not, and always reflects every interaction. A "bare"
// call (no `detail` at all) is a state-only ping and must not clobber
// `filled` — only a real `detail` (even an empty `{}`) does that.
function handleControlBlur(detail?: FieldControlDetail) {
  if (detail !== undefined)
    lastKnownValue.value = resolveDetailValue(detail)

  reportControlState({
    focused: false,
    touched: true,
    ...(detail !== undefined ? { filled: Boolean(resolveDetailValue(detail)) } : {}),
  })

  if (validationModeRef.value === 'onBlur' || validationModeRef.value === 'onChange') {
    if (canReadValidity(detail?.element))
      setNativeValidity(detail.element.validity)
    triggerValidation(resolveDetailValue(detail), true)
  }
}

function handleControlInput(detail?: FieldControlDetail) {
  if (detail !== undefined)
    lastKnownValue.value = resolveDetailValue(detail)

  reportControlState({
    dirty: true,
    ...(detail !== undefined ? { filled: Boolean(resolveDetailValue(detail)) } : {}),
  })

  // Editing the field dismisses a previously shown server error for it.
  clearedServerError.value = true

  if (validationModeRef.value === 'onChange') {
    if (canReadValidity(detail?.element))
      setNativeValidity(detail.element.validity)
    triggerValidation(resolveDetailValue(detail))
  }
}

function setControlElement(element: HTMLElement | undefined) {
  controlElement.value = element
}

async function validateNow(): Promise<boolean> {
  const element = controlElement.value as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | undefined
  if (canReadValidity(element))
    setNativeValidity(element.validity)

  const value = lastKnownValue.value !== undefined ? lastKnownValue.value : getElementValue(element)
  await triggerValidation(value, true)

  return props.invalid === undefined ? !(validationInvalid.value || hasServerError.value) : !props.invalid
}

function resetField() {
  touched.value = false
  dirty.value = false
  filled.value = false
  focused.value = false
  clearedServerError.value = true
  lastKnownValue.value = undefined
  resetValidation()
}

let unregisterFromForm: (() => void) | undefined
onMounted(() => {
  unregisterFromForm = formContext?.registerField({
    name,
    validateNow,
    focusControl: () => controlElement.value?.focus(),
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
  invalid,
  hasValidated: hasRun,
  errors,
  validity,
  touched,
  dirty,
  filled,
  focused,
  describedBy,
  registerDescription,
  reportControlState,
  handleControlFocus,
  handleControlBlur,
  handleControlInput,
  setControlElement,
  validateNow,
  resetField,
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :data-disabled="disabled ? '' : undefined"
    :data-valid="hasRun && !invalid ? '' : undefined"
    :data-invalid="hasRun && invalid ? '' : undefined"
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
