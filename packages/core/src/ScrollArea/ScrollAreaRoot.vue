<script lang="ts">
import type { Ref } from 'vue'
import type { Direction, ScrollType } from './types'
import type { PrimitiveProps } from '@/Primitive'
import { createContext, mergeExpose, useDirection, useForwardElement } from '@/shared'

export interface ScrollAreaRootContext {
  type: Ref<ScrollType>
  dir: Ref<Direction>
  scrollHideDelay: Ref<number>
  scrollArea: Ref<HTMLElement | undefined>
  viewport: Ref<HTMLElement | undefined>
  onViewportChange: (viewport: HTMLElement | null) => void
  content: Ref<HTMLElement | undefined>
  onContentChange: (content: HTMLElement) => void
  scrollbarX: Ref<HTMLElement | undefined>
  onScrollbarXChange: (scrollbar: HTMLElement | null) => void
  scrollbarXEnabled: Ref<boolean>
  onScrollbarXEnabledChange: (rendered: boolean) => void
  scrollbarY: Ref<HTMLElement | undefined>
  onScrollbarYChange: (scrollbar: HTMLElement | null) => void
  scrollbarYEnabled: Ref<boolean>
  onScrollbarYEnabledChange: (rendered: boolean) => void
  onCornerWidthChange: (width: number) => void
  onCornerHeightChange: (height: number) => void
}

export const [injectScrollAreaRootContext, provideScrollAreaRootContext]
  = createContext<ScrollAreaRootContext>('ScrollAreaRoot')

export interface ScrollAreaRootProps extends PrimitiveProps {
  /**
   * Describes the nature of scrollbar visibility, similar to how the scrollbar preferences in MacOS control visibility of native scrollbars.
   *
   * `auto` - means that scrollbars are visible when content is overflowing on the corresponding orientation. <br>
   * `always` - means that scrollbars are always visible regardless of whether the content is overflowing.<br>
   * `scroll` - means that scrollbars are visible when the user is scrolling along its corresponding orientation.<br>
   * `hover` - when the user is scrolling along its corresponding orientation and when the user is hovering over the scroll area.<br>
   * `glimpse` - a hybrid approach that briefly shows scrollbars when the user enters the scroll area, then hides them until further interaction.
   */
  type?: ScrollType
  /** The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** If type is set to either `scroll` or `hover`, this prop determines the length of time, in milliseconds, <br> before the scrollbars are hidden after the user stops interacting with scrollbars. */
  scrollHideDelay?: number
}
</script>

<script setup lang="ts">
import { toRef } from 'vue'
import { Primitive } from '@/Primitive'
import { useScrollArea } from './useScrollArea'

const props = withDefaults(defineProps<ScrollAreaRootProps>(), {
  type: 'hover',
  scrollHideDelay: 600,
})

const dir = useDirection(toRef(props, 'dir'))
const { forwardRef, currentElement: scrollArea, expose } = useForwardElement()

const { viewportElement, scrollTop, scrollTopLeft, root, context } = useScrollArea({
  type: () => props.type,
  dir,
  scrollHideDelay: () => props.scrollHideDelay,
  scrollArea,
})

defineExpose(mergeExpose(expose, {
  /** Viewport element within ScrollArea */
  viewport: viewportElement,
  /** Scroll viewport to top */
  scrollTop,
  /** Scroll viewport to top-left */
  scrollTopLeft,
}))

provideScrollAreaRootContext(context)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as-child="props.asChild"
    :as="as"
    v-bind="root.attrs.value"
  >
    <slot />
  </Primitive>
</template>
