<script setup lang="ts">
import type { Color } from 'reka-ui'
import {
  ColorAreaArea,
  ColorAreaRoot,
  ColorAreaThumb,
  colorToHex,
  normalizeColor,
} from 'reka-ui'
import { computed, ref } from 'vue'

// v-model accepts a string and emits a Color object.
const color = ref<string | Color>('#56d799')
const hex = computed(() => colorToHex(normalizeColor(color.value)))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="text-sm text-gray-600 dark:text-gray-400">
      Current: {{ hex }}
    </div>

    <ColorAreaRoot
      v-slot="{ style }"
      v-model="color"
      class="relative"
    >
      <ColorAreaArea
        class="relative w-[200px] h-[200px] rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-green-500"
        :style="style"
      >
        <ColorAreaThumb class="block w-4 h-4 rounded-full bg-white border-2 border-gray-400 shadow cursor-pointer" />
      </ColorAreaArea>
    </ColorAreaRoot>
  </div>
</template>
