<script setup lang="ts">
import {
  ColorAreaArea,
  ColorAreaRoot,
  ColorAreaThumb,
} from 'reka-ui'
import { ref } from 'vue'

const color = ref('#ff0000')
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="text-sm text-gray-600 dark:text-gray-400">
      Current: {{ color }}
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
