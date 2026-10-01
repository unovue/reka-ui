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
import { useVirtualizer } from '@tanstack/vue-virtual'
import { useResizeObserver } from '@vueuse/core'
import { cloneVNode, computed, ref, useSlots, watch } from 'vue'
import { renderSlotFragments, useForwardExpose } from '@/shared'
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

const isRtl = computed(() => rootContext.dir.value === 'rtl')
// Distance between the start of the viewport's scrollable content and this element,
// so content rendered before the virtualizer doesn't shift the visible range.
const scrollMargin = ref(0)

const virtualizer = useVirtualizer({
  get count() { return props.options.length },
  get horizontal() { return props.horizontal ?? false },
  get isRtl() { return isRtl.value },
  get scrollMargin() { return scrollMargin.value },
  get overscan() { return props.overscan ?? 12 },
  estimateSize(index) {
    if (typeof props.estimateSize === 'function')
      return props.estimateSize(index)

    return props.estimateSize ?? 28
  },
  getScrollElement() { return rootContext.viewport.value ?? null },
  scrollToFn(offset, { adjustments = 0, behavior }, instance) {
    const { horizontal, isRtl } = instance.options
    const toOffset = offset + adjustments
    // `scrollLeft` is negative in RTL
    instance.scrollElement?.scrollTo?.({
      [horizontal ? 'left' : 'top']: horizontal && isRtl ? -toOffset : toOffset,
      behavior,
    })
  },
})

defineExpose({
  /** The underlying TanStack Virtual instance, e.g. for `scrollToIndex` */
  virtualizer,
})

const { forwardRef, currentElement } = useForwardExpose()

function updateScrollMargin() {
  const viewport = rootContext.viewport.value
  const el = currentElement.value
  if (!viewport || !el)
    return

  const viewportRect = viewport.getBoundingClientRect()
  const rect = el.getBoundingClientRect()
  let margin: number
  if (!props.horizontal)
    margin = rect.top - (viewportRect.top + viewport.clientTop) + viewport.scrollTop
  else if (isRtl.value)
    margin = (viewportRect.left + viewport.clientLeft + viewport.clientWidth) - rect.right - viewport.scrollLeft
  else
    margin = rect.left - (viewportRect.left + viewport.clientLeft) + viewport.scrollLeft

  scrollMargin.value = Math.max(0, Math.round(margin))
}

watch([rootContext.viewport, currentElement, () => props.horizontal, isRtl], updateScrollMargin, { flush: 'post', immediate: true })
useResizeObserver(rootContext.content, updateScrollMargin)

// the estimated sizes are cached, so they need to be measured again
watch(() => typeof props.estimateSize === 'number' ? props.estimateSize : undefined, () => virtualizer.value.measure())

// not a computed: slots aren't reactive, so a replaced slot would keep rendering the cached nodes
function getVirtualizedItems() {
  return virtualizer.value.getVirtualItems().flatMap((item) => {
    const targetNode = renderSlotFragments(slots.default?.({
      option: props.options[item.index],
      virtualizer: virtualizer.value,
      virtualItem: item,
    })).find(child => typeof child.type !== 'symbol')

    if (!targetNode)
      return []

    const start = item.start - scrollMargin.value

    return [{
      item,
      is: cloneVNode(targetNode, {
        'data-index': item.index,
        'style': {
          position: 'absolute',
          top: 0,
          ...(props.horizontal
            ? { [isRtl.value ? 'right' : 'left']: 0 }
            : { left: 0, right: 0 }),
          transform: props.horizontal
            ? `translateX(${isRtl.value ? -start : start}px)`
            : `translateY(${start}px)`,
          overflowAnchor: 'none',
        },
      }),
    }]
  })
}
</script>

<template>
  <div
    :ref="forwardRef"
    data-reka-virtualizer
    :style="{
      position: 'relative',
      width: horizontal ? `${virtualizer.getTotalSize()}px` : '100%',
      height: horizontal ? undefined : `${virtualizer.getTotalSize()}px`,
    }"
  >
    <component
      :is="is"
      v-for="{ is, item } in getVirtualizedItems()"
      :key="item.key"
    />
  </div>
</template>
