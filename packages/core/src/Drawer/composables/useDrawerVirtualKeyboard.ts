import type { MaybeRef, Ref } from 'vue'
import { toValue, watchEffect } from 'vue'
import { getActiveElement } from '@/shared'
import { DRAWER_CSS_VARS } from '../utils'

// Thresholds and timings ported from Base UI `DrawerVirtualKeyboardProvider.tsx`.

/** Viewport shrinkage below this is browser chrome moving, not the keyboard. */
const KEYBOARD_RESIZE_THRESHOLD = 60
/** Gap kept between the focused field and the edges of the visible band. */
const KEYBOARD_VISIBILITY_MARGIN = 16
/** Scrollable room added below the field on top of its keyboard overlap. */
const KEYBOARD_SCROLL_SLACK = 48
const KEYBOARD_REALIGN_INTERVAL = 150
const KEYBOARD_REALIGN_MAX_PASSES = 4
/** Frames the alignment waits for its scroll destination to stop moving. */
const KEYBOARD_SETTLE_FRAME_LIMIT = 60
/** Travel that turns a tap into a scroll/swipe. */
const INPUT_TAP_MOVE_THRESHOLD = 10
const INPUT_TAP_HIT_SLOP = 16

const KEYBOARD_INPUT_TYPES = new Set([
  'email',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'url',
])

const INTERACTIVE_SELECTOR = 'button,a[href],select,[role="button"],[tabindex]:not([tabindex="-1"]),'
  + 'input:not([type="hidden"]):not([disabled]),textarea:not([disabled]),'
  + '[contenteditable]:not([contenteditable="false"])'

/**
 * The lift point landed on another interactive element. Distinct from `null` so
 * the caller does not fall back to the touchstart target and steal that tap.
 */
const KEYBOARD_TAP_BLOCKED = Symbol('KeyboardTapBlocked')

export interface KeyboardViewport {
  /** Top of the visible band, in client coordinates. */
  top: number
  /** Bottom of the visible band, in client coordinates. */
  bottom: number
}

interface KeyboardTouchTarget {
  focusTarget: HTMLElement
  clickTarget: HTMLElement
}

/**
 * The band of the layout viewport still visible with the keyboard up, or `null`
 * when it is closed — or the measurement can't be trusted (no `visualViewport`,
 * or the user is pinch-zoomed).
 */
export function getKeyboardViewport(win: Window): KeyboardViewport | null {
  const visualViewport = win.visualViewport
  if (!visualViewport || visualViewport.scale !== 1)
    return null

  if (win.innerHeight - visualViewport.height <= KEYBOARD_RESIZE_THRESHOLD)
    return null

  const top = Math.max(0, visualViewport.offsetTop)
  return {
    top,
    bottom: Math.min(win.innerHeight, top + visualViewport.height),
  }
}

function isKeyboardInputElement(element: HTMLElement): boolean {
  if (element.isContentEditable)
    return true

  const win = element.ownerDocument.defaultView ?? window
  if (
    element instanceof win.HTMLTextAreaElement
    || (element instanceof win.HTMLInputElement && KEYBOARD_INPUT_TYPES.has(element.type))
  ) {
    // A disabled control can neither focus nor open the keyboard.
    return !element.matches(':disabled')
  }

  return false
}

/** Nodes inside a `contenteditable` are not focusable; the editing host is. */
function getContentEditableHost(element: HTMLElement): HTMLElement {
  let host = element
  while (host.parentElement?.isContentEditable)
    host = host.parentElement
  return host
}

/**
 * Normalizes a target to the element the keyboard is attached to: the field
 * itself, its `contenteditable` host, or the control a `<label>` points at.
 */
export function resolveKeyboardInputTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement))
    return null

  if (isKeyboardInputElement(target))
    return target.isContentEditable ? getContentEditableHost(target) : target

  const control = (target.closest('label') as HTMLLabelElement | null)?.control
  return control instanceof HTMLElement && isKeyboardInputElement(control) ? control : null
}

function resolveKeyboardTouchTarget(target: EventTarget | null): KeyboardTouchTarget | null {
  const focusTarget = resolveKeyboardInputTarget(target)
  return focusTarget ? { focusTarget, clickTarget: target as HTMLElement } : null
}

