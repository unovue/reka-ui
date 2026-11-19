<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerOverlayImplProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useBodyScrollLock, useForwardExpose } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { DRAWER_CSS_VARS } from './utils'

const props = withDefaults(defineProps<DrawerOverlayImplProps & {
  /** Whether the overlay is open or still animating out. A force-mounted overlay stays mounted while closed. */
  present?: boolean
}>(), {
  present: true,
})
const rootContext = injectDrawerRootContext()

// Lock body scroll for as long as the overlay is present, including its exit animation.
const locked = useBodyScrollLock(props.present)
watch(() => props.present, val => locked.value = val)
// The content reads this to hold the lock for as long as it is still animating out.
// An overlay that is kept mounted is told it is present a moment after the drawer opens,
// and it counts from the opening on, so that the content never sees an open drawer without it.
watch(() => props.present || rootContext.open.value, val => rootContext.overlayPresent.value = val, { immediate: true })
onBeforeUnmount(() => rootContext.overlayPresent.value = false)

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
