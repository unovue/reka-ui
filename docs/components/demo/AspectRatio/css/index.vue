<script setup lang="ts">
import { AspectRatio } from 'reka-ui'
import './styles.css'
</script>

<template>
  <div class="Container">
    <AspectRatio :ratio="16 / 9">
      <img
        class="Image"
        src="https://images.unsplash.com/photo-1498855926480-d98e83099315?w=300&dpr=2&q=80"
        alt="Landscape photograph by Tobias Tullius"
      >
    </AspectRatio>
  </div>
</template>
