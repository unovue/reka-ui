<script setup>
// ColorSwatchPicker: N instances of a typical composition (closed/default state)
import { ColorSwatchPickerItem, ColorSwatchPickerItemIndicator, ColorSwatchPickerItemSwatch, ColorSwatchPickerRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff']
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <ColorSwatchPickerRoot
      default-value="#ff0000"
      aria-label="Swatches"
    >
      <ColorSwatchPickerItem
        v-for="c in colors"
        :key="c"
        :value="c"
      >
        <ColorSwatchPickerItemSwatch /><ColorSwatchPickerItemIndicator />
      </ColorSwatchPickerItem>
    </ColorSwatchPickerRoot>
  </div>
</template>
