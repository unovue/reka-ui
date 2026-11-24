<script setup lang="ts">
import { ToastAction, ToastClose, ToastDescription, ToastRoot, ToastTitle, ToastViewport, useToastManager } from '..'

const { toasts } = useToastManager()
</script>

<template>
  <ToastViewport class="stack-viewport">
    <ToastRoot
      v-for="toast in toasts"
      :key="toast.id"
      :toast="toast"
      class="stack-toast"
    >
      <ToastTitle class="font-medium" />
      <ToastDescription class="text-sm text-gray-600" />
      <div class="flex gap-2 mt-2">
        <ToastAction class="text-sm underline" />
        <ToastClose class="text-sm">
          Dismiss
        </ToastClose>
      </div>
    </ToastRoot>
  </ToastViewport>
</template>

<style>
.stack-viewport {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 340px;
  margin: 0;
  padding: 0;
  list-style: none;
  z-index: 2147483647;
  outline: none;
}
.stack-toast {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  overflow: hidden;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgb(0 0 0 / 0.12);
  height: var(--reka-toast-frontmost-height);
  transform: translateY(calc(var(--reka-toast-index) * -12px)) scale(calc(1 - var(--reka-toast-index) * 0.05));
  z-index: calc(1000 - var(--reka-toast-index));
  transition: transform 300ms, opacity 300ms, height 300ms;
}
.stack-viewport[data-expanded] .stack-toast {
  height: var(--reka-toast-height);
  transform: translateY(calc(var(--reka-toast-offset-y) * -1 - var(--reka-toast-index) * 12px));
}
.stack-toast[data-limited] {
  opacity: 0;
}
.stack-toast[data-state='closed'] {
  animation: stack-toast-hide 200ms ease-in forwards;
}
.stack-toast[data-status='loading'] {
  border-color: #93c5fd;
}
.stack-toast[data-status='success'] {
  border-color: #86efac;
}
.stack-toast[data-status='error'] {
  border-color: #fca5a5;
}
@keyframes stack-toast-hide {
  to {
    opacity: 0;
  }
}
</style>
