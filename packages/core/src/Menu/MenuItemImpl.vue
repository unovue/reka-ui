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
import { useCollection } from '@/Collection'
import { Primitive } from '@/Primitive'
import { stateToDataAttrs, useForwardExpose } from '@/shared'
import { injectMenuContentContext } from './MenuContentImpl.vue'
import { getMenuItemBaseSurface } from './useMenu'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<MenuItemImplProps>()

const contentContext = injectMenuContentContext()
const { forwardRef, currentElement } = useForwardExpose()
const { CollectionItem } = useCollection()

// role/aria/data-* + the hover-highlight (pointermove/leave/focus/blur) come from
// the shared item surface. The `<CollectionItem>` registration wrapper stays in
// the SFC — it is vnode-bound provide/inject a composable can't absorb.
const surface = getMenuItemBaseSurface(contentContext, {
  disabled: () => props.disabled,
  currentElement,
})
</script>

<template>
  <CollectionItem :value="{ textValue }">
    <Primitive
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      v-bind="mergeProps(surface.props.value, stateToDataAttrs(surface.state.value), $attrs)"
    >
      <slot />
    </Primitive>
  </CollectionItem>
</template>
