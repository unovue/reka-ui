<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerOverlayImplProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useBodyScrollLock, useForwardElement } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { getDrawerOverlaySurface } from './useDrawer'
import { DRAWER_CSS_VARS } from './utils'

defineProps<DrawerOverlayImplProps>()
const rootContext = injectDrawerRootContext()

// Only lock body scroll while the drawer is actually open. With `forceMount`,
// the overlay may stay mounted while closed — unconditional lock would keep
// the page scroll blocked.
const locked = useBodyScrollLock(rootContext.open.value)
watch(() => rootContext.open.value, (open) => {
  locked.value = open
}, { immediate: true })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// BaseUI parity: the backdrop carries data-swiping / data-swipe-direction so
// downstream CSS can target `[data-swiping] [data-slot="drawer-backdrop"]`.
// They derive from the shared surface builder (single source with `useDrawer()`).
const overlay = getDrawerOverlaySurface(rootContext)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="overlay.attrs.value"
    :style="{
      pointerEvents: 'auto',
      userSelect: 'none',
      [DRAWER_CSS_VARS.swipeProgress]: '0',
      [DRAWER_CSS_VARS.swipeStrength]: '1',
    }"
  >
    <slot />
  </Primitive>
</template>
