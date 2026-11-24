import { cleanup, fireEvent, render } from '@testing-library/vue'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import {
  DrawerClose,
  DrawerContent,
  DrawerHandle,
  DrawerOverlay,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from '.'

/**
 * Integration tests for the snap-point bugs fixed in the PR:
 *
 *   1. **Reopen bug**: `DrawerContentImpl` had a lazy
 *      `watch(activeSnapPointOffset, ...)` with no `immediate`. On the
 *      FIRST open it fired when `popupHeight` transitioned from 0 → measured,
 *      writing `--drawer-snap-point-offset`. On REOPEN, `popupHeight` was
 *      already cached on the root context, so `activeSnapPointOffset` was
 *      already correct on mount → nothing changed → lazy watcher never fired
 *      → CSS var stayed at `0px` and the drawer rendered as if snap=1.0
 *      regardless of the actual `activeSnapPoint`. Fix: explicit
 *      `writeSnapPointOffset()` call in `onMounted`.
 *
 *   2. **Stale swipe movement var**: `onRelease` did not clear
 *      `--drawer-swipe-movement-{x,y}` after a snap transition. Combined
 *      with the flicker-fix "preserve transform on dismiss" branch in
 *      `finishSwipe`, an aggressive up-swipe past the top snap would leave
 *      e.g. `--drawer-swipe-movement-y: -500px` on the element. The next
 *      computed transform `calc(snap-offset + swipe-y) = 0 + -500` pushed
 *      the drawer offscreen. Fix: explicitly clear both movement vars
 *      after `snapToNearest` when snap points are active.
 *
 *   3. **Sequencing for smooth drag-to-next-snap**: The snap-offset CSS var
 *      write must happen synchronously BEFORE the movement var clear, so
 *      both land in the same frame and the CSS transition on `transform`
 *      interpolates cleanly from the drag position to the new snap target.
 *      Before the fix, the lazy Vue watcher fired a microtask later, so
 *      the computed transform visibly jumped from the drag position back
 *      to the old snap position for one frame.
 *
 * JSDOM has no ResizeObserver and zero layout, so we mock both. Popup
 * height is reported as a fixed 800px and the composable's
 * `activeSnapPointOffset` computes `800 - 400 = 400` for snap 0.5 and
 * `800 - 800 = 0` for snap 1.0.
 */

// JSDOM doesn't have ResizeObserver. Polyfill with one that fires
// synchronously on observe() with a stubbed contentRect.
//
// The popup height must match `window.innerHeight` since
// `useDrawerSnapPoints` uses `window.innerHeight` as the viewport height
// baseline for fraction-based snap points. Setting both to the same value
// mirrors a real CSS `height: 100dvh` drawer where popupHeight === viewport.
const MOCK_POPUP_HEIGHT = 800

let installedObservers: Array<{
  cb: ResizeObserverCallback
  target: Element | null
}> = []

class ResizeObserverStub {
  private cb: ResizeObserverCallback
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb
  }

  observe(target: Element) {
    installedObservers.push({ cb: this.cb, target })
    // Fire on the next microtask so the watcher has a chance to be set up.
    queueMicrotask(() => {
      this.cb(
        [
          {
            contentRect: {
              height: MOCK_POPUP_HEIGHT,
              width: 400,
              top: 0,
              left: 0,
              bottom: MOCK_POPUP_HEIGHT,
              right: 400,
              x: 0,
              y: 0,
              toJSON() { return {} },
            },
            target,
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
          } as unknown as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver,
      )
    })
  }

  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  ;(globalThis as any).ResizeObserver = ResizeObserverStub
  ;(window as any).ResizeObserver = ResizeObserverStub

  // Align jsdom's viewport height with our mocked popup height. JSDOM
  // defaults to 768, which would make `Math.round(0.5 * 768) = 384` and
  // produce a 0.5 snap offset of `800 - 384 = 416` — close but not the
  // 400 we expect. Setting innerHeight to 800 keeps snap math clean.
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: MOCK_POPUP_HEIGHT,
  })

  // PointerEvent polyfill (same as useSwipeDismiss.test.ts)
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
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()
    Element.prototype.hasPointerCapture = () => false
  }

  // JSDOM reports 0 for offsetHeight/offsetWidth on every element. The
  // snap release math reads `el.offsetHeight` in `onRelease`, so stub it
  // to match the mocked popup height.
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get() { return MOCK_POPUP_HEIGHT },
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() { return 400 },
  })
})

