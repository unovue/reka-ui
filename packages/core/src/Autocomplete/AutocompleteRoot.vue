<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { ComboboxOpenChangeReason } from '@/Combobox/useCombobox'
import type { ListboxFilterFunction, ListboxNavigationIntent } from '@/Listbox/useListbox'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { AcceptableValue, Direction } from '@/shared/types'
import { createChangeEventDetails, createContext, mergeExpose, useDirection, useFormControl, useForwardElement, useId } from '@/shared'

/**
 * Why the Autocomplete value (the input text) changed; carried as `details.reason` (#2828).
 *
 * - `'input-change'`: the user typed (or an IME composition was committed).
 * - `'item-press'`: an item was clicked, or Enter selected the highlighted item.
 * - `'clear-press'`: `AutocompleteCancel` cleared the text.
 */
export type AutocompleteChangeReason = 'input-change' | 'item-press' | 'clear-press'

/**
 * `T` is the type of the item values (`AutocompleteItem` `value`); it defaults to `string`. The model is always the
 * input text.
 */
export interface AutocompleteRootProps<T extends AcceptableValue = string> extends PrimitiveProps {
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
  filter?: ListboxFilterFunction<T> | null
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
   * The text a selected item writes into the value (the input text), from the item's value. Defaults to
   * `String(value)`.
   */
  displayValue?: (value: T) => string
}

export type AutocompleteRootEmits<T extends AcceptableValue = string> = {
  /**
   * Event handler called before the value (the input text) changes; call `details.cancel()` to keep the current
   * value. The value is `''` when `AutocompleteCancel` clears it. Only a controlled (`v-model`) value can be kept:
   * an uncontrolled one ignores `cancel()`.
   */
  'beforeUpdate:modelValue': [value: string, details: ChangeEventDetails<AutocompleteChangeReason>]
  /** Event handler called when the value (the input text) changes. The value is `''` when `AutocompleteCancel` clears it. */
  'update:modelValue': [value: string, details: ChangeEventDetails<AutocompleteChangeReason>]
  /** Event handler when highlighted element changes. */
  'highlight': [payload: { ref: HTMLElement, value: T } | undefined]
  /** Event handler called before the open state changes; call `details.cancel()` to keep it. */
  'beforeUpdate:open': [value: boolean, details: ChangeEventDetails<ComboboxOpenChangeReason>]
  /** Event handler called when the open state of the autocomplete changes. */
  'update:open': [value: boolean, details: ChangeEventDetails<ComboboxOpenChangeReason>]
  /** Event handler called after the open or close animations of the content have finished. */
  'update:openComplete': [value: boolean]
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

<script setup lang="ts" generic="T extends AcceptableValue = string">
import { mergeProps, toRef, watch } from 'vue'
import { useCollection } from '@/Collection'
import { provideComboboxRootContext } from '@/Combobox/ComboboxRoot.vue'
import { useComboboxRoot } from '@/Combobox/useCombobox'
import { provideComboboxField } from '@/Combobox/useComboboxField'
import { useFieldBinding } from '@/Field/useFieldBinding'
import { provideListboxRootContext } from '@/Listbox/ListboxRoot.vue'
import { PopperRoot } from '@/Popper'
import { renderAs } from '@/Primitive/renderAs'
import { formResetBinder } from '@/shared/formReset'
import { resetControllableState } from '@/shared/useControllableState'
import { VisuallyHiddenInput } from '@/VisuallyHidden'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<AutocompleteRootProps<T>>(), {
  open: undefined,
  resetSearchTermOnBlur: false,
  openOnFocus: false,
  openOnClick: false,
  highlightOnHover: true,
})
const emits = defineEmits<AutocompleteRootEmits<T>>()

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

// Optional Field participation: `null` outside a `FieldRoot`, so every
// binding below is inert without a Field. The root owns the value; the input
// (Base UI parity) carries the field's id, label and aria wiring.
const field = useFieldBinding({
  // Getters read bindings that are retained anyway, not the composable's
  // return object: capturing it in a closure would keep it alive per instance.
  // The input renders its own `id`, else the field's.
  id: () => context.inputElement.value?.id || undefined,
  // A removed input can linger in the context: report none then, so an
  // invalid submit moves focus to the next field.
  element: () => context.inputElement.value?.isConnected ? context.inputElement.value : undefined,
  // The input text.
  getValue: () => modelValue.value,
  required: () => props.required,
})
// Getters rather than computeds: cheap, and free for a standalone autocomplete.
const resolvedName = () => field ? field.name(props.name) : props.name
const resolvedRequired = () => field ? field.required(props.required) : props.required
const resolvedDisabled = () => field ? field.disabled(props.disabled) : props.disabled

