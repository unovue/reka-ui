<script lang="ts">
import type { EventHookOn } from '@vueuse/core'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { ComboboxChangeReason, ComboboxInteractionType, ComboboxItems, ComboboxOpenChangeReason } from './useCombobox'
import type { ListboxRootProps } from '@/Listbox'
import type { ListboxRootContext } from '@/Listbox/ListboxRoot.vue'
import type { ListboxFilterFunction, ListboxFilterState, ListboxNavigationIntent } from '@/Listbox/useListbox'
import type { BaseChangeReason, By, ChangeEventDetails } from '@/shared'
import type { ListItemsIndex } from '@/shared/listItems'
import type { AcceptableValue } from '@/shared/types'
import { compare, createContext, mergeExpose, useDirection, useFormControl, useForwardElement, useId } from '@/shared'

/**
 * The Combobox root context. It extends the Listbox root context (#2824, the
 * shared root contract): `ComboboxRoot` provides one object as both, so every
 * Listbox part works inside a combobox.
 */
export interface ComboboxRootContext<T = AcceptableValue> extends ListboxRootContext<T> {
  baseId: string
  /** `<baseId>-content`, set when the root is created. */
  contentId: string
  open: ComputedRef<boolean>
  /** Returns `false` when the change was cancelled via `beforeUpdate:open`. */
  onOpenChange: (value: boolean, reason?: ComboboxOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Writes the whole model; returns `false` when unchanged or cancelled. */
  setModelValue: (value: T | T[] | undefined, reason?: ComboboxChangeReason | BaseChangeReason, event?: Event) => boolean
  /** What an item press selects: replaces a single value, toggles a multiple one. */
  selectItem: (value: T, reason?: ComboboxChangeReason | BaseChangeReason, event?: Event) => boolean
  /**
   * An item press in a single combobox: selects with `'item-press'`, then closes unless the selection was cancelled.
   * Returns `false` when it was.
   */
  pressItem: (value: T, event?: Event) => boolean
  /** Resets the value (`[]` when multiple) with `'clear-press'`, or the given reason. */
  clearModelValue: (event?: Event, reason?: ComboboxChangeReason) => boolean
  onContentPositionChange: (content: symbol, position: 'inline' | 'popper') => void
  onContentPlaced: (content: symbol) => void
  onContentUnmount: (content: symbol) => void
  isUserInputted: Ref<boolean>
  inputElement: Ref<HTMLInputElement | undefined>
  onInputElementChange: (el: HTMLInputElement | undefined) => void
  triggerElement: Ref<HTMLElement | undefined>
  onTriggerElementChange: (el: HTMLElement | undefined) => void
  /**
   * How the popup was last opened or closed (its interaction type), read by
   * the content for `initialFocus` / `finalFocus`: an open by touch focuses the
   * content rather than an input inside it, so no virtual keyboard opens.
   */
  interactionType: Ref<ComboboxInteractionType>
  parentElement: Ref<HTMLElement | undefined>
  resetSearchTermOnSelect: Ref<boolean>
  /** Called with the close reason when the popup closes and the input text should be reset. */
  onResetSearchTerm: EventHookOn<ComboboxOpenChangeReason | BaseChangeReason | undefined>
  /** `ComboboxCancel` clears the input text; returns `false` when an input vetoed it. */
  clearInput: (event?: Event) => boolean
  /** Registers an input's clear handler (removed with its scope); returning `false` vetoes the clear. */
  onClearInput: (handler: (event?: Event) => boolean | void) => void
  /** The details of the last value change (or cancelled attempt). */
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<ComboboxChangeReason>>>
  /** The resolved filter: `null` while client filtering is off (`filter: null` or `ignoreFilter`). */
  filter: ComputedRef<ListboxFilterFunction<T> | null>
  /** The search term the filter runs against. */
  filterSearch: Ref<string>
  /** `{ search, active, count }` from the shared Listbox filter. */
  filterState: ComputedRef<ListboxFilterState>
  openOnFocus: Ref<boolean>
  openOnClick: Ref<boolean>
  resetModelValueOnClear: Ref<boolean>
  unmountOnHide: Ref<boolean>
  /** The root's `displayValue` resolver, if any. */
  displayValue?: (value: T) => string
  /** The root's `items`, if any. Read through `getComboboxInputText` / `getComboboxSelectedLabels`. */
  items?: MaybeRefOrGetter<ComboboxItems<T> | undefined>
  /** The index of `items`, created by the first lookup that finds `items` set. @internal */
  itemsIndex?: ComputedRef<ListItemsIndex<T> | undefined>
  /** Called by the content once its open/close transitions finish; emits `update:openComplete`. */
  notifyOpenComplete?: (value: boolean) => void
}

export const [injectComboboxRootContext, provideComboboxRootContext]
  = createContext<ComboboxRootContext<AcceptableValue>>('ComboboxRoot')

export type ComboboxRootEmits<T = AcceptableValue, M extends boolean = boolean> = {
  /**
   * Event handler called before the value changes; call `details.cancel()` to keep the current value. The value is
   * an array when `multiple`, and `null` when `ComboboxCancel` clears a single selection.
   */
  'beforeUpdate:modelValue': [value: ComboboxModelValue<T, M>, details: ChangeEventDetails<ComboboxChangeReason>]
  /**
   * Event handler called when the value changes. The value is an array when `multiple`, and `null` when
   * `ComboboxCancel` clears a single selection.
   */
  'update:modelValue': [value: ComboboxModelValue<T, M>, details: ChangeEventDetails<ComboboxChangeReason>]
  /** Event handler when highlighted element changes. */
  'highlight': [payload: { ref: HTMLElement, value: T } | undefined]
  /** Event handler called before the open state changes; call `details.cancel()` to keep it. */
  'beforeUpdate:open': [value: boolean, details: ChangeEventDetails<ComboboxOpenChangeReason>]
  /** Event handler called when the open state of the combobox changes. */
  'update:open': [value: boolean, details: ChangeEventDetails<ComboboxOpenChangeReason>]
  /** Event handler called after the open or close animations of the content have finished. */
  'update:openComplete': [value: boolean]
}

/**
 * The model of a combobox: an array when `multiple` is `true`, a single value (or `null` once cleared) when it is
 * absent or `false`, either while it is a plain `boolean`.
 */
export type ComboboxModelValue<T, M extends boolean = boolean> = boolean extends M ? T | T[] | null : M extends true ? T[] : T | null

export interface ComboboxRootProps<T = AcceptableValue> extends Omit<ListboxRootProps<T>, 'orientation' | 'selectionBehavior' | 'filter' | 'getNavigationIntent' | 'modelValue' | 'defaultValue'> {
  /**
   * The controlled value of the Combobox. Can be binded with `v-model`. An array when `multiple`; `null` is an empty
   * single selection, the value `ComboboxCancel` emits when it clears one.
   */
  modelValue?: T | Array<T> | null
  /** The value of the Combobox when initially rendered. Use when you do not need to control the state of the Combobox. */
  defaultValue?: T | Array<T> | null
  /**
   * Resolves what a keydown in the input means for keyboard navigation. Return `undefined` to fall back to the default
   * mapping, `null` to opt the key out (for Enter this also skips the selection), or `'select'` to select the
   * highlighted item as Enter does. A `'next'` or `'prev'` intent also opens a closed popup. Unmodified printable keys,
   * ArrowLeft and ArrowRight always stay text input.
   */
  getNavigationIntent?: (event: KeyboardEvent) => ListboxNavigationIntent | null | undefined
  /** The controlled open state of the Combobox. Can be binded with `v-model:open`. */
  open?: boolean
  /** The open state of the combobox when it is initially rendered. <br> Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /**
   * Whether to reset the searchTerm when the Combobox input blurred
   * @defaultValue `true`
   */
  resetSearchTermOnBlur?: boolean
  /**
   * Whether to reset the searchTerm when the Combobox value is selected
   * @defaultValue `true`
   */
  resetSearchTermOnSelect?: boolean
  /**
   * Whether to open the combobox when the input is focused
   * @defaultValue `false`
   */
  openOnFocus?: boolean
  /**
   * Whether to open the combobox when the input is clicked
   * @defaultValue `false`
   */
  openOnClick?: boolean
  /**
   * Whether an item matches the search term: called as `filter(text, search, value)` with the item's `textValue` (or
   * its text content; in a `ComboboxVirtualizer`, `textContent(option)`). Omitted, items are matched with `useFilter`'s
   * `contains` (base sensitivity). `null` turns client filtering off: filter the items yourself, or on a server.
   */
  filter?: ListboxFilterFunction<T> | null
  /**
   * Deprecated alias for `:filter="null"`: when `true`, turns client filtering off. Wins over `filter`.
   * @deprecated Use `:filter="null"`.
   */
  ignoreFilter?: boolean
  /**
   * Whether `ComboboxCancel` also clears the selected value, resetting `modelValue` to `null` (or `[]` if `multiple`).
   * Set to `false` to clear only the search text and keep the selection.
   * @defaultValue true
   */
  resetModelValueOnClear?: boolean
  /**
   * When set to `false`, the Combobox content will not be unmounted when closed, but instead hidden with CSS. <br>
   * Useful when you want to improve performance by not remounting the content on every open.
   * @defaultValue true
   */
  unmountOnHide?: boolean
  /**
   * The text the input shows for the selected value of a single combobox, when `ComboboxInput` has no `displayValue`
   * of its own. Without either, a primitive value shows as its string form and an object value as an empty input.
   */
  displayValue?: (value: T) => string
  /**
   * The options as data, in the shape `SelectRoot` takes: a record of value → label, or an array of
   * `{ value, label, disabled? }` (optionally in groups, `{ items: [...] }`). The input shows the label of the selected
   * value from it, and `selectedLabels` of the default slot lists the label of each selected value, so neither needs a
   * rendered item: they are right before the first open and on the server. `displayValue` wins over it. The
   * `ComboboxItem`s still render the list and are what the filter matches; a value it does not list shows as without it.
   */
  items?: ComboboxItems<T>
}
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue, M extends boolean = false">
import { mergeProps, toRef, watch } from 'vue'
import { useCollection } from '@/Collection'
import { useFieldControl } from '@/Field/useFieldControl'
import { provideListboxRootContext } from '@/Listbox/ListboxRoot.vue'
import { PopperRoot } from '@/Popper'
import { renderAs } from '@/Primitive/renderAs'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { getComboboxSelectedLabels, hasComboboxValue, useComboboxRoot } from './useCombobox'
import { provideComboboxField } from './useComboboxField'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<ComboboxRootProps<T> & { multiple?: M }>(), {
  open: undefined,
  resetSearchTermOnBlur: true,
  resetSearchTermOnSelect: true,
  openOnFocus: false,
  openOnClick: false,
  resetModelValueOnClear: true,
  highlightOnHover: true,
  unmountOnHide: true,
})
const emits = defineEmits<ComboboxRootEmits<T, M>>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: boolean
    /** Current active value */
    modelValue: ComboboxModelValue<T, M>
    /**
     * The text of each selected value, in order: the root's `displayValue`, then its label in `items`, then the string
     * form of a primitive value.
     */
    selectedLabels: string[]
  }) => any
}>()

