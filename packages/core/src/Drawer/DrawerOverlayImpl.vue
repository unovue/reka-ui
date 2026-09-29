<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerOverlayImplProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useBodyScrollLock, useForwardExpose } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
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

useForwardExpose()

// BaseUI parity: the backdrop carries data-swiping / data-swipe-direction so
// downstream CSS can target `[data-swiping] [data-slot="drawer-backdrop"]`.
const dataAttributes = computed(() => {
  const attrs: Record<string, string | undefined> = {
    'data-state': rootContext.open.value ? 'open' : 'closed',
    'data-swipe-direction': rootContext.swipeDirection.value,
  }
  if (rootContext.isSwiping.value)
    attrs['data-swiping'] = ''
  return attrs
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="dataAttributes"
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
