<script setup lang="ts">
import type { Color, ColorChannel, ColorSpace } from '@/shared/color'
import { computed, ref } from 'vue'
import { colorToHex, normalizeColor } from '@/shared/color'
import {
  ColorFieldInput,
  ColorFieldRoot,
} from '../'

const props = defineProps<{
  defaultValue?: string
  colorSpace?: ColorSpace
  channel?: ColorChannel
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  disableWheelChange?: boolean
  step?: number
}>()

// v-model emits a Color object; the hex is derived for display.
const color = ref<string | Color>(props.defaultValue ?? '#ff0000')
const hex = computed(() => colorToHex(normalizeColor(color.value)))
</script>

<template>
  <div class="flex flex-col gap-2">
    <ColorFieldRoot
      v-model="color"
      :color-space="colorSpace ?? 'hsl'"
      :channel="channel"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :disable-wheel-change="disableWheelChange"
      :step="step"
      class="inline-flex flex-col gap-1"
    >
      <ColorFieldInput
        class="px-3 py-2 border border-gray-300 bg-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed read-only:bg-zinc-600"
        :class="channel ? 'w-24' : 'w-36'"
      />
    </ColorFieldRoot>

    <div class="flex items-center gap-2 text-xs text-gray-500">
      <div
        class="w-5 h-5 rounded border border-gray-200"
        :style="{ background: hex }"
      />
      <span>{{ hex }}</span>
    </div>
  </div>
</template>
