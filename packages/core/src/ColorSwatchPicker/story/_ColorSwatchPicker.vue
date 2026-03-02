<script setup lang="ts">
import type { ColorSwatchPickerRootEmits, ColorSwatchPickerRootProps } from '..'
import { useForwardPropsEmits } from '@/shared'
import { ColorSwatchPickerItem, ColorSwatchPickerItemIndicator, ColorSwatchPickerItemSwatch, ColorSwatchPickerRoot } from '..'

const props = defineProps<ColorSwatchPickerRootProps>()

const emits = defineEmits<ColorSwatchPickerRootEmits>()

const colors = [
  '#E5484D',
  '#D6409F',
  '#8E4EC6',
  '#0090FF',
  '#30A46C',
  '#F76B15',
  '#FFE629',
]

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <ColorSwatchPickerRoot
    v-bind="forwarded"
    aria-label="Color swatches"
  >
    <ColorSwatchPickerItem
      v-for="color in colors"
      :key="color"
      :value="color"
      class="relative"
    >
      <ColorSwatchPickerItemSwatch
        class="w-8 h-8 rounded cursor-pointer ring-1 ring-inset ring-black/15 dark:ring-white/15 bg-[var(--reka-color-swatch-color)] peer"
      />
      <ColorSwatchPickerItemIndicator class="absolute bottom-1 right-1 size-1 rounded-full bg-white peer-data-[color-contrast=dark]:bg-black" />
    </ColorSwatchPickerItem>
  </ColorSwatchPickerRoot>
</template>
