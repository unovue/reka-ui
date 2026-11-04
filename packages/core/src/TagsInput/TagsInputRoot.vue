<script lang="ts">
import type { Ref, ShallowRef } from 'vue'
import type { TagsInputChangeReason } from './useTagsInput'
import type { FieldControlBinding } from '@/Field/useFieldControl'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { KeyedSelector } from '@/shared/createKeyedSelector'
import type { Direction, FormFieldProps } from '@/shared/types'
import { createContext, useDirection, useFormControl, useForwardElement } from '@/shared'

export type AcceptableInputValue = string | number | bigint | Record<string, any>

export interface TagsInputRootProps<T = AcceptableInputValue> extends PrimitiveProps, FormFieldProps {
  /** The controlled value of the tags input. Can be bind as `v-model`. */
  modelValue?: Array<T> | null
  /** The value of the tags that should be added. Use when you do not need to control the state of the tags input */
  defaultValue?: Array<T>
  /** When `true`, allow adding tags on paste. Work in conjunction with delimiter prop. */
  addOnPaste?: boolean
  /** When `true` allow adding tags on tab keydown */
  addOnTab?: boolean
  /** When `true` allow adding tags blur input */
  addOnBlur?: boolean
  /** When `true`, allow duplicated tags. */
  duplicate?: boolean
  /** When `true`, prevents the user from interacting with the tags input. */
  disabled?: boolean
  /** The character or regular expression to trigger the addition of a new tag. Also used to split tags for `@paste` event */
  delimiter?: string | RegExp
  /** The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** Maximum number of tags. */
  max?: number
  id?: string
  /** Convert the input value to the desired type. Mandatory when using objects as values and using `TagsInputInput` */
  convertValue?: (value: string) => T
  /** Display the value of the tag. Useful when you want to apply modifications to the value like adding a suffix or when using object as values */
  displayValue?: (value: T) => string
}

export type TagsInputRootEmits<T = AcceptableInputValue> = {
  /** Event handler called before the tags change; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [payload: Array<T>, details: ChangeEventDetails<TagsInputChangeReason>]
  /** Event handler called when the value changes */
  'update:modelValue': [payload: Array<T>, details: ChangeEventDetails<TagsInputChangeReason>]
  /** Event handler called when the value is invalid */
  'invalid': [payload: T]
  /** Event handler called when tag is added */
  'addTag': [payload: T]
  /** Event handler called when tag is removed */
  'removeTag': [payload: T]
}

type Reason = TagsInputChangeReason | BaseChangeReason

export interface TagsInputRootContext<T = AcceptableInputValue> {
  /** Read-only: change the tags through `onAddValue` / `onRemoveValue` / `onClear`. */
  modelValue: Readonly<Ref<Array<T>>>
  /** Adds a tag from input text; returns `true` when it was added. */
  onAddValue: (payload: string, reason?: Reason, event?: Event) => boolean
  /** Adds several tags as one change (a paste); returns `true` when at least one was added. */
  onAddValues: (payloads: string[], reason?: Reason, event?: Event) => boolean
  /** Removes the tag at `index`; returns `false` when out of range, unchanged or cancelled. */
  onRemoveValue: (index: number, reason?: Reason, event?: Event) => boolean
  /** Removes every tag; returns `false` when already empty or cancelled. */
  onClear: (reason?: Reason, event?: Event) => boolean
  onInputKeydown: (event: KeyboardEvent) => void
  selectedElement: Ref<HTMLElement | undefined>
  /** `selectedElement` as a keyed selector: tags read their own cell. */
  selected?: KeyedSelector<HTMLElement>
  isInvalidInput: Ref<boolean>
  addOnPaste: Ref<boolean>
  addOnTab: Ref<boolean>
  addOnBlur: Ref<boolean>
  disabled: Ref<boolean>
  delimiter: Ref<string | RegExp>
  dir: Ref<Direction>
  max: Ref<number>
  id: Ref<string | undefined> | undefined
  displayValue: (value: T) => string
}

export const [injectTagsInputRootContext, provideTagsInputRootContext]
  = createContext<TagsInputRootContext>('TagsInputRoot')

/**
 * A tags input's participation in an ancestor `FieldRoot`: the root owns the
 * tags and the registration, `TagsInputInput` carries the field's id, label
 * and aria wiring. `null` outside a Field.
 * @internal
 */
export interface TagsInputFieldContext {
  field: FieldControlBinding
  /**
   * The `TagsInputInput` element: the `input`, or a wrapper rendering one. The
   * inner input is resolved on each read, as slot content can replace it.
   */
  inputElement: ShallowRef<HTMLElement | undefined>
}

export const [injectTagsInputFieldContext, provideTagsInputFieldContext]
  = createContext<TagsInputFieldContext | null>('TagsInputRoot', 'TagsInputFieldContext')

