import type { VNode } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, onTestFinished, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref, Suspense } from 'vue'
import { AlertDialogContent, AlertDialogDescription, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle } from '@/AlertDialog'
import { ComboboxAnchor, ComboboxContent, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxLabel, ComboboxRoot } from '@/Combobox'
import { DialogContent, DialogDescription, DialogPortal, DialogRoot, DialogTitle } from '@/Dialog'
import { DrawerDescription, DrawerPopup, DrawerPortal, DrawerRoot, DrawerTitle } from '@/Drawer'
import { DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { FieldControl, FieldLabel, FieldRoot } from '@/Field'
import { ListboxContent, ListboxGroup, ListboxGroupLabel, ListboxItem, ListboxRoot } from '@/Listbox'
import { SelectContent, SelectGroup, SelectItem, SelectItemText, SelectLabel, SelectPortal, SelectRoot, SelectTrigger, SelectViewport } from '@/Select'
import { StepperDescription, StepperItem, StepperRoot, StepperTitle, StepperTrigger } from '@/Stepper'
import { TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from '@/TagsInput'

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
    // v3 names the parts after the root's id.
    generatedId: title ? /^reka-dialog-v-\d+-title$/ : /^reka-dialog-v-\d+-description$/,
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
    // v3 names the parts after the root's id.
    generatedId: title ? /^reka-alert-dialog-v-\d+-title$/ : /^reka-alert-dialog-v-\d+-description$/,
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
    // v3 names the parts after the root's id.
    generatedId: title ? /^reka-drawer-v-\d+-title$/ : /^reka-drawer-v-\d+-description$/,
    attribute: title ? 'aria-labelledby' : 'aria-describedby',
    render: (parts, referrer) => h(DrawerRoot, { defaultOpen: true }, () =>
      h(DrawerPortal, () => h(DrawerPopup, referrer, () => [
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

// v2's Month/Year picker heading cases are not here: v3 folds those pickers into Calendar, whose grids
// reference a visually hidden heading the root renders rather than a consumer part.
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
}

// The ids each part rendered before consumer ids were followed: they must not change (v3's ids).
const defaultIds: Record<string, string> = {
  AlertDialogDescription: 'reka-alert-dialog-v-0-description',
  AlertDialogTitle: 'reka-alert-dialog-v-0-title',
  ComboboxLabel: 'reka-combobox-group-label-v-3',
  DialogDescription: 'reka-dialog-v-0-description',
  DialogTitle: 'reka-dialog-v-0-title',
  DrawerDescription: 'reka-drawer-v-0-description',
  DrawerTitle: 'reka-drawer-v-0-title',
  DropdownMenuLabel: 'reka-menu-group-v-1',
  FieldLabel: 'reka-field-label-v-1',
  ListboxGroupLabel: 'reka-listbox-group-v-0',
  SelectItemText: 'reka-select-item-text-v-1',
  SelectLabel: 'reka-select-group-v-1',
  StepperDescription: 'reka-stepper-item-description-v-1',
  StepperTitle: 'reka-stepper-item-title-v-0',
  TagsInputItemText: 'reka-tags-input-item-text-v-0',
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
    // An empty `id` attribute still lands on the element, as it always has (v3's Dialog, AlertDialog
    // and Drawer put the generated id back instead); the reference goes back to the generated id
    // rather than the one the element no longer has.
    expect(find('part').id === '' || generatedId.test(find('part').id)).toBe(true)
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
        // Keyed, so the first part really unmounts instead of being patched into the second.
        ...(shown.value ? [{ ...part, id: 'first-id', key: 'first' }] : []),
        { ...second, id: 'second-id', key: 'second' },
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

  const templates: Record<string, { template: string, attribute?: string }> = {
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

  describe.each(Object.entries(templates))('%s', (_name, { template, attribute = 'aria-labelledby' }) => it('references the consumer id', async () => {
    const wrapper = mount(defineComponent({ components, template }), { attachTo: document.body })
    await settle()
    expect(document.getElementById('consumer-id')).toBeTruthy()
    expect(references(find('referrer'), attribute)).toContain('consumer-id')
    wrapper.unmount()
  }))
})

describe('consumer ids around Suspense and asChild', () => {
  function deferred() {
    let resolve!: () => void
    const promise = new Promise<void>(r => resolve = r)
    return { promise, resolve }
  }

  function asyncPart(promise: Promise<void>) {
    return defineComponent({
      async setup() {
        await promise
        return () => h('span', 'async')
      },
    })
  }

  it('skips a part whose async setup is pending and references the claim once it resolves', async () => {
    const { promise, resolve } = deferred()
    const Async = asyncPart(promise)
    const wrapper = mount(defineComponent({
      render: () => h(Suspense, null, () => h(StepperRoot, { defaultValue: 1 }, () => h(StepperItem, { step: 1 }, () => [
        h(Async),
        h(StepperTrigger, { 'data-testid': 'referrer' }, () => 'Step'),
        h(StepperTitle, { id: 'consumer-id' }, () => 'Title'),
      ]))),
    }), { attachTo: document.body })
    await settle()
    resolve()
    await settle()
    expect(references(find('referrer'), 'aria-labelledby')).toContain('consumer-id')
    wrapper.unmount()
  })

  it('updates a referring part waiting in a Suspense boundary\'s pending branch', async () => {
    const { promise, resolve } = deferred()
    const Async = asyncPart(promise)
    const wrapper = mount(defineComponent({
      components: { StepperRoot, StepperItem, StepperTrigger, StepperTitle, Async },
      template: `<StepperRoot :default-value="1"><StepperItem :step="1">
        <Suspense><div><StepperTrigger data-testid="referrer">Step</StepperTrigger><Async /></div></Suspense>
        <StepperTitle id="consumer-id">Title</StepperTitle>
      </StepperItem></StepperRoot>`,
    }), { attachTo: document.body })
    await settle()
    resolve()
    await settle()
    expect(references(find('referrer'), 'aria-labelledby')).toContain('consumer-id')
    wrapper.unmount()
  })

  it('references an id on the child element of an asChild part', async () => {
    const wrapper = mount(defineComponent({
      render: () => h(ListboxRoot, null, () => h(ListboxContent, () => h(ListboxGroup, { 'data-testid': 'referrer' }, () => [
        h(ListboxGroupLabel, { asChild: true }, () => h('span', { id: 'child-label' }, 'Group')),
        h(ListboxItem, { value: 'a' }, () => 'A'),
      ]))),
    }), { attachTo: document.body })
    await settle()
    expect(document.getElementById('child-label')).toBeTruthy()
    expect(references(find('referrer'), 'aria-labelledby')).toContain('child-label')
    wrapper.unmount()
  })

  it('follows an asChild title whose child element changes its id', async () => {
    const id = ref('first-title')
    const wrapper = mount(defineComponent({
      render: () => h(DialogRoot, { defaultOpen: true }, () => h(DialogContent, { 'data-testid': 'referrer' }, () => [
        h(DialogTitle, { asChild: true }, () => h('h2', { id: id.value }, 'Title')),
        h(DialogDescription, () => 'Description'),
      ])),
    }), { attachTo: document.body })
    await settle()
    expect(find('referrer').getAttribute('aria-labelledby')).toBe('first-title')
    id.value = 'second-title'
    await settle()
    expect(document.getElementById('second-title')).toBeTruthy()
    expect(find('referrer').getAttribute('aria-labelledby')).toBe('second-title')
    wrapper.unmount()
  })
})
