<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { mergeExpose, useForwardElement } from '@/shared'
import { useNonce } from '@/shared/useNonce'

export interface ScrollAreaViewportProps extends PrimitiveProps {
  /**
   * Will add `nonce` attribute to the style tag which can be used by Content Security Policy. <br> If omitted, inherits globally from `ConfigProvider`.
   */
  nonce?: string
}
</script>

<script setup lang="ts">
import { mergeProps, onMounted, ref, toRefs } from 'vue'
import { Primitive } from '@/Primitive'
import { injectScrollAreaRootContext } from './ScrollAreaRoot.vue'
import { getScrollAreaContentSurface, getScrollAreaViewportSurface } from './useScrollArea'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<ScrollAreaViewportProps>()

const { nonce: propNonce } = toRefs(props)
const nonce = useNonce(propNonce)

const rootContext = injectScrollAreaRootContext()
// Same derivations as `useScrollArea().viewport` / `.content`.
const viewport = getScrollAreaViewportSurface(rootContext)
const content = getScrollAreaContentSurface(rootContext)

const viewportElement = ref<HTMLElement>()

onMounted(() => {
  rootContext.onViewportChange(viewportElement.value!)
  rootContext.onContentChange(contentElement.value!)
})

const { forwardRef, currentElement: contentElement, expose } = useForwardElement()
defineExpose(mergeExpose(expose, {
  viewportElement,
}))
</script>

<template>
  <div
    ref="viewportElement"
    v-bind="mergeProps(viewport.attrs.value, $attrs)"
    :tabindex="0"
  >
    <Primitive
      :ref="forwardRef"
      v-bind="content.attrs.value"
      :as-child="props.asChild"
      :as="as"
    >
      <slot />
    </Primitive>
  </div>
  <Primitive
    as="style"
    :nonce="nonce"
  >
    /* Hide scrollbars cross-browser and enable momentum scroll for touch
    devices */
    [data-reka-scroll-area-viewport] {
    scrollbar-width:none;
    -ms-overflow-style:none;
    -webkit-overflow-scrolling:touch;
    }

    [data-reka-scroll-area-viewport]::-webkit-scrollbar {
    display:none;
    }
  </Primitive>
</template>
