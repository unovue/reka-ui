<script setup lang="ts">
import { onContentUpdated, useData } from 'vitepress'
import { ref } from 'vue'
import DocOutlineItem from '../components/DocOutlineItem.vue'
import { getHeaders, useActiveAnchor } from '../composables/outline'

defineProps<{
  collapsible?: boolean
}>()

const { page, frontmatter, theme } = useData()

onContentUpdated(() => {
  getHeaders(frontmatter.value.outline ?? theme.value.outline)
})

const container = ref()
const marker = ref()

useActiveAnchor(container, marker)
</script>

<template>
  <nav
    ref="container"
    class="block relative not-prose"
  >
    <div
      ref="marker"
      class="outline-marker absolute left-0 h-[18px] w-[2px] bg-primary transition-[top,opacity] ease-in-out duration-300 rounded-full -translate-y-1"
    />

    <div
      v-if="!collapsible"
      id="doc-outline-aria-label"
      aria-level="2"
      class="font-bold text-sm mb-2 trunc"
      role="heading"
    >
      On this page
    </div>

    <div class="border-l border-muted">
      <DocOutlineItem
        :headers="page.headers"
        :root="true"
      />
    </div>
  </nav>
</template>