/** The `input` a `TagsInputInput` element is, or renders. */
function resolveFieldInput(element: HTMLElement | undefined) {
  return (element?.nodeName === 'INPUT' ? element : element?.querySelector('input') ?? undefined) as HTMLInputElement | undefined
}
</script>

<script setup lang="ts" generic="T extends AcceptableInputValue = string">
import { useFocusWithin } from '@vueuse/core'
import { mergeProps, nextTick, shallowRef, watch } from 'vue'
import { useCollection, useCollectionSlot } from '@/Collection'
import { useFieldControl } from '@/Field/useFieldControl'
import { useFieldFocusWithin } from '@/Field/useFieldFocusWithin'
import { renderAs } from '@/Primitive/renderAs'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useTagsInput } from './useTagsInput'

defineOptions({
  // `$attrs` are merged under the root's own bindings: the precedence the
  // former `CollectionSlot` wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TagsInputRootProps<T>>(), {
  defaultValue: () => [],
  delimiter: ',',
  max: 0,
  displayValue: (value: T) => value.toString(),
})
const emits = defineEmits<TagsInputRootEmits<T>>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: Array<T>
  }) => any
}>()

const dir = useDirection(() => props.dir)

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const { focused } = useFocusWithin(currentElement)
const isFormControl = useFormControl(currentElement)

const { getItems } = useCollection({ isProvider: true })
useCollectionSlot(currentElement)

// Optional Field participation: `null` outside a `FieldRoot`, so every
// binding below is inert without a Field. The root owns the tags;
// `TagsInputInput` carries the field's id, label and aria wiring.
const fieldInput = shallowRef<HTMLElement>()
const field = useFieldControl({
  // The input renders `id` (or its own), else the field's.
  id: () => resolveFieldInput(fieldInput.value)?.id || props.id,
  element: () => resolveFieldInput(fieldInput.value),
  getValue: () => modelValue.value,
  required: () => props.required,
})
// Getters rather than computeds: cheap, and free for a standalone tags input.
const resolvedName = () => field ? field.name(props.name) : props.name
const resolvedRequired = () => field ? field.required(props.required) : props.required
const resolvedDisabled = () => field ? field.disabled(props.disabled) : props.disabled

// Controlled/uncontrolled + `beforeUpdate:` / `update:` emits live in the
// composable's `useControllableState` (`modelValue === undefined` → uncontrolled).
const { modelValue, root, context } = useTagsInput<T>({
  // Getters, so a later `convertValue` / `displayValue` prop change is picked up.
  get convertValue() { return props.convertValue },
  displayValue: (value: T) => props.displayValue(value),
  modelValue: () => props.modelValue,
  defaultValue: () => props.defaultValue,
  addOnPaste: () => props.addOnPaste,
  addOnTab: () => props.addOnTab,
  addOnBlur: () => props.addOnBlur,
  duplicate: () => props.duplicate,
  disabled: resolvedDisabled,
  delimiter: () => props.delimiter,
  dir,
  max: () => props.max,
  id: () => field ? (props.id ?? field.context.fieldId.value) : props.id,
  focused,
  getItems: () => getItems() as { ref: HTMLElement, value?: T }[],
  emit: emits,
  // The Field hears its own commits by reason (`change`): user input, or, for
  // a programmatic one (`setModelValue` and the like), only the watcher below,
  // which also reports a parent-driven change.
  onUpdate: field?.change,
})

provideTagsInputRootContext(context as unknown as TagsInputRootContext)
provideTagsInputFieldContext(field ? { field, inputElement: fieldInput } : null)

if (field)
  watch(modelValue, value => field.sync(value))

// The field is focused while focus is anywhere in the tags input (the input,
// a tag, a delete button), and blurred once it leaves. With `addOnBlur`, the
// blur adds the typed tag first, which a controlled parent applies on the next
// render: report the blur after it, so `onBlur` validation sees the new tag.
const focusWithin = useFieldFocusWithin(field && {
  ...field,
  onBlur: () => nextTick(() => {
    // Unless focus came back in the meantime.
    if (!focusWithin!.isFocusWithin())
      field.onBlur()
  }),
}, currentElement as Ref<HTMLElement | undefined>)
const fieldFocusHandlers = focusWithin && { onFocusin: focusWithin.onFocusin, onFocusout: focusWithin.onFocusout }
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-bind="fieldFocusHandlers ? mergeProps($attrs, root.attrs.value, fieldFocusHandlers) : mergeProps($attrs, root.attrs.value)"
    :ref="forwardRef"
  >
    <slot :model-value="modelValue" />

    <VisuallyHiddenInput
      v-if="isFormControl && resolvedName()"
      :name="resolvedName()!"
      :value="modelValue"
      :required="resolvedRequired()"
      :disabled="resolvedDisabled()"
    />
  </component>
</template>
