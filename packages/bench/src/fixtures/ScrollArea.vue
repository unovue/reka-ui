<script setup>
// ScrollArea: N instances of a typical composition (closed/default state)
import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <ScrollAreaRoot
      class="sa"
      type="always"
    >
      <ScrollAreaViewport class="sa-vp">
        <div
          v-for="k in 5"
          :key="k"
        >
          Line {{ k }}
        </div>
      </ScrollAreaViewport>
      <ScrollAreaScrollbar orientation="vertical">
        <ScrollAreaThumb />
      </ScrollAreaScrollbar>
      <ScrollAreaCorner />
    </ScrollAreaRoot>
  </div>
</template>
