<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { RatingItem, RatingItemIndicator, RatingRoot } from 'reka-ui'
import { ref } from 'vue'

const rating = ref(3)
</script>

<template>
  <RatingRoot
    v-slot="{ items }"
    v-model="rating"
    hoverable
    class="flex gap-1"
  >
    <RatingItem
      v-for="item in items"
      :key="item"
      v-slot="{ steps }"
      :item="item"
      class="relative size-7 cursor-pointer"
    >
      <RatingItemIndicator
        v-for="step in steps"
        :key="step"
        :step="step"
        :aria-label="`Rate ${step}`"
        class="absolute overflow-hidden text-stone-300 data-[state=active]:text-yellow-400 w-[var(--reka-rating-item-step-width)] opacity-[var(--reka-rating-item-step-opacity)] z-[var(--reka-rating-item-step-z-index)] focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 rounded"
      >
        <Icon
          icon="radix-icons:star"
          class="size-7"
        />
      </RatingItemIndicator>
    </RatingItem>
  </RatingRoot>
</template>
