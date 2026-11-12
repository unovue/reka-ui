import type { Component, Ref, VNode } from 'vue'
import { CalendarDate } from '@internationalized/date'
import { renderToString } from '@vue/server-renderer'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, h, KeepAlive, ref, useId } from 'vue'
import { AlertDialogContent, AlertDialogDescription, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle, AlertDialogTrigger } from '@/AlertDialog'
import { AutocompleteAnchor, AutocompleteContent, AutocompleteInput, AutocompleteItem, AutocompletePortal, AutocompleteRoot, AutocompleteTrigger, AutocompleteViewport } from '@/Autocomplete'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '@/Combobox'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from '@/ContextMenu'
import { DatePickerContent, DatePickerField, DatePickerInput, DatePickerRoot, DatePickerTrigger } from '@/DatePicker'
import { DateRangePickerContent, DateRangePickerField, DateRangePickerInput, DateRangePickerRoot, DateRangePickerTrigger } from '@/DateRangePicker'
import { DialogContent, DialogDescription, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { DrawerContent, DrawerDescription, DrawerPortal, DrawerRoot, DrawerTitle, DrawerTrigger } from '@/Drawer'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/DropdownMenu'
import { HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from '@/HoverCard'
import { MenubarContent, MenubarItem, MenubarMenu, MenubarPortal, MenubarRoot, MenubarTrigger } from '@/Menubar'
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger, NavigationMenuViewport } from '@/NavigationMenu'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '@/Select'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'

interface OverlayFamily {
  /**
   * `open` is toggled by the test; `contentProps` are spread on the content; `wrap`
   * receives the content vnode and returns what is rendered in its place.
   */
  render: (open: Ref<boolean>, contentProps?: Record<string, unknown>, wrap?: (content: VNode) => VNode) => VNode
  /** The id reference the trigger carries while its content is rendered. */
  attribute: 'aria-controls' | 'aria-describedby'
  /** How many elements carry `attribute` while open. */
  references: number
  /** How many still do while closed. None by default. */
  closedReferences?: number
  /** Whether an `id` passed to the content lands on the element the trigger references. */
  consumerId?: boolean
  /** Whether an `asChild` content with an empty slot leaves the trigger nothing to reference. */
  emptyAsChild?: boolean
  /**
   * Whether the content teleports itself rather than being placed in a portal. `KeepAlive`
   * leaves a teleported element in the document, so the reference stays resolvable.
   */
  teleportsItself?: boolean
  /** Whether the family renders without a portal, so that the server HTML holds the content. */
  inline?: boolean
}

function identity(content: VNode) {
  return content
}

function openProps(open: Ref<boolean>) {
  return { 'open': open.value, 'onUpdate:open': (value: boolean) => { open.value = value } }
}

function selection(open: Ref<boolean>) {
  return {
    'modelValue': open.value ? 'a' : '',
    'onUpdate:modelValue': (value: unknown) => { open.value = value === 'a' },
  }
}

const date = new CalendarDate(2024, 1, 15)

const overlayFamilies: Record<string, OverlayFamily> = {
  'Dialog': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps, wrap = identity) => h(DialogRoot, openProps(open), () => [
      h(DialogTrigger, () => 'Trigger'),
      h(DialogPortal, () => wrap(h(DialogContent, contentProps, () => [h(DialogTitle, () => 'Title'), h(DialogDescription, () => 'Description')]))),
    ]),
  },
  'Dialog (inline)': {
    attribute: 'aria-controls',
    references: 1,
    inline: true,
    render: (open, contentProps, wrap = identity) => h(DialogRoot, openProps(open), () => [
      h(DialogTrigger, () => 'Trigger'),
      wrap(h(DialogContent, contentProps, () => [h(DialogTitle, () => 'Title'), h(DialogDescription, () => 'Description')])),
    ]),
  },
  'AlertDialog': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps, wrap = identity) => h(AlertDialogRoot, openProps(open), () => [
      h(AlertDialogTrigger, () => 'Trigger'),
      h(AlertDialogPortal, () => wrap(h(AlertDialogContent, contentProps, () => [h(AlertDialogTitle, () => 'Title'), h(AlertDialogDescription, () => 'Description')]))),
    ]),
  },
  'Drawer': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps, wrap = identity) => h(DrawerRoot, openProps(open), () => [
      h(DrawerTrigger, () => 'Trigger'),
      h(DrawerPortal, () => wrap(h(DrawerContent, contentProps, () => [h(DrawerTitle, () => 'Title'), h(DrawerDescription, () => 'Description')]))),
    ]),
  },
  'Popover': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps, wrap = identity) => h(PopoverRoot, openProps(open), () => [
      h(PopoverTrigger, () => 'Trigger'),
      h(PopoverPortal, () => wrap(h(PopoverContent, contentProps, () => 'Content'))),
    ]),
  },
  'Popover (inline)': {
    attribute: 'aria-controls',
    references: 1,
    inline: true,
    render: (open, contentProps, wrap = identity) => h(PopoverRoot, openProps(open), () => [
      h(PopoverTrigger, () => 'Trigger'),
      wrap(h(PopoverContent, contentProps, () => 'Content')),
    ]),
  },
  'DatePicker': {
    attribute: 'aria-controls',
    references: 1,
    teleportsItself: true,
    render: (open, contentProps, wrap = identity) => h(DatePickerRoot, { ...openProps(open), modelValue: date }, () => [
      h(DatePickerField, null, { default: ({ segments }: { segments: { part: string, value: string }[] }) => [
        ...segments.map(segment => h(DatePickerInput, { key: segment.part, part: segment.part as 'day' }, () => segment.value)),
        h(DatePickerTrigger, () => 'Trigger'),
      ] }),
      wrap(h(DatePickerContent, contentProps, () => 'Content')),
    ]),
  },
  'DateRangePicker': {
    attribute: 'aria-controls',
    references: 1,
    teleportsItself: true,
    render: (open, contentProps, wrap = identity) => h(DateRangePickerRoot, { ...openProps(open), modelValue: { start: date, end: date.add({ days: 2 }) } }, () => [
      h(DateRangePickerField, null, { default: ({ segments }: { segments: Record<'start' | 'end', { part: string, value: string }[]> }) => [
        ...(['start', 'end'] as const).flatMap(type => segments[type].map(segment =>
          h(DateRangePickerInput, { key: `${type}-${segment.part}`, part: segment.part as 'day', type }, () => segment.value))),
        h(DateRangePickerTrigger, () => 'Trigger'),
      ] }),
      wrap(h(DateRangePickerContent, contentProps, () => 'Content')),
    ]),
  },
  'Select': {
    attribute: 'aria-controls',
    references: 1,
    // In this position the content renders its own element, whatever `asChild` says.
    emptyAsChild: false,
    render: (open, contentProps, wrap = identity) => h(SelectRoot, openProps(open), () => [
      h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { placeholder: 'Pick' })),
      h(SelectPortal, () => wrap(h(SelectContent, contentProps, () => h(SelectViewport, () => [
        h(SelectItem, { value: 'apple' }, () => h(SelectItemText, () => 'Apple')),
      ])))),
    ]),
  },
  'Select (popper)': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps, wrap = identity) => h(SelectRoot, openProps(open), () => [
      h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { placeholder: 'Pick' })),
      h(SelectPortal, () => wrap(h(SelectContent, { position: 'popper', ...contentProps }, () => h(SelectViewport, () => [
        h(SelectItem, { value: 'apple' }, () => h(SelectItemText, () => 'Apple')),
      ])))),
    ]),
  },
  'DropdownMenu': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps, wrap = identity) => h(DropdownMenuRoot, openProps(open), () => [
      h(DropdownMenuTrigger, () => 'Trigger'),
      h(DropdownMenuPortal, () => wrap(h(DropdownMenuContent, contentProps, () => h(DropdownMenuItem, () => 'Item')))),
    ]),
  },
  'DropdownMenu sub-trigger': {
    attribute: 'aria-controls',
    // The menu stays open, and its trigger keeps its reference: `open` toggles the submenu.
    references: 2,
    closedReferences: 1,
    render: (open, contentProps, wrap = identity) => h(DropdownMenuRoot, { open: true }, () => [
      h(DropdownMenuTrigger, () => 'Trigger'),
      h(DropdownMenuPortal, () => h(DropdownMenuContent, () => h(DropdownMenuSub, { open: open.value }, () => [
        h(DropdownMenuSubTrigger, () => 'More'),
        h(DropdownMenuPortal, () => wrap(h(DropdownMenuSubContent, contentProps, () => h(DropdownMenuItem, () => 'Sub item')))),
      ]))),
    ]),
  },
  'Menubar': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps, wrap = identity) => h(MenubarRoot, selection(open), () => h(MenubarMenu, { value: 'a' }, () => [
      h(MenubarTrigger, () => 'Trigger'),
      h(MenubarPortal, () => wrap(h(MenubarContent, contentProps, () => h(MenubarItem, () => 'Item')))),
    ])),
  },
  'NavigationMenu': {
    attribute: 'aria-controls',
    references: 1,
    inline: true,
    render: (open, contentProps, wrap = identity) => h(NavigationMenuRoot, selection(open), () => h(NavigationMenuList, () => [
      h(NavigationMenuItem, { value: 'a' }, () => [h(NavigationMenuTrigger, () => 'A'), wrap(h(NavigationMenuContent, contentProps, () => 'Content A'))]),
      h(NavigationMenuItem, { value: 'b' }, () => [h(NavigationMenuTrigger, () => 'B'), h(NavigationMenuContent, () => 'Content B')]),
    ])),
  },
  'NavigationMenu (viewport)': {
    attribute: 'aria-controls',
    references: 1,
    teleportsItself: true,
    render: (open, contentProps, wrap = identity) => h(NavigationMenuRoot, selection(open), () => [
      h(NavigationMenuList, () => [
        h(NavigationMenuItem, { value: 'a' }, () => [h(NavigationMenuTrigger, () => 'A'), wrap(h(NavigationMenuContent, contentProps, () => 'Content A'))]),
        h(NavigationMenuItem, { value: 'b' }, () => [h(NavigationMenuTrigger, () => 'B'), h(NavigationMenuContent, () => 'Content B')]),
      ]),
      h(NavigationMenuViewport),
    ]),
  },
  'Combobox': {
    attribute: 'aria-controls',
    // The input and the trigger.
    references: 2,
    // In this position the content renders its own element, whatever `asChild` says.
    emptyAsChild: false,
    render: (open, contentProps, wrap = identity) => h(ComboboxRoot, openProps(open), () => [
      h(ComboboxAnchor, () => [h(ComboboxInput, { 'aria-label': 'Fruit' }), h(ComboboxTrigger, () => 'Toggle')]),
      h(ComboboxPortal, () => wrap(h(ComboboxContent, contentProps, () => h(ComboboxViewport, () => h(ComboboxItem, { value: 'apple' }, () => 'Apple'))))),
    ]),
  },
  'Combobox (popper)': {
    attribute: 'aria-controls',
    references: 2,
    render: (open, contentProps, wrap = identity) => h(ComboboxRoot, openProps(open), () => [
      h(ComboboxAnchor, () => [h(ComboboxInput, { 'aria-label': 'Fruit' }), h(ComboboxTrigger, () => 'Toggle')]),
      h(ComboboxPortal, () => wrap(h(ComboboxContent, { position: 'popper', ...contentProps }, () => h(ComboboxViewport, () => h(ComboboxItem, { value: 'apple' }, () => 'Apple'))))),
    ]),
  },
  'Autocomplete': {
    attribute: 'aria-controls',
    references: 2,
    // In this position the content renders its own element, whatever `asChild` says.
    emptyAsChild: false,
    render: (open, contentProps, wrap = identity) => h(AutocompleteRoot, openProps(open), () => [
      h(AutocompleteAnchor, () => [h(AutocompleteInput, { 'aria-label': 'Fruit' }), h(AutocompleteTrigger, () => 'Toggle')]),
      h(AutocompletePortal, () => wrap(h(AutocompleteContent, contentProps, () => h(AutocompleteViewport, () => h(AutocompleteItem, { value: 'apple' }, () => 'Apple'))))),
    ]),
  },
  'Autocomplete (popper)': {
    attribute: 'aria-controls',
    references: 2,
    render: (open, contentProps, wrap = identity) => h(AutocompleteRoot, openProps(open), () => [
      h(AutocompleteAnchor, () => [h(AutocompleteInput, { 'aria-label': 'Fruit' }), h(AutocompleteTrigger, () => 'Toggle')]),
      h(AutocompletePortal, () => wrap(h(AutocompleteContent, { position: 'popper', ...contentProps }, () => h(AutocompleteViewport, () => h(AutocompleteItem, { value: 'apple' }, () => 'Apple'))))),
    ]),
  },
  'Tooltip': {
    attribute: 'aria-describedby',
    references: 1,
    // The trigger is described by a visually hidden copy of the content, which keeps its generated id.
    consumerId: false,
    // The copy is rendered whatever the slot holds, so the reference stays.
    emptyAsChild: false,
    render: (open, contentProps, wrap = identity) => h(TooltipProvider, () => h(TooltipRoot, openProps(open), () => [
      h(TooltipTrigger, () => 'Trigger'),
      h(TooltipPortal, () => wrap(h(TooltipContent, contentProps, () => 'Content'))),
    ])),
  },
}