function getElementAtPoint(root: Node, x: number, y: number): Element | null {
  const elementFromPoint = (root as Partial<Document>).elementFromPoint
  return typeof elementFromPoint === 'function' ? elementFromPoint.call(root, x, y) : null
}

/**
 * iOS retargets taps while the page reacts to the keyboard, so points around
 * the lift point are probed too — but never at the cost of a tap that landed on
 * another interactive element.
 */
function resolveKeyboardTouchTargetFromPoint(
  root: Node,
  clientX: number,
  clientY: number,
): KeyboardTouchTarget | typeof KEYBOARD_TAP_BLOCKED | null {
  const exactTarget = getElementAtPoint(root, clientX, clientY)
  if (exactTarget instanceof HTMLElement) {
    const focusTarget = resolveKeyboardInputTarget(exactTarget)
    if (focusTarget)
      return { focusTarget, clickTarget: exactTarget }
  }

  if (exactTarget?.closest(INTERACTIVE_SELECTOR) != null || exactTarget?.closest('label') != null)
    return KEYBOARD_TAP_BLOCKED

  for (const [offsetX, offsetY] of [
    [0, INPUT_TAP_HIT_SLOP],
    [0, -INPUT_TAP_HIT_SLOP],
    [INPUT_TAP_HIT_SLOP, 0],
    [-INPUT_TAP_HIT_SLOP, 0],
  ]) {
    const focusTarget = resolveKeyboardInputTarget(
      getElementAtPoint(root, clientX + offsetX, clientY + offsetY),
    )
    if (focusTarget)
      return { focusTarget, clickTarget: focusTarget }
  }

  return null
}

function dispatchKeyboardClick(target: HTMLElement, touch: { clientX: number, clientY: number }) {
  const win = target.ownerDocument.defaultView ?? window
  const ClickEvent = win.PointerEvent ?? win.MouseEvent
  const init: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    clientX: touch.clientX,
    clientY: touch.clientY,
    detail: 1,
  }
  let event: MouseEvent
  try {
    event = new ClickEvent('click', { ...init, view: win })
  }
  catch {
    // jsdom rejects a proxied window as `view`.
    event = new ClickEvent('click', init)
  }
  target.dispatchEvent(event)
}

/**
 * Overrides the painted geometry WebKit samples when an element takes focus.
 * The rect is hidden rather than detached so layout is unaffected; the caller
 * must restore it before the next paint.
 */
function overrideGeometryDuringFocus(target: HTMLElement, translateY: number): () => void {
  const { opacity, transform, transition } = target.style

  target.style.transition = 'none'
  target.style.opacity = '0'
  target.style.transform = `translateY(${translateY}px)`

  return () => {
    target.style.opacity = opacity
    target.style.transform = transform
    target.style.transition = transition
  }
}

/**
 * iOS Safari scrolls the page toward a focused field even inside a transformed
 * sheet, so the field is moved off-screen for the synchronous focus call only.
 */
function focusKeyboardInputWithoutPageScroll(target: HTMLElement) {
  const wasFocused = getActiveElement() === target
  const restore = overrideGeometryDuringFocus(target, -2000)
  try {
    if (wasFocused)
      target.blur()
    target.focus({ preventScroll: true })
  }
  finally {
    restore()
  }
}

function isVerticallyScrollable(element: HTMLElement, allowOverflowIntent: boolean): boolean {
  const { overflowY } = window.getComputedStyle(element)
  if (overflowY !== 'auto' && overflowY !== 'scroll')
    return false
  // With intent, a container that overflows only once slack is added counts too.
  return allowOverflowIntent ? element.clientHeight > 0 : element.scrollHeight > element.clientHeight
}

function findScrollableAncestor(
  start: HTMLElement | null,
  root: HTMLElement,
  allowOverflowIntent: boolean,
): HTMLElement | null {
  let element = start
  while (element && element !== root) {
    if (isVerticallyScrollable(element, allowOverflowIntent))
      return element
    element = element.parentElement
  }
  return isVerticallyScrollable(root, allowOverflowIntent) ? root : null
}

/**
 * The scroller that can move the field out from under the keyboard. Starts at
 * the parent: scrolling the field's own content never moves its box.
 */
