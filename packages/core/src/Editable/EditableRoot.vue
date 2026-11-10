<script lang="ts">
import type { Ref, ShallowRef } from 'vue'
import type { EditableChangeReason } from './useEditable'
import type { FieldControlBinding } from '@/Field/useFieldControl'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { Direction, FormFieldProps } from '@/shared/types'
import { createContext, mergeExpose, useDirection, useFormControl, useForwardElement } from '@/shared'

export type ActivationMode = 'focus' | 'dblclick' | 'none'
export type SubmitMode = 'blur' | 'enter' | 'none' | 'both'
export type EditableState = 'edit' | 'submit' | 'cancel'

export type EditableRootContext = {
  id: Ref<string | undefined>
  name: Ref<string | undefined>
  maxLength: Ref<number | undefined>
  disabled: Ref<boolean>
  /** Read-only: commit a value through `submit()`. */
  modelValue: Readonly<Ref<string | null | undefined>>
  inputValue: Ref<string | null | undefined>
  placeholder: Ref<{ edit: string, preview: string }>
  isEditing: Ref<boolean>
  submitMode: Ref<SubmitMode>
  activationMode: Ref<ActivationMode>
  selectOnFocus: Ref<boolean>
  edit: () => void
  cancel: () => void
  /** Commits the draft. Returns `false` when `beforeUpdate:modelValue` cancelled it (edit mode stays on). */
  submit: (reason?: EditableChangeReason | BaseChangeReason, event?: Event) => boolean
  inputRef: Ref<HTMLInputElement | undefined>
  startWithEditMode: Ref<boolean>
  isEmpty: Ref<boolean>
  readonly: Ref<boolean>
  autoResize: Ref<boolean>
}

export interface EditableRootProps extends PrimitiveProps, FormFieldProps {
  /** The default value of the editable field */
  defaultValue?: string
  /** The value of the editable field */
  modelValue?: string | null
  /** The placeholder for the editable field */
  placeholder?: string | { edit: string, preview: string }
  /** The reading direction of the calendar when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** Whether the editable field is disabled */
  disabled?: boolean
  /** Whether the editable field is read-only */
  readonly?: boolean
  /** The activation event of the editable field */
  activationMode?: ActivationMode
  /** Whether to select the text in the input when it is focused. */
  selectOnFocus?: boolean
  /** The submit event of the editable field */
  submitMode?: SubmitMode
  /** Whether to start with the edit mode active */
  startWithEditMode?: boolean
  /** The maximum number of characters allowed */
  maxLength?: number
  /** Whether the editable field should auto resize */
  autoResize?: boolean
  /** The id of the field */
  id?: string
}

export type EditableRootEmits = {
  /** Event handler called before a submitted value is committed; `details.cancel()` vetoes it and keeps edit mode on. */
  'beforeUpdate:modelValue': [value: string, details: ChangeEventDetails<EditableChangeReason>]
  /** Event handler called whenever the model value changes */
  'update:modelValue': [value: string, details: ChangeEventDetails<EditableChangeReason>]
  /** Event handler called when a value is submitted */
  'submit': [value: string | null | undefined]
  /** Event handler called when the editable field changes state */
  'update:state': [state: EditableState]
}

export const [injectEditableRootContext, provideEditableRootContext]
  = createContext<EditableRootContext>('EditableRoot')

/** @internal The root's Field binding, for the parts. Only provided inside a `FieldRoot`. */
export interface EditableFieldControl {
  binding: FieldControlBinding
  /** Set by `EditablePreview`: focused (rather than the hidden input) while previewing. */
  preview: ShallowRef<HTMLElement | undefined>
}

/** @internal */
export const [injectEditableFieldControl, provideEditableFieldControl]
  = createContext<EditableFieldControl | null>('EditableRoot', 'EditableFieldControl')
</script>

<script setup lang="ts">
import { mergeProps, ref, shallowRef, watch } from 'vue'
import { useFocusOutside, usePointerDownOutside } from '@/DismissableLayer'
import { createPendingFieldInput } from '@/Field/pendingFieldInput'
import { useFieldControl } from '@/Field/useFieldControl'
import { useFieldFocusWithin } from '@/Field/useFieldFocusWithin'
import { Primitive } from '@/Primitive'
import { vFormReset } from '@/shared/formReset'
import { resetControllableState } from '@/shared/useControllableState'
import { VisuallyHidden, VisuallyHiddenInput } from '@/VisuallyHidden'
import { useEditable } from './useEditable'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<EditableRootProps>(), {
  as: 'div',
  disabled: false,
  submitMode: 'blur',
  activationMode: 'focus',
  selectOnFocus: false,
  placeholder: 'Enter text...',
  autoResize: false,
  required: false,
})

const emits = defineEmits<EditableRootEmits>()
defineSlots<{
  default?: (props: {
    /** Whether the editable field is in edit mode */
    isEditing: boolean
    /** The value of the editable field */
    modelValue: typeof modelValue.value
    /** Whether the editable field is empty */
    isEmpty: boolean
    /** Function to submit the value of the editable. Bound as a listener (`@click="submit"`), the change reports `'submit-press'`. */
    submit: (event?: Event) => void
    /** Function to cancel the value of the editable */
    cancel: () => void
    /** Function to set the editable in edit mode */
    edit: () => void
  }) => any
}>()

// `dir` resolution (ConfigProvider-aware) stays in the shell.
const dir = useDirection(() => props.dir)
const { forwardRef, currentElement, expose } = useForwardElement()
const isFormControl = useFormControl(currentElement)

