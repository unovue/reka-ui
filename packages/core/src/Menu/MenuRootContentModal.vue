<script setup lang="ts">
import type { MenuContentImplEmits, MenuRootContentTypeProps } from './MenuContentImpl.vue'
import type { PointerDownOutsideEvent } from '@/DismissableLayer'
import type { ContextMenuOutsideEvent } from '@/DismissableLayer/utils'
import { injectContextMenuRootContext } from '@/ContextMenu'
import { useForwardExpose, useForwardPropsEmits, useHideOthers } from '@/shared'
import MenuContentImpl from './MenuContentImpl.vue'
import { injectMenuContext } from './MenuRoot.vue'
import { isPointerInRect } from './utils'

const props = defineProps<MenuRootContentModalProps>()
const emits = defineEmits<MenuRootContentModalEmits>()
const forwarded = useForwardPropsEmits(props, emits)

const menuContext = injectMenuContext()
const menuRootContext = injectContextMenuRootContext()

interface MenuRootContentModalProps extends MenuRootContentTypeProps {}
type MenuRootContentModalEmits = MenuContentImplEmits

const { forwardRef, currentElement } = useForwardExpose()
useHideOthers(currentElement)

function handlePointerDownOutside(event: PointerDownOutsideEvent) {
  // Only handle `contextmenu` click events
  if (event.detail.originalEvent.button !== 2) {
    return
  }

  const rect = menuRootContext.triggerElement.value?.getBoundingClientRect()

  // If the `contextmenu` click occurs within the trigger element's bounding rect,
  // we prevent the default behavior to avoid closing the menu,
  // because that would cause the flash of closing and opening the menu.
  if (isPointerInRect(event.detail.originalEvent, rect)) {
    event.preventDefault()
  }
}

function handleContextMenuOutside(event: ContextMenuOutsideEvent) {
  const rect = menuRootContext.triggerElement.value?.getBoundingClientRect()

  if (isPointerInRect(event.detail.originalEvent, rect)) {
    // Prevent the default context menu from appearing
    event.detail.originalEvent.preventDefault()
    // Move the menu to the current pointer position
    menuRootContext.triggerPoint.value = {
      x: event.detail.originalEvent.clientX,
      y: event.detail.originalEvent.clientY,
    }
  }
}
</script>

<template>
  <MenuContentImpl
    v-bind="forwarded"
    :ref="forwardRef"
    :trap-focus="menuContext.open.value"
    :disable-outside-pointer-events="menuContext.open.value"
    :disable-outside-scroll="true"
    @dismiss="menuContext.onOpenChange(false)"
    @pointer-down-outside="handlePointerDownOutside"
    @context-menu-outside="handleContextMenuOutside"
    @focus-outside.prevent="emits('focusOutside', $event)"
  >
    <slot />
  </MenuContentImpl>
</template>
