import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useSwipeDismiss } from './useSwipeDismiss'

// JSDOM does not implement PointerEvent. Polyfill as a MouseEvent with the
// pointer-specific fields the composable reads. This must run before the
// composable's event listeners are attached.
beforeAll(() => {
  if (typeof PointerEvent === 'undefined') {
    class PointerEventPolyfill extends MouseEvent {
      pointerId: number
      pointerType: string
      isPrimary: boolean
      constructor(type: string, init: any = {}) {
        super(type, init)
        this.pointerId = init.pointerId ?? 1
        this.pointerType = init.pointerType ?? 'mouse'
        this.isPrimary = init.isPrimary ?? true
      }
    }
    ;(globalThis as any).PointerEvent = PointerEventPolyfill
  }
  // setPointerCapture/releasePointerCapture are called by the composable;
  // JSDOM doesn't implement them.
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()
    Element.prototype.hasPointerCapture = () => false
  }
})

/**
 * Unit tests for useSwipeDismiss pointer-event path. Covers the
 * dismiss-vs-cancel CSS variable clearing behavior — the close-animation
 * flicker fix. Before that fix, finishSwipe unconditionally cleared
 * `--drawer-swipe-movement-{x,y}` before invoking `onDismiss`, causing a
 * one-frame snap-back to the resting position just before the close
 * transition began. The fix preserves the drag transform on dismiss so
 * the closing animation continues smoothly from the released position,
 * and only clears on cancel (when the drawer should animate back to rest).
 */

interface HarnessOptions {
  onDismiss?: () => void
  onCancel?: () => void
  onRelease?: (velocity: { x: number, y: number }) => void
  directions?: Array<'up' | 'down' | 'left' | 'right'>
}

function mountHarness(opts: HarnessOptions = {}) {
  const elementRef = ref<HTMLElement | null>(null)
  const onDismiss = opts.onDismiss ?? vi.fn()
  const onCancel = opts.onCancel ?? vi.fn()
  const onRelease = opts.onRelease ?? vi.fn()

  const Harness = defineComponent({
    setup() {
      useSwipeDismiss({
        enabled: true,
        elementRef,
        directions: opts.directions ?? ['down'],
        movementCssVars: {
          x: '--drawer-swipe-movement-x',
          y: '--drawer-swipe-movement-y',
        },
        onDismiss,
        onCancel,
        onRelease,
      })
      return { elementRef }
    },
    render() {
      return h('div', {
        ref: (el) => {
          elementRef.value = el as HTMLElement | null
        },
        style: 'width:400px;height:800px',
      })
    },
  })

  const wrapper = mount(Harness, { attachTo: document.body })
  return { wrapper, elementRef, onDismiss, onCancel, onRelease }
}

function dispatchPointer(
  el: HTMLElement,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  x: number,
  y: number,
  time = 0,
  extra: Partial<PointerEventInit> = {},
) {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerType: 'mouse',
    pointerId: 1,
    button: 0,
    buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
    clientX: x,
    clientY: y,
    ...extra,
  })
  // JSDOM assigns each synthetically-dispatched event a strictly-increasing
  // real-clock `timeStamp` landing within milliseconds of `performance.now()`.
  // That makes a synchronous below-threshold "slow drag" read as a fast flick
  // (release velocity stays fresh and large) and dismiss when it should cancel.
  // Default every event to timestamp 0 so gesture classification is decided
  // purely by displacement (release velocity reads as zero, as in a real slow
  // drag). Tests that need a measurable velocity pass explicit timestamps
  // anchored to `performance.now()` so the sample is still "fresh" at release.
  Object.defineProperty(event, 'timeStamp', { value: time, configurable: true })
  el.dispatchEvent(event)
}

