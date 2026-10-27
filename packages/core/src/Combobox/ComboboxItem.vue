<script lang="ts">
import type { ListboxItemEmits, ListboxItemProps } from '@/Listbox'
import type { SelectEvent } from '@/Listbox/ListboxItem.vue'
import type { AcceptableValue } from '@/shared/types'
import { useForwardElement, useId } from '@/shared'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

export { injectListboxItemContext as injectComboboxItemContext } from '@/Listbox'

export type ComboboxItemEmits<T = AcceptableValue> = ListboxItemEmits<T>
export interface ComboboxItemProps<T = AcceptableValue> extends ListboxItemProps<T> {
  /**
   * A string representation of the item contents.
   *
   * If the children are not plain text, then the `textValue` prop must also be set to a plain text representation, which will be used for autocomplete in the ComboBox.
   */
  textValue?: string
}
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import { ListboxItem } from '@/Listbox'

const props = defineProps<ComboboxItemProps<T>>()
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

if (props.value === '') {
  throw new Error(
    'A <ComboboxItem /> must have a value prop that is not an empty string. This is because the Combobox value can be set to an empty string to clear the selection and show the placeholder.',
  )
}

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
      rootContext.pressItem(props.value, event.detail.originalEvent)
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
    :disabled="rootContext.disabled.value || disabled"
    @select="onSelect"
  >
    <slot v-bind="slotProps">
      {{ value }}
    </slot>
  </ListboxItem>
</template>
