<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { RatingItem, RatingItemIndicator, RatingRoot } from '../'

const value = ref(3)
</script>

<template>
  <Story
    title="Rating/Demo"
    :layout="{ type: 'single' }"
  >
    <Variant title="default">
      <div class="flex flex-col items-center gap-2">
        <span class="text-lg">Rating:</span>
        <span class="text-2xl">{{ value }}</span>

        <RatingRoot
          v-slot="{ items }"
          v-model="value"
          hoverable
          :step="0.5"
          class="flex gap-2"
        >
          <RatingItem
            v-for="item in items"
            :key="item"
            v-slot="{ steps }"
            :item="item"
            class="relative size-14"
          >
            <RatingItemIndicator
              v-for="step in steps"
              :key="step"
              :step="step"
              class="data-[state=active]:text-yellow-500 text-gray-400 absolute overflow-hidden w-[var(--reka-rating-item-step-width)] opacity-[var(--reka-rating-item-step-opacity)] z-[var(--reka-rating-item-step-z-index)]"
            >
              <Icon
                icon="radix-icons:star"
                class="size-14"
              />
            </RatingItemIndicator>
          </RatingItem>
        </RatingRoot>
      </div>
    </Variant>
  </Story>
</template>
