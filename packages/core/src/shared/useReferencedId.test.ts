import type { VNode } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, onTestFinished, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { AlertDialogContent, AlertDialogDescription, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle } from '@/AlertDialog'
import { ComboboxAnchor, ComboboxContent, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxLabel, ComboboxRoot } from '@/Combobox'
import { DialogContent, DialogDescription, DialogPortal, DialogRoot, DialogTitle } from '@/Dialog'
import { DrawerContent, DrawerDescription, DrawerPortal, DrawerRoot, DrawerTitle } from '@/Drawer'
import { DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { FieldControl, FieldLabel, FieldRoot } from '@/Field'
import { ListboxContent, ListboxGroup, ListboxGroupLabel, ListboxItem, ListboxRoot } from '@/Listbox'
import { MonthPickerGrid, MonthPickerHeader, MonthPickerHeading, MonthPickerRoot } from '@/MonthPicker'
import { MonthRangePickerGrid, MonthRangePickerHeader, MonthRangePickerHeading, MonthRangePickerRoot } from '@/MonthRangePicker'
import { SelectContent, SelectGroup, SelectItem, SelectItemText, SelectLabel, SelectPortal, SelectRoot, SelectTrigger, SelectViewport } from '@/Select'
import { StepperDescription, StepperItem, StepperRoot, StepperTitle, StepperTrigger } from '@/Stepper'
import { TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from '@/TagsInput'
import { YearPickerGrid, YearPickerHeader, YearPickerHeading, YearPickerRoot } from '@/YearPicker'
import { YearRangePickerGrid, YearRangePickerHeader, YearRangePickerHeading, YearRangePickerRoot } from '@/YearRangePicker'

/** Attributes for the part whose id is referenced; the consumer `id` goes here. */
type Attrs = Record<string, unknown>

interface Case {
  /** The id the referenced part renders when the consumer passes none. */
  generatedId: RegExp
  /** The attribute on the referring element that holds the referenced id. */
  attribute: string
  /** Renders the tree: one referenced part per entry of `parts`, `referrer` on the referring one. */
  render: (parts: Attrs[], referrer: Attrs) => VNode
  /** Whether the family keeps referencing the part while another of its kind unmounts. */
  multipleParts?: boolean
}

function dialog(title: boolean): Case {
  return {
    generatedId: title ? /^reka-dialog-title-/ : /^reka-dialog-description-/,
    attribute: title ? 'aria-labelledby' : 'aria-describedby',
    render: (parts, referrer) => h(DialogRoot, { defaultOpen: true }, () =>
      h(DialogPortal, () => h(DialogContent, referrer, () => [
        ...(title ? parts : [{}]).map(p => h(DialogTitle, p, () => 'Title')),
        ...(title ? [{}] : parts).map(p => h(DialogDescription, p, () => 'Description')),
      ]))),
  }
}

function alertDialog(title: boolean): Case {
  return {
    generatedId: title ? /^reka-dialog-title-/ : /^reka-dialog-description-/,
    attribute: title ? 'aria-labelledby' : 'aria-describedby',
    render: (parts, referrer) => h(AlertDialogRoot, { defaultOpen: true }, () =>
      h(AlertDialogPortal, () => h(AlertDialogContent, referrer, () => [
        ...(title ? parts : [{}]).map(p => h(AlertDialogTitle, p, () => 'Title')),
        ...(title ? [{}] : parts).map(p => h(AlertDialogDescription, p, () => 'Description')),
      ]))),
  }
}

function drawer(title: boolean): Case {
  return {
    generatedId: title ? /^reka-drawer-title-/ : /^reka-drawer-description-/,
    attribute: title ? 'aria-labelledby' : 'aria-describedby',
    render: (parts, referrer) => h(DrawerRoot, { defaultOpen: true }, () =>
      h(DrawerPortal, () => h(DrawerContent, referrer, () => [
        ...(title ? parts : [{}]).map(p => h(DrawerTitle, p, () => 'Title')),
        ...(title ? [{}] : parts).map(p => h(DrawerDescription, p, () => 'Description')),
      ]))),
  }
}

function stepper(title: boolean): Case {
  return {
    generatedId: title ? /^reka-stepper-item-title-/ : /^reka-stepper-item-description-/,
    // The trigger is named by both its title and its description.
    attribute: 'aria-labelledby',
    // A stepper item tracks whether it has a title and a description, not how many.
    multipleParts: false,
    render: (parts, referrer) => h(StepperRoot, { defaultValue: 1 }, () =>
      h(StepperItem, { step: 1 }, () => [
        h(StepperTrigger, referrer, () => 'Step'),
        ...(title ? parts : [{}]).map(p => h(StepperTitle, p, () => 'Title')),
        ...(title ? [{}] : parts).map(p => h(StepperDescription, p, () => 'Description')),
      ])),
  }
}

function picker(Root: any, Header: any, Heading: any, Grid: any, name: string): Case {
  return {
    generatedId: new RegExp(`^reka-${name}-heading-`),
    attribute: 'aria-labelledby',
    render: (parts, referrer) => h(Root, null, {
      default: () => [
        h(Header, () => parts.map(p => h(Heading, p))),
        h(Grid, referrer),
      ],
    }),
  }
}

const cases: Record<string, Case> = {
  DialogTitle: dialog(true),
  DialogDescription: dialog(false),
  AlertDialogTitle: alertDialog(true),
  AlertDialogDescription: alertDialog(false),
  DrawerTitle: drawer(true),
  DrawerDescription: drawer(false),
  StepperTitle: stepper(true),
  StepperDescription: stepper(false),
  SelectLabel: {
    generatedId: /^reka-select-group-/,
    attribute: 'aria-labelledby',
    render: (parts, referrer) => h(SelectRoot, { defaultOpen: true }, () => [
      h(SelectTrigger, () => 'Open'),
      h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () =>
        h(SelectGroup, referrer, () => [
          ...parts.map(p => h(SelectLabel, p, () => 'Group')),
          h(SelectItem, { value: 'a' }, () => h(SelectItemText, () => 'A')),
        ])))),
    ]),
  },
  SelectItemText: {
    generatedId: /^reka-select-item-text-/,
    attribute: 'aria-labelledby',
    render: (parts, referrer) => h(SelectRoot, { defaultOpen: true }, () => [
      h(SelectTrigger, () => 'Open'),
      h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () =>
        h(SelectItem, { value: 'a', ...referrer }, () => parts.map(p => h(SelectItemText, p, () => 'A')))))),
    ]),
  },
  ComboboxLabel: {
    generatedId: /^reka-combobox-group-label-/,
    attribute: 'aria-labelledby',
    render: (parts, referrer) => h(ComboboxRoot, { open: true }, () => [
      h(ComboboxAnchor, () => h(ComboboxInput)),
      h(ComboboxContent, () => h(ComboboxGroup, referrer, () => [
        ...parts.map(p => h(ComboboxLabel, p, () => 'Group')),
        h(ComboboxItem, { value: 'a' }, () => 'A'),
      ])),
    ]),
  },
  ListboxGroupLabel: {
    generatedId: /^reka-listbox-group-/,
    attribute: 'aria-labelledby',
    render: (parts, referrer) => h(ListboxRoot, null, () => h(ListboxContent, () =>
      h(ListboxGroup, referrer, () => [
        ...parts.map(p => h(ListboxGroupLabel, p, () => 'Group')),
        h(ListboxItem, { value: 'a' }, () => 'A'),
      ]))),
  },
  DropdownMenuLabel: {
    generatedId: /^reka-menu-group-/,
    attribute: 'aria-labelledby',
    render: (parts, referrer) => h(DropdownMenuRoot, { defaultOpen: true }, () => [
      h(DropdownMenuTrigger, () => 'Open'),
      h(DropdownMenuPortal, () => h(DropdownMenuContent, () => h(DropdownMenuGroup, referrer, () => [
        ...parts.map(p => h(DropdownMenuLabel, p, () => 'Group')),
        h(DropdownMenuItem, () => 'A'),
      ]))),
    ]),
  },
  TagsInputItemText: {
    generatedId: /^reka-tags-input-item-text-/,
    attribute: 'aria-labelledby',
    render: (parts, referrer) => h(TagsInputRoot, { defaultValue: ['a'] }, () =>
      h(TagsInputItem, { value: 'a', ...referrer }, () => parts.map(p => h(TagsInputItemText, p)))),
  },
  FieldLabel: {
    generatedId: /^reka-field-label-/,
    attribute: 'aria-labelledby',
    // A field tracks whether its label is mounted, not how many labels it has.
    multipleParts: false,
    render: (parts, referrer) => h(FieldRoot, null, () => [
      ...parts.map(p => h(FieldLabel, { nativeLabel: false, as: 'div', ...p }, () => 'Label')),
      h(FieldControl, referrer),
    ]),
  },
  MonthPickerHeading: picker(MonthPickerRoot, MonthPickerHeader, MonthPickerHeading, MonthPickerGrid, 'month-picker'),
  MonthRangePickerHeading: picker(MonthRangePickerRoot, MonthRangePickerHeader, MonthRangePickerHeading, MonthRangePickerGrid, 'month-range-picker'),
  YearPickerHeading: picker(YearPickerRoot, YearPickerHeader, YearPickerHeading, YearPickerGrid, 'year-picker'),
  YearRangePickerHeading: picker(YearRangePickerRoot, YearRangePickerHeader, YearRangePickerHeading, YearRangePickerGrid, 'year-range-picker'),
}

