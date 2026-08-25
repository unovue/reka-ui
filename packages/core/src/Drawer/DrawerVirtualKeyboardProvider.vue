<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
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
  watch(() => rootContext.open.value, async (open) => {
    if (!open)
      return
    await nextTick()
    if (!rootContext.viewportElement.value) {
      console.warn(
        `Warning: \`DrawerVirtualKeyboardProvider\` requires a \`DrawerViewport\` around \`DrawerContent\`.`,
      )
    }
  }, { immediate: true })
}
</script>

<template>
  <slot />
</template>
