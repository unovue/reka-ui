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
}
</script>

<script setup lang="ts">
import type { Ref } from 'vue'
import { mergeProps } from 'vue'
import { Presence } from '@/Presence'
import { Primitive } from '@/Primitive'
import { injectNavigationMenuContext } from './NavigationMenuRoot.vue'
import { useNavigationMenuViewport } from './useNavigationMenu'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<NavigationMenuViewportProps>(), {
  align: 'center',
})

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

const menuContext = injectNavigationMenuContext()

const { open, viewport, reset } = useNavigationMenuViewport({
  context: menuContext,
  viewportElement: currentElement as Ref<HTMLElement | undefined>,
  align: () => props.align,
})
</script>

<template>
  <Presence
    v-slot="{ present }"
    :present="forceMount || open"
    :force-mount="!menuContext.unmountOnHide.value"
    @after-leave="reset"
  >
    <Primitive
      v-bind="mergeProps($attrs, viewport.attrs.value)"
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :hidden="!present"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
