<script setup lang="ts">
import type { Color } from '@/shared/color'
import { computed, ref } from 'vue'
import { ColorSwatch } from '@/ColorSwatch'
import { colorToString, normalizeColor } from '@/shared/color'
import {
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
} from '../'

const props = defineProps<{
  defaultValue?: string
  colorSpace?: 'rgb' | 'hsl' | 'hsb'
  channels: Array<'hue' | 'saturation' | 'lightness' | 'brightness' | 'red' | 'green' | 'blue' | 'alpha'>
}>()

// Use a Color object as single source of truth to avoid hex round-trip drift.
const colorObj = ref<Color>(normalizeColor(props.defaultValue ?? '#7f007f'))
const hexColor = computed(() => colorToString(colorObj.value, 'hex'))

function handleColorUpdate(newColor: Color) {
  colorObj.value = newColor
}

const channelLabels: Record<string, string> = {
  hue: 'H',
  saturation: 'S',
  lightness: 'L',
  brightness: 'B',
  red: 'R',
  green: 'G',
  blue: 'B',
  alpha: 'A',
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-3">
      <ColorSwatch
        :color="hexColor"
        class="w-12 h-12 rounded-lg border-2 border-gray-200"
        style="background-color: var(--reka-color-swatch-color)"
      />
      <div class="flex flex-col gap-0.5">
        <span class="text-sm font-medium text-gray-700">Selected Color</span>
        <code class="text-xs text-gray-500">{{ hexColor }}</code>
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <div
        v-for="channel in channels"
        :key="channel"
        class="flex items-center gap-3"
      >
        <span class="text-xs font-medium text-gray-500 w-3 shrink-0">{{ channelLabels[channel] }}</span>
        <ColorSliderRoot
          :model-value="colorObj"
          :channel="channel"
          :color-space="colorSpace ?? 'hsl'"
          class="relative flex items-center select-none touch-none w-[220px] h-5"
          @update:color="handleColorUpdate"
        >
          <ColorSliderTrack
            class="relative flex-1 rounded-full h-3"
          >
            <div class="absolute inset-0 rounded-full" />
          </ColorSliderTrack>
          <ColorSliderThumb class="block w-5 h-5 rounded-full bg-white border-2 border-gray-400 shadow-lg cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </ColorSliderRoot>
      </div>
    </div>
  </div>
</template>
