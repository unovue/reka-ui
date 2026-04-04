import type { MaybeRef, Ref } from 'vue'
import type { SwipeDirection } from '../utils'
import { useEventListener } from '@vueuse/core'
import { onUnmounted, ref, toValue, watch } from 'vue'
import { getDisplacement, getElementTransform } from '../utils'

export interface SwipeProgressDetails {
  deltaX: number
  deltaY: number
  direction: SwipeDirection | undefined
}

export interface UseSwipeDismissOptions {
  enabled: MaybeRef<boolean>
  elementRef: Ref<HTMLElement | null | undefined>
  directions: SwipeDirection[]
  movementCssVars: { x: string, y: string }
  swipeThreshold?: number | ((opts: { element: HTMLElement, direction: SwipeDirection }) => number)
  ignoreScrollableAncestors?: boolean
  canStart?: () => boolean
  onDismiss?: () => void
  onProgress?: (progress: number, details?: SwipeProgressDetails) => void
  onCancel?: () => void
  onSwipeStart?: () => void
  onRelease?: (velocity: { x: number, y: number }) => void
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

  const hasVertical = directions.includes('up') || directions.includes('down')
  const hasHorizontal = directions.includes('left') || directions.includes('right')

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
    el.style.setProperty(movementCssVars.x, `${x}`)
    el.style.setProperty(movementCssVars.y, `${y}`)
  }

  function clearCssVars(el: HTMLElement) {
    el.style.setProperty(movementCssVars.x, '0')
    el.style.setProperty(movementCssVars.y, '0')
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

  function processMove(el: HTMLElement, pos: { x: number, y: number }, time: number) {
    const rawDx = pos.x - dragStartPos.x
    const rawDy = pos.y - dragStartPos.y

    // Determine direction lock on first move
    if (isFirstMove) {
      isFirstMove = false
      const absX = Math.abs(rawDx)
      const absY = Math.abs(rawDy)
      if (hasVertical && hasHorizontal) {
        lockedAxis = absX > absY ? 'horizontal' : 'vertical'
      }
      else if (hasVertical) {
        lockedAxis = 'vertical'
      }
      else {
        lockedAxis = 'horizontal'
      }
    }

    const dx = lockedAxis === 'vertical' ? 0 : rawDx
    const dy = lockedAxis === 'horizontal' ? 0 : rawDy

    const dir: SwipeDirection | undefined = directions.find(d => getDisplacement(d, dx, dy) > 0)

    if (pendingSwipe && pendingSwipeStartPos) {
      const pending = getDisplacement(
        dir ?? directions[0],
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

    const displacement = getDisplacement(intendedDirection ?? directions[0], dx, dy)

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

    // Apply damping when overshooting (moving against dismiss direction)
    const overshoot = Math.max(0, -displacement)
    const dampedDisplacement = overshoot > 0
      ? -Math.sqrt(overshoot)
      : displacement

    const offsetX = (intendedDirection === 'left' || intendedDirection === 'right')
      ? dampedDisplacement
      : 0
    const offsetY = (intendedDirection === 'up' || intendedDirection === 'down')
      ? dampedDisplacement
      : 0

    dragOffset.value = { x: offsetX, y: offsetY }
    setCssVars(el, offsetX, offsetY)
    recordSample({ x: offsetX, y: offsetY }, time)

    // Progress: 0 = closed/start, 1 = fully dismissed
    const currentEl = elementRef.value
    if (currentEl) {
      const dim = (intendedDirection === 'up' || intendedDirection === 'down')
        ? elementSize.height || currentEl.offsetHeight
        : elementSize.width || currentEl.offsetWidth
      const threshold = getThreshold(currentEl, intendedDirection ?? directions[0])
      const p = Math.min(1, Math.max(0, displacement / (dim + threshold)))
      if (p !== swipeProgress) {
        swipeProgress = p
        onProgress?.(p, { deltaX: dx, deltaY: dy, direction: intendedDirection })
      }
    }
  }

  function finishSwipe(el: HTMLElement) {
    if (!isSwiping.value) {
      reset()
      return
    }

    const displacement = getDisplacement(
      intendedDirection ?? directions[0],
      dragOffset.value.x,
      dragOffset.value.y,
    )
    const threshold = getThreshold(el, intendedDirection ?? directions[0])

    const now = performance.now()
    const velAge = lastDragSample ? now - lastDragSample.time : Infinity
    const velocity = velAge > MAX_RELEASE_VELOCITY_AGE_MS ? { x: 0, y: 0 } : lastVelocity

    onRelease?.(velocity)

    const velInDirection = getDisplacement(
      intendedDirection ?? directions[0],
      velocity.x,
      velocity.y,
    )
    const shouldDismiss = !cancelledSwipe
      && (displacement >= threshold || velInDirection > 0.3)

    clearCssVars(el)

    if (shouldDismiss) {
      onDismiss?.()
    }
    else {
      onCancel?.()
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
      const axis = hasVertical ? 'vertical' : 'horizontal'
      const scrollable = findScrollableAncestor(target, axis)
      if (scrollable)
        swipeFromScrollable = true
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

    if (swipeFromScrollable && pendingSwipe) {
      const dx = pos.x - dragStartPos.x
      const dy = pos.y - dragStartPos.y
      const scrollDir = hasVertical && Math.abs(dy) > Math.abs(dx) ? 'vertical' : 'horizontal'
      if (
        (scrollDir === 'vertical' && hasVertical)
        || (scrollDir === 'horizontal' && hasHorizontal)
      ) {
        reset()
        return
      }
    }

    if (isSwiping.value)
      e.preventDefault()

    processMove(el, pos, e.timeStamp)
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
