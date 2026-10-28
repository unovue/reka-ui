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
import { mergeProps } from 'vue'
import { useCollectionItem } from '@/Collection'
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectMenuContentContext } from './MenuContentImpl.vue'
import { createMenuItemSurface } from './useMenu'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<MenuItemImplProps>()

const contentContext = injectMenuContentContext()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
// Registered with the content's collection from setup; no wrapper component.
useCollectionItem(currentElement, () => ({ textValue: props.textValue }))

// role/aria/data-* + the hover-highlight (pointermove/leave/focus/blur) come from
// the shared item surface.
const surface = createMenuItemSurface(contentContext, {
  disabled: () => props.disabled,
  currentElement,
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    data-reka-collection-item=""
    :as="as"
    :as-child="asChild"
    v-bind="mergeProps(surface.attrs.value, $attrs)"
  >
    <slot />
  </Primitive>
</template>
