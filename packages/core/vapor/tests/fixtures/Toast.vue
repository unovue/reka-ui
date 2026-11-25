<script setup vapor lang="ts">
import { ToastAction, ToastClose, ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from '#reka'
import { ref } from 'vue'

const open = ref(false)
const undone = ref(0)
</script>

<template>
  <ToastProvider :duration="60000">
    <button
      id="show"
      @click="open = true"
    >
      Save
    </button>
    <ToastRoot
      id="toast"
      v-model:open="open"
    >
      <ToastTitle id="toast-title">
        Saved
      </ToastTitle>
      <!-- asChild, template form -->
      <ToastDescription as-child>
        <p
          id="toast-description"
          data-state="mine"
        >
          Your changes are saved
        </p>
      </ToastDescription>
      <!-- asChild, v-slot form -->
      <ToastAction
        v-slot="{ props }"
        alt-text="Undo the change"
        as-child
      >
        <button
          v-bind="props"
          id="toast-undo"
          @click="undone++"
        >
          Undo
        </button>
      </ToastAction>
      <ToastClose
        id="toast-close"
        aria-label="Close"
      >
        ×
      </ToastClose>
    </ToastRoot>
    <ToastViewport id="viewport" />
  </ToastProvider>
  <span id="open">{{ open }}</span>
  <span id="undone">{{ undone }}</span>
</template>
