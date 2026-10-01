<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerViewportProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'

/**
 * Optional wrapper around `DrawerContent`. Mirrors Base UI's `Drawer.Viewport`
 * minus the gestures, which live on `DrawerContent` / `DrawerContentImpl`, so
 * this is a passthrough that carries the `data-drawer-viewport` attribute for
 * downstream selectors and registers itself as the measurement root for
 * `DrawerVirtualKeyboardProvider`.
 */
const props = withDefaults(defineProps<DrawerViewportProps>(), { as: 'div' })
const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectDrawerRootContext()

// `currentElement` is already cleared by the time `onUnmounted` runs (Vue
// nulls the template ref before the unmount hooks), so keep our own handle
// for the identity check.
let registeredElement: HTMLElement | undefined

onMounted(() => {
  registeredElement = currentElement.value
  rootContext.viewportElement.value = registeredElement
})

onUnmounted(() => {
  if (registeredElement && rootContext.viewportElement.value === registeredElement)
    rootContext.viewportElement.value = undefined
  registeredElement = undefined
})
</script>

<template>
  <Primitive
    v-bind="props"
    :ref="forwardRef"
    data-drawer-viewport=""
    :data-state="rootContext.open.value ? 'open' : 'closed'"
  >
    <slot />
  </Primitive>
</template>
