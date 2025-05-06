<script setup lang="ts">
import { Content, useData, useRoute } from 'vitepress'
import DocTopbar from '../components/DocTopbar.vue'
import ExampleHome from '../components/ExampleHome.vue'

const { path } = useRoute()
const { page, frontmatter } = useData()

import type { ContentData } from 'vitepress'
import { computed } from 'vue'
// @ts-expect-error type issue with `createContentLoader`
import { data as examples } from '../functions/examples.data'

const data = computed(() => examples.filter((example: ContentData) => example.url !== '/examples/') as ContentData[])
</script>

<template>
  <div class="w-full">
    <DocTopbar />

    <main v-if="page.relativePath === 'examples.md'">
      <ExampleHome :data />
    </main>

    <main
      class="flex"
    >
      <div class="px-12 py-12 overflow-x-hidden flex-1">
        <article class="w-full prose prose-stone dark:prose-invert max-w-screen-lg mx-auto">
          <Content />
        </article>
      </div>
    </main>
  </div>
</template>
