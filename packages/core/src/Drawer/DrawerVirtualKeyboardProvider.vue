<script setup lang="ts">
import { computed } from 'vue'
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

// `DrawerViewport` is the containment root when present, otherwise the popup.
const elementRef = computed(() => rootContext.viewportElement.value ?? rootContext.contentElement.value)

useDrawerVirtualKeyboard({
  enabled: computed(() => rootContext.open.value),
  elementRef,
  modal: computed(() => rootContext.modal.value === true),
  nestedDrawerOpen: computed(() => rootContext.nestedOpenDrawerCount.value > 0),
})
</script>

<template>
  <slot />
</template>