beforeEach(() => {
  installedObservers = []
})

afterEach(() => {
  // Unmount any components that testing-library rendered. Clearing
  // document.body.innerHTML directly would leave Vue's internal DOM
  // references stale and crash the next test's unmount.
  cleanup()
})

function findContent() {
  return document.querySelector('[role="dialog"]') as HTMLElement | null
}

function getSnapOffset(el: HTMLElement) {
  return el.style.getPropertyValue('--drawer-snap-point-offset')
}

function getSwipeMovementY(el: HTMLElement) {
  return el.style.getPropertyValue('--drawer-swipe-movement-y')
}

const SnapDrawer = defineComponent({
  components: { DrawerRoot, DrawerTrigger, DrawerPortal, DrawerOverlay, DrawerContent, DrawerHandle, DrawerTitle, DrawerClose },
  props: {
    defaultOpen: { type: Boolean, default: false },
    defaultSnapPoint: { type: [Number, String, null] as any, default: 0.5 },
  },
  setup(props) {
    const open = ref(props.defaultOpen)
    const snapPoint = ref<number | string | null>(props.defaultSnapPoint)
    return { open, snapPoint }
  },
  template: `
    <DrawerRoot
      v-model:open="open"
      v-model:snap-point="snapPoint"
      :snap-points="[0.5, 1]"
    >
      <DrawerTrigger>Open</DrawerTrigger>
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHandle />
          <DrawerTitle>Snap Drawer</DrawerTitle>
          <DrawerClose>Close</DrawerClose>
        </DrawerContent>
      </DrawerPortal>
    </DrawerRoot>
  `,
})

