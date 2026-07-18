<script lang="ts">
import type { MenuItemImplProps } from './MenuItemImpl.vue'
import { useForwardExpose } from '@/shared'

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
import { mergeProps } from 'vue'
import { injectMenuContentContext } from './MenuContentImpl.vue'
import MenuItemImpl from './MenuItemImpl.vue'
import { injectMenuRootContext } from './MenuRoot.vue'
import { getMenuItemSelectSurface } from './useMenu'

const props = defineProps<MenuItemProps>()
const emits = defineEmits<MenuItemEmits>()

const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectMenuRootContext()
const contentContext = injectMenuContentContext()

// The select layer (click/pointer/keydown + the close-on-select protocol). Merged
// onto MenuItemImpl so its handlers chain with the base surface's. `onSelect` is a
// callback channel — the cancelable CustomEvent token, not a merged DOM listener.
const select = getMenuItemSelectSurface(rootContext, {
  disabled: () => props.disabled,
  currentElement,
  onSelect: event => emits('select', event),
  searchRef: contentContext.searchRef,
})
</script>

<template>
  <MenuItemImpl
    v-bind="mergeProps(props, select.props.value)"
    :ref="forwardRef"
  >
    <slot />
  </MenuItemImpl>
</template>
