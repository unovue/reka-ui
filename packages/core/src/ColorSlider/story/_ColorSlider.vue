<script setup lang="ts">
import { ref } from 'vue'
import {
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
} from '../'

const props = defineProps<{
  defaultValue?: string
  channel?: 'hue' | 'saturation' | 'lightness' | 'brightness' | 'red' | 'green' | 'blue' | 'alpha'
  colorSpace?: 'rgb' | 'hsl' | 'hsb'
  orientation?: 'horizontal' | 'vertical'
  disabled?: boolean
  inverted?: boolean
  step?: number
}>()

const color = ref(props.defaultValue ?? '#ff0000')
</script>

<template>
  <div class="flex flex-col gap-3">
    <ColorSliderRoot
      v-model="color"
      :channel="channel ?? 'hue'"
      :color-space="colorSpace ?? 'hsl'"
      :orientation="orientation ?? 'horizontal'"
      :disabled="disabled"
      :inverted="inverted"
      :step="step"
      class="relative flex items-center select-none touch-none"
      :class="orientation === 'vertical' ? 'h-[200px] w-5' : 'w-[200px] h-5'"
    >
      <ColorSliderTrack
        class="relative flex-1 rounded-full"
        :class="orientation === 'vertical' ? 'w-3' : 'h-3'"
      >
        <div class="absolute inset-0 rounded-full" />
      </ColorSliderTrack>
      <ColorSliderThumb
        class="block w-5 h-5 rounded-full bg-white border-2 border-gray-400 shadow-lg cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="disabled ? 'opacity-50 !cursor-not-allowed hover:!scale-100' : ''"
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
