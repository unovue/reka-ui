<script setup lang="ts">
import { AspectRatio } from 'reka-ui'
</script>

<template>
  <div class="w-full sm:w-[300px] overflow-hidden rounded-lg shadow-sm">
    <AspectRatio :ratio="16 / 9">
      <img
        class="h-full w-full object-cover"
        src="https://images.unsplash.com/photo-1498855926480-d98e83099315?w=300&dpr=2&q=80"
        alt="Landscape photograph by Tobias Tullius"
      >
    </AspectRatio>
  </div>
</template>
