<script setup lang="ts">
import { ref } from 'vue'
import { ProgressIndicator, ProgressRoot } from '..'

const interactive = ref(0)
setTimeout(() => {
  // For some reason, this interval triggers twice in the same tick
  interactive.value = (interactive.value + 50) % 100
}, 200)
</script>

<template>
  <ProgressRoot
    v-model="interactive"
    class="relative flex items-center justify-center w-full h-8 overflow-hidden rounded-full bg-blackA9 full"
  >
    <ProgressIndicator
      class="w-full h-full transition-transform duration-1000 bg-white"
      :style="`transform: translateX(-${100 - interactive}%)`"
    />
    <div
      class="absolute font-mono text-xs font-bold tracking-widest text-center text-green-400 uppercase pointer-events-none mix-blend-normal"
    >
      {{ interactive.toFixed(2) }}%
    </div>
  </ProgressRoot>
</template>
