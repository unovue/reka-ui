<script setup lang="ts">
import type { RatingRootProps } from '..'
import { Icon } from '@iconify/vue'
import { RatingItem, RatingItemTrigger, RatingRoot } from '..'

const props = defineProps<RatingRootProps>()
</script>

<template>
  <RatingRoot
    v-slot="{ items }"
    v-bind="props"
    class="flex gap-2"
  >
    <RatingItem
      v-for="item in items"
      :key="item"
      :item="item"
    >
      <RatingItemTrigger class="data-[state=active]:text-yellow-500 text-gray-400">
        <Icon
          icon="radix-icons:star"
          class="size-8"
        />
      </RatingItemTrigger>
    </RatingItem>
  </RatingRoot>
</template>
