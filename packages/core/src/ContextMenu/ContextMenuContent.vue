<script lang="ts">
import type {
  MenuContentEmits,
  MenuContentProps,
} from '@/Menu'
import { useForwardElement, useForwardPropsEmits } from '@/shared'

export type ContextMenuContentEmits = Omit<MenuContentEmits, 'entryFocus'>

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
import { useEventListener } from '@vueuse/core'
import { getInternalBackdrop } from '@/DismissableLayer/internalBackdrop'
import { MenuContent } from '@/Menu'
import { omitEntryFocusListener } from '@/Menu/utils'
import { injectContextMenuRootContext } from './ContextMenuRoot.vue'
import { createContextMenuContentHandlers } from './useContextMenu'

defineOptions({
  inheritAttrs: false,
})

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

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectContextMenuRootContext()
// Unlike a DropdownMenu trigger, the trigger area is NOT cut out of a modal
// menu's backdrop (Base UI `MenuPositioner` only cuts out a plain Menu
// trigger): a press over the area while open is an outside press, so a left
// click only dismisses the menu and never reaches what is under it (#1923).
// A right click there dismisses too, and its `contextmenu` (once the backdrop
// is gone) re-opens the menu at the new point.
// A right click on the backdrop while the menu stays open (a prevented
// dismissal) must not show the native menu either (Base UI `ContextMenuTrigger`).
// Listened on the content's root node too: in a shadow root (where the backdrop
// renders next to the content) the document only sees the host, and in a
// closed one not even `composedPath()` reaches the backdrop from there. The
// document still covers a backdrop moved to `<body>`.
useEventListener(() => {
  const root = currentElement.value?.getRootNode()
  const doc = currentElement.value?.ownerDocument
  return root && root !== doc ? [root, doc] : [doc]
}, 'contextmenu', (event: Event) => {
  const backdrop = getInternalBackdrop(currentElement.value)
  if (backdrop && event.composedPath().includes(backdrop))
    event.preventDefault()
})
// Bound after the forwarded emits, so they still see a consumer's `preventDefault()`.
const { onCloseAutoFocus, onInteractOutside } = createContextMenuContentHandlers(rootContext)
</script>

<template>
  <MenuContent
    :ref="forwardRef"
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
    v-bind="{ ...forwarded, ...omitEntryFocusListener($attrs) }"
    @close-auto-focus="onCloseAutoFocus"
    @interact-outside="onInteractOutside"
  >
    <slot />
  </MenuContent>
</template>
