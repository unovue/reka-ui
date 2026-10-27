<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { ComboboxOpenChangeReason } from '@/Combobox/useCombobox'
import type { ListboxFilterFunction, ListboxNavigationIntent } from '@/Listbox/useListbox'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { AcceptableValue, Direction } from '@/shared/types'
import { createContext, mergeExpose, useDirection, useFormControl, useForwardElement, useId } from '@/shared'

/**
 * Why the Autocomplete value (the input text) changed; carried as `details.reason` (#2828).
 *
 * - `'input-change'`: the user typed (or an IME composition was committed).
 * - `'item-press'`: an item was clicked, or Enter selected the highlighted item.
 * - `'clear-press'`: `AutocompleteCancel` cleared the text.
 */
export type AutocompleteChangeReason = 'input-change' | 'item-press' | 'clear-press'

export interface AutocompleteRootProps extends PrimitiveProps {
  /** The controlled value of the Autocomplete (the input text). Can be bound with `v-model`. */
  modelValue?: string
  /** The value of the autocomplete when initially rendered. Use when you do not need to control the state. */
  defaultValue?: string
  /** The controlled open state of the Autocomplete. Can be bound with `v-model:open`. */
  open?: boolean
  /** The open state of the autocomplete when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /** When `true`, prevents the user from interacting with autocomplete */
  disabled?: boolean
  /** The reading direction of the autocomplete when applicable. */
  dir?: Direction
  /** The name of the field. Submitted with its owning form as part of a name/value pair. */
  name?: string
  /** When `true`, indicates that the user must set the value before the owning form can be submitted. */
  required?: boolean
  /**
   * Whether to reset the searchTerm when the Autocomplete input blurred
   * @defaultValue `false`
   */
  resetSearchTermOnBlur?: boolean
  /**
   * Whether to open the autocomplete when the input is focused
   * @defaultValue `false`
   */
  openOnFocus?: boolean
  /**
   * Whether to open the autocomplete when the input is clicked
   * @defaultValue `false`
   */
  openOnClick?: boolean
  /**
   * Whether an item matches the typed text: called as `filter(text, search, value)` with the item's `textValue` (or
   * its text content). Omitted, items are matched with `useFilter`'s `contains` (base sensitivity). `null` turns client
   * filtering off: filter the items yourself, or on a server.
   */
  filter?: ListboxFilterFunction<string> | null
  /**
   * Deprecated alias for `:filter="null"`: when `true`, turns client filtering off. Wins over `filter`.
   * @deprecated Use `:filter="null"`.
   */
  ignoreFilter?: boolean
  /** When `true`, hover over item will trigger highlight */
  highlightOnHover?: boolean
  /** When `true`, keyboard navigation will loop from last item to first, and vice versa. */
  loop?: boolean
  /**
   * Resolves what a keydown in the input means for keyboard navigation. Return `undefined` to fall back to the default
   * mapping, `null` to opt the key out (for Enter this also skips the selection), or `'select'` to select the
   * highlighted item as Enter does. A `'next'` or `'prev'` intent also opens a closed popup. Unmodified printable keys,
   * ArrowLeft and ArrowRight always stay text input.
   */
  getNavigationIntent?: (event: KeyboardEvent) => ListboxNavigationIntent | null | undefined
  /**
   * The text a selected item writes into the value (the input text). Defaults to the item's value.
   */
  displayValue?: (value: string) => string
}

export type AutocompleteRootEmits = {
  /**
   * Event handler called before the value (the input text) changes; call `details.cancel()` to keep the current
   * value. The value is `''` when `AutocompleteCancel` clears it.
   */
  'beforeUpdate:modelValue': [value: string, details: ChangeEventDetails<AutocompleteChangeReason>]
  /** Event handler called when the value (the input text) changes. The value is `''` when `AutocompleteCancel` clears it. */
  'update:modelValue': [value: string, details: ChangeEventDetails<AutocompleteChangeReason>]
  /** Event handler when highlighted element changes. */
  'highlight': [payload: { ref: HTMLElement, value: string } | undefined]
  /** Event handler called before the open state changes; call `details.cancel()` to keep it. */
  'beforeUpdate:open': [value: boolean, details: ChangeEventDetails<ComboboxOpenChangeReason>]
  /** Event handler called when the open state of the autocomplete changes. */
  'update:open': [value: boolean, details: ChangeEventDetails<ComboboxOpenChangeReason>]
}

