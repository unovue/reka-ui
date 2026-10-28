<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerOverlayImplProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { watch } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { getDrawerOverlaySurface } from './useDrawer'
import { DRAWER_CSS_VARS } from './utils'

defineProps<DrawerOverlayImplProps>()
const rootContext = injectDrawerRootContext()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// BaseUI parity: a press on the backdrop dismisses a modal drawer, a press on
// anything stacked above it does not (#2822). The page scroll lock follows
// `modal` and lives in `DrawerContent`.
watch([currentElement, () => rootContext.open.value], ([element, open], _, onCleanup) => {
  if (!element || !open)
    return
  rootContext.overlayElement.value = element
  onCleanup(() => {
    if (rootContext.overlayElement.value === element)
      rootContext.overlayElement.value = undefined
  })
}, { immediate: true })

// BaseUI parity: the backdrop carries data-swiping / data-swipe-direction so
// downstream CSS can target `[data-swiping] [data-slot="drawer-backdrop"]`.
// They derive from the shared surface builder (single source with `useDrawer()`).
const overlay = getDrawerOverlaySurface(rootContext)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="overlay.attrs.value"
    :style="{
      userSelect: 'none',
      [DRAWER_CSS_VARS.swipeProgress]: '0',
      [DRAWER_CSS_VARS.swipeStrength]: '1',
    }"
  >
    <slot />
  </component>
</template>
