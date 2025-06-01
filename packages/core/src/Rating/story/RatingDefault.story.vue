<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { RatingItem, RatingRoot } from '../'

const value = ref(3)
</script>

<template>
  <Story
    title="Rating/Demo"
    :layout="{ type: 'single', iframe: true }"
  >
    <Variant title="default">
      <div class="flex flex-col items-center gap-2">
        <span class="text-lg">Rating:</span>
        <span class="text-2xl">{{ value }}</span>

        <RatingRoot
          v-slot="{ ratings }"
          v-model="value"
          clearable
          class="flex gap-2"
        >
          <RatingItem
            v-for="rating in ratings"
            :key="rating"
            :rating="rating"
            class=" data-[state=active]:text-yellow-500 text-gray-400"
          >
            <Icon icon="radix-icons:star" />
          </RatingItem>
        </RatingRoot>
      </div>
    </Variant>
  </Story>
</template>
