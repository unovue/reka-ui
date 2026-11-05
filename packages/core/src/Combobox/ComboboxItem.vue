<script lang="ts">
import type { ListboxItemEmits, ListboxItemProps } from '@/Listbox'
import type { SelectEvent } from '@/Listbox/ListboxItem.vue'
import type { AcceptableValue } from '@/shared/types'
import { useForwardElement, useId } from '@/shared'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

export { injectListboxItemContext as injectComboboxItemContext } from '@/Listbox'

export type ComboboxItemEmits<T = AcceptableValue> = ListboxItemEmits<T>
export interface ComboboxItemProps<T = AcceptableValue> extends Omit<ListboxItemProps<T>, 'value'> {
  /**
   * The value given as data when submitted with a `name`. `null` is the empty value, so pressing an item with a `null`
   * value clears a single selection; an item without a `value` has `null`, as in Base UI. An empty string is a value
   * like any other.
   * @defaultValue `null`
   */
  value?: T
  /**
   * A string representation of the item contents.
   *
   * If the children are not plain text, then the `textValue` prop must also be set to a plain text representation, which is used to filter the items and for typeahead.
   */
  textValue?: string
}
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import { ListboxItem } from '@/Listbox'

const props = defineProps<ComboboxItemProps<T>>()
// Base UI: an item without a `value` (read as `value ?? null`) is the `null`
// item, which clears a single selection.
const emits = defineEmits<ComboboxItemEmits<T>>()

defineSlots<{
  default?: (props: {
    /** Whether the item is currently selected */
    selected: boolean
  }) => any
}>()

const id = useId(undefined, 'reka-combobox-item')
const rootContext = injectComboboxRootContext()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// Matching (the shared Listbox `filter` over `textValue` or the rendered
// text), the label registry and the select protocol live in `ListboxItem`. A
// single combobox replaces its value and closes; a multiple one lets the
// Listbox toggle it and keeps the focus in the input.
function onSelect(event: SelectEvent<T>) {
  emits('select', event)
  if (event.defaultPrevented)
    return

  if (!rootContext.multiple.value) {
    event.preventDefault()
    if (!props.disabled && !rootContext.disabled.value) {
      rootContext.pressItem((props.value ?? null) as T, event.detail.originalEvent)
    }
  }
  else {
    rootContext.inputElement.value?.focus()
  }
}
</script>

<template>
  <ListboxItem
    v-bind="props"
    :id="id"
    :ref="forwardRef"
    v-slot="slotProps"
    :value="value ?? null"
    :disabled="rootContext.disabled.value || disabled"
    @select="onSelect"
  >
    <slot v-bind="slotProps">
      {{ value }}
    </slot>
  </ListboxItem>
</template>
