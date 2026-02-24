<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'

import ScrollAreaCopy from './_ScrollAreaCopy.vue'
import ScrollAreaStory from './_ScrollAreaStory.vue'

const { Story } = defineMeta({
  title: 'Scroll Area/Chromatic/Both',
})
</script>

<template>
  <Story
    name="Both (Auto with overflow)"
    :as-child="true"
  >
    <ScrollAreaStory
      type="auto"
      vertical
      horizontal
    >
      <ScrollAreaCopy
        v-for="i in 10"
        :key="i"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Both (Auto without overflow)"
    :as-child="true"
  >
    <ScrollAreaStory
      type="auto"
      vertical
      horizontal
    >
      <ScrollAreaCopy class="overflow-hidden !w-[50px] !h-[50px]" />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Both (Always with overflow)"
    :as-child="true"
  >
    <ScrollAreaStory
      type="always"
      vertical
      horizontal
    >
      <ScrollAreaCopy
        v-for="i in 10"
        :key="i"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Both (Scroll with overflow)"
    :as-child="true"
  >
    <ScrollAreaStory
      type="scroll"
      vertical
      horizontal
    >
      <ScrollAreaCopy
        v-for="i in 10"
        :key="i"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Both (Scroll without overflow)"
    :as-child="true"
  >
    <ScrollAreaStory
      type="scroll"
      vertical
      horizontal
    >
      <ScrollAreaCopy class="overflow-hidden !w-[50px] !h-[50px]" />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Both (Hover with overflow)"
    :as-child="true"
  >
    <ScrollAreaStory
      type="hover"
      vertical
      horizontal
    >
      <ScrollAreaCopy
        v-for="i in 10"
        :key="i"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Both (Hover without overflow)"
    :as-child="true"
  >
    <ScrollAreaStory
      type="hover"
      vertical
      horizontal
    >
      <ScrollAreaCopy class="overflow-hidden !w-[50px] !h-[50px]" />
    </ScrollAreaStory>
  </Story>
</template>
