import { expect } from 'vitest'

// Browser tests only: how many `scroll` events each scroller has fired since its last
// `scrollend`. Listening from import, in the capture phase, sees scrolls that start before a test
// waits on them (`scroll` and `scrollend` don't bubble, but capture listeners get them).
const scrolls = new WeakMap<EventTarget, number>()
if (typeof window !== 'undefined' && 'onscrollend' in window) {
  document.addEventListener('scroll', event => event.target && scrolls.set(event.target, (scrolls.get(event.target) ?? 0) + 1), { capture: true })
  document.addEventListener('scrollend', event => event.target && scrolls.delete(event.target), { capture: true })
}

/**
 * Whether a scroll is in flight on `scroller`: it moved more than once since its last `scrollend`.
 * A single unpaired `scroll` is a jump, not an animation, and may get no `scrollend`: Chromium
 * sends none for the instant scroll a carousel makes as it mounts on `defaultValue`.
 */
function scrolling(scroller: HTMLElement) {
  return (scrolls.get(scroller) ?? 0) > 1
}

/**
 * Waits until `scroller` rests: no scroll in flight and its position held for 300ms.
 *
 * The position alone is not enough: on a loaded runner a smooth scroll or snap animation can
 * stall mid-way for longer than any short window, so the scroll must also have ended. A scroller
 * that ends in the wrong place still rests, so the assertions after this still fail.
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
