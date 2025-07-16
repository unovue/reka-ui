<script setup lang="ts">
import { AspectRatio } from 'reka-ui'

defineProps<{
  title: string
  description?: string
  url: string
  image?: string
}>()
</script>

<template>
  <div class="h-full">
    <a
      class="flex flex-col bg-card rounded-2xl p-4 border border-muted hover:border-primary h-full"
      target="_blank"
      :href="url"
    >
      <h5 class="font-bold">{{ title }}</h5>
      <p class="flex-1 my-1 text-sm text-muted-foreground">{{ description }}</p>

      <AspectRatio
        v-if="image"
        :ratio="16 / 9"
        class="rounded-lg mt-2 overflow-hidden border border-muted"
      >
        <img
          class="w-full h-full object-cover"
          :src="image"
          :alt="title"
        >
      </AspectRatio>

    </a>
  </div>
</template>
