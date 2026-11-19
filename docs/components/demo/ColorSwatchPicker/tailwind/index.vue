<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  blue,
  green,
  indigo,
  orange,
  red,
  violet,
  yellow,
} from '@radix-ui/colors'
import { ColorSwatchPickerItem, ColorSwatchPickerItemIndicator, ColorSwatchPickerItemSwatch, ColorSwatchPickerRoot } from 'reka-ui'

const colors = [
  red.red9,
  orange.orange9,
  yellow.yellow9,
  green.green9,
  blue.blue9,
  indigo.indigo9,
  violet.violet9,
]
</script>

<template>
  <ColorSwatchPickerRoot class="flex gap-2">
    <ColorSwatchPickerItem
      v-for="color in colors"
      :key="color"
      :value="color"
      class="relative"
    >
      <ColorSwatchPickerItemSwatch
        class="size-8 rounded ring-1 ring-inset ring-black/15 dark:ring-white/15 bg-[--reka-color-swatch-color] peer"
      />
      <ColorSwatchPickerItemIndicator class="text-white peer-data-[color-contrast=dark]:text-black absolute right-1 bottom-1">
        <Icon icon="radix-icons:check" />
      </ColorSwatchPickerItemIndicator>
    </ColorSwatchPickerItem>
  </ColorSwatchPickerRoot>
</template>
