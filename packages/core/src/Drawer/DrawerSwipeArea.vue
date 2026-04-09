<script lang="ts">
import type { SwipeDirection } from './utils'
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerSwipeAreaProps extends PrimitiveProps {
  /** Override the open swipe direction (defaults to opposite of Root's swipeDirection). */
  swipeDirection?: SwipeDirection
  /** Disable swipe-to-open. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { useSwipeDismiss } from './composables/useSwipeDismiss'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { DRAWER_CSS_VARS } from './utils'

const props = withDefaults(defineProps<DrawerSwipeAreaProps>(), {
  as: 'div',
  disabled: false,
})
const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectDrawerRootContext()

const OPPOSITE: Record<string, string> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

const openDirection = computed<SwipeDirection>(() => {
  if (props.swipeDirection)
    return props.swipeDirection
  return (OPPOSITE[rootContext.swipeDirection.value] ?? 'up') as SwipeDirection
})

const enabled = computed(() => !props.disabled && !rootContext.open.value)

// Keep the directions array reactive — `[openDirection.value]` would capture
// the initial value only and ignore prop/state updates.
const directions = computed<SwipeDirection[]>(() => [openDirection.value])

useSwipeDismiss({
  enabled,
  elementRef: currentElement,
  directions,
  movementCssVars: {
    x: DRAWER_CSS_VARS.swipeMovementX,
    y: DRAWER_CSS_VARS.swipeMovementY,
  },
  onDismiss() {
    rootContext.onOpenChange(true, 'swipe')
  },
  onSwipingChange(swiping) {
    rootContext.onNestedSwipingChange(swiping)
  },
})
</script>

<template>
  <Primitive
    v-bind="props"
    :ref="forwardRef"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    :data-swipe-direction="openDirection"
  >
    <slot />
  </Primitive>
</template>
