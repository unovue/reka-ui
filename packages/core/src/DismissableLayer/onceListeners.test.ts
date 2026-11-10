import type { Component } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot } from '@/Combobox'
import { DialogContent, DialogDescription, DialogRoot, DialogTitle } from '@/Dialog'
import { DrawerDescription, DrawerPopup, DrawerRoot, DrawerTitle } from '@/Drawer'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { HoverCardContent, HoverCardRoot, HoverCardTrigger } from '@/HoverCard'
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger } from '@/NavigationMenu'
import { PopoverContent, PopoverRoot, PopoverTrigger } from '@/Popover'
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'

// Consumer listeners on a content part that name a FocusScope or
// DismissableLayer event, `.once` included. The part doesn't declare these
// events, so they were the wrappers': each `.once` runs after the plain listener,
// once per wrapper instance. The content remounts for each open, which restarts
// them, except in `DialogKeepMounted`, where only the first open's run. `escapeKeyDown`
// is declared by a part that stays mounted, so its `.once` runs once in all. The
// expected logs are what the `<FocusScope as-child>` / `<DismissableLayer as-child>`
// chain gave; this test passes on it, except Popover's `closeAutoFocus`, which
// its content part forwarded and emitted again, so it ran twice per close.

type Family = (open: { value: boolean }, attrs: Record<string, unknown>) => Component
const families: Record<string, [Family, string[]]> = {
  Dialog: [(open, attrs) => defineComponent({
    setup: () => () => h(DialogRoot, { 'open': open.value, 'onUpdate:open': (v: boolean) => (open.value = v) }, () => h(DialogContent, attrs, () => [h(DialogTitle, () => 'T'), h(DialogDescription, () => 'D'), h('button', 'in')])),
  }), ['open', 'mount', 'mountOnce', '--esc', 'esc', 'escOnce', 'dismiss', 'dismiss', 'dismissOnce', 'close', 'unmount', 'unmountOnce', 'open', 'mount', 'mountOnce', '--esc', 'esc', 'dismiss', 'dismiss', 'dismissOnce', 'close', 'unmount', 'unmountOnce']],
  DialogKeepMounted: [(open, attrs) => defineComponent({
    setup: () => () => h(DialogRoot, { 'open': open.value, 'unmountOnHide': false, 'onUpdate:open': (v: boolean) => (open.value = v) }, () => h(DialogContent, attrs, () => [h(DialogTitle, () => 'T'), h(DialogDescription, () => 'D'), h('button', 'in')])),
  }), ['open', 'mount', 'mountOnce', '--esc', 'esc', 'escOnce', 'dismiss', 'dismiss', 'dismissOnce', '--esc', 'esc', 'dismiss', 'dismiss', 'close', 'unmount', 'unmountOnce']],
  Drawer: [(open, attrs) => defineComponent({
    setup: () => () => h(DrawerRoot, { 'open': open.value, 'onUpdate:open': (v: boolean) => (open.value = v) }, () => h(DrawerPopup, attrs, () => [h(DrawerTitle, () => 'T'), h(DrawerDescription, () => 'D'), h('button', 'in')])),
  }), ['open', 'mount', 'mountOnce', '--esc', 'esc', 'escOnce', 'dismiss', 'dismiss', 'dismissOnce', 'close', 'unmount', 'unmountOnce', 'open', 'mount', 'mountOnce', '--esc', 'esc', 'dismiss', 'dismiss', 'dismissOnce', 'close', 'unmount', 'unmountOnce']],
  Popover: [(open, attrs) => defineComponent({
    setup: () => () => h(PopoverRoot, { 'open': open.value, 'onUpdate:open': (v: boolean) => (open.value = v) }, () => [h(PopoverTrigger, () => 'T'), h(PopoverContent, attrs, () => h('button', 'in'))]),
  }), ['open', 'mount', 'mountOnce', '--esc', 'esc', 'escOnce', 'dismiss', 'dismissOnce', 'close', 'unmount', 'unmountOnce', 'open', 'mount', 'mountOnce', '--esc', 'esc', 'dismiss', 'dismissOnce', 'close', 'unmount', 'unmountOnce']],
  DropdownMenu: [(open, attrs) => defineComponent({
    setup: () => () => h(DropdownMenuRoot, { 'open': open.value, 'onUpdate:open': (v: boolean) => (open.value = v) }, () => [h(DropdownMenuTrigger, () => 'T'), h(DropdownMenuContent, attrs, () => h(DropdownMenuItem, () => 'A'))]),
  }), ['open', 'mount', 'mountOnce', '--esc', 'esc', 'escOnce', 'dismiss', 'dismissOnce', 'close', 'unmount', 'unmountOnce', 'open', 'mount', 'mountOnce', '--esc', 'esc', 'dismiss', 'dismissOnce', 'close', 'unmount', 'unmountOnce']],
  Tooltip: [(open, attrs) => defineComponent({
    setup: () => () => h(TooltipProvider, () => h(TooltipRoot, { 'open': open.value, 'onUpdate:open': (v: boolean) => (open.value = v) }, () => [h(TooltipTrigger, () => 'T'), h(TooltipContent, attrs, () => 'tip')])),
  }), ['--esc', 'esc', 'escOnce', 'dismiss', 'dismissOnce', '--esc', 'esc', 'dismiss', 'dismissOnce']],
  HoverCard: [(open, attrs) => defineComponent({
    setup: () => () => h(HoverCardRoot, { 'open': open.value, 'onUpdate:open': (v: boolean) => (open.value = v) }, () => [h(HoverCardTrigger, () => 'T'), h(HoverCardContent, attrs, () => 'card')]),
  }), ['--esc', 'esc', 'escOnce', 'dismiss', 'dismissOnce', '--esc', 'esc', 'dismiss', 'dismissOnce']],
  NavigationMenu: [(open, attrs) => defineComponent({
    setup: () => () => h(NavigationMenuRoot, { 'modelValue': open.value ? 'a' : '', 'onUpdate:modelValue': (v: string) => (open.value = !!v) }, () => h(NavigationMenuList, () => h(NavigationMenuItem, { value: 'a' }, () => [h(NavigationMenuTrigger, () => 'A'), h(NavigationMenuContent, attrs, () => h(NavigationMenuLink, { href: '#' }, () => 'L'))]))),
  }), ['--esc', 'esc', 'escOnce', 'dismiss', 'dismissOnce', 'focusOutsideOnce', 'interactOutsideOnce', '--esc', 'esc', 'dismiss', 'dismissOnce']],
  Combobox: [(open, attrs) => defineComponent({
    setup: () => () => h(ComboboxRoot, { 'open': open.value, 'onUpdate:open': (v: boolean) => (open.value = v) }, () => [h(ComboboxAnchor, () => h(ComboboxInput)), h(ComboboxContent, attrs, () => h(ComboboxItem, { value: 'a' }, () => 'a'))]),
  }), ['mount', 'mountOnce', '--esc', 'esc', 'escOnce', 'dismiss', 'dismissOnce', 'unmount', 'unmountOnce', 'mount', 'mountOnce', '--esc', 'esc', 'dismiss', 'dismissOnce', 'unmount', 'unmountOnce']],
}

