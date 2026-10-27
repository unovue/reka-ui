<script lang="ts">
import type { ListboxItemIndicatorProps } from '@/Listbox'

export interface ComboboxItemIndicatorProps extends ListboxItemIndicatorProps {}
</script>

<script setup lang="ts">
import { ListboxItemIndicator } from '@/Listbox'
import { useForwardElement } from '@/shared'

const props = withDefaults(defineProps<ComboboxItemIndicatorProps>(), {
  as: 'span',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <ListboxItemIndicator
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </ListboxItemIndicator>
</template>
