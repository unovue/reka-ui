import { expect } from 'vitest'

// Browser tests only. Listening from import, in the capture phase, sees scrolls that start before
// a test waits on them (`scroll` and `scrollend` don't bubble, but capture listeners get them).

/** How many `scroll` events each scroller has fired since its last `scrollend`. */
const scrolls = new WeakMap<EventTarget, number>()
/** The position a smooth `scrollTo` is heading for, until the `scrollend` that ends it. */
const smoothTargets = new WeakMap<Element, { left?: number, top?: number }>()

if (typeof window !== 'undefined' && 'onscrollend' in window) {
  document.addEventListener('scroll', event => event.target && scrolls.set(event.target, (scrolls.get(event.target) ?? 0) + 1), { capture: true })
  document.addEventListener('scrollend', (event) => {
    if (!event.target)
      return
    scrolls.delete(event.target)
    smoothTargets.delete(event.target as Element)
  }, { capture: true })

  // A smooth scroll is in flight from the call, not from its first `scroll` event: under load the
  // first frame can come late, and its single event looks like an instant jump.
  const scrollTo = Element.prototype.scrollTo
  Element.prototype.scrollTo = function (this: Element, ...args: [ScrollToOptions?] | [number, number]) {
    const options = typeof args[0] === 'object' ? args[0] : undefined
    if (options?.behavior === 'smooth')
      smoothTargets.set(this, { left: options.left, top: options.top })
    else
      smoothTargets.delete(this)
    return (scrollTo as (...a: unknown[]) => void).apply(this, args)
  } as typeof scrollTo
}

/** Where `scroller` can actually scroll to along one axis: a target past an end stops at the end. */
function clamp(target: number, max: number) {
  return target < 0 ? Math.max(target, -max) : Math.min(target, max)
}

/**
 * Whether a scroll is in flight on `scroller`:
 * - a smooth `scrollTo` it was asked for has not ended. It ends with its `scrollend`, or once the
 *   scroller is at its target (a scroll to where it already is moves nothing and sends no event);
 * - or it moved more than once since its last `scrollend`. A single unpaired `scroll` is a jump,
 *   not an animation, and may get no `scrollend`: Chromium sends none for the instant scroll a
 *   carousel makes as it mounts on `defaultValue`.
 */
function scrolling(scroller: HTMLElement) {
  const target = smoothTargets.get(scroller)
  if (target) {
    const left = target.left === undefined || Math.abs(scroller.scrollLeft - clamp(target.left, scroller.scrollWidth - scroller.clientWidth)) < 1
    const top = target.top === undefined || Math.abs(scroller.scrollTop - clamp(target.top, scroller.scrollHeight - scroller.clientHeight)) < 1
    if (!left || !top)
      return true
    smoothTargets.delete(scroller)
  }
  return (scrolls.get(scroller) ?? 0) > 1
}

/**
 * Waits until `scroller` rests: no scroll in flight and its position held for 300ms.
 *
 * The position alone is not enough: on a loaded runner a smooth scroll or snap animation can
 * stall for longer than any short window, before it starts or part-way, so the scroll must also
 * have ended. A scroller that ends in the wrong place still rests, so the assertions after this
 * still fail.
 */
export async function settled(scroller: HTMLElement, timeout = 6000) {
  const readings: [number, number][] = []
  await expect.poll(() => {
    if (scrolling(scroller)) {
      readings.length = 0
      return false
    }
    readings.push([scroller.scrollLeft, scroller.scrollTop])
    const last = readings.slice(-4)
    return last.length === 4 && last.every(([left, top]) => Math.abs(left - last[0][0]) < 0.5 && Math.abs(top - last[0][1]) < 0.5)
  }, { interval: 100, timeout }).toBe(true)
}
