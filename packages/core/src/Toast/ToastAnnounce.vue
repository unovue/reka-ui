<script setup lang="ts">
import { isClient, useTimeout } from '@vueuse/shared'
import { onScopeDispose, ref } from 'vue'
import { VisuallyHidden } from '@/VisuallyHidden'
import { injectToastProviderContext } from './ToastProvider.vue'

const providerContext = injectToastProviderContext()

const isAnnounced = useTimeout(1000)
const renderAnnounceText = ref(false)

// A status region reads changes to its content, so it renders empty and gets its
// text in the next frame, and goes once that's announced. Double rAF mirrors
// Radix UI's `useNextFrame` behavior.
let raf1 = 0
let raf2 = 0
if (isClient) {
  raf1 = requestAnimationFrame(() => {
    raf2 = requestAnimationFrame(() => {
      renderAnnounceText.value = true
    })
  })
  onScopeDispose(() => {
    cancelAnimationFrame(raf1)
    cancelAnimationFrame(raf2)
  })
}
</script>

<template>
  <VisuallyHidden v-if="!isAnnounced">
    <template v-if="renderAnnounceText">
      {{ providerContext.label.value }}
      <slot />
    </template>
  </VisuallyHidden>
</template>
