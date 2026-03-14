<script setup lang="ts">
import type { ColorChannel, ColorSpace } from '@/shared/color'
import { ref } from 'vue'
import {
  ColorAreaArea,
  ColorAreaRoot,
  ColorAreaThumb,
} from '../'

const props = defineProps<{
  defaultValue?: string
  colorSpace?: ColorSpace
  xChannel?: ColorChannel
  yChannel?: ColorChannel
  disabled?: boolean
}>()

const color = ref(props.defaultValue ?? '#ff0000')
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="text-sm">
      Current: {{ color }}
    </div>

    <ColorAreaRoot
      v-slot="{ style }"
      v-model="color"
      :color-space="colorSpace"
      :x-channel="xChannel"
      :y-channel="yChannel"
      :disabled="disabled"
      class="relative"
    >
      <ColorAreaArea
        class="relative w-[200px] h-[200px] rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
        :style="style"
      >
        <ColorAreaThumb class="block w-4 h-4 rounded-full bg-white border-2 border-gray-400 shadow cursor-pointer" />
      </ColorAreaArea>
    </ColorAreaRoot>
  </div>
</template>