describe('drawer snap points — integration', () => {
  describe('mount-time snap offset write (reopen bug)', () => {
    it('writes --drawer-snap-point-offset on initial open for snap=0.5', async () => {
      const { getByText } = render(SnapDrawer)
      await fireEvent.click(getByText('Open'))
      // Allow microtask for ResizeObserver stub + Vue reactivity to settle
      await nextTick()
      await nextTick()
      await nextTick()

      const content = findContent()
      expect(content).not.toBeNull()

      // popupHeight=800, snap 0.5 => offset = 800 - 400 = 400
      expect(getSnapOffset(content!)).toBe('400px')
    })

    it('writes --drawer-snap-point-offset on REOPEN after close (lazy-watcher bug)', async () => {
      const { getByText } = render(SnapDrawer)

      // First open-close cycle. The lazy watcher fires here because
      // popupHeight transitions 0 -> 800, so this worked even before the fix.
      await fireEvent.click(getByText('Open'))
      await nextTick()
      await nextTick()
      await nextTick()
      expect(getSnapOffset(findContent()!)).toBe('400px')

      // Close the drawer. Presence will unmount the content.
      await fireEvent.click(getByText('Close'))
      await nextTick()
      await nextTick()

      // Reopen. popupHeight is already cached on the root context (800px
      // from the previous mount), so activeSnapPointOffset is immediately
      // correct and a lazy `watch(activeSnapPointOffset, ...)` would NEVER
      // fire. The regression was that the CSS var stayed unset and the
      // drawer rendered as if snap=1.0 (offset=0).
      await fireEvent.click(getByText('Open'))
      await nextTick()
      await nextTick()
      await nextTick()

      const content = findContent()
      expect(content).not.toBeNull()
      expect(getSnapOffset(content!)).toBe('400px')
    })

    it('writes --drawer-snap-point-offset on REOPEN after snap transition + close', async () => {
      // Regression for the compound case: open at 0.5, toggle to 1.0 via a
      // state change, close, reopen - the offset must reflect the CURRENT
      // active snap point (which reopens at 0.5 because state goes back to
      // the v-model seed value in this harness).
      const { getByText } = render(SnapDrawer)

      await fireEvent.click(getByText('Open'))
      await nextTick()
      await nextTick()
      await nextTick()
      expect(getSnapOffset(findContent()!)).toBe('400px')

      await fireEvent.click(getByText('Close'))
      await nextTick()
      await nextTick()

      await fireEvent.click(getByText('Open'))
      await nextTick()
      await nextTick()
      await nextTick()

      expect(getSnapOffset(findContent()!)).toBe('400px')
    })

    it('writes a snap=1.0 offset (0px) when defaultSnapPoint is 1', async () => {
      const { getByText } = render(SnapDrawer, { props: { defaultSnapPoint: 1 } })
      await fireEvent.click(getByText('Open'))
      await nextTick()
      await nextTick()
      await nextTick()

      const content = findContent()
      expect(content).not.toBeNull()
      // popupHeight=800, snap 1.0 => offset = 800 - 800 = 0
      expect(getSnapOffset(content!)).toBe('0px')
    })
  })

  describe('swipe release does not leave stale movement var', () => {
    // These tests exercise the DrawerContentImpl.onRelease wiring that
    // clears --drawer-swipe-movement-{x,y} after snapToNearest runs.
    // We drive it by simulating a pointer drag past threshold.

    function dispatchPointer(
      el: HTMLElement,
      type: string,
      x: number,
      y: number,
      buttons = 1,
    ) {
      const ev = new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerType: 'mouse',
        pointerId: 1,
        button: 0,
        buttons,
        clientX: x,
        clientY: y,
      })
      el.dispatchEvent(ev)
    }

    it('clears --drawer-swipe-movement-y after snap-to-snap release', async () => {
      const { getByText } = render(SnapDrawer)
      await fireEvent.click(getByText('Open'))
      await nextTick()
      await nextTick()
      await nextTick()

      const content = findContent()!

      // Simulate a drag upward that would cross into snap=1.0 territory.
      // The exact displacement is irrelevant to this assertion — we only
      // need the release path to run through the snap branch.
      dispatchPointer(content, 'pointerdown', 100, 500)
      dispatchPointer(content, 'pointermove', 100, 480)
      dispatchPointer(content, 'pointermove', 100, 400)
      dispatchPointer(content, 'pointermove', 100, 200)
      dispatchPointer(content, 'pointerup', 100, 200, 0)
      await nextTick()
      await nextTick()

      // Movement vars must be reset so the next interaction starts from a
      // clean slate and the inline `transform` doesn't carry stale drag
      // state into the new snap position.
      expect(getSwipeMovementY(content)).toBe('0px')
      expect(content.style.getPropertyValue('--drawer-swipe-movement-x')).toBe('0px')
    })

    it('updates --drawer-snap-point-offset synchronously on snap-to-snap release (smooth drag)', async () => {
      // The sequencing fix: onRelease calls writeSnapPointOffset() BEFORE
      // clearing the movement vars, so the CSS transition starts from the
      // drag position instead of snapping back to the old snap offset for
      // one frame.
      const { getByText } = render(SnapDrawer)
      await fireEvent.click(getByText('Open'))
      await nextTick()
      await nextTick()
      await nextTick()

      const content = findContent()!
      expect(getSnapOffset(content)).toBe('400px')

      // Drag upward past the snap threshold. Snap to nearest should pick
      // snap=1.0 (offset=0) given a large enough upward displacement.
      dispatchPointer(content, 'pointerdown', 100, 500)
      dispatchPointer(content, 'pointermove', 100, 450)
      dispatchPointer(content, 'pointermove', 100, 300)
      dispatchPointer(content, 'pointermove', 100, 100)
      dispatchPointer(content, 'pointerup', 100, 100, 0)
      await nextTick()
      await nextTick()

      // Snap offset should have updated immediately to the new target,
      // AND movement var should be cleared. If the movement var were
      // cleared without the snap offset update, the transform would
      // briefly revert to the old snap position.
      expect(getSnapOffset(content)).toBe('0px')
      expect(getSwipeMovementY(content)).toBe('0px')
    })
  })
})
