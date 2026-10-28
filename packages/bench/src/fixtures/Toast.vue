<script setup>
// Toast: N instances of a typical composition (closed/default state)
import { ToastClose, ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <ToastProvider :duration="1000000000">
    <div
      v-for="i in n"
      :key="i"
      class="ci"
    >
      <ToastRoot>
        <ToastTitle>Saved</ToastTitle>
        <ToastDescription>Changes saved.</ToastDescription>
        <ToastClose class="close">
          x
        </ToastClose>
      </ToastRoot>
    </div>
    <ToastViewport class="toast-vp" />
  </ToastProvider>
</template>
