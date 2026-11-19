import type { Ref, VNode } from 'vue'
import type { DrawerModal } from '.'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { DrawerClose, DrawerContent, DrawerOverlay, DrawerPortal, DrawerRoot, DrawerTitle, DrawerTrigger } from '.'

// A `DrawerContent` with `forceMount` stays in the DOM while closed, and must then behave
// like a drawer that is not there: it neither takes focus, nor disables the page, nor joins
// the layer stack. Once opened it must behave like a drawer without `forceMount`.

const STYLES = `
  @keyframes drawer-out { from { opacity: 1 } to { opacity: 0 } }
  .exit[data-state="closed"] { animation: drawer-out 1s linear paused; }
`

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const isFocusWithin = (id: string) => !!get(id)?.contains(document.activeElement)
const focused = () => document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName
const afterTimers = () => new Promise(resolve => setTimeout(resolve))
const afterFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
async function settle() {
  await afterTimers()
  await afterFrames()
  await afterTimers()
}
const finishExit = () => get('content')!.getAnimations().forEach(animation => animation.finish())

interface DrawerOptions {
  modal: DrawerModal
  open: Ref<boolean>
  forceMount?: boolean
  overlay?: boolean
  exit?: boolean
  content?: Ref<boolean>
}

function drawer({ modal, open, forceMount = true, overlay = false, exit = false, content }: DrawerOptions): VNode {
  return h(DrawerRoot, {
    'open': open.value,
    modal,
    'onUpdate:open': (value: boolean) => open.value = value,
  }, () => [
    h(DrawerTrigger, { 'data-testid': 'drawer-trigger', 'style': 'position: fixed; top: 10px; left: 0;' }, () => 'drawer'),
    h(DrawerPortal, null, () => [
      overlay ? h(DrawerOverlay, { 'data-testid': 'overlay', forceMount }) : null,
      content?.value === false
        ? null
        : h(DrawerContent, {
            'data-testid': 'content',
            'class': exit ? 'exit' : undefined,
            forceMount,
            'style': 'position: fixed; bottom: 0; left: 0; width: 200px;',
          }, () => [
            h(DrawerTitle, null, () => 'Drawer'),
            h('button', { 'data-testid': 'first' }, 'first'),
            h(DrawerClose, { 'data-testid': 'close' }, () => 'Close'),
          ]),
    ]),
  ])
}

function popover(): VNode {
  return h(PopoverRoot, () => [
    h(PopoverTrigger, { 'data-testid': 'popover-trigger', 'style': 'position: fixed; top: 10px; left: 200px;' }, () => 'popover'),
    h(PopoverPortal, () => h(PopoverContent, { 'data-testid': 'popover-content' }, () =>
      h(PopoverClose, { 'data-testid': 'popover-close' }, () => 'Close'))),
  ])
}

let sheet: HTMLStyleElement

beforeEach(() => {
  sheet = document.createElement('style')
  sheet.textContent = STYLES
  document.head.append(sheet)
})

afterEach(() => {
  sheet.remove()
})

const CASES: { modal: DrawerModal, overlay: boolean }[] = [
  { modal: true, overlay: false },
  { modal: true, overlay: true },
  { modal: 'trap-focus', overlay: false },
  { modal: 'trap-focus', overlay: true },
  { modal: false, overlay: false },
]