describe('useSwipeDismiss — dismiss vs cancel CSS var clearing', () => {
  it('preserves movement CSS vars on dismiss so close animation runs from drag position', async () => {
    const onDismiss = vi.fn()
    const { wrapper, elementRef, onCancel } = mountHarness({ onDismiss })
    await nextTick()

    const el = elementRef.value!
    expect(el).toBeTruthy()

    // Simulate a downward drag past the 40px default threshold, then release.
    dispatchPointer(el, 'pointerdown', 100, 100)
    dispatchPointer(el, 'pointermove', 100, 110)
    dispatchPointer(el, 'pointermove', 100, 160) // 60px, past threshold
    dispatchPointer(el, 'pointerup', 100, 160)
    await nextTick()

    // Release should dismiss.
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()

    // CRITICAL (flicker fix): movement CSS vars must NOT be cleared, so the
    // caller's close animation can transition smoothly from the dragged
    // position. Vars should still hold the release-time offset.
    const swipeY = el.style.getPropertyValue('--drawer-swipe-movement-y')
    expect(swipeY).not.toBe('0px')
    expect(swipeY).not.toBe('')

    // BaseUI parity: data-swipe-dismissed is set on the element so consumers
    // can style the swipe-dismissed close differently from click/escape.
    expect(el.hasAttribute('data-swipe-dismissed')).toBe(true)

    wrapper.unmount()
  })

  it('clears movement CSS vars on cancel so drawer animates back to rest', async () => {
    const onCancel = vi.fn()
    const { wrapper, elementRef, onDismiss } = mountHarness({ onCancel })
    await nextTick()

    const el = elementRef.value!

    // Drag down just a tiny bit (below threshold), then release.
    dispatchPointer(el, 'pointerdown', 100, 100)
    dispatchPointer(el, 'pointermove', 100, 105)
    dispatchPointer(el, 'pointermove', 100, 115) // 15px, below threshold
    dispatchPointer(el, 'pointerup', 100, 115)
    await nextTick()

    expect(onDismiss).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledTimes(1)

    // Movement CSS vars ARE cleared so the drawer snaps back to resting
    // position (the consumer's CSS transition animates from there).
    expect(el.style.getPropertyValue('--drawer-swipe-movement-y')).toBe('0px')
    expect(el.style.getPropertyValue('--drawer-swipe-movement-x')).toBe('0px')

    // Not a dismiss, so the marker attribute is NOT set.
    expect(el.hasAttribute('data-swipe-dismissed')).toBe(false)

    wrapper.unmount()
  })

  it('fires onRelease with the measured velocity vector', async () => {
    const onRelease = vi.fn()
    const { wrapper, elementRef } = mountHarness({ onRelease })
    await nextTick()

    const el = elementRef.value!

    // Drag past threshold with a timed sequence so velocity is measurable.
    // Anchor timestamps to performance.now() so the last sample is still within
    // MAX_RELEASE_VELOCITY_AGE_MS of release and the velocity isn't zeroed out.
    const t0 = performance.now()
    dispatchPointer(el, 'pointerdown', 100, 100, t0)
    dispatchPointer(el, 'pointermove', 100, 120, t0 + 16)
    dispatchPointer(el, 'pointermove', 100, 180, t0 + 32) // 80px, past threshold
    dispatchPointer(el, 'pointerup', 100, 180, t0 + 32)
    await nextTick()

    expect(onRelease).toHaveBeenCalledTimes(1)
    const velocity = onRelease.mock.calls[0][0]
    expect(typeof velocity.x).toBe('number')
    expect(typeof velocity.y).toBe('number')
    // A real downward flick must propagate a non-zero positive y velocity —
    // proving measured velocity reaches onRelease, not just numeric zeros.
    expect(velocity.y).toBeGreaterThan(0)

    wrapper.unmount()
  })
})

/**
 * The gesture must be tracked from the first pointer move regardless of its
 * direction (BaseUI `startSwipeAtPosition` sets `swiping` on press). A drag
 * away* from the dismiss direction is sqrt-damped by `applyDirectionalDamping`
 * and written to the movement vars — that damped offset is the elastic "pull"
 * feedback. Previously `processMove` returned early whenever the drag had no
 * allowed direction, so a bottom drawer pulled upward stayed completely frozen.
 */
