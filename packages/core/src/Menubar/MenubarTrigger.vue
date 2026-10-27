<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useCollection } from '@/Collection'
import { useForwardElement } from '@/shared'

export interface MenubarTriggerProps extends PrimitiveProps {
  /** When `true`, prevents the user from interacting with item */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { onMounted } from 'vue'
import { MenuAnchor } from '@/Menu'
import {
  Primitive,
} from '@/Primitive'
import { RovingFocusItem } from '@/RovingFocus'
import { injectMenubarMenuContext } from './MenubarMenu.vue'
import { injectMenubarRootContext } from './MenubarRoot.vue'
import { createMenubarTriggerSurface } from './useMenubar'

const props = withDefaults(defineProps<MenubarTriggerProps>(), {
  as: 'button',
})
const rootContext = injectMenubarRootContext()
const menuContext = injectMenubarMenuContext()

const { forwardRef, currentElement: triggerElement, expose } = useForwardElement()
defineExpose(expose)
const { CollectionItem } = useCollection({ key: 'Menubar' })

// role/aria, `data-highlighted`/`data-state`/`data-disabled`, the `data-value`
// selector and the pointer/keyboard handlers come from the composable;
// RovingFocusItem/CollectionItem/MenuAnchor stay the wrappers.
const trigger = createMenubarTriggerSurface(rootContext, menuContext, {
  disabled: () => props.disabled,
  triggerElement,
})

onMounted(() => {
  menuContext.triggerElement = triggerElement
})
</script>

<template>
  <RovingFocusItem
    as-child
    :focusable="!disabled"
    :tab-stop-id="menuContext.value"
  >
    <CollectionItem>
      <MenuAnchor as-child>
        <Primitive
          :ref="forwardRef"
          :as="as"
          :as-child="asChild"
          :type="as === 'button' ? 'button' : undefined"
          v-bind="trigger.attrs.value"
        >
          <slot />
        </Primitive>
      </MenuAnchor>
    </CollectionItem>
  </RovingFocusItem>
</template>
