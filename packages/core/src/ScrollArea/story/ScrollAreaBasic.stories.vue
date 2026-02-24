<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'

import { reactive } from 'vue'
import ScrollAreaCopy from './_ScrollAreaCopy.vue'
import ScrollAreaStory from './_ScrollAreaStory.vue'

type Type = 'auto' | 'always' | 'scroll' | 'hover'

const state = reactive({
  type: 'hover' as Type,
})

const contentChangeState = reactive({
  verticalCount: 1,
  horizontalCount: 1,
})

const { Story } = defineMeta({
  title: 'Scroll Area/Basic',
})
</script>

<template>
  <Story
    name="Basic"
    :as-child="true"
  >
    <ScrollAreaStory :type="state.type">
      <ScrollAreaCopy
        v-for="i in 30"
        :key="i"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Resizable"
    :as-child="true"
  >
    <div class="w-[400px] h-[400px] resize overflow-hidden">
      <ScrollAreaStory class="w-full h-full">
        <ScrollAreaCopy
          v-for="i in 30"
          :key="i"
        />
      </ScrollAreaStory>
    </div>
  </Story>

  <Story
    name="Content Change"
    :as-child="true"
  >
    <div class="w-[400px] h-[400px]">
      <ScrollAreaStory
        type="always"
        class="w-full h-full"
      >
        <ScrollAreaCopy
          v-for="i in contentChangeState.verticalCount"
          :key="i"
          :style="{ width: `${300 * contentChangeState.horizontalCount}px` }"
        />
      </ScrollAreaStory>
    </div>
  </Story>

  <Story
    name="Animated"
    :as-child="true"
  >
    <ScrollAreaStory
      animated
      :type="state.type"
    >
      <ScrollAreaCopy
        v-for="i in 30"
        :key="i"
      />
    </ScrollAreaStory>
  </Story>
</template>
