<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { COLLECTION_ITEM_ATTRS, useCollectionItem } from '@/Collection/Collection'
import { useForwardElement } from '@/shared'

export type NavigationMenuLinkEmits = {
  /**
   * Event handler called when the user selects a link (via mouse or keyboard).
   *
   * Calling `event.preventDefault` in this handler will prevent the navigation menu from closing when selecting that link.
   */
  select: [payload: CustomEvent<{ originalEvent: Event }>]
}
export interface NavigationMenuLinkProps extends PrimitiveProps {
  /** Used to identify the link as the currently active page. */
  active?: boolean
}
</script>

<script setup lang="ts">
import { getCurrentInstance, mergeProps } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useNavigationMenuLink } from './useNavigationMenu'

defineOptions({
  // `$attrs` are merged under the part's own bindings: the precedence the
  // former `CollectionItem` wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<NavigationMenuLinkProps>(), {
  as: 'a',
})

const emits = defineEmits<NavigationMenuLinkEmits>()

const { forwardRef, currentElement, expose } = useForwardElement()
// A consumer `value` attr was the `CollectionItem` wrapper's prop: the
// collection item's value, not an attribute (read through the instance
// proxy, which tracks `$attrs`).
const instance = getCurrentInstance()!
useCollectionItem(currentElement, () => instance.proxy!.$attrs.value, { key: 'NavigationMenu' })
function elementAttrs(attrs: Record<string, unknown>) {
  if (!('value' in attrs))
    return attrs
  const { value: _, ...rest } = attrs
  return rest
}
defineExpose(expose)

const { link } = useNavigationMenuLink({
  active: () => props.active,
  onSelect: event => emits('select', event),
})
</script>

<template>
  <component
    :is="renderAs(as, props.asChild)"
    :ref="forwardRef"
    v-bind="mergeProps(elementAttrs($attrs), COLLECTION_ITEM_ATTRS, link.attrs.value)"
  >
    <slot />
  </component>
</template>
