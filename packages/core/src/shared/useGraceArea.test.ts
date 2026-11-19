import type { Ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useGraceArea } from './useGraceArea'

// Characterization tests for `useGraceArea`.
//
// `useGraceArea(triggerElement, containerElement)` builds a convex-hull "grace
// polygon" out of the two elements' bounding boxes whenever the pointer leaves
// one of them (a `pointerleave`). While the pointer stays inside that polygon
// `isPointerInTransit` stays `true`; once the pointer moves outside the polygon
// (tracked via a document `pointermove` listener) it fires `onPointerExit` and
// resets the state. There's also a 300ms auto-reset and an unmount reset.
//
// Geometry note (precomputed):
//   trigger rect:   top:0  left:0   right:100 bottom:100  (100x100)
//   container rect: top:0  left:200 right:300 bottom:100  (100x100)
//   A `pointerleave` on the trigger at (100,50) exits the 'right' side; the
//   padded exit points sit near (99,49)/(99,51) and the resulting hull spans
//   x in [99,300]. So (150,50) is inside the hull and (150,500) is outside.
//
// jsdom note: `getBoundingClientRect` returns all-zero rects, so we stub it per
// element. jsdom does provide `PointerEvent`; we fall back to `MouseEvent`
// (which also carries clientX/clientY) if it ever doesn't.

function makeRect(rect: Partial<DOMRect>): DOMRect {
  return {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    ...rect,
    toJSON: () => ({}),
  } as DOMRect
}

function pointerEvent(type: string, init: { clientX?: number, clientY?: number, bubbles?: boolean }) {
  const Ctor = typeof PointerEvent !== 'undefined' ? PointerEvent : MouseEvent
  return new Ctor(type, { bubbles: true, ...init }) as PointerEvent
}

interface Harness {
  isPointerInTransit: Ref<boolean>
  onPointerExit: ReturnType<typeof useGraceArea>['onPointerExit']
}

function mountGraceArea(trigger: HTMLElement, container: HTMLElement) {
  const result: { value: Harness | null } = { value: null }
  const wrapper = mount({
    template: '<p>grace</p>',
    setup() {
      // Refs are initialised to the (already mounted) elements so that the
      // first `watchEffect` registers the `pointerleave` listeners immediately.
      const triggerRef = ref(trigger) as Ref<HTMLElement | undefined>
      const containerRef = ref(container) as Ref<HTMLElement | undefined>
      const api = useGraceArea(triggerRef, containerRef)
      result.value = api
      return api
    },
  }, { attachTo: document.body })

  return { wrapper, api: result.value as Harness }
}

describe('useGraceArea', () => {
  let trigger: HTMLElement
  let container: HTMLElement
  let wrapper: ReturnType<typeof mountGraceArea>['wrapper'] | null

  function setup() {
    trigger = document.createElement('div')
    container = document.createElement('div')
    document.body.appendChild(trigger)
    document.body.appendChild(container)

    trigger.getBoundingClientRect = () =>
      makeRect({ top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0 })
    container.getBoundingClientRect = () =>
      makeRect({ top: 0, left: 200, right: 300, bottom: 100, width: 100, height: 100, x: 200, y: 0 })

    const mounted = mountGraceArea(trigger, container)
    wrapper = mounted.wrapper
    return mounted.api
  }

  afterEach(() => {
    vi.useRealTimers()
    wrapper?.unmount()
    wrapper = null
    trigger?.remove()
    container?.remove()
  })

  it('sets isPointerInTransit to true on a trigger pointerleave', () => {
    const api = setup()
    expect(api.isPointerInTransit.value).toBe(false)

    trigger.dispatchEvent(pointerEvent('pointerleave', { clientX: 100, clientY: 50 }))

    expect(api.isPointerInTransit.value).toBe(true)
  })

  it('keeps isPointerInTransit true and does not fire exit for a pointermove inside the hull', async () => {
    const api = setup()
    const exitSpy = vi.fn()
    api.onPointerExit(exitSpy)

    trigger.dispatchEvent(pointerEvent('pointerleave', { clientX: 100, clientY: 50 }))
    // Let the second watchEffect register the document `pointermove` listener.
    await nextTick()

    // (150,50) is inside the hull. Dispatch from `document.body` so the target
    // is NOT inside trigger/container (avoids the "entered target" branch).
    document.body.dispatchEvent(pointerEvent('pointermove', { clientX: 150, clientY: 50 }))

    expect(api.isPointerInTransit.value).toBe(true)
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it('fires onPointerExit and resets when a pointermove leaves the hull', async () => {
    const api = setup()
    const exitSpy = vi.fn()
    api.onPointerExit(exitSpy)

    trigger.dispatchEvent(pointerEvent('pointerleave', { clientX: 100, clientY: 50 }))
    await nextTick()

    // (150,500) is well outside the hull.
    document.body.dispatchEvent(pointerEvent('pointermove', { clientX: 150, clientY: 500 }))

    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(api.isPointerInTransit.value).toBe(false)
  })

  it('removes the grace area without firing exit when the pointer enters the container', async () => {
    const api = setup()
    const exitSpy = vi.fn()
    api.onPointerExit(exitSpy)

    trigger.dispatchEvent(pointerEvent('pointerleave', { clientX: 100, clientY: 50 }))
    await nextTick()
    expect(api.isPointerInTransit.value).toBe(true)

    // Dispatch on the container so `event.target` is the container element and
    // `containerElement.contains(target)` is true -> "entered target" branch.
    // The coordinates would otherwise be outside the hull, proving the
    // hasEnteredTarget branch wins.
    container.dispatchEvent(pointerEvent('pointermove', { clientX: 150, clientY: 500 }))

    expect(exitSpy).not.toHaveBeenCalled()
    expect(api.isPointerInTransit.value).toBe(false)
  })

  it('auto-resets isPointerInTransit after 300ms', () => {
    vi.useFakeTimers()
    const api = setup()

    trigger.dispatchEvent(pointerEvent('pointerleave', { clientX: 100, clientY: 50 }))
    expect(api.isPointerInTransit.value).toBe(true)

    vi.advanceTimersByTime(300)
    expect(api.isPointerInTransit.value).toBe(false)
  })

  it('resets isPointerInTransit to false on unmount', () => {
    const api = setup()

    trigger.dispatchEvent(pointerEvent('pointerleave', { clientX: 100, clientY: 50 }))
    expect(api.isPointerInTransit.value).toBe(true)

    wrapper?.unmount()
    wrapper = null
    expect(api.isPointerInTransit.value).toBe(false)
  })
})
