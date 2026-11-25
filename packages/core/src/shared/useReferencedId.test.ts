import type { VNode } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
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
import { TagsInputItem, TagsInputItemText, TagsInputRoot } from '@/TagsInput'
import { YearPickerGrid, YearPickerHeader, YearPickerHeading, YearPickerRoot } from '@/YearPicker'
import { YearRangePickerGrid, YearRangePickerHeader, YearRangePickerHeading, YearRangePickerRoot } from '@/YearRangePicker'

/** Attributes for the part whose id is referenced; the consumer `id` goes here. */
type Attrs = Record<string, unknown>

interface Case {
  /** The id the referenced part renders when the consumer passes none. */
  generatedId: RegExp
  /** The attribute on the referring element that holds the referenced id. */
  attribute: string
  /** Renders the tree. `part` goes on the referenced part, `referrer` on the referring one. */
  render: (part: Attrs, referrer: Attrs) => VNode
}

function dialog(title: boolean): Case {
  return {
    generatedId: title ? /^reka-dialog-title-/ : /^reka-dialog-description-/,
    attribute: title ? 'aria-labelledby' : 'aria-describedby',
    render: (part, referrer) => h(DialogRoot, { defaultOpen: true }, () =>
      h(DialogPortal, () => h(DialogContent, referrer, () => [
        h(DialogTitle, title ? part : {}, () => 'Title'),
        h(DialogDescription, title ? {} : part, () => 'Description'),
      ]))),
  }
}

function alertDialog(title: boolean): Case {
  return {
    generatedId: title ? /^reka-dialog-title-/ : /^reka-dialog-description-/,
    attribute: title ? 'aria-labelledby' : 'aria-describedby',
    render: (part, referrer) => h(AlertDialogRoot, { defaultOpen: true }, () =>
      h(AlertDialogPortal, () => h(AlertDialogContent, referrer, () => [
        h(AlertDialogTitle, title ? part : {}, () => 'Title'),
        h(AlertDialogDescription, title ? {} : part, () => 'Description'),
      ]))),
  }
}

function drawer(title: boolean): Case {
  return {
    generatedId: title ? /^reka-drawer-title-/ : /^reka-drawer-description-/,
    attribute: title ? 'aria-labelledby' : 'aria-describedby',
    render: (part, referrer) => h(DrawerRoot, { defaultOpen: true }, () =>
      h(DrawerPortal, () => h(DrawerContent, referrer, () => [
        h(DrawerTitle, title ? part : {}, () => 'Title'),
        h(DrawerDescription, title ? {} : part, () => 'Description'),
      ]))),
  }
}

function stepper(title: boolean): Case {
  return {
    generatedId: title ? /^reka-stepper-item-title-/ : /^reka-stepper-item-description-/,
    // The trigger is named by both its title and its description.
    attribute: 'aria-labelledby',
    render: (part, referrer) => h(StepperRoot, { defaultValue: 1 }, () =>
      h(StepperItem, { step: 1 }, () => [
        h(StepperTrigger, referrer, () => 'Step'),
        h(StepperTitle, title ? part : {}, () => 'Title'),
        h(StepperDescription, title ? {} : part, () => 'Description'),
      ])),
  }
}

