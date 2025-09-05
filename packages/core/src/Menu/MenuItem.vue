<script lang="ts">
import type { MenuItemImplProps } from './MenuItemImpl.vue'

export type MenuItemEmits = {
  /**
   * Event handler called when the user selects an item (via mouse or keyboard). <br>
   *  Calling `event.preventDefault` in this handler will prevent the menu from closing when selecting that item.
   */
  select: [event: Event]
}

export interface MenuItemProps extends MenuItemImplProps {}
</script>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { getHTMLElement, useForwardExpose } from '@/shared'
import { injectMenuContentContext } from './MenuContentImpl.vue'
import MenuItemImpl from './MenuItemImpl.vue'
import { injectMenuRootContext } from './MenuRoot.vue'
import { ITEM_SELECT, SELECTION_KEYS } from './utils'

const props = defineProps<MenuItemProps>()
const emits = defineEmits<MenuItemEmits>()

const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectMenuRootContext()
const contentContext = injectMenuContentContext()

const isPointerDownRef = ref(false)

async function handleSelect() {
  const menuItem = currentElement.value
  if (!props.disabled && menuItem) {
    const itemSelectEvent = new CustomEvent(ITEM_SELECT, {
      bubbles: true,
      cancelable: true,
    })
    emits('select', itemSelectEvent)
    // let select event finish
    await nextTick()
    if (itemSelectEvent.defaultPrevented)
      isPointerDownRef.value = false
    else rootContext.onClose()
  }
}

function handlePointerDown() {
  isPointerDownRef.value = true
}

async function handlePointerUp(event: PointerEvent) {
  await nextTick()
  if (event.defaultPrevented)
    return
  if (!isPointerDownRef.value)
    getHTMLElement(event.currentTarget)?.click()
}

function handleKeydown(event: KeyboardEvent) {
  const isTypingAhead = contentContext.searchRef.value !== ''
  if (props.disabled || (isTypingAhead && event.key === ' '))
    return
  if (SELECTION_KEYS.includes(event.key)) {
    getHTMLElement(event.currentTarget)?.click()
    event.preventDefault()
  }
}
</script>

<template>
  <MenuItemImpl
    v-bind="props"
    :ref="forwardRef"
    @click="handleSelect"
    @pointerdown="handlePointerDown"
    @pointerup="handlePointerUp"
    @keydown="handleKeydown"
  >
    <slot />
  </MenuItemImpl>
</template>
