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
import { computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { DismissableLayer } from '@/DismissableLayer'
import { FocusScope } from '@/FocusScope'
import { focus } from '@/FocusScope/utils'
import { isHTMLElement, useContentId, useContentMounted, useForwardExpose } from '@/shared'
import { useDrawerSnapPoints } from './composables/useDrawerSnapPoints'
import { useSwipeDismiss } from './composables/useSwipeDismiss'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { computeSwipeReleaseScalar, DRAWER_CSS_VARS, getDisplacement, onAnimationsFinished, registerDrawerCssProperties } from './utils'

const props = withDefaults(defineProps<DrawerContentImplProps>(), {
  initialFocus: true,
  finalFocus: true,
})
const emits = defineEmits<DrawerContentImplEmits>()

const rootContext = injectDrawerRootContext()
const { forwardRef, currentElement } = useForwardExpose()
useContentId(rootContext, currentElement)
useContentMounted(rootContext, currentElement)

registerDrawerCssProperties()

// Snap points
const { activeSnapPointOffset, snapToNearest } = useDrawerSnapPoints({
  snapPoints: rootContext.snapPoints,
  activeSnapPoint: rootContext.activeSnapPoint,
  popupHeight: rootContext.popupHeight,
  viewportRef: currentElement,
  onSnapPointChange: (point) => {
    if (point === null)
      rootContext.onOpenChange(false, 'swipe')
    else
      rootContext.setActiveSnapPoint(point)
  },
})

// Write the active snap offset to the popup's inline style. Called both via a
// watcher (for live updates as the snap point or popup height changes) and
// explicitly from onMounted (to set the initial value — a lazy watcher would
// only fire on CHANGE, which may never happen on a reopen where popupHeight
// is already measured from a previous open and activeSnapPoint is unchanged).
//
// BaseUI parity: snap points are applied purely via a translate using
// --drawer-snap-point-offset. The popup's height is independent (consumers
// should set max-height: 100dvh or similar and let the transform slide the
// popup visually).
function writeSnapPointOffset() {
  const el = currentElement.value
  if (!el)
    return
  const offset = activeSnapPointOffset.value
  if (offset != null) {
    const dir = rootContext.swipeDirection.value
    const signedOffset = (dir === 'up' || dir === 'left') ? -offset : offset
    el.style.setProperty(DRAWER_CSS_VARS.snapPointOffset, `${signedOffset}px`)
  }
  else {
    el.style.setProperty(DRAWER_CSS_VARS.snapPointOffset, '0px')
  }
}

watch(activeSnapPointOffset, writeSnapPointOffset)

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

// Report the frontmost height up the stack: this drawer's own height, or the
// one its own nested drawer reported. Report 0 once it closes or unmounts, so
// the parent falls back to its own height.
//
// The 0 is reported once, when this drawer stops being open. A sibling may
// open while this one is still animating out, and a second 0 from here
// would discard the height that sibling reported.
let isReportingFrontmostHeight = false
function releaseFrontmostHeight() {
  if (!isReportingFrontmostHeight)
    return
  isReportingFrontmostHeight = false
  rootContext.notifyParentFrontmostHeight?.(0)
}
watch(
  [() => rootContext.open.value, () => rootContext.frontmostHeight.value],
  ([isOpen, frontmostHeight]) => {
    if (!isOpen) {
      releaseFrontmostHeight()
      return
    }
    isReportingFrontmostHeight = true
    rootContext.notifyParentFrontmostHeight?.(frontmostHeight)
  },
  { immediate: true },
)

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
const { isSwiping, dragOffset, restore: restoreSwipe } = useSwipeDismiss({
  enabled: computed(() => rootContext.open.value),
  elementRef: currentElement,
  directions: swipeDirections,
  movementCssVars: {
    x: DRAWER_CSS_VARS.swipeMovementX,
    y: DRAWER_CSS_VARS.swipeMovementY,
  },
  ignoreSelectorWhenTouch: false,
  canStart: () => !rootContext.nestedSwiping.value,
  onDismiss() {
    // With snap points, onRelease handles snapping
    if (hasSnapPoints.value)
      return
    if (!rootContext.onOpenChange(false, 'swipe'))
      return false
    // BaseUI parity: a controlled parent may ignore `update:open`. Its `open`
    // prop settles by the next tick; if it is still open, undo the dismissal.
    nextTick(() => {
      if (rootContext.open.value)
        restoreSwipe()
    })
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

      // Sequencing matters for smooth drag-to-next-snap animation.
      //
      // After snapToNearest, activeSnapPoint has updated synchronously (Vue
      // refs are synchronous) but the `watch(activeSnapPointOffset, ...)`
      // runs on the next microtask. If we cleared --drawer-swipe-movement-y
      // first, the transform would visually jump from the drag position
      // (e.g. translateY(50)) back to the OLD snap offset (translateY(400))
      // for a single frame, then the watch would fire and CSS would
      // transition from 400 down to the new snap offset (translateY(0)) —
      // the user sees a snap-back-then-animate instead of a continuous
      // motion from their finger to the new snap.
      //
      // Fix: write the new snap offset CSS var synchronously FIRST (via
      // writeSnapPointOffset, which reads activeSnapPointOffset.value — the
      // computed recalculates on access), then clear the movement vars.
      // Both writes happen in the same animation frame, and the CSS
      // transition on `transform` smoothly interpolates from the current
      // rendered transform (drag position) to the new snap target.
      if (el) {
        writeSnapPointOffset()
        el.style.setProperty(DRAWER_CSS_VARS.swipeMovementX, '0px')
        el.style.setProperty(DRAWER_CSS_VARS.swipeMovementY, '0px')
      }
    }

    // For snap-point drawers, this callback fully decides the open/close +
    // transform outcome above, so tell finishSwipe to skip its own
    // dismiss-vs-cancel branch.
    return hasSnapPoints.value
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

function onMountAutoFocus(event: Event) {
  emits('openAutoFocus', event)
  if (event.defaultPrevented)
    return
  if (props.initialFocus === false) {
    event.preventDefault()
  }
  else if (isHTMLElement(props.initialFocus)) {
    event.preventDefault()
    focus(props.initialFocus, { select: true })
  }
}

// --- update:openComplete wiring ---
// `update:openComplete` tells consumers the drawer has settled: every
// animation and transition running on the popup has finished, or there was
// none to wait for. A change of `open` drops the wait in progress, so an
// opening that is interrupted by a close (or the reverse) reports nothing.
let cancelOpenCompleteWait: (() => void) | undefined
// Whether a close has started and has not been reported yet.
let isClosePending = false

function completeOpenChange(isOpen: boolean) {
  cancelOpenCompleteWait = undefined
  isClosePending = false
  rootContext.notifyOpenComplete(isOpen)
}

function waitForOpenComplete(isOpen: boolean) {
  cancelOpenCompleteWait?.()
  cancelOpenCompleteWait = undefined
  isClosePending = !isOpen
  const el = currentElement.value
  if (el)
    cancelOpenCompleteWait = onAnimationsFinished(el, () => completeOpenChange(isOpen))
}

watch(() => rootContext.open.value, waitForOpenComplete)

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

let registeredElement: HTMLElement | undefined

onMounted(() => {
  registeredElement = currentElement.value
  rootContext.contentElement.value = registeredElement
  rootContext.notifyParentHasNestedDrawer?.(true)

  // The content mounts already open, so the `open` watcher above never sees
  // the opening and the enter animation has to be waited for here.
  if (rootContext.open.value)
    waitForOpenComplete(true)

  // Initial frontmost height. Required on reopen, when the height is already
  // known from a previous open and the lazy watcher would never fire.
  if (rootContext.frontmostHeight.value > 0) {
    currentElement.value?.style.setProperty(
      DRAWER_CSS_VARS.frontmostHeight,
      `${rootContext.frontmostHeight.value}px`,
    )
  }

  // Initial nested-drawer count
  currentElement.value?.style.setProperty(
    DRAWER_CSS_VARS.nestedDrawers,
    `${rootContext.nestedOpenDrawerCount.value}`,
  )

  // Initial snap-point offset. Required on reopen when popupHeight is already
  // measured and activeSnapPoint is unchanged — the lazy watcher would never
  // fire and the drawer would render at offset 0 (appearing as snap=1.0).
  writeSnapPointOffset()

  unsubscribeNestedProgress = rootContext.nestedSwipeProgressStore.subscribe(() => {
    const progress = rootContext.nestedSwipeProgressStore.getSnapshot()
    currentElement.value?.style.setProperty(DRAWER_CSS_VARS.swipeProgress, `${progress}`)
  })
})

onUnmounted(() => {
  // Release the element so the root, which stays mounted, does not keep it after close.
  if (rootContext.contentElement.value === registeredElement)
    rootContext.contentElement.value = undefined
  registeredElement = undefined
  rootContext.notifyParentHasNestedDrawer?.(false)
  releaseFrontmostHeight()
  unsubscribeNestedProgress?.()
  cancelOpenCompleteWait?.()
  // The content left before its close was reported, which is what happens
  // whenever it unmounts at the end of the exit animation: the close is complete.
  if (isClosePending && !rootContext.open.value)
    completeOpenChange(false)
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
    @mount-auto-focus="onMountAutoFocus"
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
