// #2789 review: Drawer openComplete follows Base UI's useAnimationsFinished.
import { fireEvent, render } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { sleep } from '@/test'
import { DrawerClose, DrawerContent, DrawerPortal, DrawerRoot, DrawerTitle, DrawerTrigger } from '.'

function drawer(rootProps: Record<string, unknown> = {}, contentProps: Record<string, unknown> = {}) {
  return defineComponent({
    setup() {
      return () => h(DrawerRoot, rootProps, () => [
        h(DrawerTrigger, null, () => 'Open'),
        h(DrawerPortal, null, () => h(DrawerContent, { 'aria-describedby': undefined, ...contentProps }, () => [
          h(DrawerTitle, null, () => 'Title'),
          h(DrawerClose, null, () => 'Close'),
        ])),
      ])
    },
  })
}

function fakeAnimation(finished: Promise<unknown>, endTime = 300): Animation {
  const animation = { finished, playState: 'running', effect: { getComputedTiming: () => ({ endTime }) } }
  // Real animations leave the running state once `finished` settles.
  finished.then(
    () => {
      animation.playState = 'finished'
    },
    () => {
      animation.playState = 'idle'
    },
  )
  return animation as unknown as Animation
}

describe('drawerRoot update:openComplete matches Base UI', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })
  afterEach(() => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations
  })

  // Base UI filters with isFiniteAnimation(); an infinite animation on the popup
  // (e.g. a shimmer/pulse on the popup element) must not block openComplete.
  it('fires openComplete(true) even when the popup runs an infinite animation', async () => {
    HTMLElement.prototype.getAnimations = vi.fn(() => [fakeAnimation(new Promise(() => {}), Infinity)])
    const onOpenComplete = vi.fn()
    const { getByText } = render(drawer({ 'onUpdate:openComplete': onOpenComplete }))
    await fireEvent.click(getByText('Open'))
    await sleep(100)
    expect(onOpenComplete).toHaveBeenCalledWith(true)
  })

  // Base UI re-runs getAnimations() when `finished` rejects (cancelled /
  // retargeted animation) and waits for the replacement; the first #3085 revision treated a
  // rejection as finished and reported early.
  it('waits for the replacement when the running animation is cancelled', async () => {
    // A is running when first read; 20ms later it is cancelled (retargeted)
    // and B replaces it, as a browser does when an animated property changes.
    let cancelA!: () => void
    const a = fakeAnimation(new Promise((_, reject) => { cancelA = () => reject(new DOMException('aborted', 'AbortError')) }))
    let firstRead = true
    let finishB!: () => void
    const b = fakeAnimation(new Promise<void>((r) => { finishB = r }))
    HTMLElement.prototype.getAnimations = vi.fn(function (this: HTMLElement) {
      if (this.getAttribute('role') !== 'dialog')
        return []
      if (firstRead) {
        firstRead = false
        setTimeout(cancelA, 20)
      }
      return [a, b].filter(x => x.playState === 'running' && (x === a || a.playState !== 'running'))
    })
    const onOpenComplete = vi.fn()
    const { getByText } = render(drawer({ 'onUpdate:openComplete': onOpenComplete }))
    await fireEvent.click(getByText('Open'))
    await sleep(100)
    expect(onOpenComplete).not.toHaveBeenCalled()
    finishB()
    await vi.waitFor(() => expect(onOpenComplete).toHaveBeenCalledWith(true))
  })
})
