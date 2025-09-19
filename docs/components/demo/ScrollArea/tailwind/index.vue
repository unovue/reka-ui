<script setup lang="ts">
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'reka-ui'

const tags = Array.from({ length: 50 }).map((_, i, a) => `v1.2.0-beta.${a.length - i}`)
</script>

<template>
  <ScrollAreaRoot
    class="w-[200px] h-[225px] relative overflow-hidden shadow-sm bg-white border rounded-lg"
    style="--scrollbar-size: 10px"
  >
    <div class="absolute top-0 z-10 w-full h-6 bg-gradient-to-t from-transparent to-white" />
    <ScrollAreaViewport class="w-full h-full rounded">
      <div class="py-[15px] px-5">
        <div class="text-grass11 text-sm leading-[18px] font-semibold">
          Tags
        </div>
        <div
          v-for="tag in tags"
          :key="tag"
          class="text-mauve12 text-xs leading-[18px] mt-2.5 pt-2.5 border-t border-t-mauve6"
        >
          {{ tag }}
        </div>
      </div>
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      class="flex select-none touch-none p-0.5 z-20 bg-blackA1 transition-colors duration-[160ms] ease-out hover:bg-blackA2 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
      orientation="vertical"
    >
      <ScrollAreaThumb
        class="flex-1 bg-mauve10 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]"
      />
    </ScrollAreaScrollbar>
    <ScrollAreaScrollbar
      class="flex select-none touch-none p-0.5 bg-blackA6 transition-colors duration-[160ms] ease-out hover:bg-blackA8 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
      orientation="horizontal"
    >
      <ScrollAreaThumb
        class="flex-1 bg-mauve10 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]"
      />
    </ScrollAreaScrollbar>

    <div class="absolute bottom-0 z-10 w-full h-6 bg-gradient-to-b from-transparent to-white" />
  </ScrollAreaRoot>
</template>
