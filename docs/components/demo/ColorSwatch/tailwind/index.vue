<script setup lang="ts">
import { green } from '@radix-ui/colors'
import { ColorSwatch } from 'reka-ui'
</script>

<template>
  <ColorSwatch
    :color="green.green9"
    class="size-8 shrink-0 bg-[--reka-color-swatch-color] rounded ring-1 ring-inset ring-black/15 dark:ring-white/15"
  />
</template>
