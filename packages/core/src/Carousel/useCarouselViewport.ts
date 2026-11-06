import type { Ref } from 'vue'
import type { CarouselRootContext } from './CarouselRoot.vue'
import type { CarouselChangeReason } from './useCarousel'
import type { CarouselItemRect, CarouselSnap } from './utils'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { areEqual, getOwnerDocument, getOwnerWindow } from '@/shared'
import { compareDocumentOrder } from '@/shared/documentOrder'
import {
  compactStyle,
  computeSnaps,
  getItemsInView,
  getItemSnapStyles,
  getLoopOrder,
  getNearestSnapIndex,
  getSnapsByPosition,
  getUnrotatedRects,
} from './utils'

/** Travel before a mouse or pen press becomes a drag. */
const DRAG_START_DISTANCE = 3
/** Travel after which the click that ends a drag is swallowed. */
const DRAG_CLICK_THRESHOLD = 10
/** Travel or speed (px/ms) a swipe in `fade` mode needs to change slides. */
const SWIPE_DISTANCE = 40
const SWIPE_VELOCITY = 0.3
/** How far ahead (ms) a released drag projects its velocity to pick a snap. */
const RELEASE_PROJECTION = 120
/** Velocity samples older than this (ms) are ignored on release. */
const VELOCITY_WINDOW = 80
/** Per-millisecond velocity decay of `dragFree` momentum. */
const MOMENTUM_DECAY = 0.996
/** Accumulated wheel delta that pages once, and the quiet time (ms) that ends a wheel gesture. */
const WHEEL_PAGE_DELTA = 30
const WHEEL_GESTURE_GAP = 180
/** Fallback for engines without `scrollend`. */
const SCROLL_END_DELAY = 120

function sameValues<T>(a: T[] | undefined, b: T[] | undefined) {
  return !!a && !!b && areEqual(a, b)
}

function sameSnaps(a: CarouselSnap[] | undefined, b: CarouselSnap[]) {
  return !!a && a.length === b.length && a.every((snap, i) => Math.abs(snap.position - b[i].position) < 0.5 && sameValues(snap.items, b[i].items))
}

/**
 * The carousel's scrolling: measures the track into snaps, keeps the native
 * scroll position and the current snap in sync both ways, and adds what a
 * native scroller lacks: mouse and pen dragging, wheel paging, arrow keys,
 * looping, `dragFree` momentum, `fade` swipes, `autoHeight` and `autoScroll`.
 *
 * The viewport is a real `overflow` scroller with CSS scroll snapping, so
 * touch, trackpad and focus scrolling already work before hydration.
 *
 * Returns the attributes to bind on the viewport element.
 *
 * @lifecycle setup
 */
