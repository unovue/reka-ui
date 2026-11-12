<script setup lang="ts">
import { ToastArrow, ToastPositioner, ToastRoot, ToastTitle, ToastViewport, useToastManager } from '..'

const { toasts } = useToastManager()
</script>

<template>
  <ToastViewport as="div">
    <ToastPositioner
      v-for="toast in toasts"
      :key="toast.id"
      :toast="toast"
      :side-offset="8"
    >
      <ToastRoot
        :toast="toast"
        as="div"
        class="bg-black text-white text-sm rounded px-2 py-1"
      >
        <ToastTitle />
        <ToastArrow class="fill-black" />
      </ToastRoot>
    </ToastPositioner>
  </ToastViewport>
</template>
