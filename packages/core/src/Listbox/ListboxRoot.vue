<script lang="ts">
import type { EventHook } from '@vueuse/core'
import type { ComputedRef, Ref } from 'vue'
import type { ListboxChangeReason, ListboxFilterFunction, ListboxFilterItem, ListboxHighlightScroll, ListboxLabelRegistry, ListboxNavigationIntent, ListboxVirtualKeydown } from './useListbox'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { KeyedSelector } from '@/shared/createKeyedSelector'
import type { SelectionSelector } from '@/shared/selectionSelector'
import type { AcceptableValue, DataOrientation, Direction, FormFieldProps } from '@/shared/types'
import { usePrimitiveElement } from '@/Primitive'
import { createContext, mergeExpose, useDirection, useFormControl } from '@/shared'
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
  loop: Ref<boolean>
  highlightedElement: Ref<HTMLElement | null>
  /** `highlightedElement` as a keyed selector: items read their own cell. */
  highlight?: KeyedSelector<HTMLElement>
  /** The selection as a keyed selector: items read their own cell. */
  selection?: SelectionSelector<T>
  isVirtual: Ref<boolean>
  virtualFocusHook: EventHook<{ event?: Event, scroll: boolean }>
  virtualKeydownHook: EventHook<ListboxVirtualKeydown>
  virtualHighlightHook: EventHook<any>
  by?: string | ((a: T, b: T) => boolean)
  firstValue?: Ref<T | undefined>
  selectionBehavior?: Ref<'toggle' | 'replace'>

  focusable: Ref<boolean>

  onLeave: (event: Event) => void
  onEnter: (event: Event) => void
  changeHighlight: (el: HTMLElement, scrollIntoView?: boolean, focus?: boolean) => void
  /** Returns `true` when the key was handled, so the caller prevents the default only then. Pass an already-resolved `intent` to skip resolving it again. */
  onKeydownNavigation: (event: KeyboardEvent, intent?: ListboxNavigationIntent | null) => boolean
  onKeydownEnter: (event: KeyboardEvent) => void
  onKeydownTypeAhead: (event: KeyboardEvent) => void
  onCompositionStart: () => void
  onCompositionEnd: () => void
  highlightFirstItem: () => void

  /** The sticky label registry (#2824): by-aware, last write wins, never auto-removed. */
  labels: ListboxLabelRegistry<T>
  highlightItem: (value: T) => void
  highlightSelected: (event?: Event, scroll?: boolean) => Promise<void>
  /**
   * The resolved navigation intent of a keydown (`getNavigationIntent` override first, then the default mapping):
   * `null` when the override opted the key out, `undefined` when no mapping knows it.
   */
  getNavigationIntent: (event: KeyboardEvent) => ListboxNavigationIntent | null | undefined

  /** The search term the `filter` runs against (#2824 item 7). */
  filterSearch: Readonly<Ref<string>>
  /** What `ListboxFilter` calls with its value. */
  setFilterSearch: (search: string) => void
  /** `true` while a `filter` is set and the search term is not empty. */
  isFilterActive: Readonly<Ref<boolean>>
  /** Whether a value with this text matches; always `true` while filtering is inactive. */
  filterOption: (value: T, text: string) => boolean
  /** A mounted item registers here (keyed by an internal id); the returned function unregisters it. */
  registerFilterItem: (id: string, item: ListboxFilterItem<T>) => () => void
  /** Whether the registered item is filtered out (never in virtual mode, where the virtualizer filters its options). */
  isFilteredOut: (id: string) => boolean
  /** Whether every registered item of the group is filtered out. */
  isGroupFilteredOut: (groupId: string) => boolean
  /** Set by `ListboxVirtualizer` to its number of matching options. */
  virtualFilterCount: Ref<number | undefined>
}

export const [injectListboxRootContext, provideListboxRootContext]
  = createContext<ListboxRootContext<AcceptableValue>>('ListboxRoot')

