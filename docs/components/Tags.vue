<script setup lang="ts">
import { useData } from 'vitepress'

const { frontmatter } = useData()
</script>

<template>
  <div class="flex items-center gap-4 py-4">
    <div
      v-for="tag in frontmatter.tags ?? []"
      :key="tag"
      class="font-medium px-4 py-2 rounded-full border border-muted text-sm bg-muted/30 text-muted-foreground"
    >
      {{ tag }}
    </div>
  </div>
</template>