// Optional Field participation: `null` outside a `FieldRoot`, so every binding
// below is inert without a Field. The editable input is hidden while
// previewing, so a label can't point at it: as with the date fields, a hidden
// native input takes the field's id and forwards focus (to the preview, or to
// the input while editing). The input carries the label, description and
// invalid state; the field is touched when focus leaves the whole editable.
// The value collected is the submitted string, not the draft.
const nativeInput = ref<InstanceType<typeof VisuallyHidden>>()
// Created only inside a Field, so a standalone editable doesn't allocate it.
let previewElement: EditableFieldControl['preview'] | undefined
const field = useFieldControl({
  id: () => props.id,
  element: () => (isEditing.value ? context.inputRef.value : previewElement?.value) ?? context.inputRef.value,
  getValue: () => modelValue.value,
  validityElement: () => nativeInput.value?.$el as HTMLInputElement | undefined,
})
if (field)
  previewElement = shallowRef()
const resolvedName = field ? () => field.name(props.name) : () => props.name
const resolvedDisabled = field ? () => field.disabled(props.disabled) : () => props.disabled

const { modelValue, isEditing, isEmpty, edit, cancel, submit, dismiss, root, context, isControlled } = useEditable({
  modelValue: () => props.modelValue,
  defaultValue: () => props.defaultValue,
  placeholder: () => props.placeholder,
  dir,
  disabled: resolvedDisabled,
  readonly: () => props.readonly,
  activationMode: () => props.activationMode,
  selectOnFocus: () => props.selectOnFocus,
  submitMode: () => props.submitMode,
  startWithEditMode: () => props.startWithEditMode,
  maxLength: () => props.maxLength,
  autoResize: () => props.autoResize,
  id: () => field ? field.id() : props.id,
  name: resolvedName,
  emit: emits,
  // A submit by the user (a part, Enter, a dismiss, a slot `submit` bound to
  // a click) is input; a programmatic one (`submit()` from a ref) and a
  // parent-driven change are reported through the watcher below as `filled`.
  onUpdate: field
    ? (value, details) => pendingInput!.record(value, details)
    : undefined,
})

// The value of a user's submit, reported once the hidden input has rendered it.
const pendingInput = field ? createPendingFieldInput<string | null | undefined>() : undefined
// Touched once focus leaves the whole editable, not when it moves from the
// preview to the input. A blur can submit the draft (`submitMode`), through a
// focus-outside check that settles a couple of ticks later, so the blur is
// reported after that: on-blur validation then reads the submitted value.
const focusWithin = useFieldFocusWithin(field && {
  ...field,
  onBlur: () => setTimeout(() => {
    if (!focusWithin!.isFocusWithin())
      field.onBlur()
  }),
}, currentElement as Ref<HTMLElement | undefined>)

if (field) {
  provideEditableFieldControl({ binding: field, preview: previewElement! })
  watch(modelValue, (value) => {
    const pending = pendingInput!.take()
    if (pending && Object.is(pending.value, value))
      field.input(value)
    else
      field.sync(value)
  }, { flush: 'post' })
}

function focusControl() {
  (isEditing.value ? context.inputRef.value : previewElement?.value)?.focus()
}

// The Field's state attributes go first, so the root's own and the consumer's win.
function getRootAttrs(attrs: Record<string, unknown>) {
  if (!field)
    return mergeProps(root.attrs.value, attrs)
  return mergeProps(
    field.dataAttributes(),
    root.attrs.value,
    attrs,
    { onFocusin: focusWithin!.onFocusin, onFocusout: focusWithin!.onFocusout },
  )
}

// Outside detection is DOM-bound (DismissableLayer utilities), so it stays in the shell.
const pointerDownOutside = usePointerDownOutside(event => dismiss('outside-press', event), currentElement, isEditing)
useFocusOutside(event => dismiss('focus-outside', event), currentElement, isEditing)

// Takes only an event, never a reason: called bare (a template ref) it reports
// `'imperative-action'`; bound as a listener (`@click="submit"` in the slot) it
// receives the user's event and reports `'submit-press'`.
function submitImperative(event?: Event) {
  if (event instanceof Event)
    submit('submit-press', event)
  else
    submit()
}

defineExpose(mergeExpose(expose, {
  /** Function to submit the value of the editable */
  submit: submitImperative,
  /** Function to cancel the value of the editable */
  cancel,
  /** Function to set the editable in edit mode */
  edit,
}))

provideEditableRootContext(context)

// A native reset of the owning form puts the value back to `defaultValue`,
// and a draft being edited back to the value.
function onFormReset(event: Event) {
  resetControllableState(isControlled, event)
  context.inputValue.value = modelValue.value
}
</script>

<template>
  <Primitive
    v-bind="getRootAttrs($attrs)"
    :ref="forwardRef"
    v-form-reset="onFormReset"
    :as="as"
    :as-child="asChild"
    data-dismissable-layer
    @pointerdown.capture="pointerDownOutside.onPointerDownCapture"
  >
    <slot
      :model-value="modelValue"
      :is-editing="isEditing"
      :is-empty="isEmpty"
      :submit="submitImperative"
      :cancel="cancel"
      :edit="edit"
    />

    <VisuallyHidden
      v-if="field"
      :id="field.id()"
      ref="nativeInput"
      as="input"
      feature="focusable"
      aria-hidden="true"
      tabindex="-1"
      :value="modelValue ?? ''"
      :name="resolvedName()"
      :disabled="resolvedDisabled()"
      :required="field ? field.required(required) : required"
      @focus="focusControl"
    />
    <VisuallyHiddenInput
      v-else-if="isFormControl && name"
      type="text"
      :value="modelValue"
      :name="name"
      :disabled="disabled"
      :required="required"
    />
  </Primitive>
</template>