// The ids each part rendered before consumer ids were followed: they must not change.
const defaultIds: Record<string, string> = {
  AlertDialogDescription: 'reka-dialog-description-v-1',
  AlertDialogTitle: 'reka-dialog-title-v-0',
  ComboboxLabel: 'reka-combobox-group-label-v-3',
  DialogDescription: 'reka-dialog-description-v-1',
  DialogTitle: 'reka-dialog-title-v-0',
  DrawerDescription: 'reka-drawer-description-v-2',
  DrawerTitle: 'reka-drawer-title-v-1',
  DropdownMenuLabel: 'reka-menu-group-v-2',
  FieldLabel: 'reka-field-label-v-1',
  ListboxGroupLabel: 'reka-listbox-group-v-0',
  MonthPickerHeading: 'reka-month-picker-heading-v-0',
  MonthRangePickerHeading: 'reka-month-range-picker-heading-v-0',
  SelectItemText: 'reka-select-item-text-v-1',
  SelectLabel: 'reka-select-group-v-1',
  StepperDescription: 'reka-stepper-item-description-v-1',
  StepperTitle: 'reka-stepper-item-title-v-0',
  TagsInputItemText: 'reka-tags-input-item-text-v-0',
  YearPickerHeading: 'reka-year-picker-heading-v-0',
  YearRangePickerHeading: 'reka-year-range-picker-heading-v-0',
}

