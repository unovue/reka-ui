<script lang="ts">
import type {
  DismissableLayerEmits,
  DismissableLayerProps,
} from '@/DismissableLayer'

export type DrawerContentImplEmits = DismissableLayerEmits & {
  openAutoFocus: [event: Event]
  closeAutoFocus: [event: Event]
}

export interface DrawerContentImplProps extends DismissableLayerProps {
  trapFocus?: boolean
}
</script>

<script setup lang="ts">
import type { SwipeDirection } from './utils'
import { useResizeObserver } from '@vueuse/core'
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { DismissableLayer } from '@/DismissableLayer'
import { FocusScope } from '@/FocusScope'
import { useForwardExpose } from '@/shared'
import { useDrawerSnapPoints } from './composables/useDrawerSnapPoints'
import { useSwipeDismiss } from './composables/useSwipeDismiss'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { DRAWER_CSS_VARS } from './utils'

const props = defineProps<DrawerContentImplProps>()
const emits = defineEmits<DrawerContentImplEmits>()

const rootContext = injectDrawerRootContext()
const { forwardRef, currentElement } = useForwardExpose()

// Snap points
const { activeSnapPointOffset, snapToNearest } = useDrawerSnapPoints({
  snapPoints: rootContext.snapPoints,
  activeSnapPoint: rootContext.activeSnapPoint,
  popupHeight: rootContext.popupHeight,
  viewportRef: currentElement,
  onSnapPointChange: (point) => {
    if (point === null)
      rootContext.onOpenChange(false)
    else
      rootContext.setActiveSnapPoint(point)
  },
})

// Watch activeSnapPointOffset -> set/remove CSS vars
watch(activeSnapPointOffset, (offset) => {
  const el = currentElement.value
  if (!el)
    return
  if (offset != null) {
    el.style.setProperty(DRAWER_CSS_VARS.snapPointOffset, `${offset}px`)
    // Set snap height so CSS can use min-height to fill from snap point to bottom
    const snapHeight = rootContext.popupHeight.value - offset
    el.style.setProperty('--drawer-snap-height', `${snapHeight}px`)
  }
  else {
    el.style.removeProperty(DRAWER_CSS_VARS.snapPointOffset)
    el.style.removeProperty('--drawer-snap-height')
  }
})

// Measure popup height via ResizeObserver
useResizeObserver(currentElement, ([entry]) => {
  if (!entry)
    return
  const h = entry.contentRect.height
  rootContext.onPopupHeightChange(h)
  currentElement.value?.style.setProperty(DRAWER_CSS_VARS.height, `${h}px`)
})

// Watch frontmostHeight -> set CSS var
watch(() => rootContext.frontmostHeight.value, (h) => {
  currentElement.value?.style.setProperty(DRAWER_CSS_VARS.frontmostHeight, `${h}px`)
})

// Swipe directions: when snap points exist, allow both dismiss AND expand directions
const hasSnapPoints = computed(() => (rootContext.snapPoints.value?.length ?? 0) > 0)
const swipeDirections = computed<SwipeDirection[]>(() => {
  const dismiss = rootContext.swipeDirection.value
  if (!hasSnapPoints.value)
    return [dismiss]
  // Allow swiping in both directions for snap point navigation
  const opposite: Record<string, SwipeDirection> = { up: 'down', down: 'up', left: 'right', right: 'left' }
  return [dismiss, opposite[dismiss]]
})

// Swipe dismiss
const { isSwiping, dragOffset } = useSwipeDismiss({
  enabled: computed(() => rootContext.open.value),
  elementRef: currentElement,
  directions: swipeDirections,
  movementCssVars: {
    x: DRAWER_CSS_VARS.swipeMovementX,
    y: DRAWER_CSS_VARS.swipeMovementY,
  },
  canStart: () => !rootContext.nestedSwiping.value,
  onDismiss() {
    if (!hasSnapPoints.value) {
      rootContext.onOpenChange(false)
    }
    // With snap points, onRelease handles snapping
  },
  onRelease(velocity) {
    if (hasSnapPoints.value) {
      // Pass the raw drag offset (signed: positive=down/right, negative=up/left)
      const isVertical = rootContext.swipeDirection.value === 'up' || rootContext.swipeDirection.value === 'down'
      const dragPx = isVertical ? dragOffset.value.y : dragOffset.value.x
      snapToNearest(dragPx, velocity, rootContext.swipeDirection.value, rootContext.snapToSequentialPoints.value)
    }
  },
  onSwipingChange(swiping) {
    rootContext.onNestedSwipingChange(swiping)
  },
  onProgress(progress) {
    rootContext.onNestedSwipeProgressChange(progress)
  },
})

function onDismiss() {
  if (!isSwiping.value)
    rootContext.onOpenChange(false)
}

// Data attributes
const dataAttributes = computed(() => {
  const attrs: Record<string, string | undefined> = {
    'data-state': rootContext.open.value ? 'open' : 'closed',
    'data-swipe-direction': rootContext.swipeDirection.value,
  }
  if (isSwiping.value)
    attrs['data-swiping'] = ''
  if (rootContext.hasNestedDrawer.value)
    attrs['data-nested-drawer-open'] = ''
  return attrs
})

onMounted(() => {
  rootContext.contentElement.value = currentElement.value
  rootContext.notifyParentHasNestedDrawer?.(true)

  const nestedDepth = rootContext.notifyParentHasNestedDrawer ? 1 : 0
  currentElement.value?.style.setProperty(DRAWER_CSS_VARS.nestedDrawers, `${nestedDepth}`)
})

onUnmounted(() => {
  rootContext.notifyParentHasNestedDrawer?.(false)
})

// Dev warning for missing DrawerTitle
if (process.env.NODE_ENV !== 'production') {
  onMounted(() => {
    if (!document.getElementById(rootContext.titleId)) {
      console.warn(
        `Warning: \`DrawerContent\` requires a \`DrawerTitle\` for accessibility.`,
      )
    }
  })
}
</script>

<template>
  <FocusScope
    as-child
    loop
    :trapped="props.trapFocus"
    @mount-auto-focus="emits('openAutoFocus', $event)"
    @unmount-auto-focus="emits('closeAutoFocus', $event)"
  >
    <DismissableLayer
      :id="rootContext.contentId"
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :disable-outside-pointer-events="disableOutsidePointerEvents"
      role="dialog"
      :aria-describedby="rootContext.descriptionId"
      :aria-labelledby="rootContext.titleId"
      v-bind="{ ...dataAttributes, ...$attrs }"
      @dismiss="onDismiss"
      @escape-key-down="emits('escapeKeyDown', $event)"
      @focus-outside="(e: any) => { if (isSwiping) e.preventDefault(); else emits('focusOutside', e) }"
      @interact-outside="(e: any) => { if (isSwiping) e.preventDefault(); else emits('interactOutside', e) }"
      @pointer-down-outside="(e: any) => { if (isSwiping) e.preventDefault(); else emits('pointerDownOutside', e) }"
    >
      <slot />
    </DismissableLayer>
  </FocusScope>
</template>
