<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import { useCollection } from '@/Collection'
import { createContext, defineReactiveIds, getActiveElement, useArrowNavigation, useForwardExpose, useId } from '@/shared'

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
  /** The id the content renders. Read by the trigger for `aria-controls`. */
  contentId: string
  /** The id the trigger renders. Read by the content for `aria-labelledby`. */
  triggerId: string
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
import { ref } from 'vue'
import { Primitive } from '@/Primitive'
import { injectNavigationMenuContext } from './NavigationMenuRoot.vue'
import {
  focusFirst,
  getTabbableCandidates,
  getTabbableNodes,
  makeContentId,
  makeTriggerId,
  removeFromTabOrder,
} from './utils'

const props = withDefaults(defineProps<NavigationMenuItemProps>(), {
  as: 'li',
})

useForwardExpose()
const { getItems } = useCollection({ key: 'NavigationMenu' })

const context = injectNavigationMenuContext()

const value = useId(props.value)
const triggerRef = ref<HTMLElement>()
const focusProxyRef = ref<HTMLElement>()

let restoreContentTabOrderRef: () => void = () => ({})

const wasEscapeCloseRef = ref(false)
async function handleContentEntry(side = 'start') {
  const el = document.getElementById(itemContext.contentId)
  if (el) {
    restoreContentTabOrderRef()
    const candidates = getTabbableCandidates(el)
    if (candidates.length)
      focusFirst(side === 'start' ? candidates : candidates.reverse())
  }
}

function handleContentExit() {
  const el = document.getElementById(itemContext.contentId)
  if (el) {
    // Every radio, not only each group's tab stop: with the stop taken out of the tab
    // order, the browser makes the other radios of its group tab stops.
    const candidates = getTabbableNodes(el)
    if (candidates.length)
      restoreContentTabOrderRef = removeFromTabOrder(candidates)
  }
}

const itemContext = provideNavigationMenuItemContext(defineReactiveIds({
  value,
  contentId: makeContentId(context.baseId, value),
  triggerId: makeTriggerId(context.baseId, value),
  triggerRef,
  focusProxyRef,
  wasEscapeCloseRef,
  onEntryKeyDown: handleContentEntry,
  onFocusProxyEnter: handleContentEntry,
  onContentFocusOutside: handleContentExit,
  onRootContentClose: handleContentExit,
}, ['triggerId', 'contentId']))

function handleClose() {
  context.onItemDismiss()
  itemContext.triggerRef.value?.focus()
}

function handleKeydown(ev: KeyboardEvent) {
  const currentFocus = getActiveElement() as HTMLElement
  if (ev.keyCode === 32) {
    // Only the trigger of this item toggles; links and nested items keep their own behaviour.
    // `NavigationMenuTrigger` replaces `itemContext.triggerRef` with its element ref on mount.
    if (ev.target !== itemContext.triggerRef.value)
      return
    if (ev.repeat) {
      ev.preventDefault()
      return
    }
    if (context.modelValue.value === value) {
      handleClose()
      ev.preventDefault()
      return
    }
    else {
      (ev.target as HTMLElement).click()
      ev.preventDefault()
      return
    }
  }

  const itemsArray = getItems().filter(i =>
    i.ref.parentElement?.hasAttribute('data-menu-item'),
  ).map(i => i.ref)

  // prevent triggering when the focus is on link
  if (!itemsArray.includes(currentFocus))
    return

  const newSelectedElement = useArrowNavigation(ev, currentFocus, undefined, {
    itemsArray,
    loop: false,
  })

  if (newSelectedElement)
    newSelectedElement?.focus()

  ev.preventDefault()
  ev.stopPropagation()
}
</script>

<template>
  <Primitive
    :as-child="asChild"
    :as="as"
    data-menu-item
    @keydown.up.down.left.right.home.end.space="handleKeydown"
  >
    <slot />
  </Primitive>
</template>