beforeAll(() => {
  globalThis.ResizeObserver ??= class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any
  window.HTMLElement.prototype.scrollIntoView ??= vi.fn()
  window.HTMLElement.prototype.releasePointerCapture ??= vi.fn()
  window.HTMLElement.prototype.hasPointerCapture ??= vi.fn()
})

afterEach(() => {
  document.body.innerHTML = ''
})

async function settle() {
  await flushPromises()
  await nextTick()
  await flushPromises()
}

function find(testId: string) {
  const element = document.querySelector<HTMLElement>(`[data-testid="${testId}"]`)
  expect(element, testId).toBeTruthy()
  return element!
}

function references(referrer: HTMLElement, attribute: string) {
  return referrer.getAttribute(attribute)?.split(/\s+/) ?? []
}

describe.each(Object.entries(cases))('%s', (name, { generatedId, attribute, render, multipleParts = true }) => {
  const part = { 'data-testid': 'part' }
  const second = { 'data-testid': 'part-2' }
  const referrer = { 'data-testid': 'referrer' }

  it('keeps the generated id when the consumer passes none', async () => {
    const wrapper = mount(defineComponent({ render: () => render([part], referrer) }), { attachTo: document.body })
    await settle()
    const id = find('part').id
    expect(id).toMatch(generatedId)
    expect(id).toBe(defaultIds[name])
    expect(references(find('referrer'), attribute)).toContain(id)
    wrapper.unmount()
  })

  it('points the reference at a consumer id', async () => {
    const wrapper = mount(defineComponent({ render: () => render([{ ...part, id: 'consumer-id' }], referrer) }), { attachTo: document.body })
    await settle()
    expect(find('part').id).toBe('consumer-id')
    expect(references(find('referrer'), attribute)).toContain('consumer-id')
    wrapper.unmount()
  })

  it('follows a consumer id that changes after mount', async () => {
    const id = ref('first-id')
    const wrapper = mount(defineComponent({ render: () => render([{ ...part, id: id.value }], referrer) }), { attachTo: document.body })
    await settle()
    id.value = 'second-id'
    await settle()
    expect(find('part').id).toBe('second-id')
    expect(references(find('referrer'), attribute)).toContain('second-id')
    wrapper.unmount()
  })

  it('renders each part\'s own consumer id and references the first, without an update loop', async () => {
    const warn = vi.spyOn(console, 'warn')
    onTestFinished(() => warn.mockRestore())
    const wrapper = mount(defineComponent({
      render: () => render([{ ...part, id: 'first-id' }, { ...second, id: 'second-id' }], referrer),
    }), { attachTo: document.body })
    await settle()
    expect(find('part').id).toBe('first-id')
    expect(find('part-2').id).toBe('second-id')
    expect(references(find('referrer'), attribute)).toContain('first-id')
    expect(references(find('referrer'), attribute)).not.toContain('second-id')
    expect(warn.mock.calls.flat().join('\n')).not.toContain('Maximum recursive updates')
    wrapper.unmount()
  })

  it('keeps the generated id on a plain part beside one with a consumer id', async () => {
    const wrapper = mount(defineComponent({
      render: () => render([{ ...part, id: 'consumer-id' }, second], referrer),
    }), { attachTo: document.body })
    await settle()
    expect(find('part').id).toBe('consumer-id')
    expect(find('part-2').id).toMatch(generatedId)
    expect(references(find('referrer'), attribute)).toContain('consumer-id')
    wrapper.unmount()
  })

  it('drops the reference to a consumer id that becomes empty', async () => {
    const id = ref('consumer-id')
    const wrapper = mount(defineComponent({ render: () => render([{ ...part, id: id.value }], referrer) }), { attachTo: document.body })
    await settle()
    id.value = ''
    await settle()
    // An empty `id` attribute still lands on the element, as it always has; the reference
    // goes back to the generated id rather than the one the element no longer has.
    expect(find('part').id).toBe('')
    expect(references(find('referrer'), attribute)).not.toContain('consumer-id')
    expect(references(find('referrer'), attribute).some(ref => generatedId.test(ref))).toBe(true)
    wrapper.unmount()
  })

  it('releases the reference when the part unmounts and claims it again on remount', async () => {
    const shown = ref(true)
    const wrapper = mount(defineComponent({
      render: () => render(shown.value ? [{ ...part, id: 'consumer-id' }] : [], referrer),
    }), { attachTo: document.body })
    await settle()
    shown.value = false
    await settle()
    expect(references(find('referrer'), attribute)).not.toContain('consumer-id')
    shown.value = true
    await settle()
    expect(references(find('referrer'), attribute)).toContain('consumer-id')
    wrapper.unmount()
  })

  it.skipIf(!multipleParts)('hands the reference to the next consumer id when the first part unmounts', async () => {
    const shown = ref(true)
    const wrapper = mount(defineComponent({
      render: () => render([
        ...(shown.value ? [{ ...part, id: 'first-id' }] : []),
        { ...second, id: 'second-id' },
      ], referrer),
    }), { attachTo: document.body })
    await settle()
    shown.value = false
    await settle()
    expect(references(find('referrer'), attribute)).toContain('second-id')
    wrapper.unmount()
  })
})

