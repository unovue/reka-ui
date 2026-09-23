<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  blue,
  green,
  orange,
  pink,
  red,
  violet,
  yellow,
} from '@radix-ui/colors'
import { ColorSwatchPickerItem, ColorSwatchPickerItemIndicator, ColorSwatchPickerItemSwatch, ColorSwatchPickerRoot } from 'reka-ui'
import './styles.css'

const colors = [
  red.red9,
  pink.pink9,
  violet.violet9,
  blue.blue9,
  green.green9,
  orange.orange9,
  yellow.yellow9,
]
</script>

<template>
  <ColorSwatchPickerRoot class="root">
    <ColorSwatchPickerItem
      v-for="color in colors"
      :key="color"
      :value="color"
      class="item"
    >
      <ColorSwatchPickerItemSwatch
        class="swatch"
      />
      <ColorSwatchPickerItemIndicator class="indicator">
        <Icon icon="radix-icons:check" />
      </ColorSwatchPickerItemIndicator>
    </ColorSwatchPickerItem>
  </ColorSwatchPickerRoot>
</template>