describe('useSwipeDismiss — non-dismissable direction (elastic pull)', () => {
  it('damps and tracks a drag away from the dismiss direction', async () => {
    const { wrapper, elementRef, onDismiss, onCancel } = mountHarness()
    await nextTick()

    const el = elementRef.value!

    // Pull UP on a `down`-dismiss drawer: 100px of travel.
    dispatchPointer(el, 'pointerdown', 100, 400)
    dispatchPointer(el, 'pointermove', 100, 380)
    dispatchPointer(el, 'pointermove', 100, 300)

    // sqrt-damped: -sqrt(100) = -10px, not the raw -100px.
    expect(el.style.getPropertyValue('--drawer-swipe-movement-y')).toBe('-10px')
    expect(el.style.getPropertyValue('--drawer-swipe-movement-x')).toBe('0px')

    dispatchPointer(el, 'pointerup', 100, 300)
    await nextTick()

    // A pull that never moves in a dismissable direction cancels: the drawer
    // springs back to rest and stays open.
    expect(onDismiss).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(el.style.getPropertyValue('--drawer-swipe-movement-y')).toBe('0px')
    expect(el.hasAttribute('data-swipe-dismissed')).toBe(false)

    wrapper.unmount()
  })

  it('still adopts the dismiss direction when the drag reverses into it', async () => {
    const { wrapper, elementRef, onDismiss, onCancel } = mountHarness()
    await nextTick()

    const el = elementRef.value!

    // Pull up first (no dismissable direction yet), then push back down past
    // the 40px threshold. The gesture must dismiss rather than stay stuck
    // without an intended direction.
    dispatchPointer(el, 'pointerdown', 100, 400)
    dispatchPointer(el, 'pointermove', 100, 350)
    dispatchPointer(el, 'pointermove', 100, 420)
    dispatchPointer(el, 'pointermove', 100, 470) // +70px from origin
    dispatchPointer(el, 'pointerup', 100, 470)
    await nextTick()

    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('leaves an allowed direction undamped when both axes directions are allowed', async () => {
    // Snap-point drawers pass both the dismiss direction and its opposite, so
    // neither vertical direction should be damped.
    const { wrapper, elementRef } = mountHarness({ directions: ['down', 'up'] })
    await nextTick()

    const el = elementRef.value!

    dispatchPointer(el, 'pointerdown', 100, 400)
    dispatchPointer(el, 'pointermove', 100, 380)
    dispatchPointer(el, 'pointermove', 100, 300)

    expect(el.style.getPropertyValue('--drawer-swipe-movement-y')).toBe('-100px')

    dispatchPointer(el, 'pointerup', 100, 300)
    wrapper.unmount()
  })
})

/**
 * The listeners live on the popup, which the pointer leaves as soon as the drag
 * goes past the drawer's bounds (BaseUI instead hangs them off a full-screen
 * `Drawer.Viewport`). `setPointerCapture` covers an ordinary in-window drag, but
 * a release the popup never sees — outside the window, over another app, or
 * after capture is dropped — used to leave the gesture wedged: the drawer stayed
 * frozen mid-pull with `data-swiping` set (pinning the transition to 0ms) and
 * ignored every subsequent drag.
 */
describe('useSwipeDismiss — releases the popup never sees', () => {
  it('treats a move with no button held as the missing pointerup', async () => {
    const { wrapper, elementRef, onCancel } = mountHarness()
    await nextTick()

    const el = elementRef.value!

    dispatchPointer(el, 'pointerdown', 100, 400)
    dispatchPointer(el, 'pointermove', 100, 390)
    dispatchPointer(el, 'pointermove', 100, 340)
    expect(el.hasAttribute('data-swiping')).toBe(false) // marker lives on the consumer
    expect(el.style.getPropertyValue('--drawer-swipe-movement-y')).not.toBe('0px')

    // The release happened somewhere we never saw; the pointer only comes back
    // over the page with the button already up.
    dispatchPointer(el, 'pointermove', 100, 300, 0, { buttons: 0 })
    await nextTick()

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(el.style.getPropertyValue('--drawer-swipe-movement-y')).toBe('0px')

    wrapper.unmount()
  })

  it('finishes on a pointerup that only reaches the document', async () => {
    const { wrapper, elementRef, onCancel } = mountHarness()
    await nextTick()

    const el = elementRef.value!

    dispatchPointer(el, 'pointerdown', 100, 400)
    dispatchPointer(el, 'pointermove', 100, 390)
    dispatchPointer(el, 'pointermove', 100, 340)

    // Released over some other element entirely — never retargeted to the popup.
    dispatchPointer(document.body, 'pointerup', 100, 340)
    await nextTick()

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(el.style.getPropertyValue('--drawer-swipe-movement-y')).toBe('0px')

    wrapper.unmount()
  })

  it('finishes when the window loses focus mid-drag', async () => {
    const { wrapper, elementRef, onCancel } = mountHarness()
    await nextTick()

    const el = elementRef.value!

    dispatchPointer(el, 'pointerdown', 100, 400)
    dispatchPointer(el, 'pointermove', 100, 390)
    dispatchPointer(el, 'pointermove', 100, 340)

    // Dragged out of the window and released over another application.
    window.dispatchEvent(new Event('blur'))
    await nextTick()

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(el.style.getPropertyValue('--drawer-swipe-movement-y')).toBe('0px')

    wrapper.unmount()
  })

  it('does not leak state from an unfinished gesture into the next one', async () => {
    const onDismiss = vi.fn()
    const { wrapper, elementRef, onCancel } = mountHarness({ onDismiss })
    await nextTick()

    const el = elementRef.value!

    // A change-of-mind drag that never ends: down past half the threshold, then
    // reversed far enough to latch `cancelledSwipe`, and no pointerup at all.
    dispatchPointer(el, 'pointerdown', 100, 400)
    dispatchPointer(el, 'pointermove', 100, 420)
    dispatchPointer(el, 'pointermove', 100, 460)
    dispatchPointer(el, 'pointermove', 100, 415)

    // A fresh press must start clean. If the latched cancel leaks into this
    // gesture, the drawer silently refuses to close no matter how far it is
    // dragged.
    dispatchPointer(el, 'pointerdown', 100, 400, 0, { pointerId: 2 })
    dispatchPointer(el, 'pointermove', 100, 410, 0, { pointerId: 2 })
    dispatchPointer(el, 'pointermove', 100, 470, 0, { pointerId: 2 })
    dispatchPointer(el, 'pointerup', 100, 470, 0, { pointerId: 2 })
    await nextTick()

    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})

/**
 * A side drawer holding `overflow-y: auto` content used to treat every vertical
 * flick as a horizontal drag, sliding along X and swallowing the scroll
 * (unovue/reka-ui#2876). `shouldYieldTouchMove` now arbitrates the two axes.
 */
describe('useSwipeDismiss — cross-axis scroll arbitration', () => {
  /** Marks an element as genuinely scrollable on `axis` for jsdom, which reports every box as 0x0. */
  function makeScrollable(el: HTMLElement, axis: 'vertical' | 'horizontal', scrollOffset = 0) {
    el.style.setProperty(axis === 'vertical' ? 'overflow-y' : 'overflow-x', 'auto')
    const sizes = axis === 'vertical'
      ? { scrollHeight: 2000, clientHeight: 500, scrollTop: scrollOffset }
      : { scrollWidth: 2000, clientWidth: 500, scrollLeft: scrollOffset }
    for (const [key, value] of Object.entries(sizes))
      Object.defineProperty(el, key, { value, configurable: true, writable: true })
  }

  function mountTouchHarness(opts: { directions?: Array<'up' | 'down' | 'left' | 'right'> } = {}) {
    const elementRef = ref<HTMLElement | null>(null)
    const scrollRef = ref<HTMLElement | null>(null)
    const onDismiss = vi.fn()
    const onCancel = vi.fn()

    const Harness = defineComponent({
      setup() {
        useSwipeDismiss({
          enabled: true,
          elementRef,
          directions: opts.directions ?? ['right'],
          movementCssVars: {
            x: '--drawer-swipe-movement-x',
            y: '--drawer-swipe-movement-y',
          },
          onDismiss,
          onCancel,
        })
        return {}
      },
      render() {
        return h(
          'div',
          {
            ref: (el) => {
              elementRef.value = el as HTMLElement | null
            },
          },
          [
            h('div', {
              ref: (el) => {
                scrollRef.value = el as HTMLElement | null
              },
            }, [h('p', 'content')]),
          ],
        )
      },
    })

    const wrapper = mount(Harness, { attachTo: document.body })
    return { wrapper, elementRef, scrollRef, onDismiss, onCancel }
  }

  // jsdom's `TouchEvent`/`Touch` support varies, so build the event by hand.
  function dispatchTouch(
    el: HTMLElement,
    type: 'touchstart' | 'touchmove' | 'touchend',
    x: number,
    y: number,
    { cancelable = true, target = el }: { cancelable?: boolean, target?: HTMLElement } = {},
  ) {
    const event = new Event(type, { bubbles: true, cancelable })
    Object.defineProperty(event, 'touches', {
      value: type === 'touchend' ? [] : [{ clientX: x, clientY: y }],
      configurable: true,
    })
    Object.defineProperty(event, 'timeStamp', { value: 0, configurable: true })
    target.dispatchEvent(event)
    return event
  }

  it('yields a mostly-vertical flick to the content scroll on a right drawer', async () => {
    const { wrapper, elementRef, scrollRef, onDismiss, onCancel } = mountTouchHarness()
    await nextTick()

    const el = elementRef.value!
    const scroller = scrollRef.value!
    makeScrollable(scroller, 'vertical')

    // A real finger never travels on one axis alone; this flick drifts 3px right
    // while scrolling 40px down, and that 3px used to start the drag.
    dispatchTouch(el, 'touchstart', 200, 400, { target: scroller })
    const move1 = dispatchTouch(el, 'touchmove', 201, 388, { target: scroller })
    const move2 = dispatchTouch(el, 'touchmove', 203, 360, { target: scroller })

    // The browser keeps both moves, and the drawer never budges along X.
    expect(move1.defaultPrevented).toBe(false)
    expect(move2.defaultPrevented).toBe(false)
    expect(el.style.getPropertyValue('--drawer-swipe-movement-x')).toBe('')

    dispatchTouch(el, 'touchend', 203, 360, { target: scroller })
    await nextTick()

    expect(onDismiss).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('keeps yielding for the rest of the gesture once the cross axis has won', async () => {
    const { wrapper, elementRef, scrollRef, onDismiss } = mountTouchHarness()
    await nextTick()

    const el = elementRef.value!
    const scroller = scrollRef.value!
    makeScrollable(scroller, 'vertical')

    dispatchTouch(el, 'touchstart', 200, 400, { target: scroller })
    dispatchTouch(el, 'touchmove', 200, 380, { target: scroller }) // vertical claims it

    // Re-arbitrating on this hard curve would hand the drawer the gesture
    // mid-scroll.
    const curve = dispatchTouch(el, 'touchmove', 320, 380, { target: scroller })
    expect(curve.defaultPrevented).toBe(false)
    expect(el.style.getPropertyValue('--drawer-swipe-movement-x')).toBe('')

    dispatchTouch(el, 'touchend', 320, 380, { target: scroller })
    await nextTick()
    expect(onDismiss).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('still swipes when the drag is decisively along the dismiss axis', async () => {
    const { wrapper, elementRef, scrollRef, onDismiss } = mountTouchHarness()
    await nextTick()

    const el = elementRef.value!
    const scroller = scrollRef.value!
    makeScrollable(scroller, 'vertical')

    // The scroller has nothing to offer on the horizontal axis.
    dispatchTouch(el, 'touchstart', 100, 400, { target: scroller })
    dispatchTouch(el, 'touchmove', 110, 402, { target: scroller })
    const move = dispatchTouch(el, 'touchmove', 180, 404, { target: scroller })

    expect(move.defaultPrevented).toBe(true)
    expect(el.style.getPropertyValue('--drawer-swipe-movement-x')).toBe('80px')

    dispatchTouch(el, 'touchend', 180, 404, { target: scroller })
    await nextTick()
    expect(onDismiss).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('does not arbitrate when the content has no cross-axis scroller', async () => {
    const { wrapper, elementRef, scrollRef } = mountTouchHarness()
    await nextTick()

    const el = elementRef.value!
    const scroller = scrollRef.value!
    // Short content: nothing to scroll, so the drawer owns every pixel as before.
    makeScrollable(scroller, 'horizontal')

    dispatchTouch(el, 'touchstart', 100, 400, { target: scroller })
    const move = dispatchTouch(el, 'touchmove', 102, 430, { target: scroller })

    expect(move.defaultPrevented).toBe(true)
    expect(el.style.getPropertyValue('--drawer-swipe-movement-x')).toBe('2px')

    dispatchTouch(el, 'touchend', 102, 430, { target: scroller })
    wrapper.unmount()
  })

  it('yields when the browser has already committed the gesture to a native scroll', async () => {
    const { wrapper, elementRef, scrollRef, onDismiss } = mountTouchHarness()
    await nextTick()

    const el = elementRef.value!
    const scroller = scrollRef.value!
    makeScrollable(scroller, 'vertical')

    dispatchTouch(el, 'touchstart', 100, 400, { target: scroller })
    // Non-cancelable: the scroll is already under way.
    dispatchTouch(el, 'touchmove', 140, 402, { target: scroller, cancelable: false })
    // Even a decisive horizontal move afterwards stays with the scroll.
    const move = dispatchTouch(el, 'touchmove', 260, 404, { target: scroller })

    expect(move.defaultPrevented).toBe(false)
    expect(el.style.getPropertyValue('--drawer-swipe-movement-x')).toBe('')

    dispatchTouch(el, 'touchend', 260, 404, { target: scroller })
    await nextTick()
    expect(onDismiss).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('yields a horizontal drift on a bottom drawer to horizontally scrollable content', async () => {
    const { wrapper, elementRef, scrollRef, onDismiss } = mountTouchHarness({ directions: ['down'] })
    await nextTick()

    const el = elementRef.value!
    const scroller = scrollRef.value!
    makeScrollable(scroller, 'horizontal')

    // Swiping a carousel inside a bottom sheet must not pull the sheet down.
    dispatchTouch(el, 'touchstart', 200, 400, { target: scroller })
    const move1 = dispatchTouch(el, 'touchmove', 188, 401, { target: scroller })
    const move2 = dispatchTouch(el, 'touchmove', 160, 403, { target: scroller })

    expect(move1.defaultPrevented).toBe(false)
    expect(move2.defaultPrevented).toBe(false)
    expect(el.style.getPropertyValue('--drawer-swipe-movement-y')).toBe('')

    dispatchTouch(el, 'touchend', 160, 403, { target: scroller })
    await nextTick()
    expect(onDismiss).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('starts clean after a gesture whose end was never seen', async () => {
    const { wrapper, elementRef, scrollRef, onDismiss } = mountTouchHarness()
    await nextTick()

    const el = elementRef.value!
    const scroller = scrollRef.value!
    makeScrollable(scroller, 'vertical')

    // A vertical scroll that the cross axis wins, abandoned without a touchend.
    dispatchTouch(el, 'touchstart', 200, 400, { target: scroller })
    dispatchTouch(el, 'touchmove', 200, 360, { target: scroller })

    // Inheriting that verdict would leave the drawer unswipeable for good.
    dispatchTouch(el, 'touchstart', 100, 400, { target: scroller })
    dispatchTouch(el, 'touchmove', 110, 400, { target: scroller })
    const move = dispatchTouch(el, 'touchmove', 180, 400, { target: scroller })

    expect(move.defaultPrevented).toBe(true)
    dispatchTouch(el, 'touchend', 180, 400, { target: scroller })
    await nextTick()
    expect(onDismiss).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })
})