describe('server render and hydration with consumer ids', () => {
  async function hydrate(render: () => VNode) {
    const app = () => createSSRApp(defineComponent({ render }))
    const container = document.createElement('div')
    container.innerHTML = await renderToString(app())
    document.body.append(container)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    onTestFinished(() => {
      warn.mockRestore()
      error.mockRestore()
    })
    const instance = app()
    instance.mount(container)
    onTestFinished(() => instance.unmount())
    await settle()
    const messages = [...warn.mock.calls, ...error.mock.calls].flat().join('\n')
    expect(messages).not.toMatch(/hydration/i)
    return container
  }

  it('references a consumer id on FieldLabel', async () => {
    const container = await hydrate(() => h(FieldRoot, null, () => [
      h(FieldLabel, { id: 'my-label' }, () => 'Label'),
      h(FieldControl, { 'data-testid': 'control' }),
    ]))
    expect(container.querySelector('label')!.id).toBe('my-label')
    expect(container.querySelector('[data-testid="control"]')!.getAttribute('aria-labelledby')).toBe('my-label')
  })

  it('references a consumer id on SelectLabel and SelectItemText', async () => {
    const container = await hydrate(() => h(SelectRoot, { open: true }, () => [
      h(SelectTrigger, () => 'Open'),
      h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () =>
        h(SelectGroup, { 'data-testid': 'group' }, () => [
          h(SelectLabel, { id: 'my-group-label' }, () => 'Group'),
          h(SelectItem, { 'value': 'a', 'data-testid': 'item' }, () => h(SelectItemText, { id: 'my-item-text' }, () => 'A')),
        ]))),
    ]))
    expect(document.querySelector('[data-testid="group"]')!.getAttribute('aria-labelledby')).toBe('my-group-label')
    expect(document.querySelector('[data-testid="item"]')!.getAttribute('aria-labelledby')).toBe('my-item-text')
    expect(container).toBeTruthy()
  })
})

