<script setup lang="ts">
import type { ColorSwatchProps } from '..'
import { ColorSwatch } from '..'

const props = defineProps<ColorSwatchProps>()

const color = '#E5484D'
</script>

<template>
  <ColorSwatch
    v-bind="props"
    :color="color"
    class="w-8 h-8 rounded ring-1 ring-inset ring-black/15 dark:ring-white/15"
  />
</template>