export type AutocompleteRootContext = {
  /** The value (the input text). */
  modelValue: ComputedRef<string>
  /** Writes the value; returns `false` when unchanged or cancelled. */
  onModelValueChange: (value: string, reason?: AutocompleteChangeReason | BaseChangeReason, event?: Event) => boolean
}

export const [injectAutocompleteRootContext, provideAutocompleteRootContext]
  = createContext<AutocompleteRootContext>('AutocompleteRoot')
</script>

<script setup lang="ts">
import { mergeProps, toRef } from 'vue'
import { useCollection } from '@/Collection'
import { provideComboboxRootContext } from '@/Combobox/ComboboxRoot.vue'
import { useComboboxRoot } from '@/Combobox/useCombobox'
import { provideListboxRootContext } from '@/Listbox/ListboxRoot.vue'
import { PopperRoot } from '@/Popper'
import { Primitive } from '@/Primitive'
import { VisuallyHiddenInput } from '@/VisuallyHidden'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<AutocompleteRootProps>(), {
  open: undefined,
  resetSearchTermOnBlur: false,
  openOnFocus: false,
  openOnClick: false,
  highlightOnHover: true,
})
const emits = defineEmits<AutocompleteRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: boolean
    /** Current active value */
    modelValue: string
  }) => any
}>()

const { getItems, getItem } = useCollection<{ value: string }>({ isProvider: true })
const { forwardRef, currentElement, expose } = useForwardElement()
const dir = useDirection(toRef(() => props.dir))
const isFormControl = useFormControl(currentElement)

// The Combobox root over a single string model: the value is the input text,
// a selected item writes its (display) value, a clear writes `''`.
// Typed over every item value, as the Listbox and Combobox contexts it provides
// are: `AutocompleteItem` is `ComboboxItem`, whose `value` is any
// `AcceptableValue`. `toModelValue` turns it into the text (`displayValue`, else
// `String(value)`). The public `filter`, `displayValue` and `highlight` types
// still say `string`, the documented item value, so they are narrowed here.
const combobox = useComboboxRoot<AcceptableValue>({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue ?? '',
  dir,
  disabled: () => props.disabled,
  highlightOnHover: () => props.highlightOnHover,
  loop: () => props.loop,
  getNavigationIntent: event => props.getNavigationIntent?.(event),
  filter: toRef(() => props.filter) as Ref<ListboxFilterFunction<AcceptableValue> | null | undefined>,
  ignoreFilter: () => props.ignoreFilter,
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  baseId: useId(undefined, 'reka-autocomplete'),
  resetSearchTermOnBlur: () => props.resetSearchTermOnBlur,
  resetSearchTermOnSelect: false,
  openOnFocus: () => props.openOnFocus,
  openOnClick: () => props.openOnClick,
  resetModelValueOnClear: true,
  emptyValue: '',
  toModelValue: value => props.displayValue ? props.displayValue(value as string) : String(value),
  // Opening filters by the text already in the input.
  openSearchTerm: () => modelValue.value || '',
  getItems,
  getItem,
  element: currentElement,
  emit: emits,
  onHighlight: payload => emits('highlight', payload as { ref: HTMLElement, value: string } | undefined),
})
const { root, context, open, highlightedElement, highlightItem, highlightFirstItem, highlightSelected, filterState } = combobox
const modelValue = combobox.modelValue as ComputedRef<string>

defineExpose(mergeExpose(expose, {
  /** The filtering result: `{ search, active, count }`. */
  filtered: filterState,
  highlightedElement,
  highlightItem,
  highlightFirstItem,
  highlightSelected,
}))

provideListboxRootContext(context)
provideComboboxRootContext(context)
provideAutocompleteRootContext({
  modelValue,
  onModelValueChange: (value, reason, event) => combobox.setModelValue(value, reason, event),
})
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
