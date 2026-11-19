<script setup lang="ts">
import { createToastManager, ToastProvider } from '..'
import AnchoredToaster from './_AnchoredToaster.vue'
import Toaster from './_Toaster.vue'

const toast = createToastManager()
const anchoredToast = createToastManager()

let count = 0

function addToast() {
  count++
  toast.add({
    title: `Toast ${count}`,
    description: count % 2 ? 'A short one.' : 'A longer description, so the toasts in the stack have different heights.',
    actionProps: { label: 'Undo', altText: 'Undo the change' },
  })
}

function addPromise(fail: boolean) {
  toast.promise(new Promise((resolve, reject) => setTimeout(fail ? reject : resolve, 2000)), {
    loading: { title: 'Saving…' },
    success: { title: 'Saved', description: 'Your document is saved.' },
    error: { title: 'Could not save', description: 'Try again later.' },
  }).catch(() => {})
}

function copy(event: MouseEvent) {
  anchoredToast.add({
    title: 'Copied',
    duration: 1500,
    positionerProps: { anchor: event.currentTarget as HTMLElement },
  })
}
</script>

<template>
  <Story
    title="Toast/Manager"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <ToastProvider
        :toast-manager="toast"
        :limit="3"
      >
        <Toaster />
      </ToastProvider>
      <ToastProvider :toast-manager="anchoredToast">
        <AnchoredToaster />
      </ToastProvider>

      <div class="flex flex-wrap gap-2">
        <button
          class="border rounded px-3 py-1"
          @click="addToast"
        >
          Add toast
        </button>
        <button
          class="border rounded px-3 py-1"
          @click="toast.add({ id: 'offline', title: 'You are offline', description: 'Added with the same id, so only one shows.' })"
        >
          Add deduplicated toast
        </button>
        <button
          class="border rounded px-3 py-1"
          @click="addPromise(false)"
        >
          Promise (resolves)
        </button>
        <button
          class="border rounded px-3 py-1"
          @click="addPromise(true)"
        >
          Promise (rejects)
        </button>
        <button
          class="border rounded px-3 py-1"
          @click="toast.close()"
        >
          Close all
        </button>
        <button
          class="border rounded px-3 py-1"
          @click="copy"
        >
          Copy (anchored)
        </button>
      </div>
    </Variant>
  </Story>
</template>
