<script lang="ts">
import type { Ref } from 'vue'
import type { EditableChangeReason } from './useEditable'
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
</script>

<script setup lang="ts">
import { mergeProps, toRef } from 'vue'
import { useFocusOutside, usePointerDownOutside } from '@/DismissableLayer'
import { Primitive } from '@/Primitive'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
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
    /** Function to submit the value of the editable */
    submit: () => void
    /** Function to cancel the value of the editable */
    cancel: () => void
    /** Function to set the editable in edit mode */
    edit: () => void
  }) => any
}>()

// `dir` resolution (ConfigProvider-aware) stays in the shell.
const dir = useDirection(toRef(props, 'dir'))
const { forwardRef, currentElement, expose } = useForwardElement()
const isFormControl = useFormControl(currentElement)

const { modelValue, isEditing, isEmpty, edit, cancel, submit, dismiss, root, context } = useEditable({
  modelValue: () => props.modelValue,
  defaultValue: () => props.defaultValue,
  placeholder: () => props.placeholder,
  dir,
  disabled: () => props.disabled,
  readonly: () => props.readonly,
  activationMode: () => props.activationMode,
  selectOnFocus: () => props.selectOnFocus,
  submitMode: () => props.submitMode,
  startWithEditMode: () => props.startWithEditMode,
  maxLength: () => props.maxLength,
  autoResize: () => props.autoResize,
  id: () => props.id,
  name: () => props.name,
  emit: emits,
})

// Outside detection is DOM-bound (DismissableLayer utilities), so it stays in the shell.
const pointerDownOutside = usePointerDownOutside(event => dismiss('outside-press', event), currentElement, isEditing)
const focusOutside = useFocusOutside(event => dismiss('focus-outside', event), currentElement, isEditing)

// Zero-argument wrappers: a slot or template-ref caller binding `@click="submit"` reports `imperative-action`.
function submitImperative() {
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
</script>

<template>
  <Primitive
    v-bind="mergeProps(root.attrs.value, $attrs)"
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    data-dismissable-layer
    @focus.capture="focusOutside.onFocusCapture"
    @blur.capture="focusOutside.onBlurCapture"
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

    <VisuallyHiddenInput
      v-if="isFormControl && name"
      type="text"
      :value="modelValue"
      :name="name"
      :disabled="disabled"
      :required="required"
    />
  </Primitive>
</template>