function picker(Root: any, Header: any, Heading: any, Grid: any, name: string): Case {
  return {
    generatedId: new RegExp(`^reka-${name}-heading-`),
    attribute: 'aria-labelledby',
    render: (part, referrer) => h(Root, null, {
      default: () => [
        h(Header, () => h(Heading, part)),
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
    render: (part, referrer) => h(SelectRoot, { defaultOpen: true }, () => [
      h(SelectTrigger, () => 'Open'),
      h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () =>
        h(SelectGroup, referrer, () => [
          h(SelectLabel, part, () => 'Group'),
          h(SelectItem, { value: 'a' }, () => h(SelectItemText, () => 'A')),
        ])))),
    ]),
  },
  SelectItemText: {
    generatedId: /^reka-select-item-text-/,
    attribute: 'aria-labelledby',
    render: (part, referrer) => h(SelectRoot, { defaultOpen: true }, () => [
      h(SelectTrigger, () => 'Open'),
      h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () =>
        h(SelectItem, { value: 'a', ...referrer }, () => h(SelectItemText, part, () => 'A'))))),
    ]),
  },
  ComboboxLabel: {
    generatedId: /^reka-combobox-group-label-/,
    attribute: 'aria-labelledby',
    render: (part, referrer) => h(ComboboxRoot, { open: true }, () => [
      h(ComboboxAnchor, () => h(ComboboxInput)),
      h(ComboboxContent, () => h(ComboboxGroup, referrer, () => [
        h(ComboboxLabel, part, () => 'Group'),
        h(ComboboxItem, { value: 'a' }, () => 'A'),
      ])),
    ]),
  },
  ListboxGroupLabel: {
    generatedId: /^reka-listbox-group-/,
    attribute: 'aria-labelledby',
    render: (part, referrer) => h(ListboxRoot, null, () => h(ListboxContent, () =>
      h(ListboxGroup, referrer, () => [
        h(ListboxGroupLabel, part, () => 'Group'),
        h(ListboxItem, { value: 'a' }, () => 'A'),
      ]))),
  },
  DropdownMenuLabel: {
    generatedId: /^reka-menu-group-/,
    attribute: 'aria-labelledby',
    render: (part, referrer) => h(DropdownMenuRoot, { defaultOpen: true }, () => [
      h(DropdownMenuTrigger, () => 'Open'),
      h(DropdownMenuPortal, () => h(DropdownMenuContent, () => h(DropdownMenuGroup, referrer, () => [
        h(DropdownMenuLabel, part, () => 'Group'),
        h(DropdownMenuItem, () => 'A'),
      ]))),
    ]),
  },
  TagsInputItemText: {
    generatedId: /^reka-tags-input-item-text-/,
    attribute: 'aria-labelledby',
    render: (part, referrer) => h(TagsInputRoot, { defaultValue: ['a'] }, () =>
      h(TagsInputItem, { value: 'a', ...referrer }, () => h(TagsInputItemText, part))),
  },
  FieldLabel: {
    generatedId: /^reka-field-label-/,
    attribute: 'aria-labelledby',
    render: (part, referrer) => h(FieldRoot, null, () => [
      h(FieldLabel, { nativeLabel: false, as: 'div', ...part }, () => 'Label'),
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

describe.each(Object.entries(cases))('%s', (name, { generatedId, attribute, render }) => {
  const part = { 'data-testid': 'part' }
  const referrer = { 'data-testid': 'referrer' }

  it('keeps the generated id when the consumer passes none', async () => {
    const wrapper = mount(defineComponent({ render: () => render(part, referrer) }), { attachTo: document.body })
    await settle()
    const id = find('part').id
    expect(id).toMatch(generatedId)
    expect(id).toBe(defaultIds[name])
    expect(references(find('referrer'), attribute)).toContain(id)
    wrapper.unmount()
  })

  it('points the reference at a consumer id', async () => {
    const wrapper = mount(defineComponent({ render: () => render({ ...part, id: 'consumer-id' }, referrer) }), { attachTo: document.body })
    await settle()
    expect(find('part').id).toBe('consumer-id')
    expect(references(find('referrer'), attribute)).toContain('consumer-id')
    wrapper.unmount()
  })

  it('follows a consumer id that changes after mount', async () => {
    const id = ref('first-id')
    const wrapper = mount(defineComponent({ render: () => render({ ...part, id: id.value }, referrer) }), { attachTo: document.body })
    await settle()
    id.value = 'second-id'
    await settle()
    expect(find('part').id).toBe('second-id')
    expect(references(find('referrer'), attribute)).toContain('second-id')
    wrapper.unmount()
  })
})
