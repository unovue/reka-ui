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
import { ListboxGroup } from '@/Listbox'

const props = defineProps<ComboboxGroupProps>()
const id = useId(undefined, 'reka-combobox-group')

const context = provideComboboxGroupContext({
  id,
  labelId: '',
})

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
