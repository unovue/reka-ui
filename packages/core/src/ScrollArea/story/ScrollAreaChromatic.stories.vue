<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import { ConfigProvider } from '../../ConfigProvider'
import ScrollAreaCopy from './_ScrollAreaCopy.vue'
import ScrollAreaStory from './_ScrollAreaStory.vue'

const { Story } = defineMeta({
  title: 'Scroll Area/Chromatic',
})
</script>

<template>
  <Story
    name="Min thumb size"
    as-child
  >
    <ScrollAreaStory
      type="always"
      vertical
      horizontal
    >
      <ScrollAreaCopy
        v-for="i in 100"
        :key="i"
        style="width: 10000px"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="RTL (prop)"
    as-child
  >
    <ScrollAreaStory
      type="always"
      dir="rtl"
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
    name="RTL (inherited)"
    as-child
  >
    <ConfigProvider dir="rtl">
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
    </ConfigProvider>
  </Story>

  <Story
    name="Ellipsis at viewport width"
    as-child
  >
    <ScrollAreaStory
      type="always"
      vertical
      :horizontal="false"
    >
      <ScrollAreaCopy
        v-for="i in 10"
        :key="i"
        class="w-full truncate"
      />
    </ScrollAreaStory>
  </Story>

  <Story
    name="Ellipsis at content width"
    as-child
  >
    <ScrollAreaStory
      type="always"
      vertical
      :horizontal="true"
    >
      <ScrollAreaCopy
        v-for="i in 10"
        :key="i"
        class="!w-[125px] truncate"
      />
    </ScrollAreaStory>
  </Story>
</template>
