import type { Component, VNode } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '@/Accordion'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/DropdownMenu'
import { MenubarContent, MenubarItem, MenubarMenu, MenubarPortal, MenubarRoot, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from '@/Menubar'
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger, NavigationMenuViewport } from '@/NavigationMenu'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'

/** Renders the trigger under test; `props` are the ones the family needs (e.g. `value`). */
type RenderTrigger = (component: Component, props?: Record<string, unknown>) => VNode

interface Family {
  /** The id the trigger renders when the consumer passes none. */
  generatedId: RegExp
  render: (trigger: RenderTrigger) => VNode
}

const content = { 'data-testid': 'content' }

const families: Record<string, Family> = {
  Popover: {
    generatedId: /^reka-popover-trigger-/,
    render: trigger => h(PopoverRoot, { defaultOpen: true }, () => [
      trigger(PopoverTrigger),
      h(PopoverPortal, () => h(PopoverContent, content, () => 'Content')),
    ]),
  },
  DropdownMenu: {
    generatedId: /^reka-dropdown-menu-trigger-/,
    render: trigger => h(DropdownMenuRoot, { defaultOpen: true }, () => [
      trigger(DropdownMenuTrigger),
      h(DropdownMenuPortal, () => h(DropdownMenuContent, content, () => h(DropdownMenuItem, () => 'Item'))),
    ]),
  },
  DropdownMenuSub: {
    generatedId: /^reka-menu-sub-trigger-/,
    render: trigger => h(DropdownMenuRoot, { defaultOpen: true }, () => [
      h(DropdownMenuTrigger, () => 'Open'),
      h(DropdownMenuPortal, () => h(DropdownMenuContent, () => h(DropdownMenuSub, { open: true }, () => [
        trigger(DropdownMenuSubTrigger),
        h(DropdownMenuPortal, () => h(DropdownMenuSubContent, content, () => h(DropdownMenuItem, () => 'Item'))),
      ]))),
    ]),
  },
  Menubar: {
    generatedId: /^menu$/,
    render: trigger => h(MenubarRoot, { modelValue: 'menu' }, () => h(MenubarMenu, { value: 'menu' }, () => [
      trigger(MenubarTrigger),
      h(MenubarPortal, () => h(MenubarContent, content, () => h(MenubarItem, () => 'Item'))),
    ])),
  },
  MenubarSub: {
    generatedId: /^reka-menu-sub-trigger-/,
    render: trigger => h(MenubarRoot, { modelValue: 'menu' }, () => h(MenubarMenu, { value: 'menu' }, () => [
      h(MenubarTrigger, () => 'Open'),
      h(MenubarPortal, () => h(MenubarContent, () => h(MenubarSub, { open: true }, () => [
        trigger(MenubarSubTrigger),
        h(MenubarPortal, () => h(MenubarSubContent, content, () => h(MenubarItem, () => 'Item'))),
      ]))),
    ])),
  },
  Accordion: {
    generatedId: /^reka-accordion-trigger-/,
    render: trigger => h(AccordionRoot, { type: 'single', defaultValue: 'item' }, () => h(AccordionItem, { value: 'item' }, () => [
      h(AccordionHeader, () => trigger(AccordionTrigger)),
      h(AccordionContent, content, () => 'Content'),
    ])),
  },
  Tabs: {
    generatedId: /^reka-tabs-.+-trigger-tab$/,
    render: trigger => h(TabsRoot, { defaultValue: 'tab' }, () => [
      h(TabsList, () => trigger(TabsTrigger, { value: 'tab' })),
      h(TabsContent, { value: 'tab', ...content }, () => 'Content'),
    ]),
  },
  NavigationMenu: {
    generatedId: /^reka-navigation-menu-.+-trigger-item$/,
    render: trigger => h(NavigationMenuRoot, { modelValue: 'item' }, () => [
      h(NavigationMenuList, () => h(NavigationMenuItem, { value: 'item' }, () => [
        trigger(NavigationMenuTrigger),
        h(NavigationMenuContent, content, () => 'Content'),
      ])),
      h(NavigationMenuViewport),
    ]),
  },
}

const variants: Record<string, { expectedId?: string, trigger: RenderTrigger }> = {
  'no id': {
    trigger: (component, props) => h(component, { 'data-testid': 'trigger', ...props }, () => 'Trigger'),
  },
  'an id on the trigger': {
    expectedId: 'consumer-id',
    trigger: (component, props) => h(component, { 'id': 'consumer-id', 'data-testid': 'trigger', ...props }, () => 'Trigger'),
  },
  'an id on the asChild child': {
    expectedId: 'child-id',
    trigger: (component, props) => h(component, { asChild: true, ...props }, () => h('button', { 'id': 'child-id', 'data-testid': 'trigger' }, 'Trigger')),
  },
}

const getTrigger = () => document.querySelector<HTMLElement>('[data-testid="trigger"]')
const getContent = () => document.querySelector<HTMLElement>('[data-testid="content"]')

describe('trigger ids', () => {
  let unmount: (() => void) | undefined

  afterEach(() => {
    unmount?.()
    unmount = undefined
    document.body.innerHTML = ''
  })

  describe.each(Object.entries(families))('given a %s', (_, family) => {
    it.each(Object.entries(variants))('with %s, should label the content by the id the trigger renders', async (_, variant) => {
      const wrapper = mount(defineComponent({ render: () => family.render(variant.trigger) }), { attachTo: document.body })
      unmount = () => wrapper.unmount()
      await vi.waitFor(() => expect(getContent()).not.toBeNull())
      await flushPromises()

      const trigger = getTrigger()!
      if (variant.expectedId)
        expect(trigger.id).toBe(variant.expectedId)
      else
        expect(trigger.id).toMatch(family.generatedId)

      await vi.waitFor(() => expect(getContent()!.getAttribute('aria-labelledby')).toBe(trigger.id))
      expect(document.getElementById(getContent()!.getAttribute('aria-labelledby')!)).toBe(trigger)
    })
  })

  describe.each(['Accordion', 'Tabs'])('given a server-rendered %s with an id on the trigger', (name) => {
    globalThis.ResizeObserver ??= class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    it('should render the same ids on the server and the client', async () => {
      const Fixture = defineComponent({ render: () => families[name].render(variants['an id on the trigger'].trigger) })
      const html = await renderToString(createSSRApp(Fixture))
      expect(html).toContain('id="consumer-id"')
      expect(html).toContain('aria-labelledby="consumer-id"')

      const container = document.createElement('div')
      container.innerHTML = html
      document.body.append(container)

      const warn = vi.fn()
      const app = createSSRApp(Fixture)
      app.config.warnHandler = warn
      app.mount(container)
      unmount = () => app.unmount()
      await flushPromises()

      expect(warn).not.toHaveBeenCalled()
      expect(getTrigger()!.id).toBe('consumer-id')
      expect(getContent()!.getAttribute('aria-labelledby')).toBe('consumer-id')
    })
  })
})
