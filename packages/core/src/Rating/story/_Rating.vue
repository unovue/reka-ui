<script setup lang="ts">
import type { RatingRootProps } from '..'
import { Icon } from '@iconify/vue'
import { RatingItem, RatingItemIndicator, RatingRoot } from '..'

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
      v-slot="{ steps }"
      :item="item"
      class="relative size-8"
    >
      <RatingItemIndicator
        v-for="step in steps"
        :key="step"
        :step="step"
        class="data-[state=active]:text-yellow-500 text-gray-400 absolute overflow-hidden w-[var(--reka-rating-item-step-width)] opacity-[var(--reka-rating-item-step-opacity)] z-[var(--reka-rating-item-step-z-index)]"
        :aria-label="`Rating ${step} of ${items.length}`"
      >
        <Icon
          icon="radix-icons:star"
          class="size-8"
        />
      </RatingItemIndicator>
    </RatingItem>
  </RatingRoot>
</template>
