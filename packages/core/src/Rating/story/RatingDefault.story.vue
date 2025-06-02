<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { RatingItem, RatingItemTrigger, RatingRoot } from '../'

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
                class="size-14"
              />
            </RatingItemTrigger>
          </RatingItem>
        </RatingRoot>
      </div>
    </Variant>
  </Story>
</template>
