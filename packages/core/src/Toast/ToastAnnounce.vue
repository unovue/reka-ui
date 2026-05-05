<script setup lang="ts">
import { useTimeout } from '@vueuse/shared'
import { onScopeDispose, ref } from 'vue'
import { VisuallyHidden } from '@/VisuallyHidden'
import { injectToastProviderContext } from './ToastProvider.vue'

const providerContext = injectToastProviderContext()

const isAnnounced = useTimeout(1000)
const renderAnnounceText = ref(false)

// Render text content in the next frame to ensure toast is announced in NVDA.
// Double rAF mirrors Radix UI's `useNextFrame` behavior.
let raf2 = 0
const raf1 = requestAnimationFrame(() => {
  raf2 = requestAnimationFrame(() => {
    renderAnnounceText.value = true
  })
})
onScopeDispose(() => {
  cancelAnimationFrame(raf1)
  cancelAnimationFrame(raf2)
})
</script>

<template>
  <VisuallyHidden
    v-if="isAnnounced || renderAnnounceText"
    feature="fully-hidden"
  >
    {{ providerContext.label.value }}
    <slot />
  </VisuallyHidden>
</template>