// Compiled templates, whose slots are stable: a parent that re-renders does not re-render
// the children, so a referring part rendered before the claiming one has to be updated itself.
describe('a referring part rendered before the part that claims a consumer id', () => {
  const components = {
    MonthPickerRoot,
    MonthPickerHeader,
    MonthPickerHeading,
    MonthPickerGrid,
    MonthRangePickerRoot,
    MonthRangePickerHeader,
    MonthRangePickerHeading,
    MonthRangePickerGrid,
    YearPickerRoot,
    YearPickerHeader,
    YearPickerHeading,
    YearPickerGrid,
    YearRangePickerRoot,
    YearRangePickerHeader,
    YearRangePickerHeading,
    YearRangePickerGrid,
    StepperRoot,
    StepperItem,
    StepperTrigger,
    StepperTitle,
    StepperDescription,
    TagsInputRoot,
    TagsInputItem,
    TagsInputItemDelete,
    TagsInputItemText,
    SelectRoot,
    SelectTrigger,
    SelectContent,
    SelectViewport,
    SelectGroup,
    SelectLabel,
    SelectItem,
    SelectItemText,
    ListboxRoot,
    ListboxContent,
    ListboxGroup,
    ListboxGroupLabel,
    ListboxItem,
    DropdownMenuRoot,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuItem,
  }

  const picker = (name: string) => `<${name}Root>
    <${name}Grid data-testid="referrer" />
    <${name}Header><${name}Heading id="consumer-id" /></${name}Header>
  </${name}Root>`

  const templates: Record<string, { template: string, attribute?: string }> = {
    'MonthPickerHeading': { template: picker('MonthPicker') },
    'MonthRangePickerHeading': { template: picker('MonthRangePicker') },
    'YearPickerHeading': { template: picker('YearPicker') },
    'YearRangePickerHeading': { template: picker('YearRangePicker') },
    'StepperTitle (trigger first)': { template: `<StepperRoot :default-value="1"><StepperItem :step="1">
      <StepperTrigger data-testid="referrer" /><StepperTitle id="consumer-id">Title</StepperTitle>
    </StepperItem></StepperRoot>` },
    'StepperTitle (trigger last)': { template: `<StepperRoot :default-value="1"><StepperItem :step="1">
      <StepperTitle id="consumer-id">Title</StepperTitle><StepperTrigger data-testid="referrer" />
    </StepperItem></StepperRoot>` },
    'StepperDescription (trigger first)': { template: `<StepperRoot :default-value="1"><StepperItem :step="1">
      <StepperTrigger data-testid="referrer" /><StepperDescription id="consumer-id">Description</StepperDescription>
    </StepperItem></StepperRoot>` },
    'TagsInputItemText (delete first)': { template: `<TagsInputRoot :default-value="['a']"><TagsInputItem value="a">
      <TagsInputItemDelete data-testid="referrer" /><TagsInputItemText id="consumer-id" />
    </TagsInputItem></TagsInputRoot>` },
    'SelectLabel (items first)': { template: `<SelectRoot :default-open="true"><SelectTrigger>Open</SelectTrigger>
      <SelectContent position="popper"><SelectViewport><SelectGroup data-testid="referrer">
        <SelectItem value="a"><SelectItemText>A</SelectItemText></SelectItem><SelectLabel id="consumer-id">Group</SelectLabel>
      </SelectGroup></SelectViewport></SelectContent></SelectRoot>` },
    'ListboxGroupLabel (items first)': { template: `<ListboxRoot><ListboxContent><ListboxGroup data-testid="referrer">
      <ListboxItem value="a">A</ListboxItem><ListboxGroupLabel id="consumer-id">Group</ListboxGroupLabel>
    </ListboxGroup></ListboxContent></ListboxRoot>` },
    'DropdownMenuLabel (items first)': { template: `<DropdownMenuRoot :default-open="true"><DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent><DropdownMenuGroup data-testid="referrer">
        <DropdownMenuItem>A</DropdownMenuItem><DropdownMenuLabel id="consumer-id">Group</DropdownMenuLabel>
      </DropdownMenuGroup></DropdownMenuContent></DropdownMenuRoot>` },
  }

  it.each(Object.entries(templates))('%s', async (_, { template, attribute = 'aria-labelledby' }) => {
    const wrapper = mount(defineComponent({ components, template }), { attachTo: document.body })
    await settle()
    expect(document.getElementById('consumer-id')).toBeTruthy()
    expect(references(find('referrer'), attribute)).toContain('consumer-id')
    wrapper.unmount()
  })
})
