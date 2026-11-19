import type { VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from '@/ContextMenu'
import { DialogClose, DialogContent, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { MenubarContent, MenubarItem, MenubarMenu, MenubarPortal, MenubarRoot, MenubarTrigger } from '@/Menubar'
import { PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '.'

// A menu content that stays in the DOM while closed (`unmountOnHide: false` on the root)
// must behave like one that is not there: it neither takes focus when another layer opens,
// nor takes it back from that layer, nor catches keys or clicks meant for it, and it leaves
// the page usable (no scroll lock, no hidden siblings, no blocked pointer, no tab stops).

type Other = 'popover' | 'menu' | 'dialog'

const STYLES = `
  @keyframes kept-out { from { opacity: 1 } to { opacity: 0 } }
  .exit[data-state="closed"] { animation: kept-out 1s linear paused; }
`

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const isFocusWithin = (id: string) => !!get(id)?.contains(document.activeElement)
const focused = () => document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName
/** In the document, but not rendered: `display: none` on it or on its popper wrapper. */
const isHidden = (id: string) => !!get(id) && get(id)!.getClientRects().length === 0
const isHiddenKept = isHidden
const afterTimers = () => new Promise(resolve => setTimeout(resolve))
const afterFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
async function settle() {
  await afterTimers()
  await afterFrames()
  await afterTimers()
}

function trigger(id: string, index: number, extra: Record<string, unknown> = {}) {
  return { 'data-testid': `${id}-trigger`, 'style': `position: fixed; top: 10px; left: ${index * 200}px;`, ...extra }
}

interface KeptOptions {
  modal: boolean
  open: { value: boolean }
  exit?: boolean
  /** `false` keeps it open through an outside interaction, so that another layer can open beside it. */
  dismissable?: boolean
  onCloseAutoFocus?: (event: Event) => void
  /** Renders the submenu without a portal, inside the content. */
  inlineSub?: boolean
}

function kept({ modal, open, exit, dismissable = true, onCloseAutoFocus, inlineSub }: KeptOptions): VNode {
  const subContent = () => h(DropdownMenuSubContent, { 'data-testid': 'sub-content' }, () => [
    h(DropdownMenuItem, { 'data-testid': 'sub-item' }, () => 'Blueberry'),
    h(DropdownMenuSub, null, () => [
      h(DropdownMenuSubTrigger, { 'data-testid': 'nested-trigger' }, () => 'Nested'),
      h(DropdownMenuPortal, null, () => h(DropdownMenuSubContent, { 'data-testid': 'nested-content' }, () =>
        h(DropdownMenuItem, { 'data-testid': 'nested-item' }, () => 'Deep'))),
    ]),
  ])
  return h(DropdownMenuRoot, {
    'open': open.value,
    'onUpdate:open': (value: boolean) => open.value = value,
    modal,
    'unmountOnHide': false,
  }, () => [
    h(DropdownMenuTrigger, trigger('kept', 0), () => 'kept'),
    h(DropdownMenuPortal, null, () => h(DropdownMenuContent, {
      'data-testid': 'kept-content',
      'class': exit ? 'exit' : undefined,
      'style': 'width: 200px;',
      onCloseAutoFocus,
      'onInteractOutside': (event: Event) => {
        if (!dismissable)
          event.preventDefault()
      },
    }, () => [
      h(DropdownMenuItem, { 'data-testid': 'kept-item' }, () => 'Apple'),
      h(DropdownMenuSub, null, () => [
        h(DropdownMenuSubTrigger, { 'data-testid': 'sub-trigger' }, () => 'More'),
        inlineSub ? subContent() : h(DropdownMenuPortal, null, subContent),
      ]),
      h(DropdownMenuItem, { 'data-testid': 'kept-last' }, () => 'Banana'),
    ])),
  ])
}

function other(kind: Other, extra: Record<string, unknown> = {}): VNode {
  const content = { 'data-testid': 'other-content', 'style': 'position: fixed; top: 100px; left: 300px;' }
  if (kind === 'menu') {
    return h(DropdownMenuRoot, () => [
      h(DropdownMenuTrigger, trigger('other', 1, extra), () => 'other'),
      h(DropdownMenuPortal, () => h(DropdownMenuContent, { 'data-testid': 'other-content' }, () =>
        h(DropdownMenuItem, { 'data-testid': 'other-item' }, () => 'one'))),
    ])
  }
  if (kind === 'dialog') {
    return h(DialogRoot, () => [
      h(DialogTrigger, trigger('other', 1, extra), () => 'other'),
      h(DialogPortal, () => h(DialogContent, { 'aria-describedby': undefined, ...content }, () => [
        h(DialogTitle, null, () => 'Other'),
        h(DialogClose, { 'data-testid': 'other-item' }, () => 'Close'),
      ])),
    ])
  }
  return h(PopoverRoot, () => [
    h(PopoverTrigger, trigger('other', 1, extra), () => 'other'),
    h(PopoverPortal, () => h(PopoverContent, { 'data-testid': 'other-content' }, () =>
      h(PopoverClose, { 'data-testid': 'other-item' }, () => 'Close'))),
  ])
}

const exiting = () => get('kept-content')!.getAnimations().some(animation => animation.playState === 'paused')
/** `pointer-events: auto` keeps a trigger clickable while a modal layer disables the rest of the page. */
const CLICKABLE_UNDER_MODAL = { style: 'position: fixed; top: 10px; left: 200px; pointer-events: auto;' }

/** Focus is in the other layer, stays there, and goes back to that layer's own trigger when it closes. */
async function expectOtherLayerOwnsFocus() {
  await expect.poll(() => get('other-content')).not.toBeNull()
  await settle()
  expect(focused()).not.toBe('kept-trigger')
  expect(isFocusWithin('kept-content')).toBe(false)
  expect(isFocusWithin('other-content')).toBe(true)

  await userEvent.keyboard('{Escape}')
  await expect.poll(() => get('other-content')).toBeNull()
  await settle()
  expect(focused()).toBe('other-trigger')
}

/** Opens the kept content from its trigger with the keyboard and waits for focus to move in. */
async function openKept() {
  get('kept-trigger')!.focus()
  await userEvent.keyboard('{Enter}')
  await expect.poll(() => isFocusWithin('kept-content')).toBe(true)
  await settle()
}

/** Closed, but still in the DOM. */
async function expectKeptClosed(open: { value: boolean }) {
  await expect.poll(() => open.value).toBe(false)
  await expect.poll(() => get('kept-content')?.getAttribute('data-state')).toBe('closed')
  await expect.poll(() => isHidden('kept-content')).toBe(true)
}

let sheet: HTMLStyleElement

beforeEach(() => {
  sheet = document.createElement('style')
  sheet.textContent = STYLES
  document.head.append(sheet)
})

afterEach(() => {
  sheet.remove()
  vi.unstubAllEnvs()
})

const OTHERS: Other[] = ['popover', 'menu', 'dialog']

describe.each([
  { name: 'modal DropdownMenu', modal: true },
  { name: 'non-modal DropdownMenu', modal: false },
])('$name kept mounted with unmountOnHide', ({ modal }) => {
  async function mountLayers(otherKind: Other, options: { exit?: boolean, dismissable?: boolean, otherTrigger?: Record<string, unknown>, inlineSub?: boolean } = {}) {
    const open = ref(false)
    const show = ref(true)
    const onCloseAutoFocus = vi.fn()
    const onOutsideClick = vi.fn()
    mount(defineComponent({
      setup: () => () => h('div', [
        h('button', { 'data-testid': 'start', 'style': 'position: fixed; top: 200px; left: 400px;', 'onClick': onOutsideClick }, 'start'),
        show.value ? kept({ modal, open, onCloseAutoFocus, ...options }) : null,
        h('button', { 'data-testid': 'end', 'style': 'position: fixed; top: 200px; left: 500px;' }, 'end'),
        other(otherKind, options.otherTrigger),
      ]),
    }), { attachTo: document.body })
    // The closed content is in the DOM, but hidden
    await expect.poll(() => get('kept-content')).not.toBeNull()
    await settle()
    return { open, show, onCloseAutoFocus, onOutsideClick }
  }

  it('leaves focus alone when it mounts closed, and keeps its submenus hidden', async () => {
    await mountLayers('popover')
    get('start')!.focus()
    await settle()
    expect(focused()).toBe('start')
    expect(isHidden('kept-content')).toBe(true)
  })

  it('adds no tab stop while closed', async () => {
    const { open } = await mountLayers('popover')
    await openKept()
    await userEvent.keyboard('{Escape}')
    await expectKeptClosed(open)
    await settle()
    // Nor the focus guards an open menu adds at the edges of the page
    expect(document.querySelector('[data-reka-focus-guard]')).toBeNull()

    get('start')!.focus()
    await userEvent.tab()
    expect(focused()).toBe('kept-trigger')
    await userEvent.tab()
    expect(focused()).toBe('end')
  })

  describe.each(OTHERS)('when a %s opens elsewhere', (otherKind) => {
    it('leaves focus in that layer when it was never opened', async () => {
      await mountLayers(otherKind)

      await userEvent.click(get('other-trigger')!)
      await expectOtherLayerOwnsFocus()
    })

    it('leaves focus in that layer after it was opened and closed', async () => {
      const { open } = await mountLayers(otherKind)

      await openKept()
      await userEvent.keyboard('{Escape}')
      await expectKeptClosed(open)
      await expect.poll(() => focused()).toBe('kept-trigger')
      await settle()

      await userEvent.click(get('other-trigger')!)
      await expectOtherLayerOwnsFocus()
    })

    it('leaves focus in that layer when it opens while the kept one is still animating out', async () => {
      const { open } = await mountLayers(otherKind, { exit: true, otherTrigger: CLICKABLE_UNDER_MODAL })

      await openKept()
      await userEvent.keyboard('{Escape}')
      await expect.poll(() => open.value).toBe(false)
      await settle()
      expect(exiting()).toBe(true)

      await userEvent.click(get('other-trigger')!)
      await expect.poll(() => isFocusWithin('other-content')).toBe(true)
      await settle()
      get('kept-content')!.getAnimations().forEach(animation => animation.finish())
      await expect.poll(() => exiting()).toBe(false)
      await expectKeptClosed(open)
      await expectOtherLayerOwnsFocus()
    })

    it('leaves focus in that layer when the click that opens it closes the kept one', async () => {
      const { open } = await mountLayers(otherKind, { otherTrigger: CLICKABLE_UNDER_MODAL })

      await openKept()
      await userEvent.click(get('other-trigger')!)
      await expectKeptClosed(open)
      // A modal menu takes the first click outside to close
      if (modal && !get('other-content'))
        await userEvent.click(get('other-trigger')!)
      await expectOtherLayerOwnsFocus()
    })

    it('leaves focus in that layer when it is closed from outside while that layer is open', async () => {
      const { open } = await mountLayers(otherKind, { otherTrigger: CLICKABLE_UNDER_MODAL, dismissable: false })

      await openKept()
      await userEvent.click(get('other-trigger')!)
      await expect.poll(() => isFocusWithin('other-content')).toBe(true)
      await settle()

      open.value = false
      await settle()
      await expectKeptClosed(open)
      await expectOtherLayerOwnsFocus()
    })
  })

  it('returns focus to its trigger when it closes on its own, every time', async () => {
    const { open } = await mountLayers('popover')

    for (const close of [() => userEvent.click(get('kept-item')!), () => userEvent.keyboard('{Escape}')]) {
      await openKept()
      await close()
      await expectKeptClosed(open)
      await settle()
      expect(focused()).toBe('kept-trigger')
    }
  })

  it('focuses the first item again on every keyboard open', async () => {
    const { open } = await mountLayers('popover')

    for (let i = 0; i < 2; i++) {
      await openKept()
      await expect.poll(() => focused()).toBe('kept-item')
      await userEvent.keyboard('{Escape}')
      await expectKeptClosed(open)
      await settle()
    }
  })

  it('lets outside clicks reach the page while closed', async () => {
    const { open, onOutsideClick } = await mountLayers('popover')

    await openKept()
    await userEvent.keyboard('{Escape}')
    await expectKeptClosed(open)
    await settle()

    expect(getComputedStyle(document.body).pointerEvents).not.toBe('none')
    await userEvent.click(get('start')!)
    expect(onOutsideClick).toHaveBeenCalledOnce()
    await settle()
    expect(open.value).toBe(false)
    expect(focused()).toBe('start')
  })

  it.runIf(modal)('neither locks scroll nor hides the page from assistive tech while closed', async () => {
    // `useHideOthers` is a no-op in test mode
    vi.stubEnv('MODE', 'production')
    const { open } = await mountLayers('popover')
    expect(document.body.style.overflow).not.toBe('hidden')
    expect(get('start')!.closest('[aria-hidden="true"]')).toBeNull()

    await openKept()
    expect(document.body.style.overflow).toBe('hidden')
    expect(get('start')!.closest('[aria-hidden="true"]')).not.toBeNull()

    await userEvent.keyboard('{Escape}')
    await expectKeptClosed(open)
    await settle()
    expect(document.body.style.overflow).not.toBe('hidden')
    expect(get('start')!.closest('[aria-hidden="true"]')).toBeNull()
  })

  it('emits closeAutoFocus when it is finally unmounted, not when it hides', async () => {
    const { open, show, onCloseAutoFocus } = await mountLayers('popover')

    await openKept()
    await userEvent.keyboard('{Escape}')
    await expectKeptClosed(open)
    await settle()
    expect(onCloseAutoFocus).not.toHaveBeenCalled()

    show.value = false
    await settle()
    expect(get('kept-content')).toBeNull()
    expect(onCloseAutoFocus).toHaveBeenCalledOnce()
  })

  describe('with submenus', () => {
    it('keeps opened submenus mounted and hidden, and opens them again from the keyboard', async () => {
      const { open } = await mountLayers('popover')

      for (let i = 0; i < 2; i++) {
        await openKept()
        get('sub-trigger')!.focus()
        await userEvent.keyboard('{ArrowRight}')
        await expect.poll(() => focused()).toBe('sub-item')
        await userEvent.keyboard('{ArrowDown}')
        await expect.poll(() => focused()).toBe('nested-trigger')
        await userEvent.keyboard('{ArrowRight}')
        await expect.poll(() => focused()).toBe('nested-item')

        // Closing the nested submenu hands focus back to its trigger
        await userEvent.keyboard('{ArrowLeft}')
        await expect.poll(() => isHidden('nested-content')).toBe(true)
        expect(focused()).toBe('nested-trigger')

        await userEvent.keyboard('{ArrowRight}')
        await expect.poll(() => focused()).toBe('nested-item')

        // Escape closes the whole menu, submenus included
        await userEvent.keyboard('{Escape}')
        await expectKeptClosed(open)
        await settle()
        expect(isHidden('sub-content')).toBe(true)
        expect(isHidden('nested-content')).toBe(true)
        expect(focused()).toBe('kept-trigger')
      }
    })

    it('ignores the items of a hidden submenu rendered inside the content', async () => {
      const { open } = await mountLayers('popover', { inlineSub: true })

      await openKept()
      get('sub-trigger')!.focus()
      await userEvent.keyboard('{ArrowRight}')
      await expect.poll(() => focused()).toBe('sub-item')
      await userEvent.keyboard('{ArrowLeft}')
      await expect.poll(() => isHidden('sub-content')).toBe(true)
      await expect.poll(() => focused()).toBe('sub-trigger')

      // Arrow keys move between this menu's own items only
      await userEvent.keyboard('{ArrowDown}')
      expect(focused()).toBe('kept-last')
      await userEvent.keyboard('{ArrowUp}')
      expect(focused()).toBe('sub-trigger')

      // Typeahead too: "B" matches "Banana" here, not the hidden "Blueberry"
      await userEvent.keyboard('{Home}')
      await userEvent.keyboard('b')
      expect(focused()).toBe('kept-last')

      await userEvent.keyboard('{Escape}')
      await expectKeptClosed(open)
    })

    it('lets Escape and outside clicks reach another layer while its submenus are hidden', async () => {
      const { open } = await mountLayers('popover')

      await openKept()
      get('sub-trigger')!.focus()
      await userEvent.keyboard('{ArrowRight}')
      await expect.poll(() => focused()).toBe('sub-item')
      await userEvent.keyboard('{Escape}')
      await expectKeptClosed(open)
      await settle()

      await userEvent.click(get('other-trigger')!)
      await expectOtherLayerOwnsFocus()
      expect(open.value).toBe(false)
    })
  })
})

describe.each([true, false])('menubar with unmountOnHide %s', (unmountOnHide) => {
  const isHidden = (id: string) => unmountOnHide ? !get(id) : isHiddenKept(id)
  function mountMenubar() {
    const value = ref('')
    mount(defineComponent({
      setup: () => () => h('div', [
        h(MenubarRoot, { 'modelValue': value.value, 'onUpdate:modelValue': (v: string) => value.value = v, unmountOnHide }, () =>
          ['file', 'edit', 'view'].map(name => h(MenubarMenu, { value: name }, () => [
            h(MenubarTrigger, { 'data-testid': `${name}-trigger` }, () => name),
            h(MenubarPortal, null, () => h(MenubarContent, { 'data-testid': `${name}-content` }, () => [
              h(MenubarItem, { 'data-testid': `${name}-item` }, () => `${name} one`),
              h(MenubarItem, { 'data-testid': `${name}-last` }, () => `${name} two`),
            ])),
          ]))),
        h('button', { 'data-testid': 'end' }, 'end'),
      ]),
    }), { attachTo: document.body })
    return value
  }

  it.runIf(!unmountOnHide)('keeps every menu mounted and hidden while closed', async () => {
    mountMenubar()
    await expect.poll(() => get('view-content')).not.toBeNull()
    for (const name of ['file', 'edit', 'view'])
      expect(isHidden(`${name}-content`)).toBe(true)
  })

  it('moves between menus with the arrow keys, every time', async () => {
    const value = mountMenubar()
    if (!unmountOnHide)
      await expect.poll(() => get('view-content')).not.toBeNull()
    await settle()

    for (let i = 0; i < 2; i++) {
      get('file-trigger')!.focus()
      await userEvent.keyboard('{ArrowDown}')
      await expect.poll(() => focused()).toBe('file-item')

      await userEvent.keyboard('{ArrowRight}')
      // A menu opened from another one takes focus on its content, as without `unmountOnHide`
      await expect.poll(() => value.value).toBe('edit')
      await expect.poll(() => isFocusWithin('edit-content')).toBe(true)
      await expect.poll(() => isHidden('file-content')).toBe(true)

      await userEvent.keyboard('{ArrowRight}')
      await expect.poll(() => isFocusWithin('view-content')).toBe(true)
      expect(isHidden('edit-content')).toBe(true)

      await userEvent.keyboard('{ArrowLeft}')
      await expect.poll(() => isFocusWithin('edit-content')).toBe(true)
      expect(isHidden('view-content')).toBe(true)

      // Arrow keys move within the menu that opened, not into the hidden ones
      await userEvent.keyboard('{ArrowDown}')
      expect(focused()).toBe('edit-item')
      await userEvent.keyboard('{ArrowDown}')
      expect(focused()).toBe('edit-last')

      await userEvent.keyboard('{Escape}')
      await expect.poll(() => value.value).toBe('')
      await expect.poll(() => isHidden('edit-content')).toBe(true)
      await settle()
      expect(focused()).toBe('edit-trigger')
    }
  })

  it('adds no tab stop while closed', async () => {
    const value = mountMenubar()
    if (!unmountOnHide)
      await expect.poll(() => get('view-content')).not.toBeNull()
    get('file-trigger')!.focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(() => focused()).toBe('file-item')
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => value.value).toBe('')
    await settle()

    expect(focused()).toBe('file-trigger')
    await userEvent.tab()
    expect(focused()).toBe('end')
  })
})

describe.each([true, false])('context menu with unmountOnHide %s', (unmountOnHide) => {
  const isHidden = (id: string) => unmountOnHide ? !get(id) : isHiddenKept(id)
  it('returns focus to where it was and opens again at the pointer', async () => {
    const open = ref(false)
    mount(defineComponent({
      setup: () => () => h('div', [
        h('button', { 'data-testid': 'start' }, 'start'),
        h(ContextMenuRoot, { 'onUpdate:open': (v: boolean) => open.value = v, unmountOnHide }, () => [
          h(ContextMenuTrigger, { 'data-testid': 'area', 'tabindex': 0, 'style': 'display: block; width: 300px; height: 200px; background: #eee;' }, () => 'area'),
          h(ContextMenuPortal, null, () => h(ContextMenuContent, { 'data-testid': 'context-content' }, () =>
            h(ContextMenuItem, { 'data-testid': 'context-item' }, () => 'Copy'))),
        ]),
      ]),
    }), { attachTo: document.body })
    if (!unmountOnHide)
      await expect.poll(() => get('context-content')).not.toBeNull()
    expect(isHidden('context-content')).toBe(true)

    for (const x of [20, 150]) {
      get('start')!.focus()
      await userEvent.click(get('area')!, { button: 'right', position: { x, y: 40 } })
      await expect.poll(() => isHidden('context-content')).toBe(false)
      await expect.poll(() => isFocusWithin('context-content')).toBe(true)
      // The content opens 2px off the pointer
      await expect.poll(() => Math.round(get('context-content')!.getBoundingClientRect().left - get('area')!.getBoundingClientRect().left)).toBe(x + 2)

      await userEvent.keyboard('{Escape}')
      await expect.poll(() => isHidden('context-content')).toBe(true)
      await settle()
      // Where focus was before opening: the focusable area, which the right click focused
      expect(focused()).toBe('area')
    }
  })
})
