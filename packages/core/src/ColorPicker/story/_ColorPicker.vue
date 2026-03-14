<script setup lang="ts">
import type { Color } from '@/shared/color'
import { computed, ref } from 'vue'
import {
  ColorAreaArea,
  ColorAreaRoot,
  ColorAreaThumb,
} from '@/ColorArea'
import {
  ColorFieldInput,
  ColorFieldRoot,
} from '@/ColorField'
import {
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
} from '@/ColorSlider'
import { ColorSwatch } from '@/ColorSwatch'
import { colorToString, normalizeColor } from '@/shared/color'

const props = defineProps<{
  defaultValue?: string
}>()

// Use a Color object as the single source of truth.
// This avoids hex round-trip precision loss between components.
const colorObj = ref<Color>(normalizeColor(props.defaultValue ?? '#7f007f'))
const hexColor = computed(() => colorToString(colorObj.value, 'hex'))

function handleColorUpdate(newColor: Color) {
  colorObj.value = newColor
}

function handleHexUpdate(hex: string) {
  colorObj.value = normalizeColor(hex)
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6 max-w-md">
    <div class="flex items-center gap-4">
      <ColorSwatch
        :color="hexColor"
        class="w-16 h-16 rounded-lg border-2 border-gray-200"
        style="background-color: var(--reka-color-swatch-color)"
      />
      <div class="flex flex-col gap-1">
        <span class="text-sm font-medium text-gray-700">Selected Color</span>
        <code class="text-xs text-gray-500">{{ hexColor }}</code>
      </div>
    </div>

    <!-- 2D Color Area (Saturation/Lightness) -->
    <ColorAreaRoot
      v-slot="{ style }"
      :model-value="colorObj"
      color-space="hsl"
      x-channel="saturation"
      y-channel="lightness"
      class="relative"
      @update:color="handleColorUpdate"
    >
      <ColorAreaArea
        class="relative w-[280px] h-[200px] rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
        :style="style"
      >
        <ColorAreaThumb class="block w-5 h-5 rounded-full bg-white border-2 border-gray-400 shadow-lg cursor-pointer hover:scale-110 transition-transform" />
      </ColorAreaArea>
    </ColorAreaRoot>

    <!-- Hue Slider -->
    <ColorSliderRoot
      :model-value="colorObj"
      channel="hue"
      color-space="hsl"
      class="relative flex items-center w-[280px] h-6"
      @update:color="handleColorUpdate"
    >
      <ColorSliderTrack class="relative flex-1 rounded-full h-3">
        <div class="absolute inset-0 rounded-full" />
      </ColorSliderTrack>
      <ColorSliderThumb class="block w-5 h-5 rounded-full bg-white border-2 border-gray-400 shadow-lg cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </ColorSliderRoot>

    <!-- Alpha Slider -->
    <ColorSliderRoot
      :model-value="colorObj"
      channel="alpha"
      color-space="hsl"
      class="relative flex items-center w-[280px] h-6"
      @update:color="handleColorUpdate"
    >
      <ColorSliderTrack class="relative flex-1 rounded-full h-3">
        <div class="absolute inset-0 rounded-full" />
      </ColorSliderTrack>
      <ColorSliderThumb class="block w-5 h-5 rounded-full bg-white border-2 border-gray-400 shadow-lg cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </ColorSliderRoot>

    <!-- Color Field -->
    <div class="flex gap-2">
      <ColorFieldRoot
        :model-value="hexColor"
        class="flex-1"
        @update:model-value="handleHexUpdate"
      >
        <ColorFieldInput
          class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="#000000"
        />
      </ColorFieldRoot>
      <ColorFieldRoot
        :model-value="colorObj"
        channel="hue"
        color-space="hsl"
        class="w-20"
        @update:color="handleColorUpdate"
      >
        <ColorFieldInput
          class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="H"
        />
      </ColorFieldRoot>
      <ColorFieldRoot
        :model-value="colorObj"
        channel="saturation"
        color-space="hsl"
        class="w-20"
        @update:color="handleColorUpdate"
      >
        <ColorFieldInput
          class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="S"
        />
      </ColorFieldRoot>
      <ColorFieldRoot
        :model-value="colorObj"
        channel="lightness"
        color-space="hsl"
        class="w-20"
        @update:color="handleColorUpdate"
      >
        <ColorFieldInput
          class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="L"
        />
      </ColorFieldRoot>
    </div>
  </div>
</template>
