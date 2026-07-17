<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import ScrollAreaCopy from './_ScrollAreaCopy.vue'
import ScrollAreaStory from './_ScrollAreaStory.vue'

const { Story } = defineMeta({
  title: 'Scroll Area/Chromatic/Horizontal',
})
</script>

<template>
  <Story
    name="Horizontal (Auto with overflow)"
    as-child
  >
    <ScrollAreaStory
      type="auto"
      :vertical="false"
      horizontal
    >
      <ScrollAreaCopy
        v-for="i in 10"
        :key="i"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Horizontal (Auto without overflow)"
    as-child
  >
    <ScrollAreaStory
      type="auto"
      :vertical="false"
      horizontal
    >
      <ScrollAreaCopy class="overflow-hidden !w-[50px]" />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Horizontal (Always with overflow)"
    as-child
  >
    <ScrollAreaStory
      type="always"
      :vertical="false"
      horizontal
    >
      <ScrollAreaCopy
        v-for="i in 10"
        :key="i"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Horizontal (Scroll with overflow)"
    as-child
  >
    <ScrollAreaStory
      type="scroll"
      :vertical="false"
      horizontal
    >
      <ScrollAreaCopy
        v-for="i in 10"
        :key="i"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Horizontal (Scroll without overflow)"
    as-child
  >
    <ScrollAreaStory
      type="scroll"
      :vertical="false"
      horizontal
    >
      <ScrollAreaCopy class="overflow-hidden !w-[50px]" />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Horizontal (Hover with overflow)"
    as-child
  >
    <ScrollAreaStory
      type="hover"
      :vertical="false"
      horizontal
    >
      <ScrollAreaCopy
        v-for="i in 10"
        :key="i"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Horizontal (Hover without overflow)"
    as-child
  >
    <ScrollAreaStory
      type="hover"
      :vertical="false"
      horizontal
    >
      <ScrollAreaCopy class="overflow-hidden !w-[50px]" />
    </ScrollAreaStory>
  </Story>
</template>
