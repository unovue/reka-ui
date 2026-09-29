<script setup lang="ts">
import { computed, watch } from 'vue'
import { useDrawerVirtualKeyboard } from './composables/useDrawerVirtualKeyboard'
import { injectDrawerRootContext } from './DrawerRoot.vue'

/**
 * Makes the drawer react to the software keyboard. Renderless — mirrors Base
 * UI's `Drawer.VirtualKeyboardProvider`.
 */
defineSlots<{
  default?: () => any
}>()

const rootContext = injectDrawerRootContext()

useDrawerVirtualKeyboard({
  enabled: computed(() => rootContext.open.value),
  // `DrawerViewport` is the measurement and containment root, and hosts the
  // keyboard inset variable for the popup inside it.
  elementRef: rootContext.viewportElement,
  modal: computed(() => rootContext.modal.value === true),
  nestedDrawerOpen: computed(() => rootContext.nestedOpenDrawerCount.value > 0),
})

if (process.env.NODE_ENV !== 'production') {
  // `DrawerContent` registers on mount, after the `DrawerViewport` wrapping it
  // (if any) has registered in the same flush. Checking on `open` instead would
  // run before a portal that renders its children only after its own mount.
  watch(rootContext.contentElement, (content) => {
    if (content && !rootContext.viewportElement.value) {
      console.warn(
        `Warning: \`DrawerVirtualKeyboardProvider\` requires a \`DrawerViewport\` around \`DrawerContent\`.`,
      )
    }
  }, { immediate: true, flush: 'post' })
}
</script>

<template>
  <slot />
</template>
