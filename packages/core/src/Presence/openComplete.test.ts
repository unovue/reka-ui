import type { Component, Ref, VNodeChild } from 'vue'
import type { CollapsibleRootContext } from '@/Collapsible/CollapsibleRoot.vue'
import type { ComboboxRootContext } from '@/Combobox/ComboboxRoot.vue'
import type { DialogRootContext } from '@/Dialog/DialogRoot.vue'
import type { HoverCardRootContext } from '@/HoverCard/HoverCardRoot.vue'
import type { MenuContext } from '@/Menu/MenuRoot.vue'
import type { NavigationMenuContext } from '@/NavigationMenu/NavigationMenuRoot.vue'
import type { PopoverRootContext } from '@/Popover/PopoverRoot.vue'
import type { SelectRootContext } from '@/Select/SelectRoot.vue'
import type { TooltipContext } from '@/Tooltip/TooltipRoot.vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogRoot,
  AlertDialogTitle,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteRoot,
  AutocompleteViewport,
  CollapsibleContent,
  CollapsibleRoot,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxRoot,
  ComboboxViewport,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRoot,
  ContextMenuTrigger,
  DatePickerContent,
  DatePickerRoot,
  DatePickerTrigger,
  DateRangePickerContent,
  DateRangePickerRoot,
  DateRangePickerTrigger,
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
  DrawerContent,
  DrawerRoot,
  DrawerTitle,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  HoverCardContent,
  HoverCardRoot,
  HoverCardTrigger,
  MenubarContent,
  MenubarMenu,
  MenubarRoot,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectRoot,
  SelectTrigger,
  SelectViewport,
  ToastProvider,
  ToastRoot,
  ToastViewport,
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '..'

// #2827: every root with an `open` model emits `update:openComplete` once its
// content's Presence settles, and every presence-managed content renders the
// lifecycle attributes on its own element. jsdom has no `getAnimations`, so it
// is stubbed to "nothing running": the attributes are stamped and every change
// settles right away. Real transition timing is covered by
// `Presence.browser.test.ts`.

interface Case {
  name: string
  /** Renders the family with the given open state and `update:openComplete` listener. */
  render: (open: boolean, onOpenComplete: (value: boolean) => void) => VNodeChild
  /** Set for a family whose root mounts already open (Toast). */
  initiallyOpen?: boolean
}

const content = { 'data-testid': 'content' }

