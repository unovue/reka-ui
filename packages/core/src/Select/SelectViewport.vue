<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { useNonce } from '@/shared/useNonce'

export interface SelectViewportProps extends PrimitiveProps {
  /**
   * Will add `nonce` attribute to the style tag which can be used by Content Security Policy. <br> If omitted, inherits globally from `ConfigProvider`.
   */
  nonce?: string
}
</script>

<script setup lang="ts">
import { getCurrentInstance, onMounted, ref, toRefs, useAttrs } from 'vue'
import {
  Primitive,
} from '@/Primitive'
import { injectSelectContentContext } from './SelectContentImpl.vue'
import { injectSelectItemAlignedPositionContext } from './SelectItemAlignedPosition.vue'
import { CONTENT_MARGIN } from './utils'

const props = defineProps<SelectViewportProps>()
const { nonce: propNonce } = toRefs(props)
const nonce = useNonce(propNonce)

const contentContext = injectSelectContentContext()
const alignedPositionContext
  = contentContext.position === 'item-aligned'
    ? injectSelectItemAlignedPositionContext()
    : undefined

const { forwardRef, currentElement } = useForwardExpose()

onMounted(() => {
  contentContext?.onViewportChange(currentElement.value)
})

const prevScrollTopRef = ref(0)

function handleScroll(event: WheelEvent) {
  const viewport = event.currentTarget as HTMLElement
  const { shouldExpandOnScrollRef, contentWrapper } = alignedPositionContext ?? {}
  if (shouldExpandOnScrollRef?.value && contentWrapper?.value) {
    const scrolledBy = Math.abs(prevScrollTopRef.value - viewport.scrollTop)
    if (scrolledBy > 0) {
      const availableHeight = window.innerHeight - CONTENT_MARGIN * 2
      const cssMinHeight = Number.parseFloat(
        contentWrapper.value.style.minHeight,
      )
      const cssHeight = Number.parseFloat(contentWrapper.value.style.height)
      const prevHeight = Math.max(cssMinHeight, cssHeight)

      if (prevHeight < availableHeight) {
        const nextHeight = prevHeight + scrolledBy
        const clampedNextHeight = Math.min(availableHeight, nextHeight)
        const heightDiff = nextHeight - clampedNextHeight

        contentWrapper.value.style.height = `${clampedNextHeight}px`
        if (contentWrapper.value.style.bottom === '0px') {
          viewport.scrollTop = heightDiff > 0 ? heightDiff : 0
          // ensure the content stays pinned to the bottom
          contentWrapper.value.style.justifyContent = 'flex-end'
        }
      }
    }
  }
  prevScrollTopRef.value = viewport.scrollTop
}

// The items render inside the viewport's element. The content above the viewport renders
// several times while it opens, is positioned and closes, and each of those renders used to
// reach the element and, from there, every item of a list written with `v-for`. The element
// is memoized on what it is given: it renders again when an attribute or a prop changed, or
// when the slot may have. A slot the compiler marked as stable (`_: 1`) reads nothing but
// reactive state, which the element follows by itself; any other slot renders every time.
const instance = getCurrentInstance()
const attrs = useAttrs()
let slotVersion = 0
function viewportMemo() {
  const hasStableSlots = (instance?.vnode?.children as { _?: number } | null | undefined)?._ === 1
  if (!hasStableSlots)
    slotVersion++
  return [slotVersion, props.as, props.asChild, props.nonce, ...Object.keys(attrs), ...Object.values(attrs)]
}
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-memo="viewportMemo()"
    data-reka-select-viewport
    role="presentation"
    v-bind="{ ...$attrs, ...props }"
    :style="{
      // we use position: 'relative' here on the `viewport` so that when we call
      // `selectedItem.offsetTop` in calculations, the offset is relative to the viewport
      // (independent of the scrollUpButton).
      position: 'relative',
      flex: 1,
      overflow: 'hidden auto',
    }"
    @scroll="handleScroll"
  >
    <slot />
  </Primitive>
  <Primitive
    as="style"
    :nonce="nonce"
  >
    /* Hide scrollbars cross-browser and enable momentum scroll for touch
    devices */ [data-reka-select-viewport] { scrollbar-width:none; -ms-overflow-style: none;
    -webkit-overflow-scrolling: touch; }
    [data-reka-select-viewport]::-webkit-scrollbar { display: none; }
  </Primitive>
</template>
