import type { Component, VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle } from '@/AlertDialog'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxViewport } from '@/Combobox'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from '@/ContextMenu'
import { DialogContent, DialogPortal, DialogRoot, DialogTitle } from '@/Dialog'
import { DrawerContent, DrawerPortal, DrawerRoot, DrawerTitle } from '@/Drawer'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from '@/HoverCard'
import { MenubarContent, MenubarItem, MenubarMenu, MenubarPortal, MenubarRoot, MenubarTrigger } from '@/Menubar'
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger } from '@/NavigationMenu'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '@/Select'

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  unmount = undefined
  document.body.innerHTML = ''
})

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const $ = (id: string) => document.querySelector<HTMLElement>(`[data-testid=${id}]`)

const EVENTS = ['openAutoFocus', 'closeAutoFocus', 'escapeKeyDown', 'pointerDownOutside', 'interactOutside', 'focusOutside'] as const
const contentStyle = 'position: fixed; z-index: 10; left: 40px; top: 60px; width: 200px; background: white'

interface Family {
  /** Whether the content emits `closeAutoFocus`. */
  closeAutoFocus: boolean
  render: (open: { value: boolean }, listeners: Record<string, (event: Event) => void>) => VNode | VNode[]
  /** Opens through the UI instead of the `open` state. */
  open?: () => Promise<void>
}

function content(component: Component, listeners: Record<string, unknown>, children: () => unknown) {
  return h(component, { 'data-testid': 'content', 'style': contentStyle, ...listeners }, children)
}
const controlled = (open: { value: boolean }) => ({ 'open': open.value, 'onUpdate:open': (value: boolean) => (open.value = value) })

const families: Record<string, Family> = {
  'Dialog': {
    closeAutoFocus: true,
    render: (open, on) => h(DialogRoot, controlled(open), () => h(DialogPortal, () => content(DialogContent, { ...on, 'aria-describedby': undefined }, () => [h(DialogTitle, () => 'Title'), h('button', 'In')]))),
  },
  'AlertDialog': {
    closeAutoFocus: true,
    render: (open, on) => h(AlertDialogRoot, controlled(open), () => h(AlertDialogPortal, () => content(AlertDialogContent, on, () => [h(AlertDialogTitle, () => 'Title'), h(AlertDialogDescription, () => 'Description'), h(AlertDialogCancel, () => 'Cancel')]))),
  },
  'Drawer': {
    closeAutoFocus: false,
    render: (open, on) => h(DrawerRoot, controlled(open), () => h(DrawerPortal, () => content(DrawerContent, { ...on, 'aria-describedby': undefined }, () => [h(DrawerTitle, () => 'Title'), h('button', 'In')]))),
  },
  'Popover modal': {
    closeAutoFocus: true,
    render: (open, on) => h(PopoverRoot, { ...controlled(open), modal: true }, () => [h(PopoverTrigger, () => 'Open'), h(PopoverPortal, () => content(PopoverContent, on, () => h('button', 'In')))]),
  },
  'Popover non-modal': {
    closeAutoFocus: true,
    render: (open, on) => h(PopoverRoot, controlled(open), () => [h(PopoverTrigger, () => 'Open'), h(PopoverPortal, () => content(PopoverContent, on, () => h('button', 'In')))]),
  },
  'DropdownMenu modal': {
    closeAutoFocus: true,
    render: (open, on) => h(DropdownMenuRoot, controlled(open), () => [h(DropdownMenuTrigger, () => 'Open'), h(DropdownMenuPortal, () => content(DropdownMenuContent, on, () => h(DropdownMenuItem, () => 'Item')))]),
  },
  'DropdownMenu non-modal': {
    closeAutoFocus: true,
    render: (open, on) => h(DropdownMenuRoot, { ...controlled(open), modal: false }, () => [h(DropdownMenuTrigger, () => 'Open'), h(DropdownMenuPortal, () => content(DropdownMenuContent, on, () => h(DropdownMenuItem, () => 'Item')))]),
  },
  'ContextMenu': {
    closeAutoFocus: true,
    render: (_open, on) => h(ContextMenuRoot, () => [h(ContextMenuTrigger, () => h('div', { 'data-testid': 'context-trigger', 'style': 'width: 100px; height: 40px' }, 'Area')), h(ContextMenuPortal, () => content(ContextMenuContent, on, () => h(ContextMenuItem, () => 'Item')))]),
    open: () => userEvent.click($('context-trigger')!, { button: 'right' }),
  },
  'Menubar': {
    closeAutoFocus: true,
    render: (open, on) => h(MenubarRoot, { 'modelValue': open.value ? 'menu' : '', 'onUpdate:modelValue': (value: string) => (open.value = !!value) }, () => h(MenubarMenu, { value: 'menu' }, () => [h(MenubarTrigger, () => 'Open'), h(MenubarPortal, () => content(MenubarContent, on, () => h(MenubarItem, () => 'Item')))])),
  },
  'Combobox': {
    closeAutoFocus: false,
    render: (open, on) => h(ComboboxRoot, controlled(open), () => [
      h(ComboboxAnchor, () => h(ComboboxInput, { 'aria-label': 'Fruit' })),
      h(ComboboxPortal, () => content(ComboboxContent, on, () => h(ComboboxViewport, () => ['Apple', 'Banana'].map(value => h(ComboboxItem, { value }, () => value))))),
    ]),
  },
  'HoverCard': {
    closeAutoFocus: false,
    render: (open, on) => h(HoverCardRoot, controlled(open), () => [h(HoverCardTrigger, { href: '#' }, () => 'Open'), h(HoverCardPortal, () => content(HoverCardContent, on, () => 'Card'))]),
  },
  'NavigationMenu': {
    closeAutoFocus: false,
    render: (open, on) => h(NavigationMenuRoot, { 'modelValue': open.value ? 'item' : '', 'onUpdate:modelValue': (value: string) => (open.value = !!value) }, () => h(NavigationMenuList, () => h(NavigationMenuItem, { value: 'item' }, () => [h(NavigationMenuTrigger, () => 'Open'), content(NavigationMenuContent, on, () => h('a', { href: '#' }, 'Link'))]))),
  },
  'Select': {
    closeAutoFocus: true,
    render: (open, on) => h(SelectRoot, controlled(open), () => [
      h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue)),
      h(SelectPortal, () => content(SelectContent, { ...on, position: 'popper' }, () => h(SelectViewport, () => ['Apple', 'Banana'].map(value => h(SelectItem, { value }, () => h(SelectItemText, () => value)))))),
    ]),
  },
}

