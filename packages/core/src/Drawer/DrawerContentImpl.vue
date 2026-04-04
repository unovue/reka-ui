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
import { useResizeObserver } from '@vueuse/core'
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useWarning } from '@/Dialog/utils'
import { DismissableLayer } from '@/DismissableLayer'
import { FocusScope } from '@/FocusScope'
import { useForwardExpose } from '@/shared'
import { useDrawerSnapPoints } from './composables/useDrawerSnapPoints'
import { useSwipeDismiss } from './composables/useSwipeDismiss'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { DRAWER_CSS_VARS, registerDrawerCssProperties } from './utils'

const props = defineProps<DrawerContentImplProps>()
const emits = defineEmits<DrawerContentImplEmits>()

const rootContext = injectDrawerRootContext()
const { forwardRef, currentElement } = useForwardExpose()

// Register CSS custom properties once
registerDrawerCssProperties()

// Measure popup height via ResizeObserver
useResizeObserver(currentElement, ([entry]) => {
  if (!entry)
    return
  const h = entry.contentRect.height
  rootContext.onPopupHeightChange(h)
  currentElement.value?.style.setProperty(DRAWER_CSS_VARS.height, `${h}`)
})

// Snap points
const { activeSnapPointOffset, snapToNearest } = useDrawerSnapPoints({
  snapPoints: rootContext.snapPoints,
  activeSnapPoint: rootContext.activeSnapPoint,
  popupHeight: rootContext.popupHeight,
  viewportRef: currentElement,
  onSnapPointChange: (point) => {
    if (point === null) {
      rootContext.onOpenChange(false)
    }
    else {
      rootContext.setActiveSnapPoint(point)
    }
  },
})

// Watch activeSnapPointOffset -> set/remove CSS var
watch(activeSnapPointOffset, (offset) => {
  const el = currentElement.value
  if (!el)
    return
  if (offset != null) {
    el.style.setProperty(DRAWER_CSS_VARS.snapPointOffset, `${offset}`)
  }
  else {
    el.style.removeProperty(DRAWER_CSS_VARS.snapPointOffset)
  }
})

// Watch frontmostHeight -> set CSS var
watch(() => rootContext.frontmostHeight.value, (h) => {
  currentElement.value?.style.setProperty(DRAWER_CSS_VARS.frontmostHeight, `${h}`)
})

// Swipe dismiss
const { isSwiping } = useSwipeDismiss({
  enabled: computed(() => rootContext.open.value),
  elementRef: currentElement,
  directions: [rootContext.swipeDirection.value],
  movementCssVars: {
    x: DRAWER_CSS_VARS.swipeMovementX,
    y: DRAWER_CSS_VARS.swipeMovementY,
  },
  onDismiss() {
    if (rootContext.snapPoints.value && rootContext.snapPoints.value.length > 0) {
      snapToNearest(0, { x: 0, y: 0 }, rootContext.swipeDirection.value, rootContext.snapToSequentialPoints.value)
    }
    else {
      rootContext.onOpenChange(false)
    }
  },
  onRelease(velocity) {
    if (rootContext.snapPoints.value && rootContext.snapPoints.value.length > 0) {
      const offset = activeSnapPointOffset.value ?? 0
      snapToNearest(offset, velocity, rootContext.swipeDirection.value, rootContext.snapToSequentialPoints.value)
    }
  },
  onSwipingChange(swiping) {
    rootContext.onNestedSwipingChange(swiping)
  },
  onProgress(progress) {
    rootContext.onNestedSwipeProgressChange(progress)
  },
})

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

  // Register with parent nested drawer
  rootContext.notifyParentHasNestedDrawer?.(true)

  // Set nested depth CSS var
  currentElement.value?.style.setProperty(DRAWER_CSS_VARS.nestedDrawers, '0')
})

onUnmounted(() => {
  rootContext.notifyParentHasNestedDrawer?.(false)
})

// Dev warning for missing DrawerTitle
if (process.env.NODE_ENV !== 'production') {
  useWarning({
    titleName: 'DrawerTitle',
    contentName: 'DrawerContent',
    componentLink: 'drawer.html#title',
    titleId: rootContext.titleId,
    descriptionId: rootContext.descriptionId,
    contentElement: currentElement,
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
      @dismiss="rootContext.onOpenChange(false)"
      @escape-key-down="emits('escapeKeyDown', $event)"
      @focus-outside="emits('focusOutside', $event)"
      @interact-outside="emits('interactOutside', $event)"
      @pointer-down-outside="emits('pointerDownOutside', $event)"
    >
      <slot />
    </DismissableLayer>
  </FocusScope>
</template>
