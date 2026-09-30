import type { DrawerOpenChangeDetails } from '.'
import { cleanup, render } from '@testing-library/vue'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import {
  DrawerContent,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
} from '.'

/**
 * Swipe dismissal that the consumer rejects, either by calling
 * `details.cancel()` in `update:open` or by never updating a controlled `open`.
 * The drawer must settle back open instead of staying offset and marked
 * `data-swipe-dismissed` (#2933).
 */

const MOCK_POPUP_HEIGHT = 800

beforeAll(() => {
  // JSDOM does not implement PointerEvent or pointer capture.
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
  // Report the popup height so snap points resolve.
  ;(globalThis as any).ResizeObserver = class {
    constructor(private cb: ResizeObserverCallback) {}
    observe(target: Element) {
      queueMicrotask(() => this.cb(
        [{ target, contentRect: { height: MOCK_POPUP_HEIGHT, width: 400 } } as unknown as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      ))
    }

    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: MOCK_POPUP_HEIGHT })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get() { return MOCK_POPUP_HEIGHT },
  })
})

afterEach(() => {
  cleanup()
})

function findContent() {
  return document.querySelector<HTMLElement>('[role="dialog"]')
}

function dispatchPointer(el: HTMLElement, type: string, y: number, buttons = 1) {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerType: 'mouse',
    pointerId: 1,
    button: 0,
    buttons,
    clientX: 100,
    clientY: y,
  })
  // A zero timestamp makes the release velocity read as zero, so the outcome
  // is decided by displacement alone.
  Object.defineProperty(event, 'timeStamp', { value: 0, configurable: true })
  el.dispatchEvent(event)
}

/** Drags the popup down well past the dismiss threshold and releases it. */
async function swipeDown(el: HTMLElement) {
  dispatchPointer(el, 'pointerdown', 100)
  dispatchPointer(el, 'pointermove', 120)
  dispatchPointer(el, 'pointermove', 700)
  dispatchPointer(el, 'pointerup', 700, 0)
  await nextTick()
  await nextTick()
}

function expectSettledOpen(el: HTMLElement) {
  expect(el.getAttribute('data-state')).toBe('open')
  expect(el.hasAttribute('data-swipe-dismissed')).toBe(false)
  expect(el.style.getPropertyValue('--drawer-swipe-movement-y')).toBe('0px')
}

function renderDrawer(options: {
  controlled?: 'accept' | 'ignore'
  snapPoints?: number[]
  onOpenChange?: (open: boolean, details: DrawerOpenChangeDetails) => void
}) {
  const onOpenChange = vi.fn(options.onOpenChange)
  const Test = defineComponent({
    components: { DrawerRoot, DrawerPortal, DrawerContent, DrawerTitle },
    setup() {
      const open = ref(true)
      function onUpdate(value: boolean, details: DrawerOpenChangeDetails) {
        onOpenChange(value, details)
        if (options.controlled === 'accept')
          open.value = value
      }
      return { open, onUpdate, controlled: options.controlled, snapPoints: options.snapPoints }
    },
    template: `
      <DrawerRoot
        :open="controlled ? open : undefined"
        :default-open="true"
        :snap-points="snapPoints"
        @update:open="onUpdate"
      >
        <DrawerPortal>
          <DrawerContent>
            <DrawerTitle>Swipe</DrawerTitle>
          </DrawerContent>
        </DrawerPortal>
      </DrawerRoot>
    `,
  })
  render(Test)
  return { onOpenChange }
}

describe('drawer swipe dismissal', () => {
  it('settles back open when update:open cancels the swipe', async () => {
    const { onOpenChange } = renderDrawer({
      onOpenChange: (_open, details) => details.cancel(),
    })
    await nextTick()
    const content = findContent()!

    await swipeDown(content)

    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'swipe', isCanceled: true }))
    expect(findContent()).toBe(content)
    expectSettledOpen(content)
  })

  it('settles back open when a controlled parent ignores the close', async () => {
    const { onOpenChange } = renderDrawer({ controlled: 'ignore' })
    await nextTick()
    const content = findContent()!

    await swipeDown(content)
    await nextTick()

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'swipe' }))
    expect(findContent()).toBe(content)
    expectSettledOpen(content)
  })

  it('closes when a controlled parent accepts the close', async () => {
    renderDrawer({ controlled: 'accept' })
    await nextTick()
    const content = findContent()!

    await swipeDown(content)
    await nextTick()

    expect(content.getAttribute('data-state')).toBe('closed')
    expect(content.hasAttribute('data-swipe-dismissed')).toBe(true)
  })

  it('reports a snap-point dismissal as a swipe and lets it be canceled', async () => {
    const { onOpenChange } = renderDrawer({
      snapPoints: [1],
      onOpenChange: (_open, details) => details.cancel(),
    })
    await nextTick()
    await nextTick()
    const content = findContent()!

    await swipeDown(content)

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'swipe', isCanceled: true }))
    expectSettledOpen(content)
  })
})
