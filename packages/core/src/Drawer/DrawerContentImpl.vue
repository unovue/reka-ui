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
  /**
   * Initial focus target when the drawer opens.
   * - `true` / default: focus the first focusable element inside
   * - `false`: do not focus anything
   * - element ref: focus that specific element
   */
  initialFocus?: boolean | HTMLElement | null
  /**
   * Final focus target when the drawer closes.
   * - `true` / default: focus the trigger
   * - `false`: do not restore focus
   * - element ref: focus that specific element
   */
  finalFocus?: boolean | HTMLElement | null
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
import { computeSwipeReleaseScalar, DRAWER_CSS_VARS, getDisplacement, registerDrawerCssProperties } from './utils'

const props = defineProps<DrawerContentImplProps>()
const emits = defineEmits<DrawerContentImplEmits>()

const rootContext = injectDrawerRootContext()
const { forwardRef, currentElement } = useForwardExpose()

registerDrawerCssProperties()

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

// Watch activeSnapPointOffset -> set CSS vars (matching BaseUI sign convention)
// offset >= 0 represents distance from fully-open. For 'up' drawers, flip sign.
// BaseUI parity: snap points are applied purely via a translate using
// --drawer-snap-point-offset. The popup's height is independent (consumers
// should set max-height: 100dvh or similar and let the transform slide the
// popup visually).
watch(activeSnapPointOffset, (offset) => {
  const el = currentElement.value
  if (!el)
    return
  if (offset != null) {
    const dir = rootContext.swipeDirection.value
    const signedOffset = (dir === 'up' || dir === 'left') ? -offset : offset
    el.style.setProperty(DRAWER_CSS_VARS.snapPointOffset, `${signedOffset}px`)
  }
  else {
    el.style.setProperty(DRAWER_CSS_VARS.snapPointOffset, '0px')
  }
})

// Measure popup height via ResizeObserver. BaseUI parity: skip writes while a
// nested drawer is open and we already have a measured height, to keep the
// parent's snap-point geometry stable while the child drawer animates.
useResizeObserver(currentElement, ([entry]) => {
  if (!entry)
    return
  if (rootContext.hasNestedDrawer.value && rootContext.popupHeight.value > 0)
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

// Track the latest raw signed delta for snap release (BaseUI parity: the
// release math needs the delta as of the last move, not the accumulated
// CSS offset).
let lastRawDelta = { x: 0, y: 0 }

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
      rootContext.onOpenChange(false, 'swipe')
    }
    // With snap points, onRelease handles snapping
  },
  onRelease(velocity) {
    // Write the `--drawer-swipe-strength` CSS var so consumer transitions can
    // scale their duration with release velocity. Ported from BaseUI
    // `DrawerViewport.tsx:resolveSwipeRelease`.
    const el = currentElement.value
    if (el) {
      const dir = rootContext.swipeDirection.value
      const size = (dir === 'left' || dir === 'right') ? el.offsetWidth : el.offsetHeight
      const axisDelta = (dir === 'left' || dir === 'right') ? lastRawDelta.x : lastRawDelta.y
      const releaseVelocity = (dir === 'left' || dir === 'right') ? velocity.x : velocity.y
      const scalar = computeSwipeReleaseScalar({
        direction: dir,
        size,
        axisDelta,
        snapPointOffset: activeSnapPointOffset.value ?? 0,
        releaseVelocity,
      })
      if (scalar != null)
        el.style.setProperty(DRAWER_CSS_VARS.swipeStrength, `${scalar}`)
      else
        el.style.setProperty(DRAWER_CSS_VARS.swipeStrength, '1')
    }

    if (hasSnapPoints.value) {
      // Convert the latest signed delta to a dismiss-direction-positive scalar
      // (BaseUI: `dragDelta = direction==='down' ? deltaY : direction==='up' ? -deltaY : ...`).
      // getDisplacement handles the sign flip per direction.
      const dir = rootContext.swipeDirection.value
      const dragDelta = getDisplacement(dir, lastRawDelta.x, lastRawDelta.y)
      snapToNearest(dragDelta, velocity, dir, rootContext.snapToSequentialPoints.value)
    }
  },
  onSwipingChange(swiping) {
    rootContext.onSwipingChange(swiping)
    rootContext.onNestedSwipingChange(swiping)
  },
  onProgress(progress, details) {
    if (details) {
      lastRawDelta = { x: details.deltaX, y: details.deltaY }
    }
    rootContext.onNestedSwipeProgressChange(progress)
  },
})

