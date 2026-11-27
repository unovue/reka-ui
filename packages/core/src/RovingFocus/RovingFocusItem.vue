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
import { mergeProps, useAttrs } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { useRovingFocusItem } from './useRovingFocusItem'

defineOptions({
  // `$attrs` are merged under the item's own bindings, the precedence the `CollectionItem`
  // wrapper gave them. A `value` attribute is the item's collection value (it was that wrapper's
  // prop), never a DOM attribute.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<RovingFocusItemProps>(), {
  focusable: true,
  as: 'span',
})

const attrs = useAttrs()
const { forwardRef, currentElement } = useForwardExpose()
const roving = useRovingFocusItem({
  element: currentElement,
  tabStopId: () => props.tabStopId,
  focusable: () => props.focusable,
  active: () => props.active,
  allowShiftKey: () => props.allowShiftKey,
  value: () => attrs.value,
})

function renderAttrs() {
  let own = attrs
  if ('value' in own) {
    const { value: _, ...rest } = own
    own = rest
  }
  return mergeProps(own, roving.attrs())
}
</script>

<template>
  <Primitive
    v-bind="renderAttrs()"
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
  >
    <slot />
  </Primitive>
</template>
