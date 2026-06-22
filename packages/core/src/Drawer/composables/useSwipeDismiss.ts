import type { MaybeRef, Ref } from 'vue'
import type { SwipeDirection } from '../utils'
import { useEventListener } from '@vueuse/core'
import { computed, onUnmounted, ref, toValue, watch } from 'vue'
import { getDisplacement, getElementTransform } from '../utils'

export interface SwipeProgressDetails {
  deltaX: number
  deltaY: number
  direction: SwipeDirection | undefined
}

export interface UseSwipeDismissOptions {
  enabled: MaybeRef<boolean>
  elementRef: Ref<HTMLElement | null | undefined>
  directions: MaybeRef<SwipeDirection[]>
  movementCssVars: { x: string, y: string }
  swipeThreshold?: number | ((opts: { element: HTMLElement, direction: SwipeDirection }) => number)
  ignoreScrollableAncestors?: boolean
  canStart?: () => boolean
  onDismiss?: () => void
  onProgress?: (progress: number, details?: SwipeProgressDetails) => void
  onCancel?: () => void
  onSwipeStart?: () => void
  /**
   * Fired on release with the measured velocity vector. Return `true` to signal
   * that the callback fully owns the open/close + transform outcome (e.g. the
   * snap-point release math), so `finishSwipe` skips its own dismiss-vs-cancel
   * decision (no `data-swipe-dismissed`, no `onDismiss`/`onCancel`).
   */
  onRelease?: (velocity: { x: number, y: number }) => boolean | void
  onSwipingChange?: (swiping: boolean) => void
}

const DEFAULT_SWIPE_THRESHOLD = 40
const REVERSE_CANCEL_THRESHOLD = 10
const MIN_DRAG_THRESHOLD = 1
const MIN_RELEASE_VELOCITY_DURATION_MS = 16
const MAX_RELEASE_VELOCITY_AGE_MS = 80
const DEFAULT_IGNORE_SELECTOR = 'button,a,input,select,textarea,label,[role="button"]'

