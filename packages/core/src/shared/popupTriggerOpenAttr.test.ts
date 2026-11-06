import type { Component, Ref, VNode, VNodeChild } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { AlertDialogRoot, AlertDialogTrigger } from '@/AlertDialog'
import { ComboboxRoot, ComboboxTrigger } from '@/Combobox'
import { ContextMenuRoot, ContextMenuTrigger } from '@/ContextMenu'
import { DialogRoot, DialogTrigger } from '@/Dialog'
import { DrawerRoot, DrawerTrigger } from '@/Drawer'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { HoverCardRoot, HoverCardTrigger } from '@/HoverCard'
import { MenubarMenu, MenubarRoot, MenubarTrigger } from '@/Menubar'
import { NavigationMenuItem, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger } from '@/NavigationMenu'
import { PopoverContent, PopoverRoot, PopoverTrigger } from '@/Popover'
import { RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { SelectRoot, SelectTrigger } from '@/Select'
import { Toggle } from '@/Toggle'
import { TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'

// #1407: a popup trigger rendered `asChild` onto a stateful control must not
// overwrite the control's own `data-state`. Triggers report their popup's open
// state as `data-popup-open` (present while open), never as `data-state`.

/** Renders the stateful control the trigger is rendered `asChild` onto. */
type Control = () => VNodeChild

// `h()` over components with generic props (the triggers) without per-family overload noise.
function hc(component: Component, props: Record<string, unknown> | null, child: () => VNodeChild): VNode {
  return h(component, props, child)
}

/** Each family's Root, driven open/closed through `open`, wrapping its trigger. */
const families: Record<string, (open: Ref<boolean>, control: Control) => VNodeChild> = {
  Dialog: (open, t) => hc(DialogRoot, { open: open.value }, () => hc(DialogTrigger, { asChild: true }, t)),
  AlertDialog: (open, t) => hc(AlertDialogRoot, { open: open.value }, () => hc(AlertDialogTrigger, { asChild: true }, t)),
  Drawer: (open, t) => hc(DrawerRoot, { open: open.value }, () => hc(DrawerTrigger, { asChild: true }, t)),
  Popover: (open, t) => hc(PopoverRoot, { open: open.value }, () => hc(PopoverTrigger, { asChild: true }, t)),
  Tooltip: (open, t) => hc(TooltipProvider, null, () => hc(TooltipRoot, { open: open.value }, () => hc(TooltipTrigger, { asChild: true }, t))),
  HoverCard: (open, t) => hc(HoverCardRoot, { open: open.value }, () => hc(HoverCardTrigger, { asChild: true }, t)),
  DropdownMenu: (open, t) => hc(DropdownMenuRoot, { open: open.value, modal: false }, () => hc(DropdownMenuTrigger, { asChild: true }, t)),
  ContextMenu: (open, t) => hc(ContextMenuRoot, { open: open.value, modal: false }, () => hc(ContextMenuTrigger, { asChild: true }, t)),
  Menubar: (open, t) => hc(MenubarRoot, { modelValue: open.value ? 'file' : '' }, () => hc(MenubarMenu, { value: 'file' }, () => hc(MenubarTrigger, { asChild: true }, t))),
  NavigationMenu: (open, t) => hc(NavigationMenuRoot, { modelValue: open.value ? 'docs' : '' }, () => hc(NavigationMenuList, null, () => hc(NavigationMenuItem, { value: 'docs' }, () => hc(NavigationMenuTrigger, { asChild: true }, t)))),
  Select: (open, t) => hc(SelectRoot, { open: open.value }, () => hc(SelectTrigger, { asChild: true }, t)),
  Combobox: (open, t) => hc(ComboboxRoot, { open: open.value }, () => hc(ComboboxTrigger, { asChild: true }, t)),
}

let wrapper: ReturnType<typeof mount> | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function mountWith(family: string, control: () => VNodeChild) {
  const open = ref(false)
  wrapper = mount(defineComponent({
    setup: () => () => families[family](open, control),
  }), { attachTo: document.body })
  const el = () => document.querySelector<HTMLElement>('[data-testid="control"]')!
  return { open, el }
}

describe('popup triggers rendered asChild onto a stateful control (#1407)', () => {
  describe.each(Object.keys(families))('%sTrigger on a pressed Toggle', (family) => {
    it('keeps the Toggle\'s data-state and adds data-popup-open while open', async () => {
      const { open, el } = mountWith(family, () => h(Toggle, { 'defaultValue': true, 'data-testid': 'control' }, () => 'B'))
      await nextTick()
      expect(el().getAttribute('data-state')).toBe('checked')
      expect(el().hasAttribute('data-popup-open')).toBe(false)

      open.value = true
      await nextTick()
      await nextTick()
      expect(el().getAttribute('data-state')).toBe('checked')
      expect(el().getAttribute('data-popup-open')).toBe('')

      open.value = false
      await nextTick()
      await nextTick()
      expect(el().getAttribute('data-state')).toBe('checked')
      expect(el().hasAttribute('data-popup-open')).toBe(false)
    })
  })

  it('a TooltipTrigger on a checked RadioGroupItem keeps data-state="checked"', async () => {
    const open = ref(false)
    wrapper = mount(defineComponent({
      setup: () => () => h(RadioGroupRoot, { defaultValue: 'a' }, () => [
        h(TooltipProvider, () => h(TooltipRoot, { open: open.value }, () => h(TooltipTrigger, { asChild: true }, () => h(RadioGroupItem, { 'value': 'a', 'data-testid': 'control' }, () => 'A')))),
        h(RadioGroupItem, { value: 'b' }, () => 'B'),
      ]),
    }), { attachTo: document.body })
    const el = () => document.querySelector<HTMLElement>('[data-testid="control"]')!
    expect(el().getAttribute('data-state')).toBe('checked')

    open.value = true
    await nextTick()
    expect(el().getAttribute('data-state')).toBe('checked')
    expect(el().getAttribute('data-popup-open')).toBe('')

    open.value = false
    await nextTick()
    expect(el().getAttribute('data-state')).toBe('checked')
    expect(el().hasAttribute('data-popup-open')).toBe(false)
  })

  it('a PopoverTrigger on a Toggle: one press toggles both, each keeping its own attribute', async () => {
    wrapper = mount(defineComponent({
      setup: () => () => h(PopoverRoot, () => [
        h(PopoverTrigger, { asChild: true }, () => h(Toggle, { 'data-testid': 'control' }, () => 'B')),
        h(PopoverContent, () => 'Body'),
      ]),
    }), { attachTo: document.body })
    const el = () => document.querySelector<HTMLElement>('[data-testid="control"]')!
    expect(el().getAttribute('data-state')).toBe('unchecked')
    expect(el().hasAttribute('data-popup-open')).toBe(false)

    el().click()
    await nextTick()
    expect(el().getAttribute('data-state')).toBe('checked')
    expect(el().getAttribute('data-popup-open')).toBe('')
    expect(el().getAttribute('aria-expanded')).toBe('true')
  })

  it('a DropdownMenuTrigger on a pressed Toggle opens on click without touching the Toggle\'s data-state', async () => {
    const pressed = ref(true)
    wrapper = mount(defineComponent({
      setup: () => () => h(DropdownMenuRoot, { modal: false }, () => [
        // Controlled Toggle that ignores updates: only the menu's state may change.
        h(DropdownMenuTrigger, { asChild: true }, () => h(Toggle, { 'modelValue': pressed.value, 'data-testid': 'control' }, () => 'B')),
        h(DropdownMenuContent, () => h(DropdownMenuItem, () => 'Item')),
      ]),
    }), { attachTo: document.body })
    const el = () => document.querySelector<HTMLElement>('[data-testid="control"]')!
    expect(el().getAttribute('data-state')).toBe('checked')

    el().dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    await nextTick()
    await nextTick()
    expect(el().getAttribute('data-popup-open')).toBe('')
    expect(el().getAttribute('data-state')).toBe('checked')
  })
})