// The Combobox root over a single string model: the value is the input text,
// a selected item writes its (display) value, a clear writes `''`.
// Typed over every item value, as the Listbox and Combobox contexts it provides
// are: `AutocompleteItem` is `ComboboxItem`, whose `value` is any
// `AcceptableValue`. `toModelValue` turns it into the text (`displayValue`, else
// `String(value)`). The public `filter`, `displayValue`, `highlight` and
// `highlightItem` types use the root's `T`, so they are narrowed here.
const combobox = useComboboxRoot<AcceptableValue>({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue ?? '',
  dir,
  disabled: resolvedDisabled,
  highlightOnHover: () => props.highlightOnHover,
  loop: () => props.loop,
  getNavigationIntent: event => props.getNavigationIntent?.(event),
  filter: toRef(() => props.filter) as Ref<ListboxFilterFunction<AcceptableValue> | null | undefined>,
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  baseId: useId(undefined, 'reka-autocomplete'),
  resetSearchTermOnBlur: () => props.resetSearchTermOnBlur,
  resetSearchTermOnSelect: false,
  openOnFocus: () => props.openOnFocus,
  openOnClick: () => props.openOnClick,
  resetModelValueOnClear: true,
  emptyValue: '',
  // `null` (an item without a `value`) writes no text, as Base UI's `stringifyAsLabel`.
  toModelValue: value => value == null ? '' : props.displayValue ? props.displayValue(value as T) : String(value),
  // Opening filters by the text already in the input.
  openSearchTerm: () => modelValue.value || '',
  getItems,
  getItem,
  element: currentElement,
  // Base UI parity (`AutocompleteRoot` writes an uncontrolled value before
  // `onValueChange`): an uncontrolled value ignores `cancel()`, so the listener
  // gets details of its own that nothing reads.
  emit: (event: string, ...args: unknown[]) => {
    if (event === 'beforeUpdate:modelValue' && !combobox.isControlled.value) {
      const details = args[1] as ChangeEventDetails<AutocompleteChangeReason>
      return (emits as (event: string, ...args: unknown[]) => void)(event, args[0], createChangeEventDetails(details.reason, details.event, details.trigger))
    }
    return (emits as (event: string, ...args: unknown[]) => void)(event, ...args)
  },
  // The Field hears its own commits by reason (`change`): user input, or, for
  // a programmatic one (`setModelValue` and the like), only the watcher below,
  // which also reports a parent-driven change.
  onUpdate: field?.change,
  onHighlight: payload => emits('highlight', payload as { ref: HTMLElement, value: T } | undefined),
  onOpenComplete: value => emits('update:openComplete', value),
})
const { root, context, open, highlightedElement, highlightItem, highlightFirstItem, highlightSelected, filterState } = combobox
const modelValue = combobox.modelValue as ComputedRef<string>

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

// A native reset of the owning form puts the value back to `defaultValue`.
function onFormReset(event: Event) { resetControllableState(combobox.isControlled, event) }
provideAutocompleteRootContext({
  modelValue,
  onModelValueChange: (value, reason, event) => combobox.setModelValue(value, reason, event),
})

const bindFormReset = formResetBinder(onFormReset)
</script>

<template>
  <PopperRoot>
    <component
      :is="renderAs(as, asChild)"
      :ref="forwardRef"
      v-bind="mergeProps(root.attrs.value, $attrs)"
      @vue:mounted="bindFormReset"
    >
      <slot
        :open="open"
        :model-value="modelValue"
      />

      <VisuallyHiddenInput
        v-if="isFormControl && resolvedName()"
        :name="resolvedName()!"
        :value="modelValue"
        :disabled="resolvedDisabled()"
        :required="resolvedRequired()"
      />
    </component>
  </PopperRoot>
</template>
