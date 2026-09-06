<script lang="ts">
import type { EventHook } from '@vueuse/core'
import type { ComputedRef, Ref } from 'vue'
import type { ListboxChangeReason, ListboxLabelRegistry, ListboxNavigationIntent } from './useListbox'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { AcceptableValue, DataOrientation, Direction, FormFieldProps } from '@/shared/types'
import { usePrimitiveElement } from '@/Primitive'
import { createContext, useDirection, useFormControl } from '@/shared'
import { Primitive } from '..'

export type ListboxRootContext<T> = {
  modelValue: Ref<T | Array<T> | undefined>
  /** Returns `false` when the value is unchanged or the change was cancelled. */
  onValueChange: (val: T, reason?: ListboxChangeReason | BaseChangeReason, event?: Event) => boolean
  multiple: Ref<boolean>
  orientation: Ref<DataOrientation>
  dir: Ref<Direction>
  disabled: Ref<boolean>
  highlightOnHover: Ref<boolean>
  highlightedElement: Ref<HTMLElement | null>
  isVirtual: Ref<boolean>
  virtualFocusHook: EventHook<{ event?: Event, scroll: boolean }>
  virtualKeydownHook: EventHook<KeyboardEvent>
  virtualHighlightHook: EventHook<any>
  by?: string | ((a: T, b: T) => boolean)
  firstValue?: Ref<T | undefined>
  selectionBehavior?: Ref<'toggle' | 'replace'>

  focusable: Ref<boolean>

  onLeave: (event: Event) => void
  onEnter: (event: Event) => void
  changeHighlight: (el: HTMLElement, scrollIntoView?: boolean, focus?: boolean) => void
  /** Returns `true` when the key was handled, so the caller prevents the default only then. */
  onKeydownNavigation: (event: KeyboardEvent) => boolean
  onKeydownEnter: (event: KeyboardEvent) => void
  onKeydownTypeAhead: (event: KeyboardEvent) => void
  onCompositionStart: () => void
  onCompositionEnd: () => void
  highlightFirstItem: () => void

  /** The sticky label registry (#2824): by-aware, last write wins, never auto-removed. */
  labels: ListboxLabelRegistry<T>
  highlightItem: (value: T) => void
  highlightSelected: (event?: Event, scroll?: boolean) => Promise<void>
  /** The resolved navigation intent of a keydown (`getNavigationIntent` override first, then the default mapping). */
  getNavigationIntent: (event: KeyboardEvent) => ListboxNavigationIntent | undefined
}

export const [injectListboxRootContext, provideListboxRootContext]
  = createContext<ListboxRootContext<AcceptableValue>>('ListboxRoot')

export interface ListboxRootProps<T = AcceptableValue> extends PrimitiveProps, FormFieldProps {
  /** The controlled value of the listbox. Can be binded with `v-model`. */
  modelValue?: T | Array<T>
  /** The value of the listbox when initially rendered. Use when you do not need to control the state of the Listbox */
  defaultValue?: T | Array<T>
  /** Whether multiple options can be selected or not. */
  multiple?: boolean
  /** The orientation of the listbox. <br>Mainly so arrow navigation is done accordingly (left & right vs. up & down) */
  orientation?: DataOrientation
  /** The reading direction of the listbox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** When `true`, prevents the user from interacting with listbox */
  disabled?: boolean
  /**
   * How multiple selection should behave in the collection.
   * @defaultValue 'toggle'
   */
  selectionBehavior?: 'toggle' | 'replace'
  /** When `true`, hover over item will trigger highlight */
  highlightOnHover?: boolean
  /** Use this to compare objects by a particular field, or pass your own comparison function for complete control over how objects are compared. */
  by?: string | ((a: T, b: T) => boolean)
  /**
   * Resolves what a keydown means for keyboard navigation. Return `undefined` to fall back to the default mapping
   * (arrows, Home, End, PageUp, PageDown — orientation and reading-direction aware), `null` to declare the key is not
   * a navigation key, or `'select'` to select the highlighted item as Enter does.
   */
  getNavigationIntent?: (event: KeyboardEvent) => ListboxNavigationIntent | null | undefined
}

export type ListboxRootEmits<T = AcceptableValue> = {
  /** Event handler called before the value changes; call `details.cancel()` to keep the current value. */
  'beforeUpdate:modelValue': [value: T, details: ChangeEventDetails<ListboxChangeReason>]
  /** Event handler called when the value changes. */
  'update:modelValue': [value: T, details: ChangeEventDetails<ListboxChangeReason>]
  /** Event handler when highlighted element changes. */
  'highlight': [payload: { ref: HTMLElement, value: T } | undefined]
  /** Event handler called when container is being focused. Can be prevented. */
  'entryFocus': [event: CustomEvent]
  /** Event handler called when the mouse leave the container */
  'leave': [event: Event]
}
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import { toRefs } from 'vue'
import { useCollection } from '@/Collection'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useListboxRoot } from './useListbox'

const props = withDefaults(defineProps<ListboxRootProps>(), {
  selectionBehavior: 'toggle',
  orientation: 'vertical',
})
const emits = defineEmits<ListboxRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current active value */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { dir: propDir } = toRefs(props)
const { getItems } = useCollection<{ value: T }>({ isProvider: true })
const { primitiveElement, currentElement } = usePrimitiveElement()
// `dir` resolution (ConfigProvider-aware) stays in the shell; the composable
// owns the model (`useControllableState` via `useListSelection`), the emits,
// the highlight/keyboard brain and the context.
const dir = useDirection(propDir)

const isFormControl = useFormControl(currentElement)

const listbox = useListboxRoot<AcceptableValue>({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  multiple: () => props.multiple,
  orientation: () => props.orientation,
  dir,
  disabled: () => props.disabled,
  selectionBehavior: () => props.selectionBehavior,
  highlightOnHover: () => props.highlightOnHover,
  by: props.by,
  getNavigationIntent: event => props.getNavigationIntent?.(event),
  // `useCollection` (the item registry) stays in the shell — injected as the collection seam.
  getItems,
  element: currentElement,
  emit: emits,
  onHighlight: payload => emits('highlight', payload),
  onEntryFocus: event => emits('entryFocus', event),
  onLeave: event => emits('leave', event),
})
const { root, context, highlightedElement, highlightFirstItem, highlightSelected } = listbox

// The composable is typed over `AcceptableValue` (the props are); narrow once
// here for the slot payload and the exposed `highlightItem`, as before.
const modelValue = listbox.modelValue as ComputedRef<T | T[] | undefined>
const highlightItem = listbox.highlightItem as (value: T) => void

defineExpose({
  highlightedElement,
  highlightItem,
  highlightFirstItem,
  highlightSelected,
  getItems,
})

provideListboxRootContext(context)
</script>

<template>
  <Primitive
    ref="primitiveElement"
    :as="as"
    :as-child="asChild"
    v-bind="root.attrs.value"
  >
    <slot :model-value="modelValue" />

    <VisuallyHiddenInput
      v-if="isFormControl && name"
      :name="name"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
    />
  </Primitive>
</template>
