<script setup lang="ts">
import {
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
} from 'reka-ui'
import { ref } from 'vue'

const color = ref('#10b981')
</script>

<template>
  <div class="flex flex-col gap-4">
    <ColorSliderRoot
      v-model="color"
      channel="hue"
      class="relative flex items-center select-none touch-none w-[200px] h-5"
    >
      <ColorSliderTrack
        class="relative flex-1 rounded-full h-3"
      >
        <div class="absolute inset-0 rounded-full" />
      </ColorSliderTrack>
      <ColorSliderThumb
        class="block w-5 h-5 rounded-full bg-white border-2 border-gray-400 shadow-lg cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </ColorSliderRoot>

    <div class="flex items-center gap-2 text-xs text-gray-500">
      <div
        class="w-5 h-5 rounded border border-gray-200 shrink-0"
        :style="{ background: color }"
      />
      <span class="font-mono">{{ color }}</span>
    </div>
  </div>
</template>
