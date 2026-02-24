<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'

import { AspectRatio } from '..'

const { Story } = defineMeta({
  title: 'Aspect Ratio/Demo',
})
</script>

<template>
  <Story
    name="Default"
    :as-child="true"
  >
    <AspectRatio :ratio="16 / 9">
      <img
        class="h-full w-full object-cover"
        src="https://images.unsplash.com/photo-1498855926480-d98e83099315?w=300&dpr=2&q=80"
        alt="Landscape photograph by Tobias Tullius"
      >
    </AspectRatio>
  </Story>
</template>