/** Families whose trigger carries no id reference to the content at all. */
const unreferencedFamilies: Record<string, OverlayFamily['render']> = {
  HoverCard: open => h(HoverCardRoot, openProps(open), () => [
    h(HoverCardTrigger, { href: '#' }, () => 'Trigger'),
    h(HoverCardPortal, () => h(HoverCardContent, () => 'Content')),
  ]),
  // ContextMenu has no `open` prop: it stays closed here.
  ContextMenu: () => h(ContextMenuRoot, () => [
    h(ContextMenuTrigger, () => 'Trigger'),
    h(ContextMenuPortal, () => h(ContextMenuContent, () => h(ContextMenuItem, () => 'Item'))),
  ]),
}

const ID_REFERENCES = ['aria-controls', 'aria-owns', 'aria-describedby', 'aria-labelledby']

// `usedIds` stands for whatever else consumed ids before the family rendered: when the
// server and the client disagree on it, every generated id differs between the two.
function createFixture(render: OverlayFamily['render'], open: Ref<boolean>, usedIds = 0, contentProps?: Ref<Record<string, unknown>>, wrap?: (content: VNode) => VNode) {
  return defineComponent({
    setup() {
      for (let i = 0; i < usedIds; i++)
        useId()
      return () => render(open, contentProps?.value, wrap)
    },
  })
}

