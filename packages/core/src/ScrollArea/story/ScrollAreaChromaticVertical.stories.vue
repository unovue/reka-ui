<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'

import ScrollAreaCopy from './_ScrollAreaCopy.vue'
import ScrollAreaStory from './_ScrollAreaStory.vue'

const { Story } = defineMeta({
  title: 'Scroll Area/Chromatic/Vertical',
})
</script>

<template>
  <Story
    name="Vertical (Auto with overflow)"
    :as-child="true"
  >
    <ScrollAreaStory
      type="auto"
      vertical
      :horizontal="false"
    >
      <ScrollAreaCopy
        v-for="i in 10"
        :key="i"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Vertical (Auto without overflow)"
    :as-child="true"
  >
    <ScrollAreaStory
      type="auto"
      vertical
      :horizontal="false"
    >
      <ScrollAreaCopy class="overflow-hidden h-[50px]" />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Vertical (Always with overflow)"
    :as-child="true"
  >
    <ScrollAreaStory
      type="always"
      vertical
      :horizontal="false"
    >
      <ScrollAreaCopy
        v-for="i in 10"
        :key="i"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Vertical (Scroll with overflow)"
    :as-child="true"
  >
    <ScrollAreaStory
      type="scroll"
      vertical
      :horizontal="false"
    >
      <ScrollAreaCopy
        v-for="i in 10"
        :key="i"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Vertical (Scroll without overflow)"
    :as-child="true"
  >
    <ScrollAreaStory
      type="scroll"
      vertical
      :horizontal="false"
    >
      <ScrollAreaCopy class="overflow-hidden h-[50px]" />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Vertical (Hover with overflow)"
    :as-child="true"
  >
    <ScrollAreaStory
      type="hover"
      vertical
      :horizontal="false"
    >
      <ScrollAreaCopy
        v-for="i in 10"
        :key="i"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Vertical (Hover without overflow)"
    :as-child="true"
  >
    <ScrollAreaStory
      type="hover"
      vertical
      :horizontal="false"
    >
      <ScrollAreaCopy class="overflow-hidden h-[50px]" />
    </ScrollAreaStory>
  </Story>
</template>
