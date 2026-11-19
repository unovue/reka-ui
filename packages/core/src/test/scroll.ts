import { expect } from 'vitest'

// Browser tests only. Listening from import, in the capture phase, sees scrolls that start before
// a test waits on them (`scroll` and `scrollend` don't bubble, but capture listeners get them).

/** How many `scroll` events each scroller has fired since its last `scrollend`. */
const scrolls = new WeakMap<EventTarget, number>()
/**
 * Where a smooth `scrollTo` is heading, clamped to the scroll range when it was called, until the
 * `scrollend` that ends it.
 */
const smoothTargets = new WeakMap<Element, { left?: number, top?: number }>()

/**
 * The range an axis scrolls over. It runs from `-max` to 0 where the content overflows towards the
 * start: `scrollLeft` in RTL, or in a right-to-left vertical writing mode.
 */
function range(el: Element, axis: 'left' | 'top'): [number, number] {
  const max = axis === 'left' ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight
  const style = getComputedStyle(el)
  const reversed = axis === 'left' && (style.writingMode.startsWith('horizontal') ? style.direction === 'rtl' : style.writingMode.endsWith('rl'))
  return reversed ? [-max, 0] : [0, max]
}

/**
 * The target of a smooth `scrollTo`, clamped now, or `undefined` if it moves nothing: the browser
 * clamps it to the range at the call too, and a scroll that moves nothing sends no event. Decided
 * once: content that grows later doesn't turn a scroll that moved nothing into one on its way.
 */
function smoothTarget(el: Element, options: ScrollToOptions) {
  const target: { left?: number, top?: number } = {}
  let moves = false
  for (const axis of ['left', 'top'] as const) {
    const value = options[axis]
    if (value === undefined || Number.isNaN(value))
      continue
    const [min, max] = range(el, axis)
    const clamped = Math.min(Math.max(value, min), max)
    target[axis] = clamped
    moves ||= Math.abs(clamped - (axis === 'left' ? el.scrollLeft : el.scrollTop)) >= 1
  }
  return moves ? target : undefined
}

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
    const target = options?.behavior === 'smooth' ? smoothTarget(this, options) : undefined
    if (target)
      smoothTargets.set(this, target)
    else
      smoothTargets.delete(this)
    return (scrollTo as (...a: unknown[]) => void).apply(this, args)
  } as typeof scrollTo
}

/**
 * Whether a scroll is in flight on `scroller`:
 * - a smooth `scrollTo` it was asked for has not ended. It ends with its `scrollend`, or once the
 *   scroller is at its target;
 * - or it moved more than once since its last `scrollend`. A single unpaired `scroll` is a jump,
 *   not an animation, and may get no `scrollend`: Chromium sends none for the instant scroll a
 *   carousel makes as it mounts on `defaultValue`.
 */
function scrolling(scroller: HTMLElement) {
  const target = smoothTargets.get(scroller)
  if (target) {
    const left = target.left === undefined || Math.abs(scroller.scrollLeft - target.left) < 1
    const top = target.top === undefined || Math.abs(scroller.scrollTop - target.top) < 1
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
