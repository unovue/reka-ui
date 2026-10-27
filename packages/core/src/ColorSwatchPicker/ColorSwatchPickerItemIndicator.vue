<script lang="ts">
import type { ListboxItemIndicatorProps } from '@/Listbox'

export interface ColorSwatchPickerItemIndicatorProps extends ListboxItemIndicatorProps { }
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { ListboxItemIndicator } from '@/Listbox'
import { useForwardElement } from '@/shared'
import { getColorSwatchPickerItemIndicatorSurface } from './useColorSwatchPicker'

const props = defineProps<ColorSwatchPickerItemIndicatorProps>()
const part = getColorSwatchPickerItemIndicatorSurface()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <ListboxItemIndicator
    :ref="forwardRef"
    v-bind="mergeProps(props, part.attrs.value)"
  >
    <slot />
  </ListboxItemIndicator>
</template>
