import type { VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { AlertDialogCancel, AlertDialogContent, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle, AlertDialogTrigger } from '@/AlertDialog'
import { DialogClose, DialogContent, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'

// A content that stays in the DOM while closed (`unmountOnHide: false` on the root, or
// `forceMount` on the content) must behave like one that is not there: it neither takes
// focus when another layer opens, nor takes it back from that layer once it is closed.

type Kept = 'Dialog' | 'AlertDialog'
type Keep = 'unmountOnHide' | 'forceMount'
type Other = 'popover' | 'menu' | 'dialog'

const STYLES = `
  @keyframes kept-out { from { opacity: 1 } to { opacity: 0 } }
  .exit[data-state="closed"] { animation: kept-out 1s linear paused; }
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

const KEPT = {
  Dialog: { Root: DialogRoot, Trigger: DialogTrigger, Portal: DialogPortal, Content: DialogContent, Title: DialogTitle, Close: DialogClose },
  AlertDialog: { Root: AlertDialogRoot, Trigger: AlertDialogTrigger, Portal: AlertDialogPortal, Content: AlertDialogContent, Title: AlertDialogTitle, Close: AlertDialogCancel },
}

interface KeptOptions {
  kind: Kept
  keep: Keep
  modal?: boolean
  open: { value: boolean }
  exit?: boolean
  /** `false` keeps it open through an outside interaction, so that another layer can open beside it. */
  dismissable?: boolean
  onCloseAutoFocus?: (event: Event) => void
}

function trigger(id: string, index: number, extra: Record<string, unknown> = {}) {
  return { 'data-testid': `${id}-trigger`, 'style': `position: fixed; top: 10px; left: ${index * 200}px;`, ...extra }
}

function kept({ kind, keep, modal, open, exit, dismissable = true, onCloseAutoFocus }: KeptOptions): VNode {
  const parts = KEPT[kind]
  return h(parts.Root as typeof DialogRoot, {
    'open': open.value,
    'onUpdate:open': (value: boolean) => open.value = value,
    ...(keep === 'unmountOnHide' ? { unmountOnHide: false } : {}),
    ...(modal === false ? { modal } : {}),
  }, () => [
    h(parts.Trigger, trigger('kept', 0), () => 'kept'),
    h(parts.Portal, null, () => h(parts.Content as typeof DialogContent, {
      'aria-describedby': undefined,
      'data-testid': 'kept-content',
      'class': exit ? 'exit' : undefined,
      'forceMount': keep === 'forceMount' ? true : undefined,
      'style': 'position: fixed; top: 300px; left: 0; width: 200px;',
      onCloseAutoFocus,
      'onInteractOutside': (event: Event) => {
        if (!dismissable)
          event.preventDefault()
      },
    }, () => [
      h(parts.Title, null, () => 'Kept'),
      h(parts.Close, { 'data-testid': 'kept-close' }, () => 'Close'),
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
async function expectOtherLayerOwnsFocus(returnsToTrigger = true) {
  await expect.poll(() => get('other-content')).not.toBeNull()
  await settle()
  expect(focused()).not.toBe('kept-trigger')
  expect(isFocusWithin('kept-content')).toBe(false)
  expect(isFocusWithin('other-content')).toBe(true)

  await userEvent.keyboard('{Escape}')
  await expect.poll(() => get('other-content')).toBeNull()
  await settle()
  if (returnsToTrigger)
    expect(focused()).toBe('other-trigger')
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

const CASES: { name: string, kind: Kept, keep: Keep, modal?: boolean }[] = [
  { name: 'modal Dialog', kind: 'Dialog', keep: 'unmountOnHide' },
  { name: 'modal Dialog', kind: 'Dialog', keep: 'forceMount' },
  { name: 'non-modal Dialog', kind: 'Dialog', keep: 'unmountOnHide', modal: false },
  { name: 'non-modal Dialog', kind: 'Dialog', keep: 'forceMount', modal: false },
  { name: 'AlertDialog', kind: 'AlertDialog', keep: 'unmountOnHide' },
  { name: 'AlertDialog', kind: 'AlertDialog', keep: 'forceMount' },
]
const OTHERS: Other[] = ['popover', 'menu', 'dialog']

describe.each(CASES)('$name kept mounted with $keep', ({ kind, keep, modal }) => {
  function mountLayers(otherKind: Other, options: { exit?: boolean, dismissable?: boolean, otherTrigger?: Record<string, unknown> } = {}) {
    const open = ref(false)
    const show = ref(true)
    const onCloseAutoFocus = vi.fn()
    mount(defineComponent({
      setup: () => () => h('div', [
        h('button', { 'data-testid': 'start' }, 'start'),
        show.value ? kept({ kind, keep, modal, open, exit: options.exit, dismissable: options.dismissable, onCloseAutoFocus }) : null,
        other(otherKind, options.otherTrigger),
      ]),
    }), { attachTo: document.body })
    return { open, show, onCloseAutoFocus }
  }

  it('leaves focus alone when it mounts closed', async () => {
    mountLayers('popover')
    get('start')!.focus()
    await settle()
    expect(focused()).toBe('start')
  })

  describe.each(OTHERS)('when a %s opens elsewhere', (otherKind) => {
    it('leaves focus in that layer when it was never opened', async () => {
      mountLayers(otherKind)
      await settle()

      await userEvent.click(get('other-trigger')!)
      await expectOtherLayerOwnsFocus()
    })

    it('leaves focus in that layer after it was opened and closed', async () => {
      const { open } = mountLayers(otherKind)
      await settle()

      await userEvent.click(get('kept-trigger')!)
      await expect.poll(() => isFocusWithin('kept-content')).toBe(true)
      await settle()
      await userEvent.keyboard('{Escape}')
      await expect.poll(() => open.value).toBe(false)
      await expect.poll(() => focused()).toBe('kept-trigger')
      await settle()

      await userEvent.click(get('other-trigger')!)
      await expectOtherLayerOwnsFocus()
    })

    it('leaves focus in that layer when it opens while the kept one is still animating out', async () => {
      const { open } = mountLayers(otherKind, { exit: true, otherTrigger: CLICKABLE_UNDER_MODAL })
      await settle()

      await userEvent.click(get('kept-trigger')!)
      await expect.poll(() => isFocusWithin('kept-content')).toBe(true)
      await settle()
      await userEvent.keyboard('{Escape}')
      await expect.poll(() => open.value).toBe(false)
      await settle()
      expect(exiting()).toBe(true)

      await userEvent.click(get('other-trigger')!)
      await expect.poll(() => isFocusWithin('other-content')).toBe(true)
      await settle()
      get('kept-content')!.getAnimations().forEach(animation => animation.finish())
      await expect.poll(() => exiting()).toBe(false)
      await expectOtherLayerOwnsFocus()
    })

    // An AlertDialog does not close on an outside click.
    it.skipIf(kind === 'AlertDialog')('leaves focus in that layer when the click that opens it closes the kept one', async () => {
      const { open } = mountLayers(otherKind, { otherTrigger: CLICKABLE_UNDER_MODAL })
      await settle()

      await userEvent.click(get('kept-trigger')!)
      await expect.poll(() => isFocusWithin('kept-content')).toBe(true)
      await settle()

      await userEvent.click(get('other-trigger')!)
      await expect.poll(() => open.value).toBe(false)
      await expectOtherLayerOwnsFocus()
    })

    it('leaves focus in that layer when it is closed from outside while that layer is open', async () => {
      const { open } = mountLayers(otherKind, { otherTrigger: CLICKABLE_UNDER_MODAL, dismissable: false })
      await settle()

      await userEvent.click(get('kept-trigger')!)
      await expect.poll(() => isFocusWithin('kept-content')).toBe(true)
      await settle()
      await userEvent.click(get('other-trigger')!)
      await expect.poll(() => isFocusWithin('other-content')).toBe(true)
      await settle()

      open.value = false
      await settle()
      // A Dialog that mounts while focus is held in another one takes the element focused
      // there for its trigger, so where focus goes when it closes is not this test's concern.
      await expectOtherLayerOwnsFocus(otherKind !== 'dialog')
    })
  })

  it('returns focus to its trigger when it closes on its own, every time', async () => {
    const { open } = mountLayers('popover')
    await settle()

    for (const close of [() => userEvent.click(get('kept-close')!), () => userEvent.keyboard('{Escape}')]) {
      await userEvent.click(get('kept-trigger')!)
      await expect.poll(() => isFocusWithin('kept-content')).toBe(true)
      await settle()
      await close()
      await expect.poll(() => open.value).toBe(false)
      await settle()
      expect(focused()).toBe('kept-trigger')
    }
  })

  it('emits closeAutoFocus when it is finally unmounted', async () => {
    const { open, show, onCloseAutoFocus } = mountLayers('popover')
    await settle()

    await userEvent.click(get('kept-trigger')!)
    await expect.poll(() => isFocusWithin('kept-content')).toBe(true)
    await settle()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => open.value).toBe(false)
    await settle()
    const emitted = onCloseAutoFocus.mock.calls.length

    show.value = false
    await settle()
    expect(get('kept-content')).toBeNull()
    expect(onCloseAutoFocus.mock.calls.length).toBe(emitted + 1)
  })
})
