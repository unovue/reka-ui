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
    as-child
  >
    <div class="mb-4 text-sm text-white">
      type: <select
        v-model="state.type"
        class="text-black"
      >
        <option
          v-for="opt in ['auto', 'always', 'scroll', 'hover']"
          :key="opt"
          :value="opt"
        >
          {{ opt }}
        </option>
      </select>
    </div>

    <ScrollAreaStory :type="state.type">
      <ScrollAreaCopy
        v-for="i in 30"
        :key="i"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Resizable"
    as-child
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
    as-child
  >
    <div class="mb-4 text-sm text-white">
      Vertical count: <input
        v-model="contentChangeState.verticalCount"
        type="number"
        step="1"
        class="text-black"
      >
      Horizontal count: <input
        v-model="contentChangeState.horizontalCount"
        type="number"
        step="1"
        class="text-black"
      >
    </div>

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
    as-child
  >
    <div class="mb-4 text-sm text-white">
      type: <select
        v-model="state.type"
        class="text-black"
      >
        <option
          v-for="opt in ['auto', 'always', 'scroll', 'hover']"
          :key="opt"
          :value="opt"
        >
          {{ opt }}
        </option>
      </select>
    </div>

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
