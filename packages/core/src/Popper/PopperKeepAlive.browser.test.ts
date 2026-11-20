import type { VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import { AutocompleteAnchor, AutocompleteContent, AutocompleteInput, AutocompleteItem, AutocompletePortal, AutocompleteRoot, AutocompleteViewport } from '@/Autocomplete'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxViewport } from '@/Combobox'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from '@/ContextMenu'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from '@/HoverCard'
import { MenubarContent, MenubarItem, MenubarMenu, MenubarPortal, MenubarRoot, MenubarTrigger } from '@/Menubar'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '@/Select'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const afterFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
function position(element: HTMLElement) {
  const { x, y } = element.getBoundingClientRect()
  return { x: Math.round(x), y: Math.round(y) }
}

/** Renders `page` in a `KeepAlive`, as a router view with `keepalive` does, next to another page. */
function mountPages(page: () => VNode) {
  const onPage = ref(true)
  const Page = defineComponent({ name: 'Page', setup: () => () => h('div', { style: 'padding: 200px' }, [page()]) })
  const Other = defineComponent({ name: 'Other', setup: () => () => h('button', { 'data-testid': 'other' }, 'other page') })
  mount(defineComponent({
    setup: () => () => h(KeepAlive, null, () => onPage.value ? h(Page) : h(Other)),
  }), { attachTo: document.body })
  return onPage
}

const trigger = { 'data-testid': 'trigger' }
const content = { 'data-testid': 'content' }
const popups: Record<string, (root: Record<string, unknown>) => VNode> = {
  Tooltip: root => h(TooltipProvider, () => h(TooltipRoot, root, () => [
    h(TooltipTrigger, trigger, () => 'trigger'),
    h(TooltipPortal, () => h(TooltipContent, content, () => 'tip')),
  ])),
  Popover: root => h(PopoverRoot, root, () => [
    h(PopoverTrigger, trigger, () => 'trigger'),
    h(PopoverPortal, () => h(PopoverContent, content, () => 'popover')),
  ]),
  HoverCard: root => h(HoverCardRoot, root, () => [
    h(HoverCardTrigger, { ...trigger, href: '#' }, () => 'trigger'),
    h(HoverCardPortal, () => h(HoverCardContent, content, () => 'card')),
  ]),
  DropdownMenu: root => h(DropdownMenuRoot, root, () => [
    h(DropdownMenuTrigger, trigger, () => 'trigger'),
    h(DropdownMenuPortal, () => h(DropdownMenuContent, content, () => h(DropdownMenuItem, () => 'item'))),
  ]),
  Select: root => h(SelectRoot, root, () => [
    h(SelectTrigger, trigger, () => h(SelectValue, { placeholder: 'pick' })),
    h(SelectPortal, () => h(SelectContent, { ...content, position: 'popper' }, () =>
      h(SelectViewport, () => h(SelectItem, { value: 'a' }, () => h(SelectItemText, () => 'a'))))),
  ]),
  Combobox: root => h(ComboboxRoot, root, () => [
    h(ComboboxAnchor, trigger, () => h(ComboboxInput, { 'aria-label': 'pick' })),
    h(ComboboxPortal, () => h(ComboboxContent, content, () =>
      h(ComboboxViewport, () => h(ComboboxItem, { value: 'a' }, () => 'a')))),
  ]),
  Autocomplete: root => h(AutocompleteRoot, root, () => [
    h(AutocompleteAnchor, trigger, () => h(AutocompleteInput, { 'aria-label': 'pick' })),
    h(AutocompletePortal, () => h(AutocompleteContent, content, () =>
      h(AutocompleteViewport, () => h(AutocompleteItem, { value: 'a' }, () => 'a')))),
  ]),
}

async function expectClosedOnOtherPage(onPage: { value: boolean }) {
  onPage.value = false
  await nextTick()
  await afterFrames()

  expect(get('content')).toBeNull()
  // A modal popup no longer disables pointer events on the page shown instead.
  expect(document.body.style.pointerEvents).toBe('')
  const onOther = vi.fn()
  get('other')!.addEventListener('click', onOther)
  await userEvent.click(get('other')!)
  expect(onOther).toHaveBeenCalledTimes(1)
}