const cases: Case[] = [
  {
    name: 'Dialog',
    render: (open, onOpenComplete) => h(DialogRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () =>
      h(DialogContent, content, () => [h(DialogTitle, () => 'Title'), h(DialogDescription, () => 'Description')])),
  },
  {
    name: 'AlertDialog',
    render: (open, onOpenComplete) => h(AlertDialogRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () =>
      h(AlertDialogContent, content, () => [h(AlertDialogTitle, () => 'Title'), h(AlertDialogDescription, () => 'Description')])),
  },
  {
    name: 'Drawer',
    render: (open, onOpenComplete) => h(DrawerRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () =>
      h(DrawerContent, content, () => h(DrawerTitle, () => 'Title'))),
  },
  {
    name: 'Popover',
    render: (open, onOpenComplete) => h(PopoverRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () => [
      h(PopoverTrigger, () => 'Open'),
      h(PopoverContent, content, () => 'Content'),
    ]),
  },
  {
    name: 'DatePicker',
    render: (open, onOpenComplete) => h(DatePickerRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () => [
      h(DatePickerTrigger, () => 'Open'),
      h(DatePickerContent, content, () => 'Content'),
    ]),
  },
  {
    name: 'DateRangePicker',
    render: (open, onOpenComplete) => h(DateRangePickerRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () => [
      h(DateRangePickerTrigger, () => 'Open'),
      h(DateRangePickerContent, content, () => 'Content'),
    ]),
  },
  {
    name: 'Tooltip',
    render: (open, onOpenComplete) => h(TooltipProvider, () => h(TooltipRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () => [
      h(TooltipTrigger, () => 'Trigger'),
      h(TooltipContent, content, () => 'Content'),
    ])),
  },
  {
    name: 'HoverCard',
    render: (open, onOpenComplete) => h(HoverCardRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () => [
      h(HoverCardTrigger, () => 'Trigger'),
      h(HoverCardContent, content, () => 'Content'),
    ]),
  },
  {
    name: 'DropdownMenu',
    render: (open, onOpenComplete) => h(DropdownMenuRoot, { open, 'modal': false, 'onUpdate:openComplete': onOpenComplete }, () => [
      h(DropdownMenuTrigger, () => 'Open'),
      h(DropdownMenuContent, content, () => h(DropdownMenuItem, () => 'Item')),
    ]),
  },
  {
    name: 'DropdownMenuSub',
    render: (open, onOpenComplete) => h(DropdownMenuRoot, { open: true, modal: false }, () => [
      h(DropdownMenuTrigger, () => 'Open'),
      h(DropdownMenuContent, () => h(DropdownMenuSub, { open, 'onUpdate:openComplete': onOpenComplete }, () => [
        h(DropdownMenuSubTrigger, () => 'More'),
        h(DropdownMenuSubContent, content, () => h(DropdownMenuItem, () => 'Sub item')),
      ])),
    ]),
  },
  {
    name: 'ContextMenu',
    render: (open, onOpenComplete) => h(ContextMenuRoot, { open, 'modal': false, 'onUpdate:openComplete': onOpenComplete }, () => [
      h(ContextMenuTrigger, () => 'Area'),
      h(ContextMenuContent, content, () => h(ContextMenuItem, () => 'Item')),
    ]),
  },
  {
    name: 'MenubarSub',
    render: (open, onOpenComplete) => h(MenubarRoot, { modelValue: 'file' }, () => h(MenubarMenu, { value: 'file' }, () => [
      h(MenubarTrigger, () => 'File'),
      h(MenubarContent, () => h(MenubarSub, { open, 'onUpdate:openComplete': onOpenComplete }, () => [
        h(MenubarSubTrigger, () => 'More'),
        h(MenubarSubContent, content, () => 'Sub content'),
      ])),
    ])),
  },
  {
    name: 'MenubarMenu',
    render: (open, onOpenComplete) => h(MenubarRoot, { modelValue: open ? 'file' : '' }, () => h(MenubarMenu, { 'value': 'file', 'onUpdate:openComplete': onOpenComplete }, () => [
      h(MenubarTrigger, () => 'File'),
      h(MenubarContent, content, () => 'Content'),
    ])),
  },
  {
    name: 'NavigationMenu',
    render: (open, onOpenComplete) => h(NavigationMenuRoot, { 'modelValue': open ? 'a' : '', 'onUpdate:openComplete': onOpenComplete }, () => [
      h(NavigationMenuList, () => h(NavigationMenuItem, { value: 'a' }, () => [
        h(NavigationMenuTrigger, () => 'A'),
        h(NavigationMenuContent, () => 'Content'),
      ])),
      h(NavigationMenuViewport, content),
    ]),
  },
  {
    name: 'Select',
    render: (open, onOpenComplete) => h(SelectRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () => [
      h(SelectTrigger, () => 'Open'),
      h(SelectContent, content, () => h(SelectViewport, () => h(SelectItem, { value: 'a' }, () => h(SelectItemText, () => 'A')))),
    ]),
  },
  {
    name: 'Combobox',
    render: (open, onOpenComplete) => h(ComboboxRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () => [
      h(ComboboxInput),
      h(ComboboxContent, content, () => h(ComboboxViewport, () => h(ComboboxItem, { value: 'a' }, () => 'A'))),
    ]),
  },
  {
    name: 'Autocomplete',
    render: (open, onOpenComplete) => h(AutocompleteRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () => [
      h(AutocompleteInput),
      h(AutocompleteContent, content, () => h(AutocompleteViewport, () => h(AutocompleteItem, { value: 'a' }, () => 'A'))),
    ]),
  },
  {
    name: 'Collapsible',
    render: (open, onOpenComplete) => h(CollapsibleRoot, { open, 'onUpdate:openComplete': onOpenComplete }, () =>
      h(CollapsibleContent, content, () => 'Content')),
  },
  {
    name: 'AccordionItem',
    render: (open, onOpenComplete) => h(AccordionRoot, { type: 'single', modelValue: open ? 'a' : undefined }, () =>
      h(AccordionItem, { 'value': 'a', 'onUpdate:openComplete': onOpenComplete }, () => [
        h(AccordionHeader, () => h(AccordionTrigger, () => 'A')),
        h(AccordionContent, content, () => 'Content'),
      ])),
  },
  {
    name: 'Toast',
    initiallyOpen: true,
    render: (open, onOpenComplete) => h(ToastProvider, () => [
      h(ToastRoot, { ...content, open, 'onUpdate:openComplete': onOpenComplete }, () => 'Toast'),
      h(ToastViewport),
    ]),
  },
]

function mountCase(testCase: Case, open: Ref<boolean>, onOpenComplete: (value: boolean) => void) {
  return mount(defineComponent({
    setup: () => () => testCase.render(open.value, onOpenComplete),
  }) as Component, { attachTo: document.body })
}