const { getItems, getItem } = useCollection<{ value: T }>({ isProvider: true })
const { forwardRef, currentElement, expose } = useForwardElement()
const dir = useDirection(toRef(() => props.dir))
const isFormControl = useFormControl(currentElement)

function isSameValue(a: any, b: any): boolean {
  return Array.isArray(a) && Array.isArray(b)
    ? a.length === b.length && a.every((value, index) => isSameValue(value, b[index]))
    : compare(a, b, props.by as By<any>)
}

// Optional Field participation: `null` outside a `FieldRoot`, so every
// binding below is inert without a Field. The root owns the value; the input
// (Base UI parity) carries the field's id, label and aria wiring.
const field = useFieldControl({
  // Getters read bindings that are retained anyway, not the composable's
  // return object: capturing it in a closure would keep it alive per instance.
  // The element the field focuses, so `FieldLabel`'s `for` and `focusControl()`
  // agree: the input (its own `id`, else the field's), else the trigger. A
  // removed input can linger in the context (an as-child swap): skipped then.
  id: () => (context.inputElement.value?.isConnected ? context.inputElement.value : context.triggerElement.value)?.id || undefined,
  element: () => (context.inputElement.value?.isConnected ? context.inputElement.value : undefined) ?? context.triggerElement.value,
  // The selected value(s), not the typed text.
  getValue: () => modelValue.value,
  required: () => props.required,
  // Base UI: a single value is filled unless `null` (`''` included), but `''`
  // submits nothing, so `required` still reports it missing.
  isFilled: hasComboboxValue,
  isMissing: value => !hasComboboxValue(value) || value === '',
  // Base UI's `isSelectedValueDirty`: `null` and `''` differ (an unset value is `null`).
  isDirty: (value, initial) => !isSameValue(value ?? null, initial ?? null),
})
// Getters rather than computeds: cheap, and free for a standalone combobox.
const resolvedDisabled = field ? () => field.disabled(props.disabled) : () => props.disabled