// Each consumer listener on an overlay content runs once per event. A content
// part that forwarded its emits to the inner part (`useForwardPropsEmits`) and
// also re-emitted the same event from its own handler on that part called the
// consumer twice: Popover's `closeAutoFocus` and outside-press events, the
// modal menus' `focusOutside`.
describe('given an overlay content with consumer listeners', () => {
  for (const [name, family] of Object.entries(families)) {
    it(`calls each listener once per event, ${name}`, async () => {
      const open = ref(false)
      const calls: string[] = []
      const listeners = Object.fromEntries(EVENTS.map(event => [`on${event[0].toUpperCase()}${event.slice(1)}`, () => calls.push(event)]))
      const wrapper = mount(defineComponent({
        setup: () => () => [
          h('button', { 'data-testid': 'outside', 'style': 'position: fixed; right: 0; bottom: 0; width: 30px; height: 30px' }, 'Outside'),
          family.render(open, listeners),
        ],
      }), { attachTo: document.body })
      unmount = () => wrapper.unmount()

      const count = (event: string) => calls.filter(call => call === event).length
      const openContent = async () => {
        calls.length = 0
        if (family.open)
          await family.open()
        else
          open.value = true
        await expect.poll(() => !!$('content')).toBe(true)
        await wait(100)
      }
      const expectOnce = async (close: () => Promise<void>) => {
        await close()
        await nextTick()
        await wait(150)
        for (const event of EVENTS)
          expect(count(event), `${event} in ${JSON.stringify(calls)}`).toBeLessThanOrEqual(1)
        if (family.closeAutoFocus && !$('content'))
          expect(count('closeAutoFocus')).toBe(1)
      }

      await openContent()
      await expectOnce(() => userEvent.keyboard('{Escape}'))
      expect(count('escapeKeyDown')).toBe(1)
      if (family.closeAutoFocus)
        expect(count('closeAutoFocus')).toBe(1)

      await openContent()
      await expectOnce(async () => {
        $('outside')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }))
        $('outside')!.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerType: 'mouse' }))
        $('outside')!.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
      })

      if (!$('content'))
        await openContent()
      await expectOnce(async () => $('outside')!.focus())
    })
  }
})
