import type { Ref, VNode } from 'vue'
import { CalendarDate } from '@internationalized/date'
import { renderToString } from '@vue/server-renderer'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, h, ref, useId } from 'vue'
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
  /** `open` is toggled by the test; `contentProps` are spread on the content. */
  render: (open: Ref<boolean>, contentProps?: Record<string, unknown>) => VNode
  /** The id reference the trigger carries while its content is rendered. */
  attribute: 'aria-controls' | 'aria-describedby'
  /** How many elements carry `attribute` while open. */
  references: number
  /** How many still do while closed. None by default. */
  closedReferences?: number
  /** Whether an `id` passed to the content lands on the element the trigger references. */
  consumerId?: boolean
  /** Whether the family renders without a portal, so that the server HTML holds the content. */
  inline?: boolean
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
    render: (open, contentProps) => h(DialogRoot, openProps(open), () => [
      h(DialogTrigger, () => 'Trigger'),
      h(DialogPortal, () => h(DialogContent, contentProps, () => [h(DialogTitle, () => 'Title'), h(DialogDescription, () => 'Description')])),
    ]),
  },
  'Dialog (inline)': {
    attribute: 'aria-controls',
    references: 1,
    inline: true,
    render: (open, contentProps) => h(DialogRoot, openProps(open), () => [
      h(DialogTrigger, () => 'Trigger'),
      h(DialogContent, contentProps, () => [h(DialogTitle, () => 'Title'), h(DialogDescription, () => 'Description')]),
    ]),
  },
  'AlertDialog': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps) => h(AlertDialogRoot, openProps(open), () => [
      h(AlertDialogTrigger, () => 'Trigger'),
      h(AlertDialogPortal, () => h(AlertDialogContent, contentProps, () => [h(AlertDialogTitle, () => 'Title'), h(AlertDialogDescription, () => 'Description')])),
    ]),
  },
  'Drawer': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps) => h(DrawerRoot, openProps(open), () => [
      h(DrawerTrigger, () => 'Trigger'),
      h(DrawerPortal, () => h(DrawerContent, contentProps, () => [h(DrawerTitle, () => 'Title'), h(DrawerDescription, () => 'Description')])),
    ]),
  },
  'Popover': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps) => h(PopoverRoot, openProps(open), () => [
      h(PopoverTrigger, () => 'Trigger'),
      h(PopoverPortal, () => h(PopoverContent, contentProps, () => 'Content')),
    ]),
  },
  'Popover (inline)': {
    attribute: 'aria-controls',
    references: 1,
    inline: true,
    render: (open, contentProps) => h(PopoverRoot, openProps(open), () => [
      h(PopoverTrigger, () => 'Trigger'),
      h(PopoverContent, contentProps, () => 'Content'),
    ]),
  },
  'DatePicker': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps) => h(DatePickerRoot, { ...openProps(open), modelValue: date }, () => [
      h(DatePickerField, null, { default: ({ segments }: { segments: { part: string, value: string }[] }) => [
        ...segments.map(segment => h(DatePickerInput, { key: segment.part, part: segment.part as 'day' }, () => segment.value)),
        h(DatePickerTrigger, () => 'Trigger'),
      ] }),
      h(DatePickerContent, contentProps, () => 'Content'),
    ]),
  },
  'DateRangePicker': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps) => h(DateRangePickerRoot, { ...openProps(open), modelValue: { start: date, end: date.add({ days: 2 }) } }, () => [
      h(DateRangePickerField, null, { default: ({ segments }: { segments: Record<'start' | 'end', { part: string, value: string }[]> }) => [
        ...(['start', 'end'] as const).flatMap(type => segments[type].map(segment =>
          h(DateRangePickerInput, { key: `${type}-${segment.part}`, part: segment.part as 'day', type }, () => segment.value))),
        h(DateRangePickerTrigger, () => 'Trigger'),
      ] }),
      h(DateRangePickerContent, contentProps, () => 'Content'),
    ]),
  },
  'Select': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps) => h(SelectRoot, openProps(open), () => [
      h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { placeholder: 'Pick' })),
      h(SelectPortal, () => h(SelectContent, contentProps, () => h(SelectViewport, () => [
        h(SelectItem, { value: 'apple' }, () => h(SelectItemText, () => 'Apple')),
      ]))),
    ]),
  },
  'DropdownMenu': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps) => h(DropdownMenuRoot, openProps(open), () => [
      h(DropdownMenuTrigger, () => 'Trigger'),
      h(DropdownMenuPortal, () => h(DropdownMenuContent, contentProps, () => h(DropdownMenuItem, () => 'Item'))),
    ]),
  },
  'DropdownMenu sub-trigger': {
    attribute: 'aria-controls',
    // The menu stays open, and its trigger keeps its reference: `open` toggles the submenu.
    references: 2,
    closedReferences: 1,
    render: (open, contentProps) => h(DropdownMenuRoot, { open: true }, () => [
      h(DropdownMenuTrigger, () => 'Trigger'),
      h(DropdownMenuPortal, () => h(DropdownMenuContent, () => h(DropdownMenuSub, { open: open.value }, () => [
        h(DropdownMenuSubTrigger, () => 'More'),
        h(DropdownMenuPortal, () => h(DropdownMenuSubContent, contentProps, () => h(DropdownMenuItem, () => 'Sub item'))),
      ]))),
    ]),
  },
  'Menubar': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps) => h(MenubarRoot, selection(open), () => h(MenubarMenu, { value: 'a' }, () => [
      h(MenubarTrigger, () => 'Trigger'),
      h(MenubarPortal, () => h(MenubarContent, contentProps, () => h(MenubarItem, () => 'Item'))),
    ])),
  },
  'NavigationMenu': {
    attribute: 'aria-controls',
    references: 1,
    inline: true,
    render: (open, contentProps) => h(NavigationMenuRoot, selection(open), () => h(NavigationMenuList, () => [
      h(NavigationMenuItem, { value: 'a' }, () => [h(NavigationMenuTrigger, () => 'A'), h(NavigationMenuContent, contentProps, () => 'Content A')]),
      h(NavigationMenuItem, { value: 'b' }, () => [h(NavigationMenuTrigger, () => 'B'), h(NavigationMenuContent, () => 'Content B')]),
    ])),
  },
  'NavigationMenu (viewport)': {
    attribute: 'aria-controls',
    references: 1,
    render: (open, contentProps) => h(NavigationMenuRoot, selection(open), () => [
      h(NavigationMenuList, () => [
        h(NavigationMenuItem, { value: 'a' }, () => [h(NavigationMenuTrigger, () => 'A'), h(NavigationMenuContent, contentProps, () => 'Content A')]),
        h(NavigationMenuItem, { value: 'b' }, () => [h(NavigationMenuTrigger, () => 'B'), h(NavigationMenuContent, () => 'Content B')]),
      ]),
      h(NavigationMenuViewport),
    ]),
  },
  'Combobox': {
    attribute: 'aria-controls',
    // The input and the trigger.
    references: 2,
    render: (open, contentProps) => h(ComboboxRoot, openProps(open), () => [
      h(ComboboxAnchor, () => [h(ComboboxInput, { 'aria-label': 'Fruit' }), h(ComboboxTrigger, () => 'Toggle')]),
      h(ComboboxPortal, () => h(ComboboxContent, contentProps, () => h(ComboboxViewport, () => h(ComboboxItem, { value: 'apple' }, () => 'Apple')))),
    ]),
  },
  'Autocomplete': {
    attribute: 'aria-controls',
    references: 2,
    render: (open, contentProps) => h(AutocompleteRoot, openProps(open), () => [
      h(AutocompleteAnchor, () => [h(AutocompleteInput, { 'aria-label': 'Fruit' }), h(AutocompleteTrigger, () => 'Toggle')]),
      h(AutocompletePortal, () => h(AutocompleteContent, contentProps, () => h(AutocompleteViewport, () => h(AutocompleteItem, { value: 'apple' }, () => 'Apple')))),
    ]),
  },
  'Tooltip': {
    attribute: 'aria-describedby',
    references: 1,
    // The trigger is described by a visually hidden copy of the content, which keeps its generated id.
    consumerId: false,
    render: (open, contentProps) => h(TooltipProvider, () => h(TooltipRoot, openProps(open), () => [
      h(TooltipTrigger, () => 'Trigger'),
      h(TooltipPortal, () => h(TooltipContent, contentProps, () => 'Content')),
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
function createFixture(render: OverlayFamily['render'], open: Ref<boolean>, usedIds = 0, contentProps?: Ref<Record<string, unknown>>) {
  return defineComponent({
    setup() {
      for (let i = 0; i < usedIds; i++)
        useId()
      return () => render(open, contentProps?.value)
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
async function expectReferences(root: ParentNode, family: OverlayFamily, count: number) {
  await vi.waitFor(() => {
    expect(references(root).filter(reference => reference.attribute === family.attribute)).toHaveLength(count)
  }, { timeout: 2000 })
  // Let the content that was just added or removed settle.
  await new Promise(resolve => setTimeout(resolve, 20))
  expect(references(root).filter(reference => !reference.resolves)).toEqual([])
  expect(references(root).filter(reference => reference.attribute === family.attribute)).toHaveLength(count)
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
