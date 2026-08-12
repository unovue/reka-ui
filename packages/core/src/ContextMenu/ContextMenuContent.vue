<script lang="ts">
import type { ContextMenuOutsideEvent, PointerDownOutsideEvent } from '@/DismissableLayer/utils'
import type {
  MenuContentEmits,
  MenuContentProps,
} from '@/Menu'
import { isMouseInRect } from '@/Menu/utils'
import { useForwardExpose, useForwardPropsEmits } from '@/shared'

export type ContextMenuContentEmits = MenuContentEmits

export interface ContextMenuContentProps
  extends Omit<
    MenuContentProps,
    | 'side'
    | 'sideOffset'
    | 'align'
    | 'arrowPadding'
    | 'updatePositionStrategy'
  > {}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { MenuContent } from '@/Menu'
import { injectContextMenuRootContext } from './ContextMenuRoot.vue'

const props = withDefaults(defineProps<ContextMenuContentProps>(), {
  alignOffset: 0,
  avoidCollisions: true,
  collisionBoundary: () => [],
  collisionPadding: 0,
  sticky: 'partial',
  hideWhenDetached: false,
})
const emits = defineEmits<ContextMenuContentEmits>()
const forwarded = useForwardPropsEmits(props, emits)

useForwardExpose()
const rootContext = injectContextMenuRootContext()
const hasInteractedOutside = ref(false)

function handlePointerDownOutside(event: PointerDownOutsideEvent) {
  // Only handle `contextmenu` click events
  if (!rootContext.open.value || event.detail.originalEvent.button !== 2) {
    return
  }

  const rect = rootContext.triggerElement.value?.getBoundingClientRect()

  // If the `contextmenu` click occurs within the trigger element's bounding rect,
  // we prevent the default behavior to avoid closing the menu,
  // because that would cause the flash of closing and opening the menu.
  if (isMouseInRect(event.detail.originalEvent, rect)) {
    event.preventDefault()
  }
}

function handleContextMenuOutside(event: ContextMenuOutsideEvent) {
  if (!rootContext.open.value) {
    return
  }

  const rect = rootContext.triggerElement.value?.getBoundingClientRect()

  if (isMouseInRect(event.detail.originalEvent, rect)) {
    // Prevent the default context menu from appearing
    event.detail.originalEvent.preventDefault()
    // Move the menu to the current pointer position
    rootContext.triggerPoint.value = {
      x: event.detail.originalEvent.clientX,
      y: event.detail.originalEvent.clientY,
    }
  }
}
</script>

<template>
  <MenuContent
    v-bind="forwarded"
    side="right"
    :side-offset="2"
    align="start"
    update-position-strategy="always"
    :style="{
      '--reka-context-menu-content-transform-origin':
        'var(--reka-popper-transform-origin)',
      '--reka-context-menu-content-available-width':
        'var(--reka-popper-available-width)',
      '--reka-context-menu-content-available-height':
        'var(--reka-popper-available-height)',
      '--reka-context-menu-trigger-width': 'var(--reka-popper-anchor-width)',
      '--reka-context-menu-trigger-height':
        'var(--reka-popper-anchor-height)',
    }"
    @close-auto-focus="
      (event) => {
        if (!event.defaultPrevented && hasInteractedOutside) {
          event.preventDefault();
        }
        hasInteractedOutside = false;
      }
    "
    @interact-outside="
      (event) => {
        if (!event.defaultPrevented && !rootContext.modal.value)
          hasInteractedOutside = true;
      }
    "
    @pointer-down-outside="handlePointerDownOutside"
    @context-menu-outside="handleContextMenuOutside"
  >
    <slot />
  </MenuContent>
</template>