/** Every id reference under `root`, with whether an element of `root` carries that id. */
function references(root: ParentNode) {
  return ID_REFERENCES.flatMap(attribute =>
    Array.from(root.querySelectorAll(`[${attribute}]`), (element) => {
      const ids = element.getAttribute(attribute)!.split(/\s+/).filter(Boolean)
      return { attribute, ids, resolves: ids.length > 0 && ids.every(id => !!root.querySelector(`[id="${id}"]`)) }
    }))
}

/**
 * Waits until `root` holds `count` references of the family's attribute, then expects
 * every id reference in it to be resolvable. The content of some families is loaded
 * asynchronously the first time it opens, hence the wait.
 */
async function expectReferences(root: ParentNode, family: OverlayFamily, count: number, attributes = ID_REFERENCES) {
  await vi.waitFor(() => {
    expect(references(root).filter(reference => reference.attribute === family.attribute)).toHaveLength(count)
  }, { timeout: 2000 })
  // Let the content that was just added or removed settle.
  await new Promise(resolve => setTimeout(resolve, 20))
  expect(references(root).filter(reference => attributes.includes(reference.attribute) && !reference.resolves)).toEqual([])
  expect(references(root).filter(reference => reference.attribute === family.attribute)).toHaveLength(count)
}

/**
 * The same for a content whose slot the test replaced: only the reference from the
 * trigger is looked at, since the replaced slot leaves out the parts that the content
 * itself refers to, such as a title.
 */