export const [injectListboxHighlightScrollContext, provideListboxHighlightScrollContext]
  = createContext<ListboxHighlightScroll>('ListboxHighlightScroll')

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
  /** When `true`, keyboard navigation will loop from last item to first, and vice versa. */
  loop?: boolean
  /** Use this to compare objects by a particular field, or pass your own comparison function for complete control over how values are compared (a function runs for every value, strings included). Read once at setup: changing it after mount has no effect. */
  by?: string | ((a: T, b: T) => boolean)
  /**
   * Resolves what a keydown means for keyboard navigation. Return `undefined` to fall back to the default mapping
   * (arrows, Home, End, PageUp, PageDown — orientation and reading-direction aware), `null` to opt the key out (for
   * Enter this also skips the selection), or `'select'` to select the highlighted item as Enter does. `ListboxFilter`
   * never passes unmodified printable keys (they stay text input), and Space on a focused item already selects it, so a
   * `'select'` intent for Space does not select it twice.
   */
  getNavigationIntent?: (event: KeyboardEvent) => ListboxNavigationIntent | null | undefined
  /**
   * Filters the items by the `ListboxFilter` search term: called as `filter(text, search, value)` with the item's
   * `textValue` (or text content; in a `ListboxVirtualizer`, `textContent(option)`), it returns whether the item
   * matches. Items that do not match are not rendered, so keyboard navigation, typeahead and select-all skip them.
   * Omitted or `null`, the listbox does not filter (filter the items yourself, or on a server).
   */
  filter?: ListboxFilterFunction<T> | null
}

/**
 * The model of a listbox: an array when `multiple` is `true`, a single value (or `undefined` once a single selection
 * is cleared) when it is absent or `false`, either while it is a plain `boolean` (#2824 item 4).
 */
export type ListboxModelValue<T, M extends boolean = boolean> = boolean extends M ? T | T[] | undefined : M extends true ? T[] : T | undefined

export type ListboxRootEmits<T = AcceptableValue, M extends boolean = boolean> = {
  /** Event handler called before the value changes; call `details.cancel()` to keep the current value. The value is an array when `multiple`, and `undefined` when a single selection is cleared. */
  'beforeUpdate:modelValue': [value: ListboxModelValue<T, M>, details: ChangeEventDetails<ListboxChangeReason>]
  /** Event handler called when the value changes. */
  'update:modelValue': [value: ListboxModelValue<T, M>, details: ChangeEventDetails<ListboxChangeReason>]
  /** Event handler when highlighted element changes. */
  'highlight': [payload: { ref: HTMLElement, value: T } | undefined]
  /** Event handler called when container is being focused. Can be prevented. */
  'entryFocus': [event: CustomEvent]
  /** Event handler called when the mouse leave the container */
  'leave': [event: Event]
}
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue, M extends boolean = false">
import { ref, toRef, toRefs } from 'vue'
import { useCollection } from '@/Collection'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useListboxRoot } from './useListbox'

const props = withDefaults(defineProps<ListboxRootProps & { multiple?: M }>(), {
  selectionBehavior: 'toggle',
  orientation: 'vertical',
})
// Typed by `multiple` only (#2824 item 4); the props are not generic over `T`,
// so the value type stays `AcceptableValue` as in v2.
const emits = defineEmits<ListboxRootEmits<AcceptableValue, M>>()

defineSlots<{
  default?: (props: {
    /** Current active value */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { dir: propDir } = toRefs(props)
const { getItems, getItem } = useCollection<{ value: T }>({ isProvider: true })
const { primitiveElement, currentElement, expose } = usePrimitiveElement()
// `dir` resolution (ConfigProvider-aware) stays in the shell; the composable
// owns the model (`useControllableState` via `useListSelection`), the emits,
// the highlight/keyboard brain and the context.
const dir = useDirection(propDir)
const highlightScrollContext = injectListboxHighlightScrollContext(null)

// Prevent nested Listbox roots from inheriting this root's scroll coordination.
provideListboxHighlightScrollContext({
  suppressHighlightScroll: ref(false),
  onHighlightScrollRequest: () => {},
})

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
  loop: () => props.loop,
  by: props.by,
  getNavigationIntent: event => props.getNavigationIntent?.(event),
  filter: toRef(() => props.filter) as Ref<ListboxFilterFunction<AcceptableValue> | null | undefined>,
  // `useCollection` (the item registry) stays in the shell — injected as the collection seam.
  getItems,
  getItem,
  highlightScroll: highlightScrollContext,
  element: currentElement,
  emit: emits,
  onHighlight: payload => emits('highlight', payload),
  onEntryFocus: event => emits('entryFocus', event),
  onLeave: event => emits('leave', event),
})
const { root, context, highlightedElement, highlightFirstItem, highlightSelected, filterState } = listbox

// The composable is typed over `AcceptableValue` (the props are); narrow once
// here for the slot payload and the exposed `highlightItem`, as before.
const modelValue = listbox.modelValue as ComputedRef<ListboxModelValue<T, M>>
const highlightItem = listbox.highlightItem as (value: T) => void

defineExpose(mergeExpose(expose, {
  highlightedElement,
  highlightItem,
  highlightFirstItem,
  highlightSelected,
  getItems,
  /** The filtering result: `{ search, active, count }`. */
  filtered: filterState,
}))

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
