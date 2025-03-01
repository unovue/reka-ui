<script setup lang="ts">
import { computed, onBeforeMount } from 'vue'
// @ts-expect-error type issue with `createContentLoader`
import { data as examples } from '../functions/examples.data'
import { type ContentData, useRouter } from 'vitepress'
import { normalizeLink } from '../functions/utils'

const router = useRouter()
const data = computed(() => examples.filter((example: ContentData) => example.url !== normalizeLink('/examples/')) as ContentData[])

onBeforeMount(() => {
  router.go(normalizeLink(data.value?.[0].url.replace('/en', '')))
})
</script>

<template>
  <div class="p-12">
    <div>
      <a
        v-for="example in data"
        :key="example.url"
        :href="example.url"
        class=""
      >
        {{ example.frontmatter.title }}
      </a>
    </div>
  </div>
</template>
