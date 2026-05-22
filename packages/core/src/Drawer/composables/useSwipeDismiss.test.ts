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
    dispatchPointer(el, 'pointerdown', 100, 100)
    dispatchPointer(el, 'pointermove', 100, 120)
    dispatchPointer(el, 'pointermove', 100, 180) // 80px, past threshold
    dispatchPointer(el, 'pointerup', 100, 180)
    await nextTick()

    expect(onRelease).toHaveBeenCalledTimes(1)
    const velocity = onRelease.mock.calls[0][0]
    expect(typeof velocity.x).toBe('number')
    expect(typeof velocity.y).toBe('number')

    wrapper.unmount()
  })
})
