<script lang="ts">
import type { ListboxItemIndicatorProps } from '@/Listbox'

export interface ColorSwatchPickerItemIndicatorProps extends ListboxItemIndicatorProps { }
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { ListboxItemIndicator } from '@/Listbox'
import { getColorSwatchPickerItemIndicatorSurface } from './useColorSwatchPicker'

const props = defineProps<ColorSwatchPickerItemIndicatorProps>()
const part = getColorSwatchPickerItemIndicatorSurface()
</script>

<template>
  <ListboxItemIndicator v-bind="mergeProps(props, part.attrs.value)">
    <slot />
  </ListboxItemIndicator>
</template>
