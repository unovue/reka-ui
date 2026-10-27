<script lang="ts">
import type { EventHookOn } from '@vueuse/core'
import type { ComputedRef, Ref } from 'vue'
import type { ComboboxChangeReason, ComboboxOpenChangeReason } from './useCombobox'
import type { ListboxRootProps } from '@/Listbox'
import type { ListboxRootContext } from '@/Listbox/ListboxRoot.vue'
import type { ListboxFilterFunction, ListboxFilterState, ListboxNavigationIntent } from '@/Listbox/useListbox'
import type { BaseChangeReason, By, ChangeEventDetails } from '@/shared'
import type { AcceptableValue } from '@/shared/types'
import { createContext, mergeExpose, useDirection, useFormControl, useForwardElement, useId } from '@/shared'

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
  /** Resets the value (`[]` when multiple) with `'clear-press'`. */
  clearModelValue: (event?: Event) => boolean
  onContentPositionChange: (content: symbol, position: 'inline' | 'popper') => void
  onContentPlaced: (content: symbol) => void
  onContentUnmount: (content: symbol) => void
  isUserInputted: Ref<boolean>
  inputElement: Ref<HTMLInputElement | undefined>
  onInputElementChange: (el: HTMLInputElement) => void
  triggerElement: Ref<HTMLElement | undefined>
  onTriggerElementChange: (el: HTMLElement) => void
  parentElement: Ref<HTMLElement | undefined>
  resetSearchTermOnSelect: Ref<boolean>
  onResetSearchTerm: EventHookOn
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
   * When `true` the `modelValue` will be reset to `null` (or `[]` if `multiple`)
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
}
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue, M extends boolean = false">
import { mergeProps, toRef } from 'vue'
import { useCollection } from '@/Collection'
import { provideListboxRootContext } from '@/Listbox/ListboxRoot.vue'
import { PopperRoot } from '@/Popper'
import { Primitive } from '@/Primitive'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useComboboxRoot } from './useCombobox'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<ComboboxRootProps<T> & { multiple?: M }>(), {
  open: undefined,
  resetSearchTermOnBlur: true,
  resetSearchTermOnSelect: true,
  openOnFocus: false,
  openOnClick: false,
  resetModelValueOnClear: false,
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
  }) => any
}>()

const { getItems, getItem } = useCollection<{ value: T }>({ isProvider: true })
const { forwardRef, currentElement, expose } = useForwardElement()
const dir = useDirection(toRef(() => props.dir))
const isFormControl = useFormControl(currentElement)

const combobox = useComboboxRoot<AcceptableValue>({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  multiple: () => props.multiple,
  dir,
  disabled: () => props.disabled,
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
  getItems,
  getItem,
  element: currentElement,
  emit: emits,
  onHighlight: payload => emits('highlight', payload as { ref: HTMLElement, value: T } | undefined),
})
const { root, context, open, highlightedElement, highlightItem, highlightFirstItem, highlightSelected, filterState } = combobox
const modelValue = combobox.modelValue as unknown as Ref<ComboboxModelValue<T, M>>

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
</script>

<template>
  <PopperRoot>
    <Primitive
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      v-bind="mergeProps(root.attrs.value, $attrs)"
    >
      <slot
        :open="open"
        :model-value="modelValue"
      />

      <VisuallyHiddenInput
        v-if="isFormControl && name"
        :name="name"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
      />
    </Primitive>
  </PopperRoot>
</template>
