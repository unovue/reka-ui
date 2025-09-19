<script setup lang="ts">
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'reka-ui'
import './styles.css'

const tags = Array.from({ length: 50 }).map((_, i, a) => `v1.2.0-beta.${a.length - i}`)
</script>

<template>
  <ScrollAreaRoot
    class="ScrollAreaRoot"
    style="--scrollbar-size: 10px"
  >
    <ScrollAreaViewport class="ScrollAreaViewport">
      <div :style="{ padding: '15px 20px' }">
        <div class="Text">
          Tags
        </div>
        <div
          v-for="tag in tags"
          :key="tag"
          class="Tag"
        >
          {{ tag }}
        </div>
      </div>
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      class="ScrollAreaScrollbar"
      orientation="vertical"
    >
      <ScrollAreaThumb
        class="ScrollAreaThumb"
      />
    </ScrollAreaScrollbar>
    <ScrollAreaScrollbar
      class="ScrollAreaScrollbar"
      orientation="horizontal"
    >
      <ScrollAreaThumb
        class="ScrollAreaThumb"
      />
    </ScrollAreaScrollbar>
  </ScrollAreaRoot>
</template>
