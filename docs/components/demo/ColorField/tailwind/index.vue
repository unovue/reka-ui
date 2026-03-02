<script setup lang="ts">
import {
  ColorFieldInput,
  ColorFieldRoot,
} from 'reka-ui'
import { ref } from 'vue'

const color = ref('#3b82f6')
</script>

<template>
  <div class="flex flex-col gap-3">
    <ColorFieldRoot
      v-model="color"
      class="inline-flex flex-col gap-1"
    >
      <label class="text-sm font-medium text-gray-900 dark:text-gray-100">
        Color
      </label>
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded border border-gray-200 dark:border-gray-700 shrink-0"
          :style="{ background: color }"
        />
        <ColorFieldInput
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed w-32"
        />
      </div>
    </ColorFieldRoot>

    <div class="flex items-center gap-2 text-xs text-gray-500">
      <span>Value: {{ color }}</span>
    </div>
  </div>
</template>
