<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface MenuItemImplProps extends PrimitiveProps {
  /** When `true`, prevents the user from interacting with the item. */
  disabled?: boolean
  /**
   * Optional text used for typeahead purposes. By default the typeahead behavior will use the `.textContent` of the item. <br>
   *  Use this when the content is complex, or you have non-textual content inside.
   */
  textValue?: string
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, shallowRef } from 'vue'
import { useCollectionItem } from '@/Collection'
import {
  Primitive,
} from '@/Primitive'
import { getActiveElement, useForwardExpose } from '@/shared'
import { injectMenuContentContext } from './MenuContentImpl.vue'
import { isMouseEvent } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<MenuItemImplProps>()

const contentContext = injectMenuContentContext()
const { forwardRef, currentElement } = useForwardExpose()
// Registered with the content's collection from here, so no wrapper components around the item.
// The template renders the `data-reka-collection-item` attribute the collection orders by.
useCollectionItem(currentElement, () => ({ textValue: props.textValue }))

const isFocused = ref(false)
// Whether the content's highlight is on this item's element. The content sets it, see
// `onItemElementChange`: an item that compared `highlightedElement` with its own element would
// be notified of every highlight move in the menu.
const isElementHighlighted = shallowRef(false)
let trackedElement: HTMLElement | undefined
function trackElement(element: HTMLElement | undefined) {
  if (element === trackedElement)
    return
  contentContext.onItemElementChange(isElementHighlighted, element, trackedElement)
  trackedElement = element
}
onMounted(() => trackElement(currentElement.value))
// The item can render another element later (`asChild` with a `v-if` child).
onUpdated(() => trackElement(currentElement.value))
onBeforeUnmount(() => trackElement(undefined))

const isHighlighted = computed(() => isFocused.value || isElementHighlighted.value)

async function handlePointerMove(event: PointerEvent) {
  if (event.defaultPrevented || !isMouseEvent(event))
    return
  if (props.disabled) {
    contentContext.onItemLeave(event)
  }
  else {
    const defaultPrevented = contentContext.onItemEnter(event)
    if (!defaultPrevented) {
      const item = event.currentTarget as HTMLElement
      contentContext.highlightedElement.value = item
      const isInputFocused = ['INPUT', 'TEXTAREA'].includes(getActiveElement()?.tagName || '')
      if (!isInputFocused)
        item.focus({ preventScroll: true })
    }
  }
}

async function handlePointerLeave(event: PointerEvent) {
  await nextTick()
  if (event.defaultPrevented)
    return
  if (!isMouseEvent(event))
    return

  // If the highlight was already claimed by another element (e.g. the pointer moved
  // directly onto another item, whose synchronous `pointermove` ran before this
  // `nextTick` resolved), this leave is stale and must not reset focus/roving state.
  if (contentContext.highlightedElement.value !== currentElement.value)
    return

  const isMovingToSubmenu = contentContext.onItemLeave(event)
  if (!isMovingToSubmenu && contentContext.highlightedElement.value === currentElement.value)
    contentContext.highlightedElement.value = undefined
}
</script>

<template>
  <Primitive
    :ref="forwardRef"
    data-reka-collection-item=""
    role="menuitem"
    tabindex="-1"
    v-bind="$attrs"
    :as="as"
    :as-child="asChild"
    :aria-disabled="disabled || undefined"
    :data-disabled="disabled ? '' : undefined"
    :data-highlighted="isHighlighted ? '' : undefined"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
    @focus="
      async (event: FocusEvent) => {
        const item = event.currentTarget as HTMLElement;
        await nextTick();
        if (event.defaultPrevented || disabled) return;
        isFocused = true;
        contentContext.highlightedElement.value = item
      }
    "
    @blur="
      async (event: FocusEvent) => {
        await nextTick();
        if (event.defaultPrevented) return;
        isFocused = false;
      }
    "
  >
    <slot />
  </Primitive>
</template>
