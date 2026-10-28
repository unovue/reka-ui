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
import { mergeProps } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { useDrawerSwipeArea } from './useDrawer'

const props = withDefaults(defineProps<DrawerSwipeAreaProps>(), {
  as: 'div',
  disabled: false,
})
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectDrawerRootContext()

// Swipe-to-open + `data-state` / `data-swipe-direction` from the composable.
const { swipeArea } = useDrawerSwipeArea(rootContext, {
  element: currentElement,
  swipeDirection: () => props.swipeDirection,
  disabled: () => props.disabled,
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-bind="mergeProps({ swipeDirection: props.swipeDirection, disabled: props.disabled }, swipeArea.attrs.value)"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