/**
 * Records whether the content element ever carried `data-starting-style`. The
 * attribute only lives for one frame, so it is caught by a MutationObserver
 * (a microtask) instead of by polling.
 */
function watchStartingStyle() {
  const seen = { value: false }
  const check = () => {
    if (document.querySelector('[data-testid="content"][data-starting-style]'))
      seen.value = true
  }
  const observer = new MutationObserver(check)
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-starting-style'] })
  check()
  return { seen, stop: () => observer.disconnect() }
}

const getContent = () => document.querySelector<HTMLElement>('[data-testid="content"]')
/** The element to check for presence: Collapsible keeps its content mounted (hidden) when closed. */
function isShown(name: string) {
  return name === 'Collapsible' || name === 'AccordionItem'
    ? !getContent()?.hasAttribute('hidden')
    : getContent() !== null
}

describe('update:openComplete and the lifecycle attributes (#2827)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    Element.prototype.getAnimations = () => []
  })
  afterEach(() => {
    // @ts-expect-error restoring jsdom's missing implementation
    delete Element.prototype.getAnimations
  })

  for (const testCase of cases) {
    it(`${testCase.name}: stamps the content and reports both directions`, async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const open = ref(testCase.initiallyOpen ?? false)
      const onOpenComplete = vi.fn()
      const startingStyle = watchStartingStyle()
      const wrapper = mountCase(testCase, open, onOpenComplete)

      if (!testCase.initiallyOpen) {
        await nextTick()
        expect(onOpenComplete).not.toHaveBeenCalled()
        open.value = true
      }
      await vi.waitFor(() => expect(onOpenComplete).toHaveBeenCalledWith(true))
      // The attribute reached the part's own element (attrs fall through every layer).
      expect(startingStyle.seen.value).toBe(true)
      startingStyle.stop()
      expect(getContent()!.hasAttribute('data-starting-style')).toBe(false)
      expect(isShown(testCase.name)).toBe(true)

      open.value = false
      await vi.waitFor(() => expect(onOpenComplete).toHaveBeenLastCalledWith(false))
      expect(onOpenComplete).toHaveBeenCalledTimes(2)
      await vi.waitFor(() => expect(isShown(testCase.name)).toBe(false))
      expect(getContent()?.hasAttribute('data-ending-style') ?? false).toBe(false)

      // No "extraneous non-props attributes" warning from a layer that drops them.
      expect(warn.mock.calls.flat().join('\n')).not.toMatch(/Extraneous non-props attributes/)
      wrapper.unmount()
      warn.mockRestore()
    })
  }

  it('accordion content (no open model of its own) gets the attributes too', async () => {
    const value = ref<string>()
    const wrapper = mount(defineComponent({
      setup: () => () => h(AccordionRoot, { type: 'single', modelValue: value.value }, () =>
        h(AccordionItem, { value: 'a' }, () => [
          h(AccordionHeader, () => h(AccordionTrigger, () => 'A')),
          h(AccordionContent, content, () => 'Content'),
        ])),
    }), { attachTo: document.body })

    value.value = 'a'
    await nextTick()
    expect(getContent()!.hasAttribute('data-starting-style')).toBe(true)
    await vi.waitFor(() => expect(getContent()!.hasAttribute('data-starting-style')).toBe(false))
    wrapper.unmount()
  })
})

describe('the root contexts', () => {
  it('take notifyOpenComplete as optional, so hand-written contexts keep compiling', () => {
    type Notify = ((value: boolean) => void) | undefined
    expectTypeOf<DialogRootContext['notifyOpenComplete']>().toEqualTypeOf<Notify>()
    expectTypeOf<PopoverRootContext['notifyOpenComplete']>().toEqualTypeOf<Notify>()
    expectTypeOf<TooltipContext['notifyOpenComplete']>().toEqualTypeOf<Notify>()
    expectTypeOf<HoverCardRootContext['notifyOpenComplete']>().toEqualTypeOf<Notify>()
    expectTypeOf<MenuContext['notifyOpenComplete']>().toEqualTypeOf<Notify>()
    expectTypeOf<SelectRootContext['notifyOpenComplete']>().toEqualTypeOf<Notify>()
    expectTypeOf<ComboboxRootContext['notifyOpenComplete']>().toEqualTypeOf<Notify>()
    expectTypeOf<CollapsibleRootContext['notifyOpenComplete']>().toEqualTypeOf<Notify>()
    expectTypeOf<NavigationMenuContext['notifyOpenComplete']>().toEqualTypeOf<Notify>()
  })
})
