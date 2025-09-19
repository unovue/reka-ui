<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface HighlightsProps {
  features: string[]
}

const props = defineProps<HighlightsProps>()
</script>

<template>
  <ul class="flex flex-col gap-1 !pl-0">
    <li
      v-for="(feature, index) in props.features"
      :key="index"
      class="p-0 mb-0 mt-1 flex items-center gap-4"
    >
      <span class="rounded-full h-6 aspect-square !w-6 flex-none flex items-center justify-center bg-primary/10 border border-primary/10 ">
        <Icon
          icon="radix-icons:check"
          class="h-4 w-4 text-primary"
        />
      </span>
      <span v-html="feature" />
    </li>
  </ul>
</template>
