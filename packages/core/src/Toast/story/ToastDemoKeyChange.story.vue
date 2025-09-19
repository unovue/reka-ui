<script setup lang="ts">
import { ref } from 'vue'
import { ToastDescription, ToastProvider, ToastRoot, ToastViewport } from '..'

const one = ref(0)
const two = ref(0)
</script>

<template>
  <Story
    title="Toast/Key Change"
    :layout="{ type: 'single', iframe: false }"
  >
    <ToastProvider>
      <button @click="one++">
        Open toast one
      </button>
      <button @click="two++">
        Open toast two
      </button>

      <ToastRoot
        v-if="one > 0"
        :key="`one-${String(one)}`"
        class="flex items-center space-between pointer-events-auto"
      >
        <ToastDescription>Toast one</ToastDescription>
      </ToastRoot>

      <ToastRoot
        v-if="two > 0"
        :key="`two-${String(two)}`"
        class="flex items-center space-between pointer-events-auto"
      >
        <ToastDescription>Toast two</ToastDescription>
      </ToastRoot>

      <ToastViewport class="fixed top-1/2 right-1/2 border flex flex-col overflow-hidden" />
    </ToastProvider>
  </Story>
</template>
