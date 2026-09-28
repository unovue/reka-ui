<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { FieldValidationMode } from '@/Field/useFieldValidation'
import type { PrimitiveProps } from '@/Primitive'
import { createContext, useForwardExpose } from '@/shared'

export interface FormRootProps extends PrimitiveProps {
  /**
   * A map of field `name` to server-side error message(s). Displayed by the
   * matching `FieldRoot`'s `FieldError` until the user edits that field, or a
   * new value for that key is provided.
   */
  errors?: Record<string, string | string[]>
  /**
   * When fields validate. The `validationMode` of a `FieldRoot` takes precedence over this.
   * - `onSubmit`: when the form is submitted, then on every change after that.
   * - `onBlur`: when a control loses focus.
   * - `onChange`: on every change to a control's value.
   * @defaultValue "onSubmit"
   */
  validationMode?: FieldValidationMode
}

export type FormRootEmits = {
  /**
   * Emitted with the native submit event once every field has validated
   * successfully. When any field is invalid, the native submission is
   * prevented and this isn't emitted. Otherwise the form submits natively
   * (e.g. to its `action`) unless you call `event.preventDefault()`, or
   * listen to `formSubmit`.
   */
  submit: [event: SubmitEvent]
  /**
   * Emitted after `submit` with the values of every named field. Listening
   * to it prevents the native submission.
   */
  formSubmit: [values: Record<string, unknown>, event: SubmitEvent]
}

export interface FormRegisteredField {
  name: Ref<string | undefined>
  /** Runs the field's validation now. Returns whether it's valid. */
  validate: () => boolean
  invalid: ComputedRef<boolean>
  getValue: () => unknown
  getControlElement: () => HTMLElement | undefined
  resetField: () => void
}

export interface FormRootContext {
  serverErrors: ComputedRef<Record<string, string | string[]>>
  validationMode: ComputedRef<FieldValidationMode>
  /** How many times the form has been submitted. */
  submitCount: Ref<number>
  /** The values of every named field. */
  getValues: () => Record<string, unknown>
  registerField: (field: FormRegisteredField) => () => void
}

export const [injectFormRootContext, provideFormRootContext]
  = createContext<FormRootContext>('FormRoot')
</script>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, ref, watch } from 'vue'
import { Primitive } from '@/Primitive'

const props = withDefaults(defineProps<FormRootProps>(), {
  as: 'form',
  validationMode: 'onSubmit',
})
const emit = defineEmits<FormRootEmits>()

const instance = getCurrentInstance()

function validate(fieldName?: string) {
  const targets = fieldName
    ? Array.from(fields).filter(field => field.name.value === fieldName)
    : Array.from(fields)
  // Validate every field (no short-circuit), so each one shows its errors.
  return targets.map(field => field.validate()).every(Boolean)
}

defineExpose({
  /** Validates every field, or only the field with the given `name`. Returns whether they're all valid. */
  validate,
})
useForwardExpose()

const serverErrors = computed(() => props.errors ?? {})
const validationMode = computed(() => props.validationMode)
const submitCount = ref(0)

const fields = new Set<FormRegisteredField>()

function registerField(field: FormRegisteredField) {
  fields.add(field)
  return () => {
    fields.delete(field)
  }
}

function getValues() {
  const values: Record<string, unknown> = {}
  fields.forEach((field) => {
    if (field.name.value)
      values[field.name.value] = field.getValue()
  })
  return values
}

/**
 * Focuses the control of the first invalid field in document order, since
 * registration order can diverge from it (fields mounted later, reordered
 * lists). Returns whether any field is invalid.
 */
function focusFirstInvalid() {
  let hasInvalid = false
  let first: HTMLElement | undefined
  fields.forEach((field) => {
    if (!field.invalid.value)
      return
    hasInvalid = true
    const element = field.getControlElement()
    if (element && (!first || first.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING))
      first = element
  })

  if (first) {
    first.focus()
    if (first instanceof HTMLInputElement)
      first.select()
  }
  return hasInvalid
}

// Set on a valid submit, so server `errors` arriving in response focus the
// first field they invalidate.
let awaitingServerErrors = false

watch(serverErrors, async () => {
  if (!awaitingServerErrors)
    return
  awaitingServerErrors = false
  await nextTick()
  focusFirstInvalid()
})

function handleSubmit(event: Event) {
  submitCount.value++

  // Async `validate` functions can't hold up the native submit event, so
  // only synchronous results (native constraints, sync `validate`, server
  // errors, `invalid`) gate it — matching Base UI.
  validate()
  if (focusFirstInvalid()) {
    event.preventDefault()
    return
  }

  awaitingServerErrors = true
  emit('submit', event as SubmitEvent)

  if (instance?.vnode.props?.onFormSubmit) {
    event.preventDefault()
    emit('formSubmit', getValues(), event as SubmitEvent)
  }
}

function handleReset() {
  fields.forEach(field => field.resetField())
}

provideFormRootContext({
  serverErrors,
  validationMode,
  submitCount,
  getValues,
  registerField,
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    novalidate
    @submit="handleSubmit"
    @reset="handleReset"
  >
    <slot />
  </Primitive>
</template>
