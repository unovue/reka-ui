<script setup lang="ts">
import type { ColorSwatchProps } from '..'
import { ColorSwatch } from '..'

const props = withDefaults(defineProps<ColorSwatchProps>(), {
  color: '#E5484D',
})
</script>

<template>
  <ColorSwatch
    v-bind="props"
    class="w-8 h-8 rounded ring-1 ring-inset ring-black/15 dark:ring-white/15 bg-[var(--reka-color-swatch-color)]"
  />
</template>
