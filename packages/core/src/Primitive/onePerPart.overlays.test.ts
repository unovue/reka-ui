import type { VNodeChild } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { ContextMenuRoot, ContextMenuTrigger } from '@/ContextMenu'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { DrawerClose, DrawerContent, DrawerDescription, DrawerRoot, DrawerTitle, DrawerTrigger } from '@/Drawer'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { HoverCardContent, HoverCardRoot, HoverCardTrigger } from '@/HoverCard'
import { MenubarContent, MenubarItem, MenubarMenu, MenubarRoot, MenubarTrigger } from '@/Menubar'
import { NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger, NavigationMenuViewport } from '@/NavigationMenu'
import { PopoverAnchor, PopoverClose, PopoverContent, PopoverRoot, PopoverTrigger } from '@/Popover'
import { componentNames } from '@/test'
import { ToastAction, ToastClose, ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from '@/Toast'
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'

const WRAPPERS = new Set(['Primitive', 'PrimitiveSlot', 'PopperAnchor', 'MenuAnchor', 'RovingFocusGroup', 'RovingFocusItem', 'CollectionSlot', 'CollectionItem'])

const compositions: Record<string, () => VNodeChild> = {
  Dialog: () => h(DialogRoot, { defaultOpen: true }, () => [
    h(DialogTrigger, () => 'Open'),
    h(DialogOverlay),
    h(DialogContent, () => [h(DialogTitle, () => 'T'), h(DialogDescription, () => 'D'), h(DialogClose, () => 'x')]),
  ]),
  Drawer: () => h(DrawerRoot, { defaultOpen: true }, () => [
    h(DrawerTrigger, () => 'Open'),
    h(DrawerContent, () => [h(DrawerTitle, () => 'T'), h(DrawerDescription, () => 'D'), h(DrawerClose, () => 'x')]),
  ]),
  Popover: () => h(PopoverRoot, { defaultOpen: true }, () => [
    h(PopoverAnchor),
    h(PopoverTrigger, () => 'Open'),
    h(PopoverContent, () => h(PopoverClose, () => 'x')),
  ]),
  Tooltip: () => h(TooltipProvider, () => h(TooltipRoot, { defaultOpen: true }, () => [
    h(TooltipTrigger, () => 'Hover'),
    h(TooltipContent, () => 'Tip'),
  ])),
  HoverCard: () => h(HoverCardRoot, { defaultOpen: true }, () => [
    h(HoverCardTrigger, () => 'Hover'),
    h(HoverCardContent, () => 'Card'),
  ]),
  DropdownMenu: () => h(DropdownMenuRoot, { defaultOpen: true }, () => [
    h(DropdownMenuTrigger, () => 'Open'),
    h(DropdownMenuContent, () => h(DropdownMenuItem, () => 'A')),
  ]),
  ContextMenu: () => h(ContextMenuRoot, () => h(ContextMenuTrigger, () => 'Area')),
  Menubar: () => h(MenubarRoot, { defaultValue: 'm' }, () => h(MenubarMenu, { value: 'm' }, () => [
    h(MenubarTrigger, () => 'File'),
    h(MenubarContent, () => h(MenubarItem, () => 'New')),
  ])),
  NavigationMenu: () => h(NavigationMenuRoot, { defaultValue: 'a' }, () => [
    h(NavigationMenuList, () => [
      h(NavigationMenuItem, { value: 'a' }, () => [
        h(NavigationMenuTrigger, () => 'A'),
        h(NavigationMenuContent, () => h(NavigationMenuLink, { href: '#' }, () => 'Link')),
      ]),
      h(NavigationMenuIndicator),
    ]),
    h(NavigationMenuViewport),
  ]),
  Toast: () => h(ToastProvider, () => [
    h(ToastRoot, { defaultOpen: true }, () => [
      h(ToastTitle, () => 'T'),
      h(ToastDescription, () => 'D'),
      h(ToastAction, { altText: 'Undo' }, () => 'Undo'),
      h(ToastClose, () => 'x'),
    ]),
    h(ToastViewport),
  ]),
}

// The content parts keep their `<FocusScope as-child>` / `<DismissableLayer
// as-child>` chain (each a `Slot` onto the next): those are public components
// with their own state, left for a follow-up. Every other part renders its own
// element: no `Primitive`, no `PopperAnchor` / `MenuAnchor`, no collection or
// roving-focus wrapper.
const LAYERS = new Set(['FocusScope', 'DismissableLayer'])

/** Wrapper instances in the tree, but the `Slot` of a layer's `as-child`. */
function wrapperNames(names: string[]) {
  return names.filter((name, i) => WRAPPERS.has(name) && !(name === 'PrimitiveSlot' && LAYERS.has(names[i - 1])))
}

describe('one component per part: overlays', () => {
  it.each(Object.entries(compositions))('%s renders no wrapper', async (_, render) => {
    const wrapper = mount(defineComponent({ setup: () => render }), { attachTo: document.body })
    await nextTick()
    expect(wrapperNames(componentNames(wrapper.vm.$))).toEqual([])
    wrapper.unmount()
  })

  it('a trigger binds the consumer\'s attrs under its own, as the anchor wrapper did', async () => {
    let clicks = 0
    const wrapper = mount(defineComponent({
      setup: () => () => h(PopoverRoot, () => h(PopoverTrigger, {
        'class': 'trigger',
        'aria-expanded': 'mixed',
        'data-state': 'custom',
        'data-test': 'kept',
        'onClick': () => clicks++,
      }, () => 'Open')),
    }), { attachTo: document.body })
    const trigger = wrapper.find('.trigger')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(trigger.attributes('data-state')).toBe('closed')
    expect(trigger.attributes('data-test')).toBe('kept')
    expect(trigger.attributes('type')).toBe('button')
    await trigger.trigger('click')
    // Both handlers run: the consumer's and the trigger's own toggle.
    expect(clicks).toBe(1)
    expect(trigger.attributes('data-state')).toBe('open')
    wrapper.unmount()
  })

  it('a popover positions against its trigger, or its anchor when there is one', async () => {
    const anchored = mount(defineComponent({
      setup: () => () => h(PopoverRoot, { defaultOpen: true }, () => [
        h(PopoverAnchor, { class: 'anchor' }),
        h(PopoverTrigger, () => 'Open'),
        h(PopoverContent, () => 'Content'),
      ]),
    }), { attachTo: document.body })
    const plain = mount(defineComponent({
      setup: () => () => h(PopoverRoot, { defaultOpen: true }, () => [
        h(PopoverTrigger, { class: 'trigger' }, () => 'Open'),
        h(PopoverContent, () => 'Content'),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    const anchorOf = (w: typeof plain) => {
      const root = w.findComponent({ name: 'PopperRoot' }).vm.$ as unknown as { provides: Record<string | symbol, { anchor: { value: unknown } }> }
      const context = Reflect.ownKeys(root.provides).map(key => root.provides[key]).find(value => value && 'anchor' in value)
      return context?.anchor.value
    }
    expect(anchorOf(anchored)).toBe(anchored.find('.anchor').element)
    expect(anchorOf(plain)).toBe(plain.find('.trigger').element)
    anchored.unmount()
    plain.unmount()
  })

  // The menu content's attrs reached its `<RovingFocusGroup as-child>` through
  // the `FocusScope` / `DismissableLayer` as-child chain, under the wrapper's
  // own bindings: they configure only what the content leaves unset, and
  // never render.
  it('a menu content keeps its own roving config over consumer group attrs', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(DropdownMenuRoot, { defaultOpen: true }, () => [
        h(DropdownMenuTrigger, () => 'Open'),
        h(DropdownMenuContent, { 'class': 'content', 'dir': 'rtl', 'orientation': 'horizontal', 'data-test': 'kept' }, () => h(DropdownMenuItem, () => 'A')),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    const content = document.querySelector('.content')!
    expect(content.getAttribute('dir')).toBe('ltr')
    expect(content.getAttribute('data-orientation')).toBe('vertical')
    expect(content.getAttribute('orientation')).toBeNull()
    expect(content.getAttribute('data-test')).toBe('kept')
    wrapper.unmount()
  })

  // `reference` on a trigger fell through to its `<PopperAnchor as-child>`.
  it('a trigger\'s `reference` attr is the anchor and does not render', async () => {
    const target = document.createElement('span')
    document.body.append(target)
    const wrapper = mount(defineComponent({
      setup: () => () => h(PopoverRoot, { defaultOpen: true }, () => [
        h(PopoverTrigger, { class: 'trigger', reference: target }, () => 'Open'),
        h(PopoverContent, () => 'Content'),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    const root = wrapper.findComponent({ name: 'PopperRoot' }).vm.$ as unknown as { provides: Record<string | symbol, { anchor: { value: unknown } }> }
    const context = Reflect.ownKeys(root.provides).map(key => root.provides[key]).find(value => value && 'anchor' in value)
    expect(context?.anchor.value).toBe(target)
    expect(wrapper.find('.trigger').attributes('reference')).toBeUndefined()
    wrapper.unmount()
    target.remove()
  })

  // Props of a dropped wrapper, passed as attrs, still act as those props.
  it('a toast close\'s `altText` and a navigation link\'s `value` act as the wrappers\' props', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => [
        h(ToastProvider, () => [
          h(ToastRoot, { defaultOpen: true }, () => h(ToastClose, { class: 'close', altText: 'Dismiss' }, () => 'x')),
          h(ToastViewport),
        ]),
        h(NavigationMenuRoot, () => h(NavigationMenuList, () => h(NavigationMenuItem, () => h(NavigationMenuLink, { class: 'link', href: '#', value: 'home' }, () => 'Home')))),
      ],
    }), { attachTo: document.body })
    await nextTick()
    const close = document.querySelector('.close')!
    expect(close.getAttribute('data-reka-toast-announce-alt')).toBe('Dismiss')
    expect(close.getAttribute('alttext')).toBeNull()
    expect(document.querySelector('.link')!.getAttribute('value')).toBeNull()
    wrapper.unmount()
  })
})
