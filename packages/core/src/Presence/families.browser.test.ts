import type { VNodeChild } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import {
  CollapsibleContent,
  CollapsibleRoot,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectViewport,
  ToastProvider,
  ToastRoot,
  ToastViewport,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '..'

// #2827 in a real browser: each family's content enters from
// `data-starting-style` with a plain CSS transition, stays mounted with
// `data-ending-style` until the exit transition finishes, and its root emits
// `update:openComplete` when each direction settles.

const DURATION = 120

let style: HTMLStyleElement
beforeEach(() => {
  style = document.createElement('style')
  style.textContent = `
    .fade { opacity: 1; transition: opacity ${DURATION}ms linear; }
    .fade[data-starting-style], .fade[data-ending-style] { opacity: 0; }
    @keyframes families-fade-out { from { opacity: 1; } to { opacity: 0; } }
    .keyframes[data-state=closed] { animation: families-fade-out ${DURATION}ms linear; }
  `
  document.head.appendChild(style)
})
afterEach(() => {
  style.remove()
})

const getContent = () => document.querySelector<HTMLElement>('[data-testid="content"]')
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

/** Whether the content element carried `data-starting-style` when it was inserted (or shown again). */
function watchInsertion() {
  const result = { hadStartingStyle: undefined as boolean | undefined }
  const observer = new MutationObserver(() => {
    const element = getContent()
    if (element && result.hadStartingStyle === undefined && !element.hidden)
      result.hadStartingStyle = element.hasAttribute('data-starting-style')
  })
  observer.observe(document.body, { subtree: true, childList: true, attributes: true })
  return { result, stop: () => observer.disconnect() }
}

interface Case {
  name: string
  render: (open: boolean, onOpenComplete: (value: boolean) => void) => VNodeChild
  /** Collapsible keeps its content in the DOM (hidden) once closed. */
  staysInDom?: boolean
}

const content = { 'data-testid': 'content', 'class': 'fade' }

const cases: Case[] = [
  {
    name: 'Dialog',
    render: (open, onOpenComplete) => h(DialogRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () => h(DialogPortal, () => [
      h(DialogOverlay, { class: 'fade' }),
      h(DialogContent, content, () => [h(DialogTitle, () => 'Title'), h(DialogDescription, () => 'Description')]),
    ])),
  },
  {
    name: 'Popover',
    render: (open, onOpenComplete) => h(PopoverRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () => [
      h(PopoverTrigger, () => 'Open'),
      h(PopoverPortal, () => h(PopoverContent, content, () => 'Content')),
    ]),
  },
  {
    name: 'Tooltip',
    render: (open, onOpenComplete) => h(TooltipProvider, () => h(TooltipRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () => [
      h(TooltipTrigger, () => 'Trigger'),
      h(TooltipPortal, () => h(TooltipContent, content, () => 'Content')),
    ])),
  },
  {
    name: 'DropdownMenu',
    render: (open, onOpenComplete) => h(DropdownMenuRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () => [
      h(DropdownMenuTrigger, () => 'Open'),
      h(DropdownMenuPortal, () => h(DropdownMenuContent, content, () => h(DropdownMenuItem, () => 'Item'))),
    ]),
  },
  {
    name: 'Select',
    render: (open, onOpenComplete) => h(SelectRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () => [
      h(SelectTrigger, () => 'Open'),
      h(SelectPortal, () => h(SelectContent, { ...content, position: 'popper' }, () =>
        h(SelectViewport, () => h(SelectItem, { value: 'a' }, () => h(SelectItemText, () => 'A'))))),
    ]),
  },
  {
    name: 'Collapsible',
    staysInDom: true,
    render: (open, onOpenComplete) => h(CollapsibleRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () =>
      h(CollapsibleContent, content, () => 'Content')),
  },
]

async function mountCase(testCase: Case) {
  const open = ref(false)
  const onOpenComplete = vi.fn()
  mount(defineComponent({
    setup: () => () => h('div', { style: 'padding: 100px;' }, [testCase.render(open.value, onOpenComplete)]),
  }), { attachTo: document.body })
  // Portals render their content once mounted; a Presence created already open
  // is an initial render (no starting style), so open after that settles.
  await nextFrame()
  return { open, onOpenComplete }
}

function isShown(testCase: Case) {
  return testCase.staysInDom
    ? !!getContent() && !getContent()!.hidden
    : getContent() !== null
}

describe('css transition exits, per family', () => {
  for (const testCase of cases) {
    it(`${testCase.name}: transitions in from data-starting-style and out with data-ending-style`, async () => {
      const { open, onOpenComplete } = await mountCase(testCase)
      const insertion = watchInsertion()

      const openedAt = performance.now()
      open.value = true
      await vi.waitFor(() => expect(onOpenComplete).toHaveBeenCalledWith(true))
      insertion.stop()
      expect(insertion.result.hadStartingStyle).toBe(true)
      // `openComplete` waited for the enter transition.
      expect(performance.now() - openedAt).toBeGreaterThanOrEqual(DURATION - 20)
      expect(getComputedStyle(getContent()!).opacity).toBe('1')

      const closedAt = performance.now()
      open.value = false
      await nextFrame()
      // Still shown, fading out.
      expect(isShown(testCase)).toBe(true)
      expect(getContent()!.hasAttribute('data-ending-style')).toBe(true)
      expect(getContent()!.getAttribute('data-state')).toBe('closed')

      await vi.waitFor(() => expect(isShown(testCase)).toBe(false))
      expect(performance.now() - closedAt).toBeGreaterThanOrEqual(DURATION - 20)
      expect(onOpenComplete).toHaveBeenLastCalledWith(false)
      expect(onOpenComplete).toHaveBeenCalledTimes(2)
    })
  }

  it('toast: a newly added toast enters from data-starting-style', async () => {
    const open = ref(true)
    const onOpenComplete = vi.fn()
    const insertion = watchInsertion()
    mount(defineComponent({
      setup: () => () => h(ToastProvider, () => [
        h(ToastRoot, { ...content, 'open': open.value, 'duration': 60_000, 'onUpdate:openComplete': onOpenComplete }, () => 'Toast'),
        h(ToastViewport),
      ]),
    }), { attachTo: document.body })

    await vi.waitFor(() => expect(onOpenComplete).toHaveBeenCalledWith(true))
    insertion.stop()
    expect(insertion.result.hadStartingStyle).toBe(true)

    open.value = false
    await nextFrame()
    expect(getContent()!.hasAttribute('data-ending-style')).toBe(true)
    await vi.waitFor(() => expect(getContent()).toBeNull())
    expect(onOpenComplete).toHaveBeenLastCalledWith(false)
  })

  it('dialog: a keyframe exit animation still holds the content (no regression)', async () => {
    const open = ref(true)
    const onOpenComplete = vi.fn()
    mount(defineComponent({
      setup: () => () => h(DialogRoot, { 'open': open.value, 'onUpdate:openComplete': onOpenComplete }, () => h(DialogPortal, () =>
        h(DialogContent, { 'data-testid': 'content', 'class': 'keyframes' }, () => [h(DialogTitle, () => 'Title'), h(DialogDescription, () => 'Description')]))),
    }), { attachTo: document.body })
    await vi.waitFor(() => expect(onOpenComplete).toHaveBeenCalledWith(true))

    open.value = false
    await nextFrame()
    const [exit] = getContent()!.getAnimations()
    expect(exit).toBeInstanceOf(CSSAnimation)
    const finished = exit.finished.then(() => true, () => false)
    await vi.waitFor(() => expect(getContent()).toBeNull())
    expect(await finished).toBe(true)
    expect(onOpenComplete).toHaveBeenLastCalledWith(false)
  })

  it('collapsible: a height transition driven by the size variable runs both ways', async () => {
    const extra = document.createElement('style')
    extra.textContent = `
      .panel { overflow: hidden; height: var(--reka-collapsible-content-height); transition: height ${DURATION}ms linear; }
      .panel[data-starting-style], .panel[data-ending-style] { height: 0; }
      .panel-inner { height: 80px; }
    `
    document.head.appendChild(extra)
    const open = ref(false)
    const onOpenComplete = vi.fn()
    mount(defineComponent({
      setup: () => () => h(CollapsibleRoot, { 'open': open.value, 'onUpdate:openComplete': onOpenComplete }, () =>
        h(CollapsibleContent, { 'data-testid': 'content', 'class': 'panel' }, () => h('div', { class: 'panel-inner' }, 'Content'))),
    }), { attachTo: document.body })
    // CollapsibleContent keeps transitions off for its first frame.
    await nextFrame()

    open.value = true
    await vi.waitFor(() => expect(getContent()!.getAnimations().length).toBe(1))
    // Mid-transition: growing from 0 towards the measured 80px.
    expect(getContent()!.getBoundingClientRect().height).toBeLessThan(80)
    await vi.waitFor(() => expect(onOpenComplete).toHaveBeenCalledWith(true))
    expect(getContent()!.getBoundingClientRect().height).toBe(80)
    expect(getContent()!.style.getPropertyValue('--reka-collapsible-content-height')).toBe('80px')

    open.value = false
    await vi.waitFor(() => expect(getContent()!.getAnimations().length).toBe(1))
    expect(getContent()!.hidden).toBe(false)
    expect(getContent()!.getBoundingClientRect().height).toBeGreaterThan(0)
    await vi.waitFor(() => expect(onOpenComplete).toHaveBeenLastCalledWith(false))
    expect(getContent()!.hidden).toBe(true)
    extra.remove()
  })
})