function findScrollableAncestor(
  el: Element | null,
  axis: 'vertical' | 'horizontal',
): HTMLElement | null {
  if (!el || el === document.body)
    return null
  const style = window.getComputedStyle(el as HTMLElement)
  const overflow = axis === 'vertical'
    ? style.overflowY
    : style.overflowX
  if (
    (overflow === 'auto' || overflow === 'scroll')
    && (axis === 'vertical'
      ? (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight
      : (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth)
  ) {
    return el as HTMLElement
  }
  return findScrollableAncestor(el.parentElement, axis)
}

/**
 * Returns whether the user can start a swipe dismiss from a scrollable element
 * based on the scroll position and drag direction.
 * Ported from BaseUI `useSwipeDismiss.ts:canSwipeFromScrollEdgeOnPendingMove`.
 *
 * Returns:
 *   true  → swipe is allowed (scroll is at the relevant edge)
 *   false → swipe is blocked (user is scrolling, not dismissing)
 *   null  → the drag is not along a recognized axis; caller should fall through
 */
function canSwipeFromScrollEdge(
  scrollTarget: HTMLElement,
  deltaX: number,
  deltaY: number,
  flags: { hasVertical: boolean, hasHorizontal: boolean, allowUp: boolean, allowDown: boolean, allowLeft: boolean, allowRight: boolean },
): boolean | null {
  const absDx = Math.abs(deltaX)
  const absDy = Math.abs(deltaY)
  const useVerticalAxis
    = flags.hasVertical && deltaY !== 0 && (!flags.hasHorizontal || absDy >= absDx)

  if (useVerticalAxis) {
    const maxScrollTop = Math.max(0, scrollTarget.scrollHeight - scrollTarget.clientHeight)
    const atTop = scrollTarget.scrollTop <= 0
    const atBottom = scrollTarget.scrollTop >= maxScrollTop
    const movingDown = deltaY > 0
    const movingUp = deltaY < 0
    // A 'down'-dismiss drawer starts dismiss on a downward pull from the top.
    // An 'up'-dismiss drawer starts dismiss on an upward pull from the bottom.
    const canSwipeDown = movingDown && atTop && flags.allowDown
    const canSwipeUp = movingUp && atBottom && flags.allowUp
    return canSwipeDown || canSwipeUp
  }

  const useHorizontalAxis
    = flags.hasHorizontal && deltaX !== 0 && (!flags.hasVertical || absDx > absDy)
  if (useHorizontalAxis) {
    const maxScrollLeft = Math.max(0, scrollTarget.scrollWidth - scrollTarget.clientWidth)
    const atLeft = scrollTarget.scrollLeft <= 0
    const atRight = scrollTarget.scrollLeft >= maxScrollLeft
    const movingRight = deltaX > 0
    const movingLeft = deltaX < 0
    const canSwipeRight = movingRight && atLeft && flags.allowRight
    const canSwipeLeft = movingLeft && atRight && flags.allowLeft
    return canSwipeRight || canSwipeLeft
  }
  return null
}

export function useSwipeDismiss(options: UseSwipeDismissOptions) {
  const {
    elementRef,
    directions,
    movementCssVars,
    swipeThreshold: swipeThresholdProp,
    canStart,
    onDismiss,
    onProgress,
    onCancel,
    onSwipeStart,
    onRelease,
    onSwipingChange,
  } = options

  const hasVertical = computed(() => toValue(directions).includes('up') || toValue(directions).includes('down'))
  const hasHorizontal = computed(() => toValue(directions).includes('left') || toValue(directions).includes('right'))
  const allowUp = computed(() => toValue(directions).includes('up'))
  const allowDown = computed(() => toValue(directions).includes('down'))
  const allowLeft = computed(() => toValue(directions).includes('left'))
  const allowRight = computed(() => toValue(directions).includes('right'))

  const isSwiping = ref(false)
  const swipeDirection = ref<SwipeDirection | undefined>(undefined)
  const dragOffset = ref({ x: 0, y: 0 })

  // Internal state (not reactive -- use plain vars for perf)
  let dragStartPos = { x: 0, y: 0 }
  let intendedDirection: SwipeDirection | undefined
  let maxDisplacement = 0
  let cancelledSwipe = false
  let isFirstMove = false
  let pendingSwipe = false
  let pendingSwipeStartPos: { x: number, y: number } | null = null
  let swipeFromScrollable = false
  let scrollableAncestor: HTMLElement | null = null
  let elementSize = { width: 0, height: 0 }
  let swipeProgress = 0
  let lastDragSample: { x: number, y: number, time: number } | null = null
  let lastVelocity = { x: 0, y: 0 }
  let lockedAxis: 'horizontal' | 'vertical' | null = null
  let activePointerId: number | null = null
  let pointerStarted = false

  function getThreshold(el: HTMLElement, dir: SwipeDirection): number {
    if (typeof swipeThresholdProp === 'function')
      return Math.max(0, swipeThresholdProp({ element: el, direction: dir }))
    return typeof swipeThresholdProp === 'number' ? swipeThresholdProp : DEFAULT_SWIPE_THRESHOLD
  }

  function setSwiping(next: boolean) {
    if (isSwiping.value === next)
      return
    isSwiping.value = next
    onSwipingChange?.(next)
  }

  function recordSample(offset: { x: number, y: number }, time: number) {
    if (lastDragSample && time > lastDragSample.time) {
      const dt = Math.max(time - lastDragSample.time, MIN_RELEASE_VELOCITY_DURATION_MS)
      lastVelocity = {
        x: (offset.x - lastDragSample.x) / dt,
        y: (offset.y - lastDragSample.y) / dt,
      }
    }
    lastDragSample = { x: offset.x, y: offset.y, time }
  }

  function setCssVars(el: HTMLElement, x: number, y: number) {
    el.style.setProperty(movementCssVars.x, `${x}px`)
    el.style.setProperty(movementCssVars.y, `${y}px`)
  }

  function clearCssVars(el: HTMLElement) {
    el.style.setProperty(movementCssVars.x, '0px')
    el.style.setProperty(movementCssVars.y, '0px')
  }

  function reset() {
    setSwiping(false)
    swipeDirection.value = undefined
    dragOffset.value = { x: 0, y: 0 }
    dragStartPos = { x: 0, y: 0 }
    intendedDirection = undefined
    maxDisplacement = 0
    cancelledSwipe = false
    isFirstMove = false
    pendingSwipe = false
    pendingSwipeStartPos = null
    swipeFromScrollable = false
    scrollableAncestor = null
    elementSize = { width: 0, height: 0 }
    swipeProgress = 0
    lastDragSample = null
    lastVelocity = { x: 0, y: 0 }
    lockedAxis = null
    activePointerId = null
    pointerStarted = false
  }

  function startSwipe(el: HTMLElement, pos: { x: number, y: number }) {
    // Capture the element's current transform so we can account for it
    getElementTransform(el)
    dragStartPos = pos
    pendingSwipeStartPos = pos
    elementSize = { width: el.offsetWidth, height: el.offsetHeight }
    isFirstMove = true
    pendingSwipe = true
  }

  /**
   * Applies sqrt-damping to any axis moving in a disallowed direction.
   * Axes moving in an allowed direction pass through linearly.
   * Ported from BaseUI `useSwipeDismiss.ts:applyDirectionalDamping`.
   */
  function applyDirectionalDamping(deltaX: number, deltaY: number) {
    const exponent = (value: number) => (value >= 0 ? value ** 0.5 : -((Math.abs(value)) ** 0.5))
    const dampAxis = (delta: number, allowNegative: boolean, allowPositive: boolean) => {
      if (!allowNegative && delta < 0)
        return exponent(delta)
      if (!allowPositive && delta > 0)
        return exponent(delta)
      return delta
    }
    const newDx = hasHorizontal.value
      ? dampAxis(deltaX, allowLeft.value, allowRight.value)
      : exponent(deltaX)
    const newDy = hasVertical.value
      ? dampAxis(deltaY, allowUp.value, allowDown.value)
      : exponent(deltaY)
    return { x: newDx, y: newDy }
  }

  function processMove(el: HTMLElement, pos: { x: number, y: number }, time: number) {
    const rawDx = pos.x - dragStartPos.x
    const rawDy = pos.y - dragStartPos.y

    // Determine direction lock on first move
    if (isFirstMove) {
      isFirstMove = false
      const absX = Math.abs(rawDx)
      const absY = Math.abs(rawDy)
      if (hasVertical.value && hasHorizontal.value) {
        lockedAxis = absX > absY ? 'horizontal' : 'vertical'
      }
      else if (hasVertical.value) {
        lockedAxis = 'vertical'
      }
      else {
        lockedAxis = 'horizontal'
      }
    }

    // Axis-locked deltas for direction detection
    const dx = lockedAxis === 'vertical' ? 0 : rawDx
    const dy = lockedAxis === 'horizontal' ? 0 : rawDy

    const dir: SwipeDirection | undefined = toValue(directions).find(d => getDisplacement(d, dx, dy) > 0)

    if (pendingSwipe && pendingSwipeStartPos) {
      // Only promote to an active swipe when we've identified an allowed
      // direction. If the user is dragging against the dismiss direction
      // (dir === undefined), bail out so we don't steal scroll/drag from
      // one-direction drawers.
      if (!dir)
        return
      const pending = getDisplacement(
        dir,
        pos.x - pendingSwipeStartPos.x,
        pos.y - pendingSwipeStartPos.y,
      )
      if (Math.abs(pending) < MIN_DRAG_THRESHOLD)
        return
      pendingSwipe = false
      intendedDirection = dir
      swipeDirection.value = dir
      setSwiping(true)
      onSwipeStart?.()
    }

    if (!isSwiping.value)
      return

    const currentDir = intendedDirection ?? toValue(directions)[0]
    const displacement = getDisplacement(currentDir, dx, dy)

    // Detect reversal (cancel swipe)
    if (!cancelledSwipe) {
      maxDisplacement = Math.max(maxDisplacement, displacement)
      if (
        maxDisplacement > DEFAULT_SWIPE_THRESHOLD / 2
        && maxDisplacement - displacement > REVERSE_CANCEL_THRESHOLD
      ) {
        cancelledSwipe = true
      }
    }

    // Apply directional damping to raw deltas (BaseUI parity).
    // Allowed-direction axes pass through linearly; disallowed directions
    // sqrt-damp. No manual single-axis sign reconstruction.
    const damped = applyDirectionalDamping(dx, dy)

    dragOffset.value = { x: damped.x, y: damped.y }
    setCssVars(el, damped.x, damped.y)
    recordSample({ x: damped.x, y: damped.y }, time)

    // Progress: 0 = closed/start, 1 = fully dismissed
    const currentEl = elementRef.value
    if (currentEl) {
      const dim = (currentDir === 'up' || currentDir === 'down')
        ? elementSize.height || currentEl.offsetHeight
        : elementSize.width || currentEl.offsetWidth
      const threshold = getThreshold(currentEl, currentDir)
      const p = Math.min(1, Math.max(0, displacement / (dim + threshold)))
      if (p !== swipeProgress) {
        swipeProgress = p
        onProgress?.(p, { deltaX: damped.x, deltaY: damped.y, direction: currentDir })
      }
    }
  }

  function finishSwipe(el: HTMLElement) {
    if (!isSwiping.value) {
      reset()
      return
    }

    const displacement = getDisplacement(
      intendedDirection ?? toValue(directions)[0],
      dragOffset.value.x,
      dragOffset.value.y,
    )
    const threshold = getThreshold(el, intendedDirection ?? toValue(directions)[0])

    const now = performance.now()
    const velAge = lastDragSample ? now - lastDragSample.time : Infinity
    const velocity = velAge > MAX_RELEASE_VELOCITY_AGE_MS ? { x: 0, y: 0 } : lastVelocity

    // When onRelease returns true (snap-point release), it owns the open/close
    // and transform outcome — don't run the dismiss-vs-cancel branch, which
    // would otherwise set a stray `data-swipe-dismissed` on a drawer that
    // actually snapped to a point, or clear CSS vars onRelease already wrote.
    const releaseHandled = onRelease?.(velocity) === true

    if (!releaseHandled) {
      const velInDirection = getDisplacement(
        intendedDirection ?? toValue(directions)[0],
        velocity.x,
        velocity.y,
      )
      const shouldDismiss = !cancelledSwipe
        && (displacement >= threshold || velInDirection > 0.3)

      if (shouldDismiss) {
        // BaseUI parity: on dismiss, keep the drag transform in place so the
        // close animation runs smoothly from the dragged position. Clearing the
        // CSS vars here would cause a one-frame snap-back to resting before the
        // closing transition begins (visible as a flicker).
        el.setAttribute('data-swipe-dismissed', '')
        onDismiss?.()
      }
      else {
        // On cancel, reset the drag transform so the drawer animates back to rest.
        clearCssVars(el)
        onCancel?.()
      }
    }

    reset()
  }

  // -- Pointer Events (mouse + pen) --

  function onPointerDown(e: PointerEvent) {
    if (!toValue(options.enabled))
      return
    if (e.pointerType === 'touch')
      return // handled by touch events
    if (e.button !== 0)
      return
    if (canStart && !canStart())
      return

    const target = e.target as HTMLElement
    if (target?.closest(DEFAULT_IGNORE_SELECTOR))
      return

    const el = elementRef.value
    if (!el)
      return

    startSwipe(el, { x: e.clientX, y: e.clientY })
    activePointerId = e.pointerId
    pointerStarted = true
    try {
      el.setPointerCapture(e.pointerId)
    }
    catch {}
  }

  function onPointerMove(e: PointerEvent) {
    if (!pointerStarted || e.pointerId !== activePointerId)
      return
    const el = elementRef.value
    if (!el)
      return
    if ((e.buttons & 1) === 0)
      return
    processMove(el, { x: e.clientX, y: e.clientY }, e.timeStamp)
  }

  function onPointerUp(e: PointerEvent) {
    if (!pointerStarted || e.pointerId !== activePointerId)
      return
    const el = elementRef.value
    if (!el)
      return
    finishSwipe(el)
  }

  // -- Touch Events (mobile) --

  function onTouchStart(e: TouchEvent) {
    if (!toValue(options.enabled))
      return
    if (canStart && !canStart())
      return

    const target = e.target as HTMLElement
    if (target?.closest(DEFAULT_IGNORE_SELECTOR))
      return

    const el = elementRef.value
    if (!el)
      return

    if (!options.ignoreScrollableAncestors) {
      const axis = hasVertical.value ? 'vertical' : 'horizontal'
      const scrollable = findScrollableAncestor(target, axis)
      if (scrollable) {
        swipeFromScrollable = true
        scrollableAncestor = scrollable
      }
    }

    const t = e.touches[0]
    if (!t)
      return
    startSwipe(el, { x: t.clientX, y: t.clientY })
  }

  function onTouchMove(e: TouchEvent) {
    const el = elementRef.value
    if (!el || (!pendingSwipe && !isSwiping.value))
      return

    const t = e.touches[0]
    if (!t)
      return

    const pos = { x: t.clientX, y: t.clientY }

    if (swipeFromScrollable && pendingSwipe && scrollableAncestor) {
      const dx = pos.x - dragStartPos.x
      const dy = pos.y - dragStartPos.y
      // BaseUI-style scroll-edge allowance: only cancel if the user is genuinely
      // scrolling (not at the edge in the dismiss direction). If they are at the
      // relevant edge, let the swipe proceed.
      const allowed = canSwipeFromScrollEdge(scrollableAncestor, dx, dy, {
        hasVertical: hasVertical.value,
        hasHorizontal: hasHorizontal.value,
        allowUp: allowUp.value,
        allowDown: allowDown.value,
        allowLeft: allowLeft.value,
        allowRight: allowRight.value,
      })
      if (allowed === false) {
        reset()
        return
      }
      if (allowed === true) {
        // Scroll edge reached in the swipe direction → clear the guard so
        // subsequent moves go through the normal swipe path.
        swipeFromScrollable = false
        scrollableAncestor = null
      }
      // allowed === null → axis unclear, fall through to processMove which
      // will lock the axis and retry the decision on the next frame.
    }

    // Capture swiping state BEFORE processMove — that function is what sets
    // isSwiping.value = true on the move that crosses the drag threshold, so
    // we need to preventDefault on that same event (not the next one) to avoid
    // a visible scroll hitch on the first frame of the gesture on mobile.
    const wasSwiping = isSwiping.value
    processMove(el, pos, e.timeStamp)
    if (wasSwiping || isSwiping.value)
      e.preventDefault()
  }

  function onTouchEnd() {
    const el = elementRef.value
    if (!el)
      return
    finishSwipe(el)
  }

  // -- Attach listeners --

  const cleanups: Array<() => void> = []

  watch(
    () => elementRef.value,
    (el) => {
      cleanups.forEach(fn => fn())
      cleanups.length = 0

      if (!el)
        return

      cleanups.push(
        useEventListener(el, 'pointerdown', onPointerDown as EventListener),
        useEventListener(el, 'pointermove', onPointerMove as EventListener),
        useEventListener(el, 'pointerup', onPointerUp as EventListener),
        useEventListener(el, 'pointercancel', onPointerUp as EventListener),
        useEventListener(el, 'touchstart', onTouchStart as EventListener, { passive: true }),
        useEventListener(el, 'touchmove', onTouchMove as EventListener, { passive: false }),
        useEventListener(el, 'touchend', onTouchEnd as EventListener),
        useEventListener(el, 'touchcancel', onTouchEnd as EventListener),
      )
    },
    { immediate: true },
  )

  onUnmounted(() => {
    cleanups.forEach(fn => fn())
    cleanups.length = 0
    reset()
  })

  return {
    isSwiping,
    swipeDirection,
    dragOffset,
  }
}
