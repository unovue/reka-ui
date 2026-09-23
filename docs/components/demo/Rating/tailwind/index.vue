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
    class="flex gap-1"
  >
    <RatingItem
      v-for="item in items"
      :key="item"
      v-slot="{ steps }"
      :item="item"
      class="relative size-8 cursor-pointer transition-transform duration-150 ease-out hover:scale-110"
    >
      <RatingItemIndicator
        v-for="step in steps"
        :key="step"
        :step="step"
        :aria-label="`Rate ${step}`"
        class="absolute overflow-hidden text-stone-200 transition-colors duration-150 data-[state=active]:text-[hsl(142.1_70.6%_45.3%)] data-[state=active]:drop-shadow-[0_1px_4px_hsl(142.1_70.6%_45.3%/0.5)] w-[var(--reka-rating-item-step-width)] opacity-[var(--reka-rating-item-step-opacity)] z-[var(--reka-rating-item-step-z-index)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(142.1_70.6%_45.3%)] rounded"
      >
        <Icon
          icon="material-symbols:star-rounded"
          class="size-8"
        />
      </RatingItemIndicator>
    </RatingItem>
  </RatingRoot>
</template>
