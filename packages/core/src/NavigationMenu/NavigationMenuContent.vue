<script lang="ts">
import type { NavigationMenuContentImplEmits, NavigationMenuContentImplProps } from './NavigationMenuContentImpl.vue'

export type NavigationMenuContentEmits = NavigationMenuContentImplEmits

export interface NavigationMenuContentProps extends NavigationMenuContentImplProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { isClient, reactiveOmit } from '@vueuse/shared'
import { Presence } from '@/Presence'
import { useForwardElement, useForwardPropsEmits } from '@/shared'
import NavigationMenuContentImpl from './NavigationMenuContentImpl.vue'
import { injectNavigationMenuItemContext } from './NavigationMenuItem.vue'
import { injectNavigationMenuContext } from './NavigationMenuRoot.vue'
import { getNavigationMenuContentPresence } from './useNavigationMenu'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<NavigationMenuContentProps>()
const emits = defineEmits<NavigationMenuContentEmits>()

const forwarded = useForwardPropsEmits(reactiveOmit(props, 'forceMount'), emits)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const menuContext = injectNavigationMenuContext()
const itemContext = injectNavigationMenuItemContext()

// `data-state`, the hover handlers and the leave-animation `pointer-events`
// guard are bound by `NavigationMenuContentImpl` from the content surface.
const { open, isLastActiveValue } = getNavigationMenuContentPresence(menuContext, itemContext)
</script>

<template>
  <Teleport
    :to="isClient && menuContext.viewport.value ? menuContext.viewport.value : 'body'"
    :disabled="isClient && menuContext.viewport.value ? !menuContext.viewport.value : true"
  >
    <Presence
      v-slot="{ present }"
      :present="forceMount || open || isLastActiveValue"
      :force-mount="!menuContext.unmountOnHide.value"
    >
      <NavigationMenuContentImpl
        :ref="forwardRef"
        v-bind="{ ...$attrs, ...forwarded }"
        :hidden="!present"
      >
        <slot />
      </NavigationMenuContentImpl>
    </Presence>
  </Teleport>
</template>
