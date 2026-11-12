import type { Component, VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { AlertDialogCancel, AlertDialogContent, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle, AlertDialogTrigger } from '@/AlertDialog'
import { DialogClose, DialogContent, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { DrawerClose, DrawerContent, DrawerPortal, DrawerRoot, DrawerTitle, DrawerTrigger } from '@/Drawer'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'

interface Parts {
  Root: Component
  Trigger: Component
  Portal: Component
  Content: Component
  Title?: Component
  Close?: Component
  Item?: Component
}

const Dialog = { Root: DialogRoot, Trigger: DialogTrigger, Portal: DialogPortal, Content: DialogContent, Title: DialogTitle, Close: DialogClose }
const AlertDialog = { Root: AlertDialogRoot, Trigger: AlertDialogTrigger, Portal: AlertDialogPortal, Content: AlertDialogContent, Title: AlertDialogTitle, Close: AlertDialogCancel }
const Drawer = { Root: DrawerRoot, Trigger: DrawerTrigger, Portal: DrawerPortal, Content: DrawerContent, Title: DrawerTitle, Close: DrawerClose }
const DropdownMenu = { Root: DropdownMenuRoot, Trigger: DropdownMenuTrigger, Portal: DropdownMenuPortal, Content: DropdownMenuContent, Item: DropdownMenuItem }
const Popover = { Root: PopoverRoot, Trigger: PopoverTrigger, Portal: PopoverPortal, Content: PopoverContent, Close: PopoverClose }

interface Fixture {
  name: string
  parts: Parts
  rootProps?: Record<string, unknown>
  contentProps?: Record<string, unknown>
  modal: boolean
}

const CASES: Fixture[] = [
  { name: 'Dialog', parts: Dialog, modal: true },
  { name: 'kept-mounted Dialog', parts: Dialog, rootProps: { unmountOnHide: false }, modal: true },
  { name: 'force-mounted Dialog', parts: Dialog, contentProps: { forceMount: true }, modal: true },
  { name: 'AlertDialog', parts: AlertDialog, modal: true },
  { name: 'Drawer', parts: Drawer, modal: true },
  { name: 'DropdownMenu', parts: DropdownMenu, modal: true },
  { name: 'modal Popover', parts: Popover, rootProps: { modal: true }, modal: true },
  { name: 'non-modal Dialog', parts: Dialog, rootProps: { modal: false }, modal: false },
  { name: 'non-modal Popover', parts: Popover, modal: false },
]

function get(id: string) {
  const element = document.getElementById(id)
  if (!element)
    throw new Error(`Missing element: ${id}`)
  return element
}

function createHost() {
  const host = document.createElement('div')
  document.body.append(host)
  onTestFinished(() => host.remove())
  return host
}

// MutationObserver callbacks run after autofocus has already finished. Observe
// the attribute write itself so a transient hidden focus cannot go unnoticed.
function observeHiddenFocus(trigger: HTMLElement) {
  const hiddenOnHide: Element[] = []
  const hiddenOnRestore: Element[] = []
  const setAttribute = Element.prototype.setAttribute
  vi.spyOn(Element.prototype, 'setAttribute').mockImplementation(function (this: Element, name, value) {
    if (name === 'aria-hidden' && value === 'true' && this.contains(document.activeElement))
      hiddenOnHide.push(this)
    return setAttribute.call(this, name, value)
  })
  trigger.addEventListener('focus', () => {
    const hidden = trigger.closest('[aria-hidden="true"]')
    if (hidden)
      hiddenOnRestore.push(hidden)
  })
  return { hiddenOnHide, hiddenOnRestore }
}

beforeEach(() => {
  // Exercise the real hiding behavior, which is normally disabled in test mode.
  vi.stubEnv('MODE', 'development')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('modal focus and aria-hidden ordering', () => {
  it.each(CASES)('keeps focus exposed when $name opens, closes and reopens', async ({ parts, rootProps, contentProps, modal }) => {
    const host = createHost()
    mount(defineComponent({
      setup: () => () => h(parts.Root, rootProps, () => [
        h(parts.Trigger, { id: 'trigger' }, () => 'Open'),
        h(parts.Portal, null, () => h(parts.Content, {
          'id': 'content',
          'aria-describedby': undefined,
          'style': 'position: fixed; top: 100px; left: 100px; width: 200px;',
          ...contentProps,
        }, () => parts.Item
          ? h(parts.Item, null, () => 'Item')
          : [
              parts.Title ? h(parts.Title, null, () => 'Title') : null,
              h('input'),
              parts.Close ? h(parts.Close, null, () => 'Close') : null,
            ])),
      ]),
    }), { attachTo: host })
    const trigger = get('trigger')
    const { hiddenOnHide, hiddenOnRestore } = observeHiddenFocus(trigger)
    // Menus prevent the pointerdown default, so start with an already-focused trigger.
    trigger.focus()

    for (let cycle = 0; cycle < 2; cycle++) {
      await userEvent.click(trigger)
      await expect.poll(() => get('content').contains(document.activeElement)).toBe(true)
      if (modal)
        await expect.poll(() => host.getAttribute('aria-hidden')).toBe('true')
      else
        expect(host.hasAttribute('aria-hidden')).toBe(false)
      expect.soft(hiddenOnHide, 'background must be hidden after focus moves inside').toEqual([])

      await userEvent.keyboard('{Escape}')
      await expect.poll(() => document.activeElement).toBe(trigger)
      expect(host.hasAttribute('aria-hidden')).toBe(false)
      expect.soft(hiddenOnRestore, 'background must be exposed before trigger focus').toEqual([])
    }
  })

  it('exposes a nested dialog trigger before restoring focus while keeping the page hidden', async () => {
    const host = createHost()
    const dialog = (id: string, children: () => VNode[]) => h(DialogRoot, null, () => [
      h(DialogTrigger, { id: `${id}-trigger` }, () => `Open ${id}`),
      h(DialogPortal, null, () => h(DialogContent, {
        'id': `${id}-content`,
        'aria-describedby': undefined,
        'style': `position: fixed; top: ${id === 'outer' ? 100 : 200}px; left: 100px;`,
      }, () => [h(DialogTitle, null, () => id), ...children()])),
    ])
    mount(defineComponent({
      setup: () => () => dialog('outer', () => [dialog('inner', () => [h('input')])]),
    }), { attachTo: host })
    await userEvent.click(get('outer-trigger'))
    await expect.poll(() => host.getAttribute('aria-hidden')).toBe('true')
    const trigger = get('inner-trigger')
    const { hiddenOnHide, hiddenOnRestore } = observeHiddenFocus(trigger)

    await userEvent.click(trigger)
    await expect.poll(() => get('inner-content').contains(document.activeElement)).toBe(true)
    await expect.poll(() => get('outer-content').getAttribute('aria-hidden')).toBe('true')
    expect(hiddenOnHide).toEqual([])

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => document.activeElement).toBe(trigger)
    expect(hiddenOnRestore).toEqual([])
    expect(get('outer-content').hasAttribute('aria-hidden')).toBe(false)
    expect(host.getAttribute('aria-hidden')).toBe('true')

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => document.activeElement).toBe(get('outer-trigger'))
    expect(host.hasAttribute('aria-hidden')).toBe(false)
  })
})