export function findKeyboardScrollTarget(target: HTMLElement, root: HTMLElement): HTMLElement | null {
  const start = target.parentElement
  return findScrollableAncestor(start, root, false) ?? findScrollableAncestor(start, root, true)
}

/**
 * Snapshot of a scroller taken before slack is applied: the strings are the
 * inline values to restore, the numbers the computed baselines to add onto.
 */
interface ScrollAdjustment {
  element: HTMLElement
  paddingBottom: string
  scrollPaddingBottom: string
  overflowAnchor: string
  computedPaddingBottom: number
  computedScrollPaddingBottom: number
}

export interface UseDrawerVirtualKeyboardOptions {
  /** Only listen while the drawer is open. */
  enabled: MaybeRef<boolean>
  /** Containment root for focus and taps, and host of the keyboard CSS var. */
  elementRef: Ref<HTMLElement | null | undefined>
  /** Page scroll is only pinned for a fully modal drawer. */
  modal?: MaybeRef<boolean>
  /** Alignment is suspended while a nested drawer owns the interaction. */
  nestedDrawerOpen?: MaybeRef<boolean>
}

/**
 * Keyboard-aware focus and scroll handling for drawers with form fields.
 * Ported from Base UI `DrawerVirtualKeyboardProvider`.
 *
 * Publishes `--drawer-keyboard-inset` — the height the keyboard covers — while
 * a field inside the drawer is focused, and keeps that field scrolled into the
 * band left visible above the keyboard. Styling stays in CSS.
 */
