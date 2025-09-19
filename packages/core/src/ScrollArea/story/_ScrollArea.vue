<script setup lang="ts">
import type { ScrollAreaRootProps } from '../ScrollAreaRoot.vue'
import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from '..'
import ScrollAreaCopy from './_ScrollAreaCopy.vue'

const props = defineProps<ScrollAreaRootProps>()
</script>

<template>
  <ScrollAreaRoot
    style="width: 200px; height: 200px; overflow: hidden;"
    v-bind="props"
  >
    <ScrollAreaViewport style="width: 100%; height: 100%;">
      <ScrollAreaCopy style="width: 50px;" />
      <ScrollAreaCopy style="width: 50px;" />
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      orientation="vertical"
    >
      <ScrollAreaThumb />
    </ScrollAreaScrollbar>

    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
