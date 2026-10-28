<script lang="ts">
import type { ListboxGroupProps } from '@/Listbox'
import { createContext, useForwardElement, useId } from '@/shared'

export interface ComboboxGroupProps extends ListboxGroupProps {}

type ComboboxGroupContext = {
  id: string
  labelId: string
}

export const [injectComboboxGroupContext, provideComboboxGroupContext]
  = createContext<ComboboxGroupContext>('ComboboxGroup')
</script>

<script setup lang="ts">
import { reactive } from 'vue'
import { ListboxGroup } from '@/Listbox'

const props = defineProps<ComboboxGroupProps>()
const id = useId(undefined, 'reka-combobox-group')

// Reactive: the label sets `labelId` once it sets up, and the group's
// `aria-labelledby` follows, whenever that is (a label rendered later, or one
// that is its own custom element).
const context = provideComboboxGroupContext(reactive({
  id,
  labelId: '',
}))

// `ListboxGroup` hides itself (`hidden`, still mounted) while the filter leaves none of its items.
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <ListboxGroup
    :id="id"
    :ref="forwardRef"
    :aria-labelledby="context.labelId"
    v-bind="props"
  >
    <slot />
  </ListboxGroup>
</template>