export function useCarouselViewport(context: CarouselRootContext, element: Ref<HTMLElement | null | undefined>) {
  const vertical = computed(() => context.orientation.value === 'vertical')
  const rtl = computed(() => !vertical.value && context.dir.value === 'rtl')
  const fade = computed(() => context.options.value.fade)

  const snapSuspended = ref(false)
  const autoHeight = ref<number>()
  let rects: CarouselItemRect[] = []
  let programmaticTarget: number | undefined
  let inputReason: CarouselChangeReason = 'scroll'
  let rotating = false
  // Mouse and pen drag. Touch scrolls natively, except in `fade` mode where every pointer swipes.
  interface DragState {
    pointerId: number
    pointerType: string
    x: number
    y: number
    scroll: number
    index: number
    started: boolean
    distance: number
    /** When the press started, for the speed of a `fade` swipe. */
    time: number
    /** The last event of the pointer, to end the drag from when its release never arrives. */
    last: PointerEvent
    samples: { time: number, position: number }[]
    cleanup: () => void
  }

  let dragState: DragState | undefined
  let momentumFrame = 0
  // Continuous `autoScroll`.
  const autoScrollRunning = computed(() => !!context.autoScroll.value
    && context.playing.value
    && context.mounted.value
    && !context.paused.value
    && !context.dragging.value
    && context.measured.value)

  // Logical scroll coordinates: 0 at the start edge, growing towards the end, in both directions.
  function getScroll(el = element.value) {
    if (!el)
      return 0
    if (vertical.value)
      return el.scrollTop
    return rtl.value ? -el.scrollLeft : el.scrollLeft
  }
  function setScroll(position: number, behavior: ScrollBehavior) {
    const el = element.value
    if (!el)
      return
    const physical = rtl.value ? -position : position
    const options: ScrollToOptions = vertical.value ? { top: physical, behavior } : { left: physical, behavior }
    if (typeof el.scrollTo === 'function')
      el.scrollTo(options)
    else if (vertical.value)
      el.scrollTop = physical
    else
      el.scrollLeft = physical
  }
  function getViewportSize(el: HTMLElement) {
    return vertical.value ? el.clientHeight : el.clientWidth
  }
  function getScrollSize(el: HTMLElement) {
    return vertical.value ? el.scrollHeight : el.scrollWidth
  }
  function measureItem(el: HTMLElement, item: HTMLElement): CarouselItemRect {
    const viewport = el.getBoundingClientRect()
    const rect = item.getBoundingClientRect()
    const scroll = getScroll(el)
    if (vertical.value)
      return { start: rect.top - viewport.top - el.clientTop + scroll, size: rect.height }
    if (rtl.value)
      return { start: viewport.left + el.clientLeft + el.clientWidth - rect.right + scroll, size: rect.width }
    return { start: rect.left - viewport.left - el.clientLeft + scroll, size: rect.width }
  }

  function setScrollSnapSuspended(value: boolean) {
    snapSuspended.value = value
    // Applied right away: a mandatory snap would pull the very next scroll write back.
    const el = element.value
    if (el)
      el.style.scrollSnapType = scrollSnapType()
  }
  function scrollSnapType() {
    if (fade.value || snapSuspended.value || context.options.value.dragFree)
      return 'none'
    return `${vertical.value ? 'y' : 'x'} mandatory`
  }

  function updateInView() {
    const el = element.value
    if (!el || !context.measured.value)
      return
    const next = getItemsInView(rects, getScroll(el), getViewportSize(el), context.options.value.inViewThreshold)
    if (!sameValues(context.inView.value, next))
      context.inView.value = next
  }

  function updateAutoHeight() {
    if (!context.options.value.autoHeight || vertical.value) {
      autoHeight.value = undefined
      return
    }
    let height = 0
    for (const index of context.activeItems.value) {
      const item = context.items.value[index]
      if (item)
        height = Math.max(height, item.getBoundingClientRect().height)
    }
    autoHeight.value = height || undefined
  }

  function measure() {
    const el = element.value
    if (!el || !context.mounted.value)
      return
    const items = context.items.value
    if (fade.value) {
      context.measuredSnaps.value = undefined
      context.loopFits.value = true
      context.loopOrder.value = undefined
      context.inView.value = undefined
      updateAutoHeight()
      return
    }
    const viewportSize = getViewportSize(el)
    // Not laid out (hidden, or jsdom): keep the unmeasured fallback.
    if (viewportSize <= 0 || !items.length) {
      context.measuredSnaps.value = undefined
      return
    }
    const options = context.options.value
    const spacing = context.spacing.value
    rects = items.map(item => measureItem(el, item))

    const unrotated = getUnrotatedRects(rects)
    const lastRect = unrotated.at(-1)
    const trackSize = lastRect ? lastRect.start + lastRect.size - unrotated[0].start : 0
    const largestItem = Math.max(...rects.map(r => r.size))
    // A loop needs a hidden slide on each side of the view to scroll into.
    const loopFits = items.length > 1 && trackSize - viewportSize >= 2 * largestItem - 1
    const loopActive = options.loop && loopFits
    const base = loopActive ? rects : rects.map(r => ({ start: r.start - spacing.start, size: r.size }))
    const result = computeSnaps({
      items: base,
      baseItems: loopActive ? unrotated : undefined,
      viewportSize,
      maxScroll: getScrollSize(el) - spacing.start - spacing.end - viewportSize,
      align: options.align,
      slidesToScroll: options.slidesToScroll,
      containScroll: options.containScroll,
      loop: loopActive,
    })

    context.loopFits.value = loopFits
    if (!loopActive && context.loopOrder.value) {
      // These rects are the rotated layout: drop the rotation and measure the restored one.
      context.loopOrder.value = undefined
      nextTick(measure)
      return
    }
    const wasMeasured = context.measured.value
    if (result.spacing.start !== spacing.start || result.spacing.end !== spacing.end)
      context.spacing.value = result.spacing
    if (!sameSnaps(context.measuredSnaps.value, result.snaps))
      context.measuredSnaps.value = result.snaps
    const styles = getItemSnapStyles(items.length, result.groups, options.align, loopActive ? unrotated : base, viewportSize)
    if (JSON.stringify(styles) !== JSON.stringify(context.itemStyles.value))
      context.itemStyles.value = styles

    // Fewer snaps after a resize: rest on the last one.
    if (context.modelValue.value >= result.snaps.length)
      context.changeModelValue(result.snaps.length - 1)
    updateInView()
    updateAutoHeight()
    // Laid out for the first time, or again after `display: none` reset the scroll: show the current snap.
    if (!wasMeasured)
      showCurrentSnap()
  }

  let firstLayout = true
  /**
   * Brings the current snap into view on a fresh layout. On the first one, a
   * track the user already scrolled before hydration (the server HTML is a
   * native scroller) keeps its place: the current snap follows it instead.
   */
  function showCurrentSnap() {
    const position = getScroll()
    if (firstLayout) {
      firstLayout = false
      const nearest = getNearestSnapIndex(position, context.snaps.value)
      if (position > 1 && nearest !== context.modelValue.value && context.changeModelValue(nearest, 'scroll')) {
        scrollToSnap(nearest, 'instant')
        rotate()
        return
      }
    }
    scrollToSnap(context.modelValue.value, 'instant')
    rotate()
  }

  function scrollToSnap(index: number, behavior?: ScrollBehavior) {
    const snap = context.snaps.value[index]
    const el = element.value
    if (!snap || !el || !context.measured.value)
      return
    if (Math.abs(snap.position - getScroll(el)) < 1) {
      programmaticTarget = undefined
      if (snapSuspended.value && !autoScrollRunning.value)
        setScrollSnapSuspended(false)
      return
    }
    programmaticTarget = index
    setScroll(snap.position, behavior ?? (context.reducedMotion.value ? 'instant' : 'smooth'))
  }

  /**
   * Keeps the current snap in the middle of a looping track by reordering the
   * items with CSS `order`, then shifts the scroll position by the distance the
   * current item moved, so nothing visibly jumps.
   */
  async function rotate() {
    const el = element.value
    // Never under a running smooth scroll: it would land on a moved item.
    if (!el || rotating || !context.loopActive.value || programmaticTarget !== undefined)
      return
    const group = context.snaps.value[context.modelValue.value]?.items
    if (!group?.length)
      return
    const anchor = group[0]
    const order = getLoopOrder(context.items.value.length, anchor, group.length)
    if (sameValues(context.loopOrder.value, order))
      return
    const anchorItem = context.items.value[anchor]
    rotating = true
    const before = measureItem(el, anchorItem).start - getScroll(el)
    context.loopOrder.value = order
    await nextTick()
    const after = measureItem(el, anchorItem).start - getScroll(el)
    if (Math.abs(after - before) >= 0.5)
      setScroll(getScroll(el) + after - before, 'instant')
    rotating = false
    measure()
  }

  function settle() {
    clearScrollEndTimer()
    programmaticTarget = undefined
    if (snapSuspended.value && !dragState && !momentumFrame && !autoScrollRunning.value)
      setScrollSnapSuspended(false)
    const reason = inputReason
    inputReason = 'scroll'
    if (!context.measured.value || dragState || momentumFrame)
      return
    const nearest = getNearestSnapIndex(getScroll(), context.snaps.value)
    if (nearest !== context.modelValue.value && !context.changeModelValue(nearest, reason))
      scrollToSnap(context.modelValue.value)
    else if (!context.options.value.dragFree && !autoScrollRunning.value && Math.abs(context.snaps.value[nearest].position - getScroll()) >= 1)
      scrollToSnap(nearest)
    rotate()
  }

  let scrollFrame = 0
  let scrollEndTimer: ReturnType<typeof setTimeout> | undefined
  function clearScrollEndTimer() {
    if (scrollEndTimer !== undefined)
      clearTimeout(scrollEndTimer)
    scrollEndTimer = undefined
  }
  function onScroll() {
    const win = getOwnerWindow(element.value)
    if (!('onscrollend' in win)) {
      clearScrollEndTimer()
      scrollEndTimer = setTimeout(settle, SCROLL_END_DELAY)
    }
    if (scrollFrame)
      return
    scrollFrame = win.requestAnimationFrame(() => {
      scrollFrame = 0
      updateInView()
      if (!context.measured.value || dragState || programmaticTarget !== undefined)
        return
      const nearest = getNearestSnapIndex(getScroll(), context.snaps.value)
      if (nearest !== context.modelValue.value)
        context.changeModelValue(nearest, inputReason)
    })
  }

  /** User input takes over from a running programmatic scroll or momentum. */
  function interrupt(reason: CarouselChangeReason) {
    inputReason = reason
    programmaticTarget = undefined
    stopMomentum()
  }

  function stopMomentum() {
    if (momentumFrame)
      getOwnerWindow(element.value).cancelAnimationFrame(momentumFrame)
    momentumFrame = 0
  }

  function getDelta(event: PointerEvent, state: DragState) {
    if (vertical.value)
      return event.clientY - state.y
    return rtl.value ? -(event.clientX - state.x) : event.clientX - state.x
  }
  function getCrossDelta(event: PointerEvent, state: DragState) {
    return vertical.value ? event.clientX - state.x : event.clientY - state.y
  }

  function getReleaseVelocity(state: DragState, now: number) {
    const recent = state.samples.filter(sample => now - sample.time <= VELOCITY_WINDOW)
    if (recent.length < 2)
      return 0
    const first = recent[0]
    const last = recent.at(-1)!
    return last.time === first.time ? 0 : (last.position - first.position) / (last.time - first.time)
  }

  function swallowNextClick(el: HTMLElement) {
    const swallow = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
    }
    el.addEventListener('click', swallow, { capture: true, once: true })
    setTimeout(() => el.removeEventListener('click', swallow, { capture: true }), 0)
  }

  function onPointerdown(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0)
      return
    if (event.pointerType === 'touch') {
      // A finger on the scroller takes over the scroll natively.
      context.reportInteraction()
      interrupt('swipe')
    }
    else {
      // Grabbing the track stops `dragFree` momentum.
      stopMomentum()
    }
    const el = element.value
    if (!el || dragState || !event.isPrimary || event.button !== 0 || !context.options.value.draggable)
      return
    if (!fade.value && event.pointerType === 'touch')
      return
    if (!fade.value && !context.measured.value)
      return

    const doc = getOwnerDocument(el)
    const win = getOwnerWindow(el)
    const move = (e: PointerEvent) => onPointermove(e)
    const up = (e: PointerEvent) => onPointerup(e)
    // A release outside the window (or outside an iframe, in Firefox) can never
    // arrive: losing the capture or the window's focus ends the drag where it is.
    const lost = () => {
      if (dragState)
        onPointerup(dragState.last)
    }
    doc.addEventListener('pointermove', move)
    doc.addEventListener('pointerup', up)
    doc.addEventListener('pointercancel', up)
    el.addEventListener('lostpointercapture', lost)
    win.addEventListener('blur', lost)
    dragState = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      x: event.clientX,
      y: event.clientY,
      scroll: getScroll(el),
      index: context.modelValue.value,
      started: false,
      distance: 0,
      time: event.timeStamp,
      last: event,
      samples: [],
      cleanup: () => {
        doc.removeEventListener('pointermove', move)
        doc.removeEventListener('pointerup', up)
        doc.removeEventListener('pointercancel', up)
        el.removeEventListener('lostpointercapture', lost)
        win.removeEventListener('blur', lost)
      },
    }
  }

  function onPointermove(event: PointerEvent) {
    const state = dragState
    const el = element.value
    if (!state || !el || event.pointerId !== state.pointerId)
      return
    // A mouse or pen moving with no button down was released where we couldn't see it.
    if (event.pointerType !== 'touch' && event.buttons === 0) {
      onPointerup(event)
      return
    }
    state.last = event
    const delta = getDelta(event, state)
    if (!state.started) {
      if (Math.abs(delta) < DRAG_START_DISTANCE)
        return
      // A gesture along the cross axis is the page's (a vertical scroll over a horizontal carousel).
      if (Math.abs(getCrossDelta(event, state)) > Math.abs(delta)) {
        endDrag()
        return
      }
      state.started = true
      context.dragging.value = true
      // A mouse or pen press is only an interaction once it drags: a click on a slide keeps a running scroll and autoplay.
      context.reportInteraction()
      interrupt(state.pointerType === 'touch' ? 'swipe' : 'drag')
      if (!fade.value) {
        setScrollSnapSuspended(true)
        // Any selection the press started before it became a drag.
        getOwnerWindow(el).getSelection()?.removeAllRanges()
        // Captured only now: capturing on press would retarget the click on a link or button in a slide.
        try {
          el.setPointerCapture(event.pointerId)
        }
        catch {
          // An untrusted or already released pointer can't be captured; the document listeners still follow it.
        }
      }
    }
    state.distance = Math.max(state.distance, Math.abs(delta))
    if (fade.value)
      return
    const position = state.scroll - delta
    setScroll(position, 'instant')
    const now = event.timeStamp || performance.now()
    state.samples.push({ time: now, position })
    if (state.samples.length > 20)
      state.samples.shift()
  }

  function endDrag() {
    dragState?.cleanup()
    dragState = undefined
    context.dragging.value = false
  }

  function onPointerup(event: PointerEvent) {
    const state = dragState
    const el = element.value
    if (!state || !el || event.pointerId !== state.pointerId)
      return
    const started = state.started
    const delta = getDelta(event, state)
    endDrag()
    if (!started)
      return
    if (state.distance > DRAG_CLICK_THRESHOLD)
      swallowNextClick(el)
    if (el.hasPointerCapture?.(event.pointerId))
      el.releasePointerCapture(event.pointerId)

    const reason: CarouselChangeReason = state.pointerType === 'touch' ? 'swipe' : 'drag'
    if (fade.value) {
      const elapsed = Math.max(1, event.timeStamp - state.time)
      if (Math.abs(delta) >= SWIPE_DISTANCE || Math.abs(delta) / elapsed >= SWIPE_VELOCITY) {
        if (delta < 0)
          context.scrollNext(reason, event)
        else
          context.scrollPrev(reason, event)
      }
      return
    }

    const velocity = getReleaseVelocity(state, event.timeStamp || performance.now())
    if (context.options.value.dragFree) {
      startMomentum(velocity)
      return
    }
    const snaps = context.snaps.value
    const projected = getScroll(el) + velocity * RELEASE_PROJECTION
    let target = getNearestSnapIndex(projected, snaps)
    if (!context.options.value.skipSnaps) {
      // One gesture moves one snap at most, in visual order (a rotated loop's indices wrap).
      const order = getSnapsByPosition(snaps)
      const from = order.indexOf(state.index)
      const to = order.indexOf(target)
      if (from !== -1 && Math.abs(to - from) > 1)
        target = order[from + Math.sign(to - from)]
    }
    inputReason = reason
    if (target !== context.modelValue.value && !context.changeModelValue(target, reason, event))
      target = context.modelValue.value
    scrollToSnap(target)
  }

  function startMomentum(initialVelocity: number) {
    const el = element.value
    if (!el)
      return
    const win = getOwnerWindow(el)
    let velocity = initialVelocity
    let last: number | undefined
    const frame = (now: number) => {
      // The first frame has no previous timestamp; a frame timestamp can precede `performance.now()` at request time.
      const dt = last === undefined ? 16 : Math.min(64, Math.max(0, now - last))
      last = now
      velocity *= MOMENTUM_DECAY ** dt
      const before = getScroll(el)
      setScroll(before + velocity * dt, 'instant')
      const stuck = Math.abs(getScroll(el) - before) < 0.1
      if (Math.abs(velocity) < 0.02 || stuck) {
        momentumFrame = 0
        settle()
        return
      }
      if (context.loopActive.value)
        rotate()
      momentumFrame = win.requestAnimationFrame(frame)
    }
    inputReason = 'drag'
    momentumFrame = win.requestAnimationFrame(frame)
  }

  function onSelectstart(event: Event) {
    // A held mouse or pen press on the track is a drag, not a text selection.
    if (dragState && !fade.value)
      event.preventDefault()
  }

  function onDragstart(event: DragEvent) {
    // Images and links in a slide would start a native drag instead of moving the track.
    if (context.options.value.draggable)
      event.preventDefault()
  }

  // Wheel and trackpad. Native scrolling handles the main axis; with `wheel`, a
  // cross-axis wheel (and any wheel in `fade` mode) pages once per gesture.
  let wheelDelta = 0
  let wheelLocked = false
  let wheelTimer: ReturnType<typeof setTimeout> | undefined
  function onWheel(event: WheelEvent) {
    if (event.ctrlKey)
      return
    const crossAxis = vertical.value ? Math.abs(event.deltaX) > Math.abs(event.deltaY) : Math.abs(event.deltaY) > Math.abs(event.deltaX)
    const pages = context.options.value.wheel && (fade.value || crossAxis)
    const scrollsTrack = !fade.value && !crossAxis && context.options.value.draggable
    // A wheel that only scrolls the page over the carousel is not an interaction with it.
    if (!pages && !scrollsTrack)
      return
    context.reportInteraction()
    interrupt('wheel')
    if (!pages)
      return
    const delta = fade.value
      ? (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? (rtl.value ? -event.deltaX : event.deltaX) : event.deltaY)
      : (vertical.value ? event.deltaX : event.deltaY)

    if (wheelTimer !== undefined)
      clearTimeout(wheelTimer)
    wheelTimer = setTimeout(() => {
      wheelLocked = false
      wheelDelta = 0
    }, WHEEL_GESTURE_GAP)

    const forward = delta > 0
    const can = forward ? context.canScrollNext.value : context.canScrollPrev.value
    // At an end the gesture goes back to the page.
    if (!can && !wheelLocked)
      return
    event.preventDefault()
    if (wheelLocked)
      return
    wheelDelta += delta
    if (Math.abs(wheelDelta) < WHEEL_PAGE_DELTA)
      return
    wheelLocked = true
    wheelDelta = 0
    if (forward)
      context.scrollNext('wheel', event)
    else
      context.scrollPrev('wheel', event)
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey)
      return
    const nextKey = vertical.value ? 'ArrowDown' : rtl.value ? 'ArrowLeft' : 'ArrowRight'
    const prevKey = vertical.value ? 'ArrowUp' : rtl.value ? 'ArrowRight' : 'ArrowLeft'
    const last = context.snapCount.value - 1
    let handled = true
    if (event.key === nextKey)
      context.scrollNext('keyboard', event)
    else if (event.key === prevKey)
      context.scrollPrev('keyboard', event)
    else if (event.key === 'Home')
      context.changeModelValue(0, 'keyboard', event)
    else if (event.key === 'End' && last >= 0)
      context.changeModelValue(last, 'keyboard', event)
    else
      handled = false
    if (handled) {
      event.preventDefault()
      context.reportInteraction()
      interrupt('keyboard')
    }
  }

  let autoScrollFrame = 0
  function stopAutoScroll() {
    if (autoScrollFrame)
      getOwnerWindow(element.value).cancelAnimationFrame(autoScrollFrame)
    autoScrollFrame = 0
  }
  watch(autoScrollRunning, (running) => {
    const el = element.value
    stopAutoScroll()
    if (!running || !el) {
      if (snapSuspended.value && !dragState)
        setScrollSnapSuspended(false)
      return
    }
    setScrollSnapSuspended(true)
    const win = getOwnerWindow(el)
    let last: number | undefined
    let expected = getScroll(el)
    const frame = (now: number) => {
      const options = context.autoScroll.value
      if (!options)
        return
      // The first frame has no previous timestamp; a frame timestamp can precede `performance.now()` at request time.
      const dt = last === undefined ? 16 : Math.min(64, Math.max(0, now - last))
      last = now
      const current = getScroll(el)
      // Something else moved the track (a loop rotation, a focus scroll): continue from there.
      if (Math.abs(current - expected) > 1.5)
        expected = current
      const step = options.speed * dt / 1000 * (options.direction === 'backward' ? -1 : 1)
      expected += step
      inputReason = 'autoplay'
      setScroll(expected, 'instant')
      if (!context.loopActive.value) {
        const max = getScrollSize(el) - getViewportSize(el)
        if ((step > 0 && expected >= max - 0.5) || (step < 0 && expected <= 0.5)) {
          autoScrollFrame = 0
          // Kept playing (cancelled, or a controlled parent ignored it): rest at the end with snapping back on.
          if (!context.setPlaying(false, 'last-snap'))
            setScrollSnapSuspended(false)
          return
        }
      }
      else {
        rotate()
      }
      autoScrollFrame = win.requestAnimationFrame(frame)
    }
    autoScrollFrame = win.requestAnimationFrame(frame)
  }, { flush: 'post' })

  // The track follows the current snap when it changes from outside the scroll (controls, keys, `v-model`).
  watch(context.modelValue, (value) => {
    updateAutoHeight()
    if (!context.measured.value || fade.value || programmaticTarget === value || dragState)
      return
    // Already there by a user scroll; a running programmatic scroll towards another snap still has to turn.
    if (programmaticTarget === undefined && getNearestSnapIndex(getScroll(), context.snaps.value) === value)
      return
    scrollToSnap(value)
  }, { flush: 'post' })

  let resizeObserver: ResizeObserver | undefined
  let mutationObserver: MutationObserver | undefined
  let measureFrame = 0
  function scheduleMeasure() {
    const el = element.value
    if (!el || measureFrame)
      return
    measureFrame = getOwnerWindow(el).requestAnimationFrame(() => {
      measureFrame = 0
      if (!rotating)
        measure()
    })
  }
  function observe() {
    resizeObserver?.disconnect()
    const el = element.value
    if (!el)
      return
    const win = getOwnerWindow(el)
    if ('ResizeObserver' in win) {
      resizeObserver ??= new win.ResizeObserver(scheduleMeasure)
      resizeObserver.observe(el)
      if (context.contentElement.value)
        resizeObserver.observe(context.contentElement.value)
      for (const item of context.items.value)
        resizeObserver.observe(item)
    }

    // A keyed `v-for` reorder moves the items without remounting them: re-read their order.
    mutationObserver?.disconnect()
    const content = context.contentElement.value
    if (content && 'MutationObserver' in win) {
      mutationObserver ??= new win.MutationObserver(() => {
        const sorted = [...context.items.value].sort(compareDocumentOrder)
        if (!sameValues(sorted, context.items.value))
          context.items.value = sorted
      })
      mutationObserver.observe(content, { childList: true })
    }
  }

  // Starts once the root is mounted: every item has registered by then.
  watch(() => context.mounted.value && element.value, async (ready) => {
    if (!ready)
      return
    observe()
    measure()
    // `containScroll: false` pads the track on the first measure: measure again on the padded layout.
    await nextTick()
    measure()
    scrollToSnap(context.modelValue.value, 'instant')
    rotate()
  }, { immediate: true, flush: 'post' })
  watch([context.items, () => context.contentElement.value], () => {
    if (!context.mounted.value)
      return
    observe()
    measure()
  }, { flush: 'post' })
  watch([context.options, context.orientation, context.dir], () => {
    if (!context.mounted.value)
      return
    if (!context.options.value.loop)
      context.loopOrder.value = undefined
    nextTick(() => {
      measure()
      scrollToSnap(context.modelValue.value, 'instant')
    })
  }, { flush: 'post' })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    mutationObserver?.disconnect()
    endDrag()
    stopMomentum()
    stopAutoScroll()
    clearScrollEndTimer()
    if (wheelTimer !== undefined)
      clearTimeout(wheelTimer)
    const win = getOwnerWindow(element.value)
    if (scrollFrame)
      win.cancelAnimationFrame(scrollFrame)
    if (measureFrame)
      win.cancelAnimationFrame(measureFrame)
  })

  const style = computed(() => {
    const draggable = context.options.value.draggable
    const height = autoHeight.value === undefined ? undefined : `${autoHeight.value}px`
    if (fade.value) {
      return compactStyle({
        'overflow': 'hidden',
        'touchAction': draggable ? (vertical.value ? 'pan-x' : 'pan-y') : undefined,
        'height': height,
        '--reka-carousel-height': height,
      })
    }
    const overflow = draggable ? 'auto' : 'hidden'
    return compactStyle({
      'overflowX': vertical.value ? 'hidden' : overflow,
      'overflowY': vertical.value ? overflow : 'hidden',
      'scrollSnapType': scrollSnapType(),
      [vertical.value ? 'overscrollBehaviorY' : 'overscrollBehaviorX']: 'contain',
      'scrollbarWidth': 'none',
      'userSelect': context.dragging.value ? 'none' : undefined,
      'height': height,
      '--reka-carousel-height': height,
    })
  })

  const attrs = computed(() => ({
    tabindex: 0,
    style: style.value,
    onScroll,
    onScrollend: settle,
    onPointerdown,
    onDragstart,
    onSelectstart,
    onWheel,
    onKeydown,
  }))

  return { attrs, measure }
}