async function flush() {
  for (let i = 0; i < 4; i++) {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve))
  }
}

function escape() {
  const active = document.activeElement
  const target = active && active !== document.body ? active : (document.querySelector('[data-dismissable-layer]') ?? document.body)
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
}

describe('content parts: `.once` on the layers\' events', () => {
  it.each(Object.entries(families))('%s', async (_, [family, expected]) => {
    const log: string[] = []
    const listener = (name: string) => () => log.push(name)
    const open = ref(false)
    const wrapper = mount(family(open, {
      onMountAutoFocus: listener('mount'),
      onMountAutoFocusOnce: listener('mountOnce'),
      onUnmountAutoFocus: listener('unmount'),
      onUnmountAutoFocusOnce: listener('unmountOnce'),
      onOpenAutoFocus: listener('open'),
      onCloseAutoFocus: listener('close'),
      onDismiss: listener('dismiss'),
      onDismissOnce: listener('dismissOnce'),
      onEscapeKeyDown: listener('esc'),
      onEscapeKeyDownOnce: listener('escOnce'),
      onFocusOutsideOnce: listener('focusOutsideOnce'),
      onInteractOutsideOnce: listener('interactOutsideOnce'),
    }), { attachTo: document.body })

    for (let i = 0; i < 2; i++) {
      open.value = true
      await flush()
      log.push('--esc')
      escape()
      await flush()
      if (open.value) {
        open.value = false
        await flush()
      }
    }
    wrapper.unmount()
    await flush()

    expect(log).toEqual(expected)
  })
})
