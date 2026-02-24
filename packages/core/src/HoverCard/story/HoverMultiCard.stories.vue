<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'

import {
  HoverCardContent,
  HoverCardPortal,
  HoverCardRoot,
  HoverCardTrigger,
} from '..'

const { Story } = defineMeta({
  title: 'Hover Card/Multi',
})
</script>

<template>
  <Story
    name="Default"
    :as-child="true"
  >
    <div class="flex h-10 items-center gap-0.5 mt-20">
      <HoverCardRoot
        v-for="(entry, index) in 20"
        :key="index"
        :open-delay="10"
        :close-delay="0"
      >
        <HoverCardTrigger :as-child="true">
          <div
            class="h-full w-3 rounded-[1px] first:rounded-l-[4px] last:rounded-r-[4px] bg-green-500"
          />
        </HoverCardTrigger>
        <HoverCardPortal>
          <HoverCardContent
            side="top"
            :side-offset="5"
            class="font-brand bg-black w-16 text-center rounded-md px-2 py-1 text-white"
          >
            {{ index }}
          </HoverCardContent>
        </HoverCardPortal>
      </HoverCardRoot>
    </div>
  </Story>
</template>
