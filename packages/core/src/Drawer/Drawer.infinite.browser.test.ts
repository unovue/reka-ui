// #2789 review: an infinite animation on the popup must not block openComplete(true), in real Chromium.
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { DrawerClose, DrawerContent, DrawerPortal, DrawerRoot, DrawerTitle, DrawerTrigger } from '.'

const mounted: { unmount: () => void }[] = []
let style: HTMLStyleElement | undefined

describe('drawerRoot openComplete with an infinite popup animation', () => {
  afterEach(() => {
    style?.remove()
    mounted.splice(0).forEach(w => w.unmount())
  })

  it('reports openComplete(true) although the popup pulses forever (Base UI isFiniteAnimation)', async () => {
    style = document.createElement('style')
    style.textContent = `
      @keyframes drawer-in { from { opacity: 0 } }
      @keyframes pulse { 50% { outline-color: red } }
      .popup[data-state="open"] { animation: drawer-in 200ms, pulse 1s infinite }
    `
    document.head.append(style)
    const onOpenComplete = vi.fn()
    const Fixture = defineComponent({
      setup: () => () => h(DrawerRoot, { 'onUpdate:openComplete': onOpenComplete }, () => [
        h(DrawerTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
        h(DrawerPortal, null, () => h(DrawerContent, { 'class': 'popup', 'style': 'position:fixed;left:0;right:0;bottom:0;z-index:1;background:white;outline:2px solid transparent', 'aria-describedby': undefined }, () => [
          h(DrawerTitle, null, () => 'Title'),
          h(DrawerClose, null, () => 'Close'),
        ])),
      ]),
    })
    mounted.push(mount(Fixture, { attachTo: document.body }))
    await userEvent.click(document.querySelector<HTMLElement>('[data-testid="trigger"]')!)
    await expect.poll(() => onOpenComplete.mock.calls, { timeout: 1500 }).toEqual([[true]])
  })
})
