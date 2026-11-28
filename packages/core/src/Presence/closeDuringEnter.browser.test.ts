import type { Component, Ref, VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref, Transition } from 'vue'
import { DialogContent, DialogPortal, DialogRoot, DialogTitle } from '@/Dialog'
import { DrawerPopup, DrawerPortal, DrawerRoot, DrawerTitle } from '@/Drawer'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '@/Select'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'
import { Presence } from '.'

// Real Chromium: a close while the enter is still running starts the exit from
// the current opacity and goes straight back down. It never plays the enter on to
// full opacity first.

// Long enough that the frames a close takes to reach the DOM (a part that defers
// its unmount, a `<Transition>` starting its leave) stay well under the limit.
const DURATION = 1000
/**
 * How far the opacity may still go up after the close: some frames of the enter
 * (a part can take a few to unmount on a slow runner), far from playing it on to 1.
 */
const GOING_ON_LIMIT = 0.25

const styleElements: HTMLStyleElement[] = []
function addStyles(css: string) {
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
  styleElements.push(style)
}

afterEach(() => {
  styleElements.splice(0).forEach(style => style.remove())
})

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

const popup = () => document.querySelector<HTMLElement>('[data-testid="popup"]')

/** The opacity the popup shows with: its own times that of every ancestor (a positioning wrapper can carry the transition). */
function shownOpacity(element: HTMLElement) {
  let value = 1
  for (let node: HTMLElement | null = element; node; node = node.parentElement)
    value *= Number(getComputedStyle(node).opacity)
  return value
}

/**
 * Opens, closes halfway through the enter, and returns the opacity at the close
 * and the highest one in any frame after it, until the popup leaves the DOM.
 */
async function closeDuringEnter(open: Ref<boolean>) {
  // The portal mounts its teleport after the first render: let it settle, so the
  // `<Transition>` is mounted before the open, as on a real page.
  await nextFrame()
  open.value = true
  await nextTick()
  await nextFrame()
  await wait(DURATION / 2)
  const atClose = shownOpacity(popup()!)
  open.value = false

  let highest = 0
  let frames = 0
  const start = performance.now()
  while (popup() && performance.now() - start < DURATION * 2) {
    highest = Math.max(highest, shownOpacity(popup()!))
    frames++
    await nextFrame()
  }
  return { atClose, highest, frames, gone: !popup() }
}

const TRANSITION_STYLES = `
  .motion { transition: opacity ${DURATION}ms linear; }
  .hidden { opacity: 0; }
`
const transitionProps = { enterActiveClass: 'motion', leaveActiveClass: 'motion', enterFromClass: 'hidden', leaveToClass: 'hidden' }

interface Family {
  name: string
  render: (open: Ref<boolean>, content: () => VNode) => VNode
  content: () => VNode
}

const families: Family[] = [
  {
    name: 'Dialog',
    render: (open, content) => h(DialogRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => { open.value = value } }, () =>
      h(DialogPortal, () => h(Transition, transitionProps, content))),
    content: () => h(DialogContent, { 'data-testid': 'popup', 'aria-describedby': undefined }, () => h(DialogTitle, () => 'Title')),
  },
  {
    name: 'Drawer',
    render: (open, content) => h(DrawerRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => { open.value = value } }, () =>
      h(DrawerPortal, () => h(Transition, transitionProps, content))),
    content: () => h(DrawerPopup, { 'data-testid': 'popup', 'aria-describedby': undefined }, () => h(DrawerTitle, () => 'Title')),
  },
  {
    name: 'Popover',
    render: (open, content) => h(PopoverRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => { open.value = value } }, () => [
      h(PopoverTrigger, () => 'Open'),
      h(PopoverPortal, () => h(Transition, transitionProps, content)),
    ]),
    content: () => h(PopoverContent, { 'data-testid': 'popup' }, () => 'Content'),
  },
  {
    name: 'DropdownMenu',
    render: (open, content) => h(DropdownMenuRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => { open.value = value } }, () => [
      h(DropdownMenuTrigger, () => 'Open'),
      h(DropdownMenuPortal, () => h(Transition, transitionProps, content)),
    ]),
    content: () => h(DropdownMenuContent, { 'data-testid': 'popup' }, () => h(DropdownMenuItem, () => 'Item')),
  },
  {
    name: 'Select',
    render: (open, content) => h(SelectRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => { open.value = value }, 'defaultValue': 'apple' }, () => [
      h(SelectTrigger, () => h(SelectValue)),
      h(SelectPortal, () => h(Transition, transitionProps, content)),
    ]),
    content: () => h(SelectContent, { 'data-testid': 'popup', 'position': 'popper' }, () =>
      h(SelectViewport, () => h(SelectItem, { value: 'apple' }, () => h(SelectItemText, () => 'Apple')))),
  },
  {
    name: 'Tooltip',
    render: (open, content) => h(TooltipProvider, () => h(TooltipRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => { open.value = value } }, () => [
      h(TooltipTrigger, () => 'Open'),
      h(TooltipPortal, () => h(Transition, transitionProps, content)),
    ])),
    content: () => h(TooltipContent, { 'data-testid': 'popup' }, () => 'Tip'),
  },
]