export function useDrawerVirtualKeyboard(options: UseDrawerVirtualKeyboardOptions) {
  const { enabled, elementRef, modal = true, nestedDrawerOpen = false } = options

  let focusedTarget: HTMLElement | null = null
  let scrollAdjustment: ScrollAdjustment | null = null
  let alignFrame: number | undefined
  let realignTimer: ReturnType<typeof setTimeout> | undefined
  let programmaticFocus = false
  let touchStart: { x: number, y: number } | null = null
  let touchMoved = false

  function restoreScrollAdjustment() {
    if (!scrollAdjustment)
      return
    const { element, paddingBottom, scrollPaddingBottom, overflowAnchor } = scrollAdjustment
    element.style.paddingBottom = paddingBottom
    element.style.scrollPaddingBottom = scrollPaddingBottom
    element.style.overflowAnchor = overflowAnchor
    scrollAdjustment = null
  }

  function setScrollSlack(element: HTMLElement, slack: number) {
    const rounded = Math.max(0, Math.ceil(slack))

    if (scrollAdjustment && (!scrollAdjustment.element.isConnected || scrollAdjustment.element !== element))
      restoreScrollAdjustment()

    if (rounded === 0) {
      restoreScrollAdjustment()
      return
    }

    if (!scrollAdjustment) {
      const styles = window.getComputedStyle(element)
      scrollAdjustment = {
        element,
        paddingBottom: element.style.paddingBottom,
        scrollPaddingBottom: element.style.scrollPaddingBottom,
        overflowAnchor: element.style.overflowAnchor,
        computedPaddingBottom: Number.parseFloat(styles.paddingBottom) || 0,
        computedScrollPaddingBottom: Number.parseFloat(styles.scrollPaddingBottom) || 0,
      }
    }

    // Without this the browser compensates for the added padding and fights the scroll.
    element.style.overflowAnchor = 'none'
    element.style.paddingBottom = `${scrollAdjustment.computedPaddingBottom + rounded}px`
    element.style.scrollPaddingBottom = `${scrollAdjustment.computedScrollPaddingBottom + KEYBOARD_VISIBILITY_MARGIN}px`
  }

  function animateScroll(element: HTMLElement, scrollTop: number) {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    element.scrollTo?.({ top: scrollTop, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  function cancelPendingAlignment() {
    if (alignFrame !== undefined) {
      cancelAnimationFrame(alignFrame)
      alignFrame = undefined
    }
    if (realignTimer !== undefined) {
      clearTimeout(realignTimer)
      realignTimer = undefined
    }
  }

  watchEffect((onCleanup) => {
    if (!toValue(enabled) || !elementRef.value)
      return

    const root: HTMLElement = elementRef.value

    const doc = root.ownerDocument
    const win = doc.defaultView ?? window

    // Alignment scroll bookkeeping: destination stability, and the last observed
    // position so delayed passes can tell a moving scroll from a stalled one.
    let scrollElement: HTMLElement | null = null
    let scrollDestination = 0
    let scrollChecks = 0
    let scrollObserved = -1

    // WebKit can scroll the page toward a focused field even with the scroll
    // lock on; while modal, any such movement is spurious, so the page is
    // pinned to where it sat when the drawer opened.
    const baseScrollX = win.scrollX
    const baseScrollY = win.scrollY

    // A native focus change (the keyboard's prev/next arrows) commits WebKit's
    // reveal before `focusin` reaches us, so the incoming field's geometry is
    // overridden on `focusout` and restored once focus lands.
    let restorePreemptedFocus: (() => void) | null = null

    function setKeyboardInset(inset: number) {
      root.style.setProperty(DRAWER_CSS_VARS.keyboardInset, `${Math.max(0, Math.ceil(inset))}px`)
    }

    function consumePreemptedFocus() {
      restorePreemptedFocus?.()
      restorePreemptedFocus = null
    }

    function preemptFocusReveal(target: HTMLElement, keyboardViewport: KeyboardViewport) {
      consumePreemptedFocus()
      // Native focus carries no `preventScroll`, so an off-screen rect would make
      // WebKit chase it; a rect centered in the visible band makes it a no-op.
      const rect = target.getBoundingClientRect()
      restorePreemptedFocus = overrideGeometryDuringFocus(
        target,
        (keyboardViewport.top + keyboardViewport.bottom - rect.top - rect.bottom) / 2,
      )
    }

    function restoreWindowScroll(): boolean {
      if (
        !toValue(modal)
        || toValue(nestedDrawerOpen)
        || !focusedTarget
        || getKeyboardViewport(win) == null
      ) {
        return false
      }

      if (win.scrollX !== baseScrollX || win.scrollY !== baseScrollY) {
        // `instant` so a global `scroll-behavior: smooth` can't animate the
        // restore — the measurements below assume the page is back at rest.
        win.scrollTo({ left: baseScrollX, top: baseScrollY, behavior: 'instant' })
        return true
      }

      return false
    }

    function clearFocusedTarget() {
      focusedTarget = null
      scrollElement = null
      cancelPendingAlignment()
      restoreScrollAdjustment()
      setKeyboardInset(0)
    }

    function captureTarget(target: EventTarget | null): boolean {
      if (toValue(nestedDrawerOpen))
        return false
      const resolved = resolveKeyboardInputTarget(target)
      if (!resolved || !root.contains(resolved))
        return false
      // A different field starts a fresh alignment.
      if (focusedTarget !== resolved)
        scrollElement = null
      focusedTarget = resolved
      return true
    }

    function align() {
      // If focus never lands on a preempted target, this restores it before paint.
      consumePreemptedFocus()

      // A field can be removed without firing `focusout` (conditional rendering);
      // this self-corrects on the next event instead of tracking each lifecycle.
      if (toValue(nestedDrawerOpen) || !focusedTarget || !root.contains(focusedTarget)) {
        setKeyboardInset(0)
        restoreScrollAdjustment()
        return
      }

      // Undo any reveal scroll before measuring against the resting viewport.
      restoreWindowScroll()

      const keyboardViewport = getKeyboardViewport(win)
      if (!keyboardViewport) {
        setKeyboardInset(0)
        restoreScrollAdjustment()
        return
      }

      setKeyboardInset(win.innerHeight - keyboardViewport.bottom)

      const scrollTarget = findKeyboardScrollTarget(focusedTarget, root!)
      if (!scrollTarget) {
        restoreScrollAdjustment()
        return
      }

      const scrollRect = scrollTarget.getBoundingClientRect()
      const overlap = Math.max(0, scrollRect.bottom - keyboardViewport.bottom)
      setScrollSlack(scrollTarget, overlap > 0 ? overlap + KEYBOARD_SCROLL_SLACK : 0)

      const maxScrollTop = Math.max(0, scrollTarget.scrollHeight - scrollTarget.clientHeight)
      if (maxScrollTop <= 0)
        return

      // The part of the scroller that is on screen and above the keyboard.
      const visibleTop = Math.max(scrollRect.top, keyboardViewport.top) + KEYBOARD_VISIBILITY_MARGIN
      const visibleBottom = Math.min(scrollRect.bottom, keyboardViewport.bottom) - KEYBOARD_VISIBILITY_MARGIN
      if (visibleBottom <= visibleTop)
        return

      // Center the field in that band.
      const targetRect = focusedTarget.getBoundingClientRect()
      const nextScrollTop = scrollTarget.scrollTop
        + (targetRect.top + targetRect.bottom - visibleTop - visibleBottom) / 2
      const destination = Math.round(Math.min(maxScrollTop, Math.max(0, nextScrollTop)))

      const settled = scrollElement === scrollTarget && Math.abs(scrollDestination - destination) <= 1

      if (!settled) {
        // Commit only once the destination holds across two checks — layout may
        // still be transitioning, and a mid-transition destination overshoots.
        const checks = scrollElement === scrollTarget ? scrollChecks + 1 : 1
        scrollElement = scrollTarget
        scrollDestination = destination
        scrollChecks = checks
        scrollObserved = -1
        if (checks <= KEYBOARD_SETTLE_FRAME_LIMIT) {
          scheduleAlign()
          return
        }
      }
      else if (scrollObserved >= 0) {
        // A scroll is already out; re-issuing restarts its easing. Leave it be
        // unless it stalled short — WebKit cancels in-flight smooth scrolls.
        const current = scrollTarget.scrollTop
        if (Math.abs(current - destination) <= 1)
          return
        if (current !== scrollObserved) {
          scrollObserved = current
          return
        }
      }

      scrollElement = scrollTarget
      scrollDestination = destination
      scrollChecks = 0
      scrollObserved = scrollTarget.scrollTop
      animateScroll(scrollTarget, destination)
    }

    function scheduleAlign() {
      if (alignFrame !== undefined)
        return
      alignFrame = requestAnimationFrame(() => {
        alignFrame = undefined
        align()
      })
    }

    // Focus moving with the keyboard already up fires no viewport resize, and a
    // single frame-scheduled pass measures geometry that is still settling.
    function scheduleRealignPasses() {
      if (realignTimer !== undefined)
        clearTimeout(realignTimer)
      let remaining = KEYBOARD_REALIGN_MAX_PASSES
      const pass = () => {
        align()
        remaining -= 1
        realignTimer = remaining > 0 ? setTimeout(pass, KEYBOARD_REALIGN_INTERVAL) : undefined
      }
      realignTimer = setTimeout(pass, KEYBOARD_REALIGN_INTERVAL)
    }

    function onFocusIn(event: FocusEvent) {
      // Focus has landed, so a later `focusout` is the consumer's own and must be
      // reconciled rather than suppressed.
      programmaticFocus = false
      consumePreemptedFocus()

      if (!captureTarget(event.target)) {
        // The tap path suppresses `focusout`, so a consumer handler that moves
        // focus out of the drawer would otherwise leave a stale target behind.
        clearFocusedTarget()
        return
      }

      if (getKeyboardViewport(win))
        scheduleRealignPasses()
      scheduleAlign()
    }

    function onFocusOut(event: FocusEvent) {
      // The blur inside the tap path is followed synchronously by a re-focus;
      // clearing here would drop the inset for a frame.
      if (programmaticFocus)
        return

      if (captureTarget(event.relatedTarget)) {
        const keyboardViewport = getKeyboardViewport(win)
        if (focusedTarget && keyboardViewport)
          preemptFocusReveal(focusedTarget, keyboardViewport)
        scheduleAlign()
        return
      }

      clearFocusedTarget()
    }

    function onViewportChange() {
      if (focusedTarget || captureTarget(getActiveElement()))
        scheduleAlign()
    }

    function onWindowScroll() {
      // Measurements taken mid-reveal inflate the inset, so recompute once the
      // page is back at rest.
      if (restoreWindowScroll())
        scheduleAlign()
    }

    // Once a finger is down the user owns the scroll position. A later focus or
    // viewport change reschedules the alignment if it is still needed.
    function onPointerDown() {
      cancelPendingAlignment()
      scrollElement = null
    }

    function resetTouchTracking() {
      touchStart = null
      touchMoved = false
    }

    function onTouchStart(event: TouchEvent) {
      const touch = event.touches[0]
      touchMoved = false
      touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null
    }

    function onTouchMove(event: TouchEvent) {
      const touch = event.touches[0]
      if (!touch || !touchStart || touchMoved)
        return
      if (
        Math.abs(touch.clientX - touchStart.x) > INPUT_TAP_MOVE_THRESHOLD
        || Math.abs(touch.clientY - touchStart.y) > INPUT_TAP_MOVE_THRESHOLD
      ) {
        touchMoved = true
      }
    }

    function onTouchEnd(event: TouchEvent) {
      if (toValue(nestedDrawerOpen) || !touchStart || touchMoved) {
        resetTouchTracking()
        return
      }

      const touch = event.changedTouches[0] ?? event.touches[0]
      if (!touch) {
        resetTouchTracking()
        return
      }

      const pointTarget = resolveKeyboardTouchTargetFromPoint(
        root.getRootNode(),
        touch.clientX,
        touch.clientY,
      )
      if (pointTarget === KEYBOARD_TAP_BLOCKED) {
        resetTouchTracking()
        return
      }

      const keyboardTarget = pointTarget ?? resolveKeyboardTouchTarget(event.target)
      if (
        !keyboardTarget
        || !root.contains(keyboardTarget.focusTarget)
        || !root.contains(keyboardTarget.clickTarget)
      ) {
        resetTouchTracking()
        return
      }

      // Alignment is suspended while pinch-zoomed; let the native tap handle
      // focus and caret placement.
      if (win.visualViewport && win.visualViewport.scale !== 1) {
        resetTouchTracking()
        return
      }

      // Already focused with the keyboard up: let the tap through so it can
      // reposition the caret instead of blurring and re-focusing.
      if (
        getActiveElement() === keyboardTarget.focusTarget
        && (!win.visualViewport || getKeyboardViewport(win) != null)
      ) {
        resetTouchTracking()
        return
      }

      // iOS only opens the keyboard when focus happens synchronously inside the
      // touch gesture. The flag suppresses the intermediate blur's `focusout`.
      event.preventDefault()
      programmaticFocus = true
      try {
        focusKeyboardInputWithoutPageScroll(keyboardTarget.focusTarget)
      }
      finally {
        programmaticFocus = false
      }
      // Preventing the touchend default also suppresses the compatibility mouse
      // events, so the click is redispatched on the original tap target.
      dispatchKeyboardClick(keyboardTarget.clickTarget, touch)
      resetTouchTracking()
    }

    doc.addEventListener('focusin', onFocusIn, true)
    doc.addEventListener('focusout', onFocusOut, true)
    doc.addEventListener('pointerdown', onPointerDown, true)
    win.addEventListener('scroll', onWindowScroll)
    win.visualViewport?.addEventListener('resize', onViewportChange)
    win.visualViewport?.addEventListener('scroll', onViewportChange)
    root.addEventListener('touchstart', onTouchStart, { passive: true })
    root.addEventListener('touchmove', onTouchMove, { passive: true })
    root.addEventListener('touchend', onTouchEnd)
    root.addEventListener('touchcancel', resetTouchTracking)

    // The drawer may open with a field already focused.
    if (captureTarget(getActiveElement()))
      scheduleAlign()

    onCleanup(() => {
      doc.removeEventListener('focusin', onFocusIn, true)
      doc.removeEventListener('focusout', onFocusOut, true)
      doc.removeEventListener('pointerdown', onPointerDown, true)
      win.removeEventListener('scroll', onWindowScroll)
      win.visualViewport?.removeEventListener('resize', onViewportChange)
      win.visualViewport?.removeEventListener('scroll', onViewportChange)
      root.removeEventListener('touchstart', onTouchStart)
      root.removeEventListener('touchmove', onTouchMove)
      root.removeEventListener('touchend', onTouchEnd)
      root.removeEventListener('touchcancel', resetTouchTracking)
      consumePreemptedFocus()
      resetTouchTracking()
      focusedTarget = null
      cancelPendingAlignment()
      restoreScrollAdjustment()
      root.style.removeProperty(DRAWER_CSS_VARS.keyboardInset)
    })
  })
}
