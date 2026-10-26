<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface NavigationMenuViewportProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
  /**
   * Placement of the viewport for css variables `(--reka-navigation-menu-viewport-left, --reka-navigation-menu-viewport-top)`.
   * @defaultValue 'center'
   */
  align?: 'start' | 'center' | 'end'
}
</script>

<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'
import { Presence } from '@/Presence'
import {
  Primitive,
} from '@/Primitive'
import { injectNavigationMenuContext } from './NavigationMenuRoot.vue'
import { getOpenState, whenMouse } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<NavigationMenuViewportProps>(), {
  align: 'center',
})

const { forwardRef, currentElement } = useForwardExpose()

const menuContext = injectNavigationMenuContext()
const { activeTrigger, rootNavigationMenu, modelValue } = menuContext

const size = ref<{ width: number, height: number }>()
const position = ref<{ left: number, top: number }>()

const open = computed(() => !!menuContext.modelValue.value)

watch(currentElement, () => {
  menuContext.onViewportChange(currentElement.value)
})

const content = ref<HTMLElement>()

watch([modelValue, open], () => {
  nextTick(() => {
    if (!currentElement.value)
      return

    requestAnimationFrame(() => {
      const el = (currentElement.value as HTMLElement)?.querySelector('[data-state=open]') as HTMLElement | undefined
      content.value = el
    })
  })
}, { immediate: true })

function updatePosition() {
  if (content.value && activeTrigger.value && rootNavigationMenu.value) {
    const bodyWidth = document.documentElement.offsetWidth
    const bodyHeight = document.documentElement.offsetHeight
    const rootRect = rootNavigationMenu.value.getBoundingClientRect()
    // Rectangles include ancestor transforms, but offsets and the CSS
    // variables consumed by the viewport are in local CSS pixels.
    const scaleX = rootRect.width / (rootNavigationMenu.value.offsetWidth || rootRect.width) || 1
    const scaleY = rootRect.height / (rootNavigationMenu.value.offsetHeight || rootRect.height) || 1
    const rect = activeTrigger.value.getBoundingClientRect()
    const { offsetWidth, offsetHeight } = content.value

    // Find the beginning of the position of the menu item
    const startPositionLeft = (rect.left - rootRect.left) / scaleX
    const startPositionTop = (rect.top - rootRect.top) / scaleY

    // Aligning to specified alignment
    let posLeft = null
    let posTop = null
    switch (props.align) {
      case 'start':
        posLeft = startPositionLeft
        posTop = startPositionTop
        break
      case 'end':
        posLeft = startPositionLeft - offsetWidth + rect.width / scaleX
        posTop = startPositionTop - offsetHeight + rect.height / scaleY
        break
      default:
        // center
        posLeft = startPositionLeft - offsetWidth / 2 + rect.width / scaleX / 2
        posTop = startPositionTop - offsetHeight / 2 + rect.height / scaleY / 2
    }

    const screenOffset = 10

    // Convert the screen bounds to local coordinates before clamping.
    const minLeft = (screenOffset - rootRect.left) / scaleX
    const maxLeft = (bodyWidth - screenOffset - rootRect.left) / scaleX - offsetWidth
    const minTop = (screenOffset - rootRect.top) / scaleY
    const maxTop = (bodyHeight - screenOffset - rootRect.top) / scaleY - offsetHeight
    posLeft = Math.max(minLeft, Math.min(posLeft, maxLeft))
    posTop = Math.max(minTop, Math.min(posTop, maxTop))

    // Possible blurring font with decimal values
    posLeft = Math.round(posLeft)
    posTop = Math.round(posTop)

    position.value = {
      left: posLeft,
      top: posTop,
    }
  }
}

useResizeObserver(content, () => {
  if (content.value) {
    size.value = {
      width: content.value.offsetWidth,
      height: content.value.offsetHeight,
    }
    updatePosition()
  }
})

useResizeObserver([globalThis.document?.body, rootNavigationMenu], () => {
  updatePosition()
})
</script>

<template>
  <Presence
    v-slot="{ present }"
    :present="forceMount || open"
    :force-mount="!menuContext.unmountOnHide.value"
    @after-leave="() => {
      size = undefined
      position = undefined
    }"
  >
    <Primitive
      v-bind="$attrs"
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :data-state="getOpenState(open)"
      :data-orientation="menuContext.orientation"
      :style="{
        // Prevent interaction when animating out
        pointerEvents: !open && menuContext.isRootMenu ? 'none' : undefined,
        ['--reka-navigation-menu-viewport-width']: size ? `${size?.width}px` : undefined,
        ['--reka-navigation-menu-viewport-height']: size ? `${size?.height}px` : undefined,
        ['--reka-navigation-menu-viewport-left']: position ? `${position?.left}px` : undefined,
        ['--reka-navigation-menu-viewport-top']: position ? `${position?.top}px` : undefined,
      }"
      :hidden="!present"
      @pointerenter="menuContext.onContentEnter(menuContext.modelValue.value)"
      @pointerleave="whenMouse(() => menuContext.onContentLeave())($event)"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