function expectTriggerReferences(root: ParentNode, family: OverlayFamily, count: number) {
  return expectReferences(root, family, count, [family.attribute])
}

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe.each(Object.entries(overlayFamilies))('%s', (_name, family) => {
  const closed = family.closedReferences ?? 0

  it('renders no reference while its content is not in the document', async () => {
    const wrapper = mount(createFixture(family.render, ref(false)), { attachTo: document.body })

    await expectReferences(document.body, family, closed)
    wrapper.unmount()
  })

  it('references the content it rendered while open, and drops the reference with it', async () => {
    const open = ref(false)
    const wrapper = mount(createFixture(family.render, open), { attachTo: document.body })
    await expectReferences(document.body, family, closed)

    open.value = true
    await expectReferences(document.body, family, family.references)

    open.value = false
    await expectReferences(document.body, family, closed)

    open.value = true
    await expectReferences(document.body, family, family.references)
    wrapper.unmount()
  })

  it('references the content when mounted open', async () => {
    const wrapper = mount(createFixture(family.render, ref(true)), { attachTo: document.body })

    await expectReferences(document.body, family, family.references)
    wrapper.unmount()
  })

  it.each([false, true])('renders no empty or dangling reference on the server (open: %s)', async (open) => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(createFixture(family.render, ref(open), 5)))

    for (const attribute of ID_REFERENCES)
      expect(container.innerHTML).not.toContain(`${attribute}=""`)
    expect(references(container).filter(reference => !reference.resolves)).toEqual([])
  })

  it.each([
    ['the same ids', 0],
    ['diverged ids', 5],
  ])('keeps the reference resolvable after hydrating an open render with %s', async (_label, usedIds) => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(createFixture(family.render, ref(true), usedIds)))
    document.body.append(container)

    const open = ref(true)
    const app = createSSRApp(createFixture(family.render, open))
    app.mount(container)
    await expectReferences(document.body, family, family.references)

    open.value = false
    await expectReferences(document.body, family, closed)

    open.value = true
    await expectReferences(document.body, family, family.references)
    app.unmount()
  })

  it('references the content after hydrating a closed render with diverged ids', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(createFixture(family.render, ref(false), 5)))
    document.body.append(container)

    const open = ref(false)
    const app = createSSRApp(createFixture(family.render, open))
    app.mount(container)
    await expectReferences(document.body, family, closed)

    open.value = true
    await expectReferences(document.body, family, family.references)
    app.unmount()
  })

  it.runIf(family.consumerId !== false)('follows an id the consumer passes to the content', async () => {
    const contentProps = ref<Record<string, unknown>>({ id: 'consumer-content' })
    const wrapper = mount(createFixture(family.render, ref(true), 0, contentProps), { attachTo: document.body })
    await expectReferences(document.body, family, family.references)

    const targets = () => Array.from(document.body.querySelectorAll(`[${family.attribute}]`), element => element.getAttribute(family.attribute))
    expect(document.getElementById('consumer-content')).not.toBeNull()
    expect(targets()).toContain('consumer-content')

    contentProps.value = { id: 'changed-content' }
    await vi.waitFor(() => expect(targets()).toContain('changed-content'))
    await expectReferences(document.body, family, family.references)
    expect(document.getElementById('changed-content')).not.toBeNull()
    wrapper.unmount()
  })

  it.runIf(family.emptyAsChild !== false)('drops the reference while an as-child content renders no element', async () => {
    const hasElement = ref(true)
    const wrap = (content: VNode) => h(content.type as Component, { ...content.props, asChild: true }, () => hasElement.value ? h('div', 'Child') : null)
    const wrapper = mount(createFixture(family.render, ref(true), 0, undefined, wrap), { attachTo: document.body })
    await expectTriggerReferences(document.body, family, family.references)

    hasElement.value = false
    await expectTriggerReferences(document.body, family, closed)

    hasElement.value = true
    await expectTriggerReferences(document.body, family, family.references)
    wrapper.unmount()
  })

  it.runIf(family.emptyAsChild !== false)('renders no reference when an as-child content mounts without an element', async () => {
    const wrap = (content: VNode) => h(content.type as Component, { ...content.props, asChild: true }, () => null)
    const wrapper = mount(createFixture(family.render, ref(true), 0, undefined, wrap), { attachTo: document.body })

    await new Promise(resolve => setTimeout(resolve, 50))
    await expectTriggerReferences(document.body, family, closed)
    wrapper.unmount()
  })

  it.runIf(!family.teleportsItself)('drops the reference while KeepAlive holds the content deactivated', async () => {
    const isActive = ref(true)
    const wrap = (content: VNode) => h(KeepAlive, () => isActive.value ? content : null)
    const wrapper = mount(createFixture(family.render, ref(true), 0, undefined, wrap), { attachTo: document.body })
    await expectReferences(document.body, family, family.references)

    isActive.value = false
    await expectReferences(document.body, family, closed)

    isActive.value = true
    await expectReferences(document.body, family, family.references)
    wrapper.unmount()
  })

  it.runIf(family.teleportsItself)('keeps the reference while KeepAlive holds the content deactivated with its element in the document', async () => {
    const isActive = ref(true)
    const wrap = (content: VNode) => h(KeepAlive, () => isActive.value ? content : null)
    const wrapper = mount(createFixture(family.render, ref(true), 0, undefined, wrap), { attachTo: document.body })
    await expectReferences(document.body, family, family.references)

    isActive.value = false
    await new Promise(resolve => setTimeout(resolve, 50))
    await expectReferences(document.body, family, family.references)
    wrapper.unmount()
  })

  it('has no axe violations while open', async () => {
    const wrapper = mount(createFixture(family.render, ref(true)), { attachTo: document.body })
    await expectReferences(document.body, family, family.references)

    expect(await axe(document.body)).toHaveNoViolations()
    wrapper.unmount()
  })
})

describe.each(Object.entries(unreferencedFamilies))('%s', (_name, render) => {
  it('renders no id reference from its trigger to its content', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(createFixture(render, ref(true), 5)))
    document.body.append(container)
    expect(references(container)).toEqual([])

    const app = createSSRApp(createFixture(render, ref(true)))
    app.mount(container)
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(references(document.body).filter(reference => reference.attribute !== 'aria-labelledby')).toEqual([])
    expect(references(document.body).filter(reference => !reference.resolves)).toEqual([])
    app.unmount()
  })
})