const combobox = useComboboxRoot<AcceptableValue>({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  multiple: () => props.multiple,
  dir,
  disabled: resolvedDisabled,
  highlightOnHover: () => props.highlightOnHover,
  loop: () => props.loop,
  by: props.by as By<AcceptableValue> | undefined,
  getNavigationIntent: event => props.getNavigationIntent?.(event),
  filter: toRef(() => props.filter) as Ref<ListboxFilterFunction<AcceptableValue> | null | undefined>,
  ignoreFilter: () => props.ignoreFilter,
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  baseId: useId(undefined, 'reka-combobox'),
  resetSearchTermOnBlur: () => props.resetSearchTermOnBlur,
  resetSearchTermOnSelect: () => props.resetSearchTermOnSelect,
  openOnFocus: () => props.openOnFocus,
  openOnClick: () => props.openOnClick,
  resetModelValueOnClear: () => props.resetModelValueOnClear,
  unmountOnHide: () => props.unmountOnHide,
  displayValue: props.displayValue && (value => props.displayValue!(value as T)),
  items: () => props.items as ComboboxItems<AcceptableValue> | undefined,
  getItems,
  getItem,
  element: currentElement,
  emit: emits,
  // The Field hears its own commits by reason (`change`): user input, or, for
  // a programmatic one (`setModelValue` and the like), only the watcher below,
  // which also reports a parent-driven change.
  onUpdate: field?.change,
  onHighlight: payload => emits('highlight', payload as { ref: HTMLElement, value: T } | undefined),
  onOpenComplete: value => emits('update:openComplete', value),
})
const { root, context, open, highlightedElement, highlightItem, highlightFirstItem, highlightSelected, filterState } = combobox
const modelValue = combobox.modelValue as unknown as Ref<ComboboxModelValue<T, M>>

if (field)
  watch(modelValue, value => field.sync(value))

defineExpose(mergeExpose(expose, {
  /** The filtering result: `{ search, active, count }`. */
  filtered: filterState,
  highlightedElement,
  highlightItem: highlightItem as (value: T) => void,
  highlightFirstItem,
  highlightSelected,
}))

provideListboxRootContext(context)
provideComboboxRootContext(context)
provideComboboxField(field, context)
</script>

<template>
  <PopperRoot>
    <component
      :is="renderAs(as, asChild)"
      :ref="forwardRef"
      v-bind="mergeProps(root.attrs.value, $attrs)"
    >
      <slot
        :open="open"
        :model-value="modelValue"
        :selected-labels="getComboboxSelectedLabels(context)"
      />

      <!-- Base UI: a multiple combobox with any selection (`['']` included) is not missing a value. -->
      <VisuallyHiddenInput
        v-if="isFormControl && (field ? field.name(name) : name)"
        :name="(field ? field.name(name) : name)!"
        :value="modelValue"
        :disabled="resolvedDisabled()"
        :required="(field ? field.required(required) : required) && !(multiple && hasComboboxValue(modelValue))"
      />
    </component>
  </PopperRoot>
</template>
