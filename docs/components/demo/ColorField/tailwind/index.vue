<script setup lang="ts">
import type { Color } from 'reka-ui'
import {
  ColorFieldInput,
  ColorFieldRoot,
  colorToHex,
  normalizeColor,
} from 'reka-ui'
import { computed, ref } from 'vue'

// v-model accepts a string and emits a Color object.
const color = ref<string | Color>('#56d799')
const hex = computed(() => colorToHex(normalizeColor(color.value)))
</script>

<template>
  <div class="flex flex-col gap-3">
    <ColorFieldRoot
      v-model="color"
      class="inline-flex flex-col gap-1"
    >
      <label class="text-sm font-medium text-foreground">
        Color
      </label>
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded border border-muted shrink-0"
          :style="{ background: hex }"
        />
        <ColorFieldInput
          class="px-3 py-2 border border-foreground/10 bg-muted text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed w-32"
        />
      </div>
    </ColorFieldRoot>
  </div>
</template>
