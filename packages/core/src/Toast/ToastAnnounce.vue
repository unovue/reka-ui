<script setup lang="ts">
import { isClient, useTimeout } from '@vueuse/shared'
import { onScopeDispose, ref } from 'vue'
import { VisuallyHidden } from '@/VisuallyHidden'
import { injectToastProviderContext } from './ToastProvider.vue'

defineProps<{
  type?: 'foreground' | 'background'
}>()

const providerContext = injectToastProviderContext()

const isAnnounced = useTimeout(1000)
const renderAnnounceText = ref(false)

// A foreground toast is announced by an alert, which is read when it is added and
// interrupts, so it is added with its text in it. A background toast is announced
// by a polite status region, which reads what changes in it and not what it is
// added with, so it is added empty and gets its text afterwards.
//
// Render text content in the next frame to ensure toast is announced in NVDA.
// Double rAF mirrors Radix UI's `useNextFrame` behavior. A hidden tab holds
// animation frames, so the text also renders once a second has passed.
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
  <VisuallyHidden
    v-if="type === 'background'"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <template v-if="isAnnounced || renderAnnounceText">
      {{ providerContext.label.value }}
      <slot />
    </template>
  </VisuallyHidden>
  <VisuallyHidden
    v-else-if="isAnnounced || renderAnnounceText"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
  >
    {{ providerContext.label.value }}
    <slot />
  </VisuallyHidden>
</template>