describe.each(CASES)('given a force-mounted Drawer with modal $modal (overlay: $overlay), in a real browser', ({ modal, overlay }) => {
  function mountPage(options: { forceMount?: boolean, exit?: boolean, withPopover?: boolean } = {}) {
    const open = ref(false)
    const show = ref(false)
    const outsideClicks = ref(0)
    const content = ref(true)
    mount(defineComponent({
      setup: () => () => h('div', [
        h('button', { 'data-testid': 'outside', 'style': 'position: fixed; top: 10px; left: 100px;', 'onClick': () => outsideClicks.value++ }, 'outside'),
        show.value ? drawer({ modal, open, overlay, forceMount: options.forceMount, exit: options.exit, content }) : null,
        options.withPopover ? popover() : null,
      ]),
    }), { attachTo: document.body })
    return { open, show, outsideClicks, content }
  }

  // The page and its own body style before any drawer is there.
  const blocksPage = modal === true || (overlay && modal !== false)

  async function mountClosed() {
    const page = mountPage()
    get('outside')!.focus()
    page.show.value = true
    await expect.poll(() => get('content')).not.toBeNull()
    await settle()
    expect(get('content')!.getAttribute('data-state')).toBe('closed')
    return page
  }

  it('does not take focus while closed', async () => {
    await mountClosed()
    expect(focused()).toBe('outside')
  })

  it('leaves the page clickable while closed', async () => {
    const { outsideClicks } = await mountClosed()
    expect(document.body.style.pointerEvents).toBe('')
    await userEvent.click(get('outside')!)
    expect(outsideClicks.value).toBe(1)
  })

  it('does not render a `forcemount` attribute', async () => {
    await mountClosed()
    expect(get('content')!.hasAttribute('forcemount')).toBe(false)
  })

  it('takes focus when it mounts open', async () => {
    const { show, open } = mountPage()
    open.value = true
    show.value = true
    await expect.poll(() => isFocusWithin('content')).toBe(true)
    expect(document.body.style.pointerEvents).toBe(blocksPage ? 'none' : '')
  })

  it.each([false, true])('behaves like a drawer that unmounts while open, and lets go once closed (exit animation: %s)', async (exit) => {
    const { show, open } = mountPage({ exit })
    show.value = true
    await expect.poll(() => get('content')).not.toBeNull()
    await settle()
    expect(document.body.style.pointerEvents).toBe('')

    await userEvent.click(get('drawer-trigger')!)
    await expect.poll(() => get('content')!.getAttribute('data-state')).toBe('open')
    await settle()
    expect(isFocusWithin('content')).toBe(true)
    expect(document.body.style.pointerEvents).toBe(blocksPage ? 'none' : '')
    if (modal !== false) {
      // Focus is trapped.
      await userEvent.keyboard('{Tab}{Tab}{Tab}')
      expect(isFocusWithin('content')).toBe(true)
    }

    await userEvent.keyboard('{Escape}')
    expect(open.value).toBe(false)
    await expect.poll(() => get('content')!.getAttribute('data-state')).toBe('closed')
    if (exit) {
      await settle()
      expect(get('content')!.getAnimations()).toHaveLength(1)
      // Still on screen: still the top layer until it has finished leaving.
      expect(document.body.style.pointerEvents).toBe(modal === true ? 'none' : '')
      finishExit()
    }
    await settle()

    expect(get('content')).not.toBeNull()
    expect(focused()).toBe('drawer-trigger')
    expect(document.body.style.pointerEvents).toBe('')
  })

  it.each([false, true])('leaves focus alone when the closed content is removed later (opened before: %s)', async (openedBefore) => {
    const { open, content } = await mountClosed()
    if (openedBefore) {
      open.value = true
      await expect.poll(() => isFocusWithin('content')).toBe(true)
      await userEvent.keyboard('{Escape}')
      await expect.poll(() => focused()).toBe('drawer-trigger')
      await settle()
    }

    get('outside')!.focus()
    content.value = false
    await expect.poll(() => get('content')).toBeNull()
    await settle()
    expect(focused()).toBe('outside')
  })

  it('returns focus to the trigger when the open content is removed', async () => {
    const { open, content } = await mountClosed()
    open.value = true
    await expect.poll(() => isFocusWithin('content')).toBe(true)

    content.value = false
    await expect.poll(() => get('content')).toBeNull()
    await settle()
    expect(focused()).toBe('drawer-trigger')
  })

  it('leaves focus in a Popover opened beside it, before and after it has been open', async () => {
    const { show, open } = mountPage({ withPopover: true })
    show.value = true
    await expect.poll(() => get('content')).not.toBeNull()
    await settle()

    for (let round = 0; round < 2; round++) {
      expect(document.body.style.pointerEvents).toBe('')
      await userEvent.click(get('popover-trigger')!)
      await expect.poll(() => get('popover-content')).not.toBeNull()
      await settle()
      expect(isFocusWithin('popover-content')).toBe(true)

      await userEvent.keyboard('{Escape}')
      await expect.poll(() => get('popover-content')).toBeNull()
      await settle()
      expect(focused()).toBe('popover-trigger')

      // Open and close the drawer, then try again.
      open.value = true
      await expect.poll(() => isFocusWithin('content')).toBe(true)
      await userEvent.keyboard('{Escape}')
      await expect.poll(() => focused()).toBe('drawer-trigger')
      await settle()
    }
  })
})

describe('given a force-mounted Drawer nested in an open Drawer, in a real browser', () => {
  it.each([true, 'trap-focus', false] as DrawerModal[])('keeps the parent as the top layer while the nested one is closed (modal %s)', async (modal) => {
    const parentOpen = ref(false)
    const childOpen = ref(false)
    mount(defineComponent({
      setup: () => () => h(DrawerRoot, { 'open': parentOpen.value, modal, 'onUpdate:open': (value: boolean) => parentOpen.value = value }, () => [
        h(DrawerTrigger, { 'data-testid': 'parent-trigger' }, () => 'parent'),
        h(DrawerPortal, null, () => h(DrawerContent, { 'data-testid': 'parent' }, () => [
          h(DrawerTitle, null, () => 'Parent'),
          h('button', { 'data-testid': 'parent-first' }, 'first'),
          h(DrawerRoot, { 'open': childOpen.value, modal, 'onUpdate:open': (value: boolean) => childOpen.value = value }, () => [
            h(DrawerTrigger, { 'data-testid': 'child-trigger' }, () => 'child'),
            h(DrawerPortal, null, () => h(DrawerContent, { 'data-testid': 'child', 'forceMount': true }, () => [
              h(DrawerTitle, null, () => 'Child'),
              h('button', { 'data-testid': 'child-first' }, 'first'),
            ])),
          ]),
        ])),
      ]),
    }), { attachTo: document.body })

    await userEvent.click(get('parent-trigger')!)
    await expect.poll(() => get('child')).not.toBeNull()
    await settle()
    expect(get('child')!.getAttribute('data-state')).toBe('closed')
    expect(focused()).toBe('parent-first')

    await userEvent.keyboard('{Escape}')
    await nextTick()
    expect(parentOpen.value).toBe(false)
    expect(childOpen.value).toBe(false)
  })
})
