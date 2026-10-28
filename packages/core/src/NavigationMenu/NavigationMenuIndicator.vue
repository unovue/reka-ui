<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface NavigationMenuIndicatorProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { Presence } from '@/Presence'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectNavigationMenuContext } from './NavigationMenuRoot.vue'
import { useNavigationMenuIndicator } from './useNavigationMenu'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<NavigationMenuIndicatorProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const menuContext = injectNavigationMenuContext()

const { isVisible, indicator } = useNavigationMenuIndicator({ context: menuContext })
</script>

<template>
  <Teleport
    v-if="menuContext.indicatorTrack.value"
    :to="menuContext.indicatorTrack.value"
  >
    <Presence :present="forceMount || isVisible">
      <component
        :is="renderAs(as, props.asChild)"
        v-bind="mergeProps(indicator.attrs.value, $attrs)"
        :ref="forwardRef"
      >
        <slot />
      </component>
    </Presence>
  </Teleport>
</template>
