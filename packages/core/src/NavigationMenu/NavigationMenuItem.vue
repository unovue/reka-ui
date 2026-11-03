<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import { useCollection } from '@/Collection'
import { createContext, useForwardElement, useId } from '@/shared'

export interface NavigationMenuItemProps extends PrimitiveProps {
  /**
   * A unique value that associates the item with an active value when the navigation menu is controlled.
   *
   *  This prop is managed automatically when uncontrolled.
   */
  value?: string
}

export type NavigationMenuItemContext = {
  value: string
  contentId: string
  triggerRef: Ref<HTMLElement | undefined>
  focusProxyRef: Ref<HTMLElement | undefined>
  wasEscapeCloseRef: Ref<boolean>
  onEntryKeyDown: () => void
  onFocusProxyEnter: (side: 'start' | 'end') => void
  onContentFocusOutside: () => void
  onRootContentClose: () => void
}

export const [injectNavigationMenuItemContext, provideNavigationMenuItemContext]
  = createContext<NavigationMenuItemContext>('NavigationMenuItem')
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { injectNavigationMenuContext } from './NavigationMenuRoot.vue'
import { useNavigationMenuItem } from './useNavigationMenu'

const props = withDefaults(defineProps<NavigationMenuItemProps>(), {
  as: 'li',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const { getItems } = useCollection({ key: 'NavigationMenu' })

const context = injectNavigationMenuContext()

const { itemContext, item } = useNavigationMenuItem({
  context,
  value: useId(props.value),
  getItems: () => getItems().map(i => i.ref),
})

provideNavigationMenuItemContext(itemContext)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-bind="item.attrs.value"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