// Track the source of the next dismiss so we can attach a reason.
// DismissableLayer fires `escape-key-down` / `pointer-down-outside` / `focus-outside`
// before it fires `dismiss`, so we capture the reason in those handlers and read
// it here.
let pendingDismissReason: 'escape-key' | 'outside-press' | undefined

function onDismiss() {
  if (isSwiping.value)
    return
  rootContext.onOpenChange(false, pendingDismissReason ?? 'outside-press')
  pendingDismissReason = undefined
}

function onEscapeKeyDown(event: KeyboardEvent) {
  pendingDismissReason = 'escape-key'
  emits('escapeKeyDown', event)
}

function onPointerDownOutside(event: any) {
  if (isSwiping.value) {
    event.preventDefault()
    return
  }
  pendingDismissReason = 'outside-press'
  emits('pointerDownOutside', event)
}

function onFocusOutside(event: any) {
  if (isSwiping.value) {
    event.preventDefault()
    return
  }
  emits('focusOutside', event)
}

function onInteractOutside(event: any) {
  if (isSwiping.value) {
    event.preventDefault()
    return
  }
  emits('interactOutside', event)
}

// --- update:openComplete wiring ---
// Fire `update:openComplete` on the popup's own transitionend/animationend,
// not on a microtask — consumers rely on this marker to know the enter/exit
// transition has actually finished. We track the current listener so a rapid
// open→close doesn't leak or double-fire, and guard with `event.target === el`
// so child element transitions don't spuriously resolve the drawer lifecycle.
let openCompleteCleanup: (() => void) | undefined

function clearOpenCompleteListener() {
  openCompleteCleanup?.()
  openCompleteCleanup = undefined
}

watch(() => rootContext.open.value, (isOpen) => {
  clearOpenCompleteListener()
  const el = currentElement.value
  if (!el) {
    // If there's no element (e.g. closed without ever mounting), fire
    // synchronously so consumers still get the contract.
    rootContext.notifyOpenComplete(isOpen)
    return
  }
  const handler = (event: Event) => {
    if (event.target !== el)
      return
    clearOpenCompleteListener()
    rootContext.notifyOpenComplete(isOpen)
  }
  el.addEventListener('transitionend', handler)
  el.addEventListener('animationend', handler)
  openCompleteCleanup = () => {
    el.removeEventListener('transitionend', handler)
    el.removeEventListener('animationend', handler)
  }
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

// Sync nestedOpenDrawerCount onto the popup CSS var so nested scale effects
// can read it. BaseUI uses a running count, not a boolean.
watch(() => rootContext.nestedOpenDrawerCount.value, (n) => {
  currentElement.value?.style.setProperty(DRAWER_CSS_VARS.nestedDrawers, `${n}`)
})

// Subscribe to the nested swipe progress store: when a CHILD drawer reports
// dismiss-swipe progress, the parent popup reads it and writes the value onto
// its own `--drawer-swipe-progress` CSS var so consumer CSS can animate the
// parent "in reverse" while the child swipes away. Ported from BaseUI
// `DrawerPopup.tsx` (useIsoLayoutEffect subscribing to nestedSwipeProgressStore).
let unsubscribeNestedProgress: (() => void) | undefined

onMounted(() => {
  rootContext.contentElement.value = currentElement.value
  rootContext.notifyParentHasNestedDrawer?.(true)

  // Initial nested-drawer count
  currentElement.value?.style.setProperty(
    DRAWER_CSS_VARS.nestedDrawers,
    `${rootContext.nestedOpenDrawerCount.value}`,
  )

  unsubscribeNestedProgress = rootContext.nestedSwipeProgressStore.subscribe(() => {
    const progress = rootContext.nestedSwipeProgressStore.getSnapshot()
    currentElement.value?.style.setProperty(DRAWER_CSS_VARS.swipeProgress, `${progress}`)
  })
})

onUnmounted(() => {
  rootContext.notifyParentHasNestedDrawer?.(false)
  unsubscribeNestedProgress?.()
  clearOpenCompleteListener()
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
      @escape-key-down="onEscapeKeyDown"
      @focus-outside="onFocusOutside"
      @interact-outside="onInteractOutside"
      @pointer-down-outside="onPointerDownOutside"
    >
      <slot />
    </DismissableLayer>
  </FocusScope>
</template>
