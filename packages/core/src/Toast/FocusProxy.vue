<script setup lang="ts">
import { VisuallyHidden } from '@/VisuallyHidden'
import { injectToastProviderContext } from './ToastProvider.vue'

const emits = defineEmits<{
  focusFromOutsideViewport: [void]
}>()

const providerContext = injectToastProviderContext()

// `VisuallyHidden` defaults to `aria-hidden="true"` (feature="focusable"), but this
// proxy is a deliberately tabbable (`tabindex="0"`) focus sentinel, and a focusable
// element must not be `aria-hidden` (axe `aria-hidden-focus`). Override it back to
// `undefined` so the attribute is not rendered.
</script>

<template>
  <VisuallyHidden
    :aria-hidden="undefined"
    tabindex="0"
    style="position: fixed"
    @focus="(event: FocusEvent) => {
      const prevFocusedElement = event.relatedTarget as HTMLElement | null;
      const isFocusFromOutsideViewport = !providerContext.viewport.value?.contains(prevFocusedElement);
      if (isFocusFromOutsideViewport) emits('focusFromOutsideViewport');
    }"
  >
    <slot />
  </VisuallyHidden>
</template>
