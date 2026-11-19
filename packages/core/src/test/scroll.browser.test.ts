import { afterEach, describe, expect, it } from 'vitest'
import { settled } from './scroll'

function mountScroller() {
  document.body.innerHTML = '<div data-testid="scroller" style="width: 200px; overflow: auto"><div style="width: 1000px; height: 50px"></div></div>'
  return document.querySelector<HTMLElement>('[data-testid="scroller"]')!
}

/**
 * While `stalled` is set, lets one `scroll` event through and holds back the rest, and every
 * `scrollend`: a scroll that stalled after one frame sends nothing more and hasn't ended.
 * Engines differ in how many events the jump below sends, so this makes it the same everywhere.
 */
let stalled = false
let frames = 0
window.addEventListener('scroll', event => stalled && frames++ > 0 && event.stopImmediatePropagation(), { capture: true })
window.addEventListener('scrollend', event => stalled && event.stopImmediatePropagation(), { capture: true })

afterEach(() => {
  stalled = false
  frames = 0
  document.body.innerHTML = ''
})

describe('settled', () => {
  // A loaded runner can deliver a smooth scroll's first frame late, as one `scroll` event that
  // looks like an instant jump, then stall for far longer than the 300ms window.
  it('waits out a smooth scroll that stalls after one frame', async () => {
    const scroller = mountScroller()
    scroller.scrollTo({ left: 200, behavior: 'smooth' })
    // Stands in for the stall: one frame part-way, then nothing until the scroll goes on.
    stalled = true
    scroller.scrollLeft = 60
    setTimeout(() => {
      stalled = false
      scroller.scrollTo({ left: 200, behavior: 'smooth' })
    }, 1500)
    await settled(scroller)
    expect(scroller.scrollLeft).toBe(200)
  })

  it('does not wait for a smooth scroll to where the scroller already is', async () => {
    const scroller = mountScroller()
    scroller.scrollTo({ left: 0, behavior: 'smooth' })
    await settled(scroller, 1000)
    expect(scroller.scrollLeft).toBe(0)
  })

  it('does not wait for a smooth scroll past the end, which stops at the end', async () => {
    const scroller = mountScroller()
    scroller.scrollLeft = 800
    await settled(scroller, 1000)
    scroller.scrollTo({ left: 5000, behavior: 'smooth' })
    await settled(scroller, 1000)
    expect(scroller.scrollLeft).toBe(800)
  })

  it('does not wait for a smooth scroll before the start, which stays at the start', async () => {
    const scroller = mountScroller()
    scroller.scrollTo({ left: -50, behavior: 'smooth' })
    await settled(scroller, 1000)
    expect(scroller.scrollLeft).toBe(0)
  })

  it('does not wait for a smooth scroll that moved nothing when the content grows after it', async () => {
    const scroller = mountScroller()
    scroller.scrollLeft = 800
    await settled(scroller, 1000)
    scroller.scrollTo({ left: 5000, behavior: 'smooth' })
    // The range grows past 800 only now: the scroll still moved nothing.
    ;(scroller.firstElementChild as HTMLElement).style.width = '1200px'
    await settled(scroller, 1000)
    expect(scroller.scrollLeft).toBe(800)
  })

  it('waits for a smooth scroll in RTL, where the range is negative', async () => {
    const scroller = mountScroller()
    scroller.dir = 'rtl'
    scroller.scrollTo({ left: 50, behavior: 'smooth' })
    await settled(scroller, 1000)
    expect(scroller.scrollLeft).toBe(0)
    scroller.scrollTo({ left: -5000, behavior: 'smooth' })
    await settled(scroller)
    expect(scroller.scrollLeft).toBe(-800)
  })
})
