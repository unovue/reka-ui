<script lang="ts">
export interface ScrollAreaVirtualizerProps<T = any> {
  /** List of items */
  options: T[]
  /** Number of items rendered outside the visible area */
  overscan?: number
  /** Estimated size (in px) of each item */
  estimateSize?: number | ((index: number) => number)
  /** Whether to virtualize items horizontally. */
  horizontal?: boolean
}
</script>

<script setup lang="ts" generic="T = any">
import type { VirtualItem, Virtualizer } from '@tanstack/vue-virtual'
import type { VNode } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { cloneVNode, computed, Fragment, useSlots } from 'vue'
import { injectScrollAreaRootContext } from './ScrollAreaRoot.vue'

const props = defineProps<ScrollAreaVirtualizerProps<T>>()

defineSlots<{
  default?: (props: {
    option: T
    virtualizer: Virtualizer<HTMLElement, Element>
    virtualItem: VirtualItem
  }) => any
}>()

const slots = useSlots()
const rootContext = injectScrollAreaRootContext()

const virtualizer = useVirtualizer({
  get count() { return props.options.length },
  get horizontal() { return props.horizontal ?? false },
  estimateSize(index) {
    if (typeof props.estimateSize === 'function')
      return props.estimateSize(index)

    return props.estimateSize ?? 28
  },
  getScrollElement() { return rootContext.viewport.value ?? null },
  overscan: props.overscan ?? 12,
})

const virtualizedItems = computed(() => virtualizer.value.getVirtualItems().map((item) => {
  const defaultNode = slots.default!({
    option: props.options[item.index],
    virtualizer: virtualizer.value,
    virtualItem: item,
  })[0]

  const targetNode = defaultNode.type === Fragment && Array.isArray(defaultNode.children)
    ? defaultNode.children.find(child => typeof (child as VNode).type !== 'symbol') as VNode
    : defaultNode

  return {
    item,
    is: cloneVNode(targetNode, {
      'data-index': item.index,
      'style': {
        position: 'absolute',
        top: 0,
        left: 0,
        transform: props.horizontal
          ? `translateX(${item.start}px)`
          : `translateY(${item.start}px)`,
        overflowAnchor: 'none',
      },
    }),
  }
}))
</script>

<template>
  <div
    data-reka-virtualizer
    :style="{
      position: 'relative',
      width: horizontal ? `${virtualizer.getTotalSize()}px` : '100%',
      height: horizontal ? '100%' : `${virtualizer.getTotalSize()}px`,
    }"
  >
    <component
      :is="is"
      v-for="{ is, item } in virtualizedItems"
      :key="item.key"
    />
  </div>
</template>
