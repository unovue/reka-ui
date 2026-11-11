<script lang="ts">
import type { AcceptableValue } from '@/shared/types'

export interface ComboboxValueProps {
  /** The text shown while nothing is selected. */
  placeholder?: string
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { injectComboboxRootContext } from './ComboboxRoot.vue'
import { getComboboxSelectedLabels } from './useCombobox'

defineProps<ComboboxValueProps>()

defineSlots<{
  default?: (props: {
    /** The selected value: an array when the combobox is `multiple`. */
    modelValue: AcceptableValue | AcceptableValue[] | undefined
    /**
     * The text of each selected value, in order: the root's `displayValue`, then its label in the root's `items`, then
     * the `label` key of an object value, then the string form of a primitive value. Empty while nothing is selected.
     */
    selectedLabels: string[]
  }) => any
}>()

const rootContext = injectComboboxRootContext()
const selectedLabels = computed(() => getComboboxSelectedLabels(rootContext))
</script>

<template>
  <slot
    :model-value="rootContext.modelValue.value"
    :selected-labels="selectedLabels"
  >
    {{ selectedLabels.length ? selectedLabels.join(', ') : placeholder }}
  </slot>
</template>
