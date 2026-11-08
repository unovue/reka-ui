<script setup lang="ts">
import { isClient, useTimeoutFn } from '@vueuse/shared'
import { onScopeDispose, ref } from 'vue'
import { VisuallyHidden } from '@/VisuallyHidden'
import { injectToastProviderContext } from './ToastProvider.vue'

const providerContext = injectToastProviderContext()

const isAnnounced = ref(false)
const renderAnnounceText = ref(false)
const { start: startAnnouncedTimer } = useTimeoutFn(() => {
  isAnnounced.value = true
}, 1000, { immediate: false })

// A status region reads changes to its content, so it renders empty and gets its
// text in the next frame, and goes a second after that. The second starts with
// the text, as a hidden tab holds animation frames. Double rAF mirrors Radix UI's
// `useNextFrame` behavior.
let raf1 = 0
let raf2 = 0
if (isClient) {
  raf1 = requestAnimationFrame(() => {
    raf2 = requestAnimationFrame(() => {
      renderAnnounceText.value = true
      startAnnouncedTimer()
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
