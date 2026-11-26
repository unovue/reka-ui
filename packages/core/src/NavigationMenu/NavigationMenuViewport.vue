<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface NavigationMenuViewportProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
  /**
   * Placement of the viewport for css variables `(--reka-navigation-menu-viewport-left, --reka-navigation-menu-viewport-top)`.
   * @defaultValue 'center'
   */
  align?: 'start' | 'center' | 'end'
  /**
   * When `true`, keeps the viewport inside the ancestors that clip it (an `overflow` other
   * than `visible`, or paint containment) instead of the document, and sets the position
   * css variables in the coordinates of the viewport's containing block. When `false`, the
   * viewport is kept inside the document and the variables are measured from the root.
   * @defaultValue true
   */
  avoidClipping?: boolean
}
</script>

<script setup lang="ts">
import type { Ref } from 'vue'
import { mergeProps } from 'vue'
import { Presence } from '@/Presence'
import { renderAs } from '@/Primitive/renderAs'
import { injectNavigationMenuContext } from './NavigationMenuRoot.vue'
import { useNavigationMenuViewport } from './useNavigationMenu'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<NavigationMenuViewportProps>(), {
  align: 'center',
  avoidClipping: true,
})

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

const menuContext = injectNavigationMenuContext()

const { open, viewport, reset } = useNavigationMenuViewport({
  context: menuContext,
  viewportElement: currentElement as Ref<HTMLElement | undefined>,
  align: () => props.align,
  avoidClipping: () => props.avoidClipping,
})

// A force-mounted viewport stays shown and keeps its measurements; Presence
// still tracks the open state so `update:openComplete` is reported (#2827).
function onAfterLeave() {
  if (!props.forceMount)
    reset()
}
</script>

<template>
  <Presence
    v-slot="{ present }"
    :present="open"
    :force-mount="forceMount || !menuContext.unmountOnHide.value"
    @after-leave="onAfterLeave"
    @complete="menuContext.notifyOpenComplete"
  >
    <component
      :is="renderAs(as, asChild)"
      v-bind="mergeProps($attrs, viewport.attrs.value)"
      :ref="forwardRef"
      :hidden="!(forceMount || present)"
    >
      <slot />
    </component>
  </Presence>
</template>
