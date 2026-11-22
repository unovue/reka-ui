<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface RovingFocusItemProps extends PrimitiveProps {
  tabStopId?: string
  /**
   * When `false`, item will not be focusable.
   * @defaultValue `true`
   */
  focusable?: boolean
  /** When `true`, item will be initially focused. */
  active?: boolean
  /** When `true`, shift + arrow key will allow focusing on next/previous item. */
  allowShiftKey?: boolean
}
</script>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { useCollection } from '@/Collection'
import { Primitive } from '@/Primitive'
import { useForwardExpose, useId } from '@/shared'
import { injectRovingFocusGroupContext } from './RovingFocusGroup.vue'
import { focusFirst, getFocusIntent, wrapArray } from './utils'

const props = withDefaults(defineProps<RovingFocusItemProps>(), {
  focusable: true,
  as: 'span',
})

const context = injectRovingFocusGroupContext()
const randomId = useId()
const id = computed(() => props.tabStopId || randomId)
// Until a tab stop is chosen, the group only becomes tabbable once its items
// have mounted, so the server-rendered HTML would have no stop at all. Before
// mount, the first active item stands in as the stop (one per group, even when
// several are active, as in a multiple ToggleGroup); after mount the group's own
// tabindex takes over, as before.
const isMounted = shallowRef(false)
const isPreMountTabStop = props.active && props.focusable && context.claimPreMountTabStop(id.value)
const isCurrentTabStop = computed(() => {
  if (context.currentTabStopId.value != null)
    return context.currentTabStopId.value === id.value
  return !isMounted.value && isPreMountTabStop
})

const { getItems, CollectionItem } = useCollection()

onMounted(() => {
  isMounted.value = true
  if (props.focusable)
    context.onFocusableItemAdd()
})
onUnmounted(() => {
  if (props.focusable)
    context.onFocusableItemRemove()
})

watch(() => props.focusable, (newVal, oldVal) => {
  if (newVal === oldVal)
    return
  if (newVal) {
    context.onFocusableItemAdd()
  }
  else {
    context.onFocusableItemRemove()
  }
})

function handleKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented)
    return

  if (event.key === 'Tab' && event.shiftKey) {
    context.onItemShiftTab()
    return
  }

  if (event.target !== event.currentTarget)
    return

  const focusIntent = getFocusIntent(
    event,
    context.orientation.value,
    context.dir.value,
  )

  if (focusIntent !== undefined) {
    if (event.metaKey || event.ctrlKey || event.altKey || (props.allowShiftKey ? false : event.shiftKey))
      return
    event.preventDefault()
    let candidateNodes = [...getItems().map(i => i.ref).filter(i => i.dataset.disabled !== '')]

    if (focusIntent === 'last') {
      candidateNodes.reverse()
    }
    else if (focusIntent === 'prev' || focusIntent === 'next') {
      if (focusIntent === 'prev')
        candidateNodes.reverse()
      const currentIndex = candidateNodes.indexOf(
        event.currentTarget as HTMLElement,
      )

      candidateNodes = context.loop.value
        ? wrapArray(candidateNodes, currentIndex + 1)
        : candidateNodes.slice(currentIndex + 1)
    }

    nextTick(() => focusFirst(candidateNodes))
  }
}
// Bound natively after mount rather than via `@keydown` so it runs after the
// item's own handlers. An `asChild` item (e.g. a `DropdownMenuTrigger` inside a
// `ToolbarButton`) or a consumer can then claim a key with `preventDefault()`,
// matching Radix, where the wrapped child's handler runs first.
const { forwardRef, currentElement } = useForwardExpose()
const itemElement = shallowRef<HTMLElement>()
watch(currentElement, (element) => {
  itemElement.value = element
}, { immediate: true, flush: 'post' })
useEventListener(itemElement, 'keydown', handleKeydown)

// An `asChild` child can replace its root element without this component
// re-rendering, which would leave the listener on the detached element. Focus
// reaches the item before any key does, so rebind from there.
function handleFocusIn(event: FocusEvent) {
  itemElement.value = event.currentTarget as HTMLElement
}
</script>

<template>
  <CollectionItem>
    <Primitive
      :ref="forwardRef"
      :tabindex="isCurrentTabStop ? 0 : -1"
      :data-orientation="context.orientation.value"
      :data-active="active ? '' : undefined"
      :data-disabled="!focusable ? '' : undefined"
      :as="as"
      :as-child="asChild"
      @mousedown="
        (event: MouseEvent) => {
          // We prevent focusing non-focusable items on `mousedown`.
          // Even though the item has tabIndex={-1}, that only means take it out of the tab order.
          if (!focusable) event.preventDefault();
          // Safari doesn't focus a button when clicked so we run our logic on mousedown also
          else context.onItemFocus(id);
        }
      "
      @focus="context.onItemFocus(id)"
      @focusin="handleFocusIn"
    >
      <slot />
    </Primitive>
  </CollectionItem>
</template>