describe('given an open popup in a KeepAlive page', () => {
  // #785: the page leaves the document, but the teleported content stayed open in the
  // body, placed against the detached trigger in the top-left corner.
  it.each(Object.keys(popups))('%s closes when the page is deactivated', async (name) => {
    const onOpen = vi.fn()
    const onPage = mountPages(() => popups[name]({ 'defaultOpen': true, 'onUpdate:open': onOpen }))
    await expect.poll(() => get('content')).not.toBeNull()

    await expectClosedOnOtherPage(onPage)
    expect(onOpen).toHaveBeenCalledExactlyOnceWith(false)

    onPage.value = true
    await nextTick()
    await afterFrames()
    expect(get('content')).toBeNull()
  })

  it('a context menu closes when the page is deactivated', async () => {
    const onOpen = vi.fn()
    const onPage = mountPages(() => h(ContextMenuRoot, { 'onUpdate:open': onOpen }, () => [
      h(ContextMenuTrigger, { ...trigger, style: 'display: block; height: 40px' }, () => 'area'),
      h(ContextMenuPortal, () => h(ContextMenuContent, content, () => h(ContextMenuItem, () => 'item'))),
    ]))
    await userEvent.click(get('trigger')!, { button: 'right' })
    await expect.poll(() => get('content')).not.toBeNull()

    await expectClosedOnOtherPage(onPage)
    expect(onOpen).toHaveBeenLastCalledWith(false)
  })

  it('a menubar menu closes when the page is deactivated', async () => {
    const onValue = vi.fn()
    const onPage = mountPages(() => h(MenubarRoot, { 'defaultValue': 'file', 'onUpdate:modelValue': onValue }, () => h(MenubarMenu, { value: 'file' }, () => [
      h(MenubarTrigger, trigger, () => 'file'),
      h(MenubarPortal, () => h(MenubarContent, content, () => h(MenubarItem, () => 'item'))),
    ])))
    await expect.poll(() => get('content')).not.toBeNull()

    await expectClosedOnOtherPage(onPage)
    expect(onValue).toHaveBeenCalledExactlyOnceWith('')
  })
})

describe('given a closed popup in a KeepAlive page', () => {
  it.each(Object.keys(popups))('%s emits nothing when the page is deactivated', async (name) => {
    const onOpen = vi.fn()
    const onPage = mountPages(() => popups[name]({ 'open': false, 'onUpdate:open': onOpen }))
    await afterFrames()

    onPage.value = false
    await nextTick()
    await afterFrames()

    expect(onOpen).not.toHaveBeenCalled()
  })
})

describe('given a tooltip closing with an exit animation as its KeepAlive page is deactivated', () => {
  const style = document.createElement('style')
  style.textContent = `@keyframes popper-keep-alive-out { from { opacity: 1 } to { opacity: 0 } }
[data-testid="content"][data-state="closed"] { animation: popper-keep-alive-out 1s linear }`
  afterEach(() => style.remove())

  // #785: a trigger that navigates closes the tooltip, which then left in the
  // top-left corner, anchored to the trigger the page took out of the document.
  it('finishes the animation where it was', async () => {
    document.head.append(style)
    const onPage = mountPages(() => h(TooltipProvider, { delayDuration: 0 }, () => h(TooltipRoot, () => [
      h(TooltipTrigger, { ...trigger, onClick: () => onPage.value = false }, () => 'navigate'),
      h(TooltipPortal, () => h(TooltipContent, content, () => 'tip')),
    ])))

    await userEvent.hover(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    await afterFrames()
    const open = position(get('content')!)

    await userEvent.click(get('trigger')!)
    await nextTick()
    await afterFrames()

    expect(get('content')?.dataset.state).toBe('closed')
    expect(position(get('content')!)).toEqual(open)
  })
})

describe('given a popover kept open while its KeepAlive page is deactivated', () => {
  it('follows its trigger again once the page is activated', async () => {
    const offset = ref(0)
    // Controlled and never closed: it stays open across the deactivation.
    const onPage = mountPages(() => h('div', { style: { marginTop: `${offset.value}px` } }, [popups.Popover({ open: true })]))
    await expect.poll(() => get('content')).not.toBeNull()
    await afterFrames()
    const before = position(get('content')!)

    onPage.value = false
    await nextTick()
    await afterFrames()
    onPage.value = true
    await nextTick()
    offset.value = 100
    await nextTick()
    await afterFrames()

    expect(position(get('content')!)).toEqual({ x: before.x, y: before.y + 100 })
  })
})