describe('a close during the enter of a Vue <Transition> around the content', () => {
  it.each(families)('$name: goes back from where it is', async ({ render, content }) => {
    addStyles(TRANSITION_STYLES)
    const open = ref(false)
    mount(defineComponent({ setup: () => () => render(open, content) }), {
      attachTo: document.body,
      // Test utils replace `<Transition>` with a stub that runs no enter or leave.
      global: { stubs: { transition: false } },
    })

    const { atClose, highest, frames, gone } = await closeDuringEnter(open)
    expect(atClose).toBeGreaterThan(0.2)
    expect(atClose).toBeLessThan(0.8)
    // The leave ran (the popup stayed for some frames) and then removed it.
    expect(frames).toBeGreaterThan(3)
    expect(gone).toBe(true)
    expect(highest).toBeLessThan(atClose + GOING_ON_LIMIT)
  })
})

describe('a close during the enter of an animation on the presence state', () => {
  it('waits for an enter animation that the closed state reverses in place', async () => {
    // Changing only `animation-direction` updates the running animation instead of
    // replacing it: it is still the exit, so it holds the node.
    addStyles(`
      @keyframes close-during-enter-fade { from { opacity: 0 } to { opacity: 1 } }
      .box { animation: close-during-enter-fade ${DURATION}ms linear both; }
      .box[data-ending-style] { animation-direction: reverse; }
    `)
    const open = ref(false)
    const Fixture = defineComponent({
      setup: () => () => h(Presence as Component, { present: open.value }, {
        default: () => h('div', { 'class': 'box', 'data-testid': 'popup' }, 'Content'),
      }),
    })
    mount(Fixture, { attachTo: document.body })

    const { atClose, frames, gone } = await closeDuringEnter(open)
    expect(atClose).toBeGreaterThan(0.2)
    expect(atClose).toBeLessThan(0.8)
    // Held for the reversed run, then removed.
    expect(frames).toBeGreaterThan(3)
    expect(gone).toBe(true)
  })
})

describe('a close during the enter of a transition on the presence state', () => {
  it('still waits for the exit transition the closed state starts, from where the enter was', async () => {
    addStyles(`
      .box { opacity: 1; transition: opacity ${DURATION}ms linear; }
      .box[data-starting-style], .box[data-ending-style] { opacity: 0; }
    `)
    const open = ref(false)
    const Fixture = defineComponent({
      setup: () => () => h(Presence as Component, { present: open.value }, {
        default: () => h('div', { 'class': 'box', 'data-testid': 'popup' }, 'Content'),
      }),
    })
    mount(Fixture, { attachTo: document.body })

    const { atClose, highest, frames, gone } = await closeDuringEnter(open)
    expect(atClose).toBeGreaterThan(0.2)
    expect(atClose).toBeLessThan(0.8)
    expect(frames).toBeGreaterThan(3)
    expect(gone).toBe(true)
    expect(highest).toBeLessThan(atClose + GOING_ON_LIMIT)
  })
})
