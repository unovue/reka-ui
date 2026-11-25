// The bridge's privacy and safety contract, checked on every output path for every family it covers.
// Cases are generated: each family × where it sits × the mark on it. A new family added to `families`
// gets every placement and every mark that applies to it.
import type { Ref, VNode } from 'vue'
import type { Agent, AgentComponent, AgentStep, ObservedChange } from '.'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '@/Accordion'
import { CheckboxRoot } from '@/Checkbox'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '@/Collapsible'
import { ComboboxAnchor, ComboboxCancel, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot, ComboboxViewport } from '@/Combobox'
import { DialogContent, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { ListboxContent, ListboxItem, ListboxRoot } from '@/Listbox'
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from '@/NumberField'
import { PinInputInput, PinInputRoot } from '@/PinInput'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '@/Select'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '@/Slider'
import { SwitchRoot } from '@/Switch'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
import { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from '@/TagsInput'
import { ToggleGroupItem, ToggleGroupRoot } from '@/ToggleGroup'
import { createAgent } from '.'

// jsdom lacks ResizeObserver, which the slider measures its thumbs with.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

const SECRET = 'ZQXSECRET'
// Private text beside a component, in its row or its section's name, that no output may carry.
const NEARBY = 'ZQXNEARBY'
const CONFIRM = 'Changes something that matters.'
type Attrs = Record<string, unknown>

/** The marks a family's fixture places on its own parts. */
interface Marks {
  /** On the item an action picks or takes out, `bravo`. */
  item: (value: string) => Attrs
  /** On the control an action stands for, like the increment button. */
  part: Attrs
  disabled: boolean
  /** On the list's content part, like a closed select's content. */
  content: Attrs
  /** Whether the app's filter leaves out the chosen item, `secret`. */
  filtered: () => boolean
}

interface Family {
  name: string
  render: (m: Marks, model: Ref<any>) => VNode | VNode[]
  initial: () => unknown
  /** Each action the family advertises, as a step on "Target". */
  actions: Omit<AgentStep, 'ref'>[]
  /** A step that picks, opens or takes out the item `bravo`, for item marks. */
  itemStep?: Omit<AgentStep, 'ref'>
  /** A step the marked part stands for. */
  partStep?: Omit<AgentStep, 'ref'>
  /** Steps that fail for a reason, like a missing item or a bound, whose error must not say what a private one holds. */
  probes?: Omit<AgentStep, 'ref'>[]
  /** No `disabled` prop to set. */
  noDisabledProp?: boolean
  /** Changes it the way the app would, for `subscribe`. */
  poke?: (model: Ref<any>) => void
  /** Always private, so a secret mark changes nothing. */
  alwaysSecret?: boolean
  /** Whether a step changed it, from its model, or a spy. */
  changed?: (model: Ref<any>, initial: unknown) => boolean
  /** Takes `m.content` on its list content. */
  content?: boolean
  /** Renders only the items `m.filtered` leaves, and this step takes the chosen one out. */
  replaceStep?: Omit<AgentStep, 'ref'>
  /** One chosen item: `strict` always holds one, `empties` can hold none. */
  single?: 'strict' | 'empties'
  /** Takes numbers in `setValue`. */
  numeric?: boolean
}

const v = (model: Ref<any>) => ({ 'modelValue': model.value, 'onUpdate:modelValue': (value: unknown) => (model.value = value) })
const ITEMS: [string, string][] = [['alpha', 'Alpha'], ['bravo', 'Bravo'], ['secret', SECRET]]
const target = { 'aria-label': 'Target' }
const pressed = { count: 0 }

const families: Family[] = [
  {
    name: 'native input',
    initial: () => SECRET,
    render: (m, model) => h('input', { ...target, value: model.value, disabled: m.disabled, onInput: (e: Event) => (model.value = (e.target as HTMLInputElement).value) }),
    actions: [{ action: 'setValue', args: ['new'] }, { action: 'clear' }],
  },
  {
    name: 'native number',
    initial: () => 42,
    render: (m, model) => h('input', { ...target, type: 'number', value: model.value, disabled: m.disabled, onInput: (e: Event) => (model.value = (e.target as HTMLInputElement).valueAsNumber) }),
    actions: [{ action: 'setValue', args: [7] }],
    probes: [{ action: 'setValue', args: ['Infinity'] }],
    numeric: true,
  },
  {
    name: 'native range',
    initial: () => '40',
    render: (m, model) => h('input', { ...target, type: 'range', value: model.value, disabled: m.disabled, onInput: (e: Event) => (model.value = (e.target as HTMLInputElement).value) }),
    actions: [{ action: 'setValue', args: [50] }],
    probes: [{ action: 'setValue', args: [1000] }],
    numeric: true,
  },
  {
    name: 'native date',
    initial: () => '2024-01-01',
    render: (m, model) => h('input', { ...target, type: 'date', value: model.value, disabled: m.disabled, onInput: (e: Event) => (model.value = (e.target as HTMLInputElement).value) }),
    actions: [{ action: 'setValue', args: ['2024-02-02'] }, { action: 'clear' }],
    probes: [{ action: 'setValue', args: ['tomorrow'] }],
  },
  {
    name: 'native checkbox',
    initial: () => true,
    render: (m, model) => h('input', { ...target, type: 'checkbox', checked: model.value, disabled: m.disabled, onChange: (e: Event) => (model.value = (e.target as HTMLInputElement).checked) }),
    actions: [{ action: 'setChecked', args: [false] }, { action: 'toggle' }],
  },
  {
    name: 'native select',
    initial: () => 'secret',
    render: (m, model) => h('select', { ...target, value: model.value, disabled: m.disabled, onChange: (e: Event) => (model.value = (e.target as HTMLSelectElement).value) }, ITEMS.map(([value, label]) => h('option', { value, selected: model.value === value, ...m.item(value) }, label))),
    actions: [{ action: 'setValue', args: ['bravo'] }],
    itemStep: { action: 'setValue', args: ['bravo'] },
    single: 'strict',
  },
  {
    name: 'native radio',
    initial: () => 'secret',
    render: (m, model) => h('fieldset', target, ITEMS.map(([value, label]) => h('label', [h('input', { type: 'radio', name: 'contract', value, checked: model.value === value, disabled: m.disabled, onChange: () => (model.value = value), ...m.item(value) }), label]))),
    actions: [{ action: 'setValue', args: ['bravo'] }],
    itemStep: { action: 'setValue', args: ['bravo'] },
    single: 'strict',
  },
  {
    name: 'switch',
    initial: () => true,
    render: (m, model) => h(SwitchRoot, { ...target, ...v(model), disabled: m.disabled }),
    actions: [{ action: 'setChecked', args: [false] }, { action: 'toggle' }],
  },
  {
    name: 'checkbox',
    initial: () => true,
    render: (m, model) => h(CheckboxRoot, { ...target, ...v(model), disabled: m.disabled }),
    actions: [{ action: 'setChecked', args: [false] }, { action: 'toggle' }],
  },
  {
    name: 'radio-group',
    initial: () => 'secret',
    render: (m, model) => h(RadioGroupRoot, { ...target, ...v(model), disabled: m.disabled }, () => ITEMS.map(([value, label]) => h(RadioGroupItem, { value, ...m.item(value) }, () => label))),
    actions: [{ action: 'setValue', args: ['bravo'] }],
    itemStep: { action: 'setValue', args: ['bravo'] },
    single: 'strict',
  },
  {
    name: 'select',
    initial: () => 'secret',
    render: (m, model) => h(SelectRoot, { ...v(model), disabled: m.disabled }, () => [
      h(SelectTrigger, target, () => h(SelectValue)),
      h(SelectPortal, () => h(SelectContent, m.content, () => h(SelectViewport, () => ITEMS.map(([value, label]) => h(SelectItem, { value, ...m.item(value) }, () => h(SelectItemText, () => label)))))),
    ]),
    actions: [{ action: 'setValue', args: ['bravo'] }, { action: 'setOpen', args: [true] }],
    itemStep: { action: 'setValue', args: ['bravo'] },
    content: true,
    single: 'strict',
  },
  {
    name: 'combobox',
    initial: () => ['secret'],
    render: (m, model) => h(ComboboxRoot, { ...v(model), multiple: true, disabled: m.disabled }, () => [
      h(ComboboxAnchor, () => [h(ComboboxInput, target), h(ComboboxCancel, m.part, () => 'Clear')]),
      h(ComboboxContent, m.content, () => h(ComboboxViewport, () => ITEMS.filter(([value]) => !(m.filtered() && value === 'secret')).map(([value, label]) => h(ComboboxItem, { value, ...m.item(value) }, () => label)))),
    ]),
    actions: [{ action: 'setValue', args: [['secret', 'bravo']] }, { action: 'setOpen', args: [true] }, { action: 'setQuery', args: ['a'] }, { action: 'clear' }],
    itemStep: { action: 'setValue', args: [['secret', 'bravo']] },
    partStep: { action: 'clear' },
    content: true,
    replaceStep: { action: 'setValue', args: [['bravo']] },
  },
  {
    name: 'listbox',
    initial: () => 'secret',
    render: (m, model) => h(ListboxRoot, { ...target, ...v(model), disabled: m.disabled }, () => h(ListboxContent, () => ITEMS.filter(([value]) => !(m.filtered() && value === 'secret')).map(([value, label]) => h(ListboxItem, { value, ...m.item(value) }, () => label)))),
    actions: [{ action: 'setValue', args: ['bravo'] }],
    itemStep: { action: 'setValue', args: ['bravo'] },
    replaceStep: { action: 'setValue', args: ['bravo'] },
    single: 'strict',
  },
  {
    name: 'tabs',
    initial: () => 'secret',
    noDisabledProp: true,
    render: (m, model) => h(TabsRoot, v(model), () => [
      h(TabsList, target, () => ITEMS.map(([value, label]) => h(TabsTrigger, { value, disabled: m.disabled, ...m.item(value) }, () => label))),
      ...ITEMS.map(([value]) => h(TabsContent, { value }, () => `Panel ${value}`)),
    ]),
    actions: [{ action: 'setValue', args: ['bravo'] }],
    itemStep: { action: 'setValue', args: ['bravo'] },
    single: 'strict',
  },
  {
    name: 'accordion',
    initial: () => 'secret',
    render: (m, model) => h(AccordionRoot, { ...target, ...v(model), type: 'single', collapsible: true, disabled: m.disabled }, () => ITEMS.map(([value, label]) => h(AccordionItem, { value, ...m.item(value) }, () => [
      h(AccordionHeader, () => h(AccordionTrigger, () => label)),
      h(AccordionContent, () => `Body ${value}`),
    ]))),
    actions: [{ action: 'setValue', args: ['bravo'] }, { action: 'open', args: ['bravo'] }, { action: 'close', args: ['secret'] }, { action: 'toggle', args: ['bravo'] }],
    itemStep: { action: 'open', args: ['bravo'] },
    single: 'empties',
  },
  {
    name: 'toggle-group',
    initial: () => 'secret',
    render: (m, model) => h(ToggleGroupRoot, { ...target, ...v(model), type: 'single', disabled: m.disabled }, () => ITEMS.map(([value, label]) => h(ToggleGroupItem, { value, ...m.item(value) }, () => label))),
    actions: [{ action: 'setValue', args: ['bravo'] }, { action: 'toggle', args: ['bravo'] }],
    itemStep: { action: 'setValue', args: ['bravo'] },
    single: 'empties',
  },
  {
    name: 'collapsible',
    initial: () => false,
    render: (m, model) => h(CollapsibleRoot, { ...target, 'open': model.value, 'onUpdate:open': (value: boolean) => (model.value = value), 'disabled': m.disabled }, () => [h(CollapsibleTrigger, () => 'More'), h(CollapsibleContent, () => SECRET)]),
    actions: [{ action: 'setOpen', args: [true] }],
    poke: model => (model.value = true),
  },
  {
    name: 'slider',
    initial: () => [40],
    render: (m, model) => h(SliderRoot, { ...target, ...v(model), disabled: m.disabled }, () => [h(SliderTrack, () => h(SliderRange)), h(SliderThumb, target)]),
    actions: [{ action: 'setValue', args: [50] }, { action: 'increment' }, { action: 'decrement' }],
    probes: [{ action: 'setValue', args: [1000] }],
    poke: model => (model.value = [60]),
    numeric: true,
  },
  {
    name: 'number-field',
    initial: () => 4242,
    render: (m, model) => h(NumberFieldRoot, { ...v(model), max: 5000, disabled: m.disabled }, () => [
      h(NumberFieldDecrement, () => '-'),
      h(NumberFieldInput, target),
      h(NumberFieldIncrement, m.part, () => '+'),
    ]),
    actions: [{ action: 'setValue', args: [5] }, { action: 'increment' }, { action: 'decrement' }, { action: 'clear' }],
    partStep: { action: 'increment' },
    probes: [{ action: 'setValue', args: [99999] }],
    poke: model => (model.value = 7),
    numeric: true,
  },
  {
    name: 'tags-input',
    initial: () => ['secret', 'bravo'],
    render: (m, model) => h(TagsInputRoot, { ...v(model), disabled: m.disabled }, () => [
      ...(model.value as string[]).map(tag => h(TagsInputItem, { key: tag, value: tag, ...m.item(tag) }, () => [h(TagsInputItemText), h(TagsInputItemDelete, tag === 'bravo' ? m.part : {}, () => 'x')])),
      h(TagsInputInput, target),
    ]),
    actions: [{ action: 'add', args: ['new'] }, { action: 'remove', args: ['bravo'] }, { action: 'setValue', args: [['secret']] }, { action: 'clear' }],
    itemStep: { action: 'remove', args: ['bravo'] },
    partStep: { action: 'remove', args: ['bravo'] },
    poke: model => (model.value = ['other']),
  },
  {
    name: 'pin-input',
    initial: () => ['1', '2'],
    alwaysSecret: true,
    render: (m, model) => h(PinInputRoot, { ...target, ...v(model), disabled: m.disabled }, () => [0, 1, 2].map(index => h(PinInputInput, { index }))),
    actions: [{ action: 'setValue', args: ['345'] }, { action: 'clear' }],
    poke: model => (model.value = ['9']),
  },
  {
    name: 'dialog',
    initial: () => false,
    noDisabledProp: true,
    render: (m, model) => h(DialogRoot, { 'open': model.value, 'onUpdate:open': (value: boolean) => (model.value = value), 'modal': false }, () => [
      h(DialogTrigger, { ...target, disabled: m.disabled }, () => 'Open'),
      h(DialogPortal, () => h(DialogContent, () => [h(DialogTitle, () => SECRET)])),
    ]),
    actions: [{ action: 'setOpen', args: [true] }],
    poke: model => (model.value = true),
  },
  {
    name: 'popover',
    initial: () => false,
    noDisabledProp: true,
    render: (m, model) => h(PopoverRoot, { 'open': model.value, 'onUpdate:open': (value: boolean) => (model.value = value) }, () => [
      h(PopoverTrigger, { ...target, disabled: m.disabled }, () => 'Open'),
      h(PopoverPortal, () => h(PopoverContent, () => h('button', SECRET))),
    ]),
    actions: [{ action: 'setOpen', args: [true] }],
    poke: model => (model.value = true),
  },
  {
    name: 'menu',
    initial: () => false,
    noDisabledProp: true,
    render: (m, model) => h(DropdownMenuRoot, { 'open': model.value, 'onUpdate:open': (value: boolean) => (model.value = value), 'modal': false }, () => [
      h(DropdownMenuTrigger, { ...target, disabled: m.disabled }, () => 'Open'),
      h(DropdownMenuPortal, () => h(DropdownMenuContent, () => ITEMS.map(([value, label]) => h(DropdownMenuItem, { onSelect: () => pressed.count++, ...m.item(value) }, () => label)))),
    ]),
    actions: [{ action: 'setOpen', args: [true] }, { action: 'press', args: ['Alpha'] }],
    itemStep: { action: 'press', args: ['Bravo'] },
    poke: model => (model.value = true),
    changed: (model, initial) => pressed.count > 0 || model.value !== initial,
  },
]

// Where the component sits: in the page, in a popover's portal, or in a popover inside a dialog's portal.
type Wrap = (inner: () => VNode | VNode[]) => VNode
// Each placement puts the component inside `[data-placed]`, which the setup waits to see on the page.
const placed = (inner: () => VNode | VNode[]) => h('div', { 'data-placed': '' }, [inner()].flat())
const placements: Record<string, Wrap> = {
  'inline': inner => placed(inner),
  'portal': inner => h(PopoverRoot, { defaultOpen: true }, () => [h(PopoverTrigger, () => 'Holder'), h(PopoverPortal, () => h(PopoverContent, () => placed(inner)))]),
  'nested portal': inner => h(DialogRoot, { defaultOpen: true, modal: false }, () => h(DialogPortal, () => h(DialogContent, () => [
    h(DialogTitle, () => 'Shell'),
    placements.portal!(inner),
  ]))),
}

type Expect = 'hidden' | 'secret' | 'confirm' | 'disabled' | 'item-hidden' | 'selected-hidden' | 'filtered-confirm' | 'clear-keeps-hidden' | 'none'
interface Mark {
  expect: Expect
  /** Around the whole placement, outside its portals. */
  ancestor?: Attrs
  /** Around the component, inside its placement. */
  around?: { tag?: string, attrs: Attrs }
  /** A wrapper of its own around the component, like a row with text beside it. */
  wrap?: (inner: VNode[]) => VNode
  item?: Attrs
  /** The item `item` goes on, `bravo` unless said. */
  itemOn?: string
  /** The selected item, `secret`, is disabled. */
  selectedDisabled?: boolean
  part?: Attrs
  disabled?: boolean
  /** On the list's content part. */
  content?: Attrs
  /** The app's filter leaves out the chosen item: after the agent has seen it, or from the start. */
  filtered?: 'later' | 'always'
  applies?: (family: Family) => boolean
}
const marks: Record<string, Mark> = {
  'no mark': { expect: 'none' },
  'hidden on component': { expect: 'hidden', around: { attrs: { 'data-agent-hidden': '' } } },
  'hidden on ancestor': { expect: 'hidden', ancestor: { 'data-agent-hidden': '' } },
  'aria-hidden on component': { expect: 'hidden', around: { attrs: { 'aria-hidden': 'true' } } },
  '[hidden] on component': { expect: 'hidden', around: { attrs: { hidden: '' } } },
  'hidden on item': { expect: 'item-hidden', item: { 'data-agent-hidden': '' }, applies: f => !!f.itemStep },
  // An item hidden from everyone is no item to an agent either, by the same rule as a component.
  '[hidden] on item': { expect: 'item-hidden', item: { hidden: '' }, applies: f => !!f.itemStep && f.name !== 'menu' },
  'aria-hidden on item': { expect: 'item-hidden', item: { 'aria-hidden': 'true' }, applies: f => !!f.itemStep && f.name !== 'menu' },
  // Marks on a list's content apply to its items while it's closed and they render elsewhere.
  'confirm on content': { expect: 'confirm', content: { 'data-agent-confirm': CONFIRM }, applies: f => !!f.content },
  'secret on content': { expect: 'secret', content: { 'data-agent-secret': '' }, applies: f => !!f.content },
  'hidden on content': { expect: 'item-hidden', content: { 'data-agent-hidden': '' }, applies: f => !!f.content },
  // A chosen item the app's filter leaves out keeps its mark: taking it out still asks, or can't go ahead unseen.
  'confirm on the selected item, filtered out': { expect: 'filtered-confirm', item: { 'data-agent-confirm': CONFIRM }, itemOn: 'secret', filtered: 'later', applies: f => !!f.replaceStep },
  // Clearing a list takes out what the agent sees: a hidden chosen item stays chosen.
  'clear with a hidden selected item': { expect: 'clear-keeps-hidden', item: { 'data-agent-hidden': '' }, itemOn: 'secret', applies: f => f.actions.some(a => a.action === 'clear') && Array.isArray(f.initial()) && (!!f.itemStep || f.name === 'tags-input') },
  'confirm on the selected item, never shown': { expect: 'filtered-confirm', item: { 'data-agent-confirm': CONFIRM }, itemOn: 'secret', filtered: 'always', applies: f => !!f.replaceStep },
  'secret on component': { expect: 'secret', around: { attrs: { 'data-agent-secret': '' } } },
  'secret on ancestor': { expect: 'secret', ancestor: { 'data-agent-secret': '' } },
  'confirm on item': { expect: 'confirm', item: { 'data-agent-confirm': CONFIRM }, applies: f => !!f.itemStep },
  'confirm on part': { expect: 'confirm', part: { 'data-agent-confirm': CONFIRM }, applies: f => !!f.partStep },
  'disabled by prop': { expect: 'disabled', disabled: true, applies: f => !f.noDisabledProp },
  'disabled by fieldset': { expect: 'disabled', around: { tag: 'fieldset', attrs: { disabled: true } } },
  'disabled by inert': { expect: 'disabled', around: { attrs: { inert: '' } } },
  // A list whose items show only while it's open can't know a chosen item is hidden before it has opened once.
  'hidden on the selected item': { expect: 'selected-hidden', item: { 'data-agent-hidden': '' }, itemOn: 'secret', applies: f => !!f.itemStep && f.name !== 'menu' && f.name !== 'combobox' },
  'secret on the selected item': { expect: 'secret', item: { 'data-agent-secret': '' }, itemOn: 'secret', applies: f => !!f.itemStep && f.name !== 'menu' && f.name !== 'combobox' },
  'secret text in its row': { expect: 'none', wrap: inner => h('ul', h('li', [h('span', { 'data-agent-secret': '' }, `Balance ${NEARBY}`), ...inner])) },
  'secret text in its section name': { expect: 'none', wrap: inner => h('fieldset', [h('legend', [h('span', { 'data-agent-secret': '' }, NEARBY), ' Group']), ...inner]) },
  'secret ancestor around its row': { expect: 'secret', ancestor: { 'data-agent-secret': '' }, wrap: inner => h('ul', h('li', [h('span', `Balance ${NEARBY}`), ...inner])) },
  'secret, with its selected item disabled': { expect: 'secret', ancestor: { 'data-agent-secret': '' }, selectedDisabled: true, applies: f => !!f.itemStep && f.name !== 'menu' },
}

let agents: Agent[] = []
afterEach(() => {
  agents.forEach(agent => agent.destroy())
  agents = []
  document.body.innerHTML = ''
  pressed.count = 0
})
enableAutoUnmount(afterEach)

// Popups render their content after timers of their own (a portal waits for mount, presence for a frame),
// so a slow run can take several. Each waits on what it needs, not on a fixed time: the page settles once
// `ready` holds and nothing in the document has changed for a few timer turns.
async function settle(ready: () => boolean = () => true) {
  let changed = true
  const observer = new MutationObserver(() => (changed = true))
  // Positioning rewrites `style` on every frame, which says nothing of what is on the page.
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributeFilter: ['hidden', 'inert', 'disabled', 'data-state', 'aria-hidden', 'id'] })
  try {
    for (let quiet = 0, turns = 0; quiet < 2 && turns < 200; turns++) {
      for (let tick = 0; tick < 4; tick++)
        await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))
      quiet = changed || !ready() ? 0 : quiet + 1
      changed = false
    }
  }
  finally {
    observer.disconnect()
  }
}

async function build(family: Family, place: Wrap, mark: Mark, allow?: (step: any) => boolean) {
  const agent = createAgent(allow ? { allow } : {})
  agents.push(agent)
  const model = ref(family.initial())
  const filtered = ref(mark.filtered === 'always')
  const m: Marks = {
    item: value => (value === (mark.itemOn ?? 'bravo') && mark.item ? mark.item : value === 'secret' && mark.selectedDisabled ? { disabled: true } : {}),
    part: mark.part ?? {},
    disabled: !!mark.disabled,
    content: mark.content ?? {},
    filtered: () => filtered.value,
  }
  const component = () => {
    const inner = [family.render(m, model)].flat()
    const wrapped = mark.wrap ? [mark.wrap(inner)] : inner
    return mark.around ? h(mark.around.tag ?? 'div', mark.around.attrs, wrapped) : wrapped
  }
  const errors: unknown[] = []
  const wrapper = mount(defineComponent({ render: () => h('div', mark.ancestor ?? {}, [place(component), h('button', 'Elsewhere')]) }), { attachTo: document.body, global: { config: { errorHandler: error => errors.push(error) } } })
  await settle(() => !!document.querySelector('[data-placed]'))
  return { agent, model, wrapper, filtered, errors }
}

const targetOf = (list: AgentComponent[]) => list.find(c => c.label === 'Target')
const json = (value: unknown) => JSON.stringify(value)

// A list's probe names an item it doesn't have.
for (const family of families) {
  if (family.itemStep && !family.probes) {
    const many = Array.isArray(family.itemStep.args?.[0])
    family.probes = [{ action: family.itemStep.action, args: [many ? ['nonexistent'] : 'nonexistent'] }]
  }
}

const cases = Object.entries(families).flatMap(([, family]) =>
  Object.entries(placements).flatMap(([placeName, place]) =>
    Object.entries(marks)
      .filter(([, mark]) => mark.applies?.(family) ?? true)
      .filter(([, mark]) => !(family.alwaysSecret && mark.expect === 'secret'))
      .map(([markName, mark]) => ({ family, placeName, place, markName, mark })),
  ),
)

describe('agent contract', () => {
  it('covers every family, placement and mark', () => {
    expect(cases.length).toBeGreaterThan(500)
  })

  for (const { family, placeName, place, markName, mark } of cases) {
    it(`${family.name} · ${placeName} · ${markName}`, async () => {
      const { agent, model, wrapper, filtered } = await build(family, place, mark)
      const initial = JSON.parse(json(model.value))
      const changed = () => (family.changed ? family.changed(model, initial) : json(model.value) !== json(initial))
      const outputs: unknown[] = []
      const events: ObservedChange[] = []
      const stop = agent.subscribe(change => events.push(change))

      const snapshot = agent.snapshot()
      outputs.push(snapshot)
      const found = targetOf(snapshot)
      const byText = await agent.query({ text: 'Target' })
      const within = await agent.query({ within: 'Target' })
      const closed = await agent.query({ closed: true })
      const wrong = await agent.act({ steps: [{ ref: 'Nowhere at all', action: 'setValue', args: ['x'] }] })
      outputs.push(byText, within, closed, wrong, await agent.query({ text: SECRET }))

      switch (mark.expect) {
        case 'none': {
          expect(found, 'the fixture is on the page').toBeTruthy()
          for (const step of family.actions) {
            const result = await agent.act({ steps: [{ ref: 'Target', ...step }] })
            expect(result.error?.message, `${step.action} runs`).toBeUndefined()
          }
          break
        }
        case 'hidden': {
          expect(found).toBeUndefined()
          expect(byText).toEqual([])
          expect(within).toMatchObject({ error: expect.stringContaining('No component "Target"') })
          expect(json(closed)).not.toContain('Target')
          expect(wrong.error?.message).not.toContain('Target')
          for (const step of family.actions) {
            const result = await agent.act({ steps: [{ ref: 'Target', ...step }] })
            outputs.push(result)
            expect(result.ok).toBe(false)
            expect(result.error?.message).toMatch(/^No component "Target"/)
          }
          expect(changed()).toBe(false)
          if (family.poke) {
            family.poke(model)
            await settle()
          }
          expect(events.filter(e => e.label === 'Target' || json(e).includes(SECRET))).toEqual([])
          break
        }
        case 'secret': {
          expect(found, 'a private component is still on the page').toBeTruthy()
          for (const step of family.probes ?? []) {
            const result = await agent.act({ steps: [{ ref: 'Target', ...step }] })
            outputs.push(result)
            expect(result.ok, `${step.action} fails`).toBe(false)
          }
          for (const step of family.actions) {
            outputs.push(await agent.act({ steps: [{ ref: 'Target', ...step }] }))
            outputs.push(agent.snapshot())
          }
          if (family.poke) {
            family.poke(model)
            await settle()
          }
          outputs.push(events)
          break
        }
        case 'selected-hidden': {
          expect(found, 'the list is still on the page').toBeTruthy()
          for (const step of family.actions)
            outputs.push(await agent.act({ steps: [{ ref: 'Target', ...step }] }))
          // The app moves the value back to the hidden item and on, so subscribe hears both ways.
          model.value = JSON.parse(json(initial))
          await settle()
          family.poke?.(model) ?? (model.value = Array.isArray(initial) ? ['alpha'] : 'alpha')
          await settle()
          outputs.push(agent.snapshot(), events)
          expect(json(outputs)).not.toContain(SECRET)
          expect(json(outputs)).not.toContain('"secret"')
          break
        }
        case 'item-hidden': {
          expect(found).toBeTruthy()
          expect(json(found)).not.toContain('Bravo')
          const result = await agent.act({ steps: [{ ref: 'Target', ...family.itemStep! }] })
          outputs.push(result)
          expect(result.ok).toBe(false)
          expect(changed()).toBe(false)
          expect(json(await agent.query({ text: 'Bravo' }))).not.toContain('Bravo')
          break
        }
        case 'confirm': {
          const step = family.partStep && mark.part ? family.partStep : family.itemStep!
          const alone = await agent.act({ steps: [{ ref: 'Target', ...step }] })
          expect(alone.ok).toBe(false)
          expect(alone.error?.message).toContain('Needs a person')
          expect(changed()).toBe(false)
          // The same page again, with an `allow` that says no.
          wrapper.unmount()
          agent.destroy()
          document.body.innerHTML = ''
          // It lets everything unmarked through, like opening a list to read it, and refuses the marked change.
          const allow = vi.fn((step: { confirm?: string }) => !step.confirm)
          const asked = await build(family, place, mark, allow)
          const refused = await asked.agent.act({ steps: [{ ref: 'Target', ...step }] })
          expect(refused.ok).toBe(false)
          expect(allow.mock.calls.some(([s]: any[]) => String(s.confirm).includes(CONFIRM))).toBe(true)
          break
        }
        case 'clear-keeps-hidden': {
          const result = await agent.act({ steps: [{ ref: 'Target', action: 'clear' }] })
          outputs.push(result)
          expect(result.error).toBeUndefined()
          expect(model.value).toContain('secret')
          // A Combobox learns its hidden items when it first opens, which the clear does: from then on it's left out.
          expect(json([result, agent.snapshot()])).not.toContain('"secret"')
          break
        }
        case 'filtered-confirm': {
          if (mark.filtered === 'later') {
            // The agent sees the list, and its items' marks, before the app's filter leaves the chosen one out.
            expect((await agent.act({ steps: [{ ref: 'Target', action: 'setOpen', args: [true] }] })).ok || !family.actions.some(a => a.action === 'setOpen')).toBe(true)
            await agent.act({ steps: [{ ref: 'Target', action: 'setOpen', args: [false] }] })
            outputs.push(agent.snapshot())
            filtered.value = true
            await settle()
          }
          const result = await agent.act({ steps: [{ ref: 'Target', ...family.replaceStep! }] })
          outputs.push(result)
          expect(result.ok).toBe(false)
          expect(result.error?.message).toMatch(mark.filtered === 'later' ? /Needs a person/ : /Needs a person|needs the list unfiltered/)
          expect(changed()).toBe(false)
          const clears = family.actions.find(a => a.action === 'clear')
          if (clears) {
            const cleared = await agent.act({ steps: [{ ref: 'Target', ...clears }] })
            expect(cleared.ok).toBe(false)
            expect(changed()).toBe(false)
          }
          break
        }
        case 'disabled': {
          expect(found).toMatchObject({ disabled: true, actions: [] })
          for (const step of family.actions) {
            const result = await agent.act({ steps: [{ ref: 'Target', ...step }] })
            expect(result.ok, `${step.action} is refused`).toBe(false)
          }
          expect(changed()).toBe(false)
          break
        }
      }
      stop()
      // Private text beside a component never reaches any output.
      expect(json([outputs, agent.snapshot(), events])).not.toContain(NEARBY)
      // Nothing private reaches any output, for every mark.
      if (mark.expect === 'hidden' || mark.expect === 'secret' || family.alwaysSecret)
        expect(json(outputs)).not.toContain(SECRET)
    })
  }
})

// Each finding of the second review, and each CodeRabbit thread on 1b6a4ed0b, as the case that showed it.
describe('review findings', () => {
  const page = async (render: () => VNode | VNode[], allow?: (step: any) => boolean | Promise<boolean>) => {
    const agent = createAgent(allow ? { allow } : {})
    agents.push(agent)
    const wrapper = mount(defineComponent({ render }), { attachTo: document.body })
    await settle()
    return { agent, wrapper }
  }
  const select = (model: Ref<any>, item: (value: string) => Attrs = () => ({}), trigger: Attrs = target) => h(SelectRoot, v(model), () => [
    h(SelectTrigger, trigger, () => h(SelectValue)),
    h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () => ITEMS.map(([value, label]) => h(SelectItem, { value, ...item(value) }, () => h(SelectItemText, () => label)))))),
  ])

  it('1: a hidden select item is neither listed nor picked, and a marked one asks', async () => {
    const model = ref('alpha')
    const { agent } = await page(() => select(model, value => (value === 'bravo' ? { 'data-agent-hidden': '' } : value === 'secret' ? { 'data-agent-confirm': CONFIRM } : {})))
    expect(json(targetOf(agent.snapshot()))).not.toContain('Bravo')
    expect((await agent.act({ steps: [{ ref: 'Target', action: 'setValue', args: ['bravo'] }] })).ok).toBe(false)
    const marked = await agent.act({ steps: [{ ref: 'Target', action: 'setValue', args: ['secret'] }] })
    expect(marked.error?.message).toContain('Needs a person')
    expect(model.value).toBe('alpha')
  })

  it('2: a private select is never named by the value it shows', async () => {
    const model = ref('band')
    const { agent } = await page(() => h('div', { 'data-agent-secret': '' }, h(SelectRoot, v(model), () => [
      h(SelectTrigger, () => h(SelectValue)),
      h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () => h(SelectItem, { value: 'band' }, () => h(SelectItemText, () => 'Band L7 $250k'))))),
    ])))
    expect(json(agent.snapshot())).not.toContain('L7')
    expect(await agent.query({ text: 'L7' })).toEqual([])
  })

  it('3: a private accordion\'s sections are never surveyed or offered', async () => {
    const { agent } = await page(() => h('div', { 'data-agent-secret': '' }, h(AccordionRoot, { 'type': 'single', 'collapsible': true, 'aria-label': 'Comp' }, () => ['Salary bands', 'Equity'].map((label, index) => h(AccordionItem, { value: `s${index}` }, () => [
      h(AccordionHeader, () => h(AccordionTrigger, () => label)),
      h(AccordionContent, () => h(SwitchRoot, { 'aria-label': `${label} switch` })),
    ])))))
    expect(json(await agent.query({ closed: true }))).not.toMatch(/Salary|Equity/)
    const wrong = await agent.act({ steps: [{ ref: 'Nowhere', action: 'setChecked', args: [true] }] })
    expect(wrong.error?.message).not.toMatch(/Salary|Equity/)
  })

  it('4: clearing a closed combobox asks about the marked items it takes out', async () => {
    const model = ref(['bravo'])
    const { agent } = await page(() => h(ComboboxRoot, { ...v(model), multiple: true }, () => [
      h(ComboboxAnchor, () => h(ComboboxInput, target)),
      h(ComboboxContent, () => h(ComboboxViewport, () => ITEMS.map(([value, label]) => h(ComboboxItem, { value, ...(value === 'bravo' ? { 'data-agent-confirm': CONFIRM } : {}) }, () => label)))),
    ]))
    const result = await agent.act({ steps: [{ ref: 'Target', action: 'clear' }] })
    expect(result.error?.message).toContain('Needs a person')
    expect(model.value).toEqual(['bravo'])
  })

  it('5: aria-labelledby never reads private text elsewhere on the page', async () => {
    const { agent } = await page(() => [
      h('span', { 'id': 'who', 'data-agent-secret': '' }, `Salary ${SECRET}`),
      h('span', { id: 'what' }, 'Notes'),
      h('input', { 'aria-labelledby': 'what who' }),
    ])
    expect(json(agent.snapshot())).not.toContain(SECRET)
    expect(agent.snapshot().map(c => c.label)).toContain('Notes')
  })

  it('6: a bridge made after another was destroyed still places portalled content', async () => {
    const first = createAgent()
    mount(defineComponent({ render: () => h('div', { 'data-agent-hidden': '' }, h(DialogRoot, { defaultOpen: true, modal: false }, () => h(DialogPortal, () => h(DialogContent, () => [h(DialogTitle, () => 'Keys'), h('input', { 'aria-label': 'Key', 'value': SECRET })])))) }), { attachTo: document.body })
    await settle()
    first.destroy()
    const second = createAgent()
    agents.push(second)
    expect(json(second.snapshot())).not.toContain(SECRET)
    expect(second.snapshot().map(c => c.label)).not.toContain('Key')
  })

  it('7: subscribe says nothing of a component hidden with aria-hidden or [hidden]', async () => {
    const a = ref(false)
    const b = ref(false)
    const { agent } = await page(() => [
      h('div', { 'aria-hidden': 'true' }, h(SwitchRoot, { 'aria-label': 'One', ...v(a) })),
      h('div', { hidden: '' }, h(SwitchRoot, { 'aria-label': 'Two', ...v(b) })),
    ])
    const events: ObservedChange[] = []
    agent.subscribe(change => events.push(change))
    a.value = true
    b.value = true
    await settle()
    expect(events).toEqual([])
  })

  it('8: increment asks when the increment button is marked', async () => {
    const model = ref(1)
    const { agent } = await page(() => h(NumberFieldRoot, v(model), () => [h(NumberFieldInput, target), h(NumberFieldIncrement, { 'data-agent-confirm': CONFIRM }, () => '+')]))
    expect((await agent.act({ steps: [{ ref: 'Target', action: 'increment' }] })).error?.message).toContain('Needs a person')
    expect(model.value).toBe(1)
  })

  it('9: remove asks when the tag\'s delete button is marked', async () => {
    const model = ref(['bravo'])
    const { agent } = await page(() => h(TagsInputRoot, v(model), () => [
      ...(model.value as string[]).map(tag => h(TagsInputItem, { key: tag, value: tag }, () => [h(TagsInputItemText), h(TagsInputItemDelete, { 'data-agent-confirm': CONFIRM }, () => 'x')])),
      h(TagsInputInput, target),
    ]))
    expect((await agent.act({ steps: [{ ref: 'Target', action: 'remove', args: ['bravo'] }] })).error?.message).toContain('Needs a person')
    expect(model.value).toEqual(['bravo'])
  })

  it('a closed section that gains a mark while allow answers isn\'t opened to look', async () => {
    const checked = ref(false)
    const opened: unknown[] = []
    const { agent } = await page(() => h(AccordionRoot, { 'type': 'multiple', 'aria-label': 'Groups', 'onUpdate:modelValue': (value: unknown) => opened.push(value) }, () => h(AccordionItem, { value: 'deep', id: 'deep' }, () => [
      h(AccordionHeader, () => h(AccordionTrigger, () => 'Deep section')),
      h(AccordionContent, () => h(SwitchRoot, { 'aria-label': 'Deep', ...v(checked) })),
    ])), (step) => {
      if (step.action === 'open')
        document.getElementById('deep')?.setAttribute('data-agent-confirm', CONFIRM)
      return true
    })
    const result = await agent.act({ steps: [{ ref: 'Deep', action: 'setChecked', args: [true] }] })
    expect(result.ok).toBe(false)
    expect(checked.value).toBe(false)
    // Looking never opened the section the page marked while it was asked.
    expect(opened).toEqual([])
  })

  it('a select in a disabled fieldset is disabled', async () => {
    const model = ref('alpha')
    const { agent } = await page(() => h('fieldset', { disabled: true }, select(model)))
    expect(targetOf(agent.snapshot())).toMatchObject({ disabled: true, actions: [] })
  })

  it('a numeric pin input takes digits only, and no more than its boxes', async () => {
    const model = ref<number[]>([])
    const { agent } = await page(() => h(PinInputRoot, { ...target, ...v(model), type: 'number' }, () => [0, 1, 2].map(index => h(PinInputInput, { index }))))
    for (const value of ['1 2', '1a', '1234'])
      expect((await agent.act({ steps: [{ ref: 'Target', action: 'setValue', args: [value] }] })).ok, value).toBe(false)
    expect(model.value).toEqual([])
    expect((await agent.act({ steps: [{ ref: 'Target', action: 'setValue', args: ['123'] }] })).ok).toBe(true)
    expect(model.value).toEqual([1, 2, 3])
  })

  it('open with no section on a single accordion closes nothing', async () => {
    const model = ref('alpha')
    const { agent } = await page(() => h(AccordionRoot, { ...target, ...v(model), type: 'single' }, () => ITEMS.map(([value, label]) => h(AccordionItem, { value }, () => [h(AccordionHeader, () => h(AccordionTrigger, () => label)), h(AccordionContent, () => value)]))))
    expect((await agent.act({ steps: [{ ref: 'Target', action: 'open' }] })).ok).toBe(false)
    expect(model.value).toBe('alpha')
  })

  it('a private field that refuses a value fails, without saying what it holds', async () => {
    const { agent } = await page(() => h('input', { 'aria-label': 'Token', 'data-agent-secret': '', 'value': SECRET, 'onInput': (e: Event) => ((e.target as HTMLInputElement).value = SECRET) }))
    const result = await agent.act({ steps: [{ ref: 'Token', action: 'setValue', args: ['other'] }] })
    expect(result.ok).toBe(false)
    expect(json(result)).not.toContain(SECRET)
  })

  it('without a page, every method answers empty instead of throwing', async () => {
    vi.stubGlobal('document', undefined)
    try {
      const agent = createAgent()
      expect(agent.snapshot({})).toEqual([])
      expect(await agent.query({ text: 'x' })).toEqual([])
      expect(await agent.act({ steps: [{ ref: 'x', action: 'press' }] })).toMatchObject({ ok: false, error: { message: expect.stringContaining('No page') } })
      agent.destroy()
    }
    finally {
      vi.unstubAllGlobals()
    }
  })
})

// Each finding of the third review, as the case that showed it.
describe('third review findings', () => {
  const page = async (render: () => VNode | VNode[]) => {
    const agent = createAgent()
    agents.push(agent)
    const wrapper = mount(defineComponent({ render }), { attachTo: document.body })
    await settle()
    return { agent, wrapper }
  }
  const secretSelect = (model: Ref<any>, item: (value: string) => Attrs = () => ({})) => h('div', { 'data-agent-secret': '' }, h(SelectRoot, v(model), () => [
    h(SelectTrigger, target, () => h(SelectValue)),
    h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () => ITEMS.map(([value, label]) => h(SelectItem, { value, ...item(value) }, () => h(SelectItemText, () => label)))))),
  ]))

  it('1: a row inside a private popover is never read, on any path', async () => {
    const show = ref(false)
    const { agent } = await page(() => h('div', { 'data-agent-secret': '' }, h(PopoverRoot, { defaultOpen: true }, () => [
      h(PopoverTrigger, () => 'Account'),
      h(PopoverPortal, () => h(PopoverContent, () => h('ul', h('li', [h('span', `Balance ${SECRET}`), h(SwitchRoot, { 'aria-label': 'Show', ...v(show) })])))),
    ])))
    const events: ObservedChange[] = []
    agent.subscribe(change => events.push(change))
    const outputs = [agent.snapshot(), await agent.query({ text: SECRET }), await agent.query({ text: 'Balance' })]
    outputs.push(await agent.act({ steps: [{ ref: 'Show', action: 'setChecked', args: [true] }, { ref: 'Show', action: 'expect', args: [SECRET] }] }))
    expect(json([outputs, events])).not.toContain(SECRET)
    expect(outputs[1]).toEqual([])
  })

  it('2: a private select\'s errors never name its items or value', async () => {
    const model = ref('secret')
    const { agent } = await page(() => secretSelect(model, value => (value === 'secret' ? { disabled: true } : {})))
    for (const args of [['bravo'], ['nonexistent']]) {
      const result = await agent.act({ steps: [{ ref: 'Target', action: 'setValue', args }] })
      expect(result.ok).toBe(false)
      expect(json(result)).not.toContain(SECRET)
    }
  })

  it('3: a native field hidden and changed after it was seen keeps no value once it leaves', async () => {
    const { agent } = await page(() => h('section', [h('input', { 'aria-label': 'Note', 'value': 'public' })]))
    expect(agent.snapshot().find(c => c.label === 'Note')).toMatchObject({ value: 'public' })
    const input = document.querySelector<HTMLInputElement>('input[aria-label=Note]')!
    const wrapper = document.createElement('div')
    wrapper.setAttribute('data-agent-hidden', '')
    input.replaceWith(wrapper)
    wrapper.append(input)
    input.value = SECRET
    wrapper.remove()
    expect(json(agent.snapshot())).not.toContain(SECRET)
  })

  it('4: a switch hidden, changed and unmounted leaves nothing of the change behind', async () => {
    const hidden = ref(false)
    const here = ref(true)
    const on = ref(false)
    const { agent } = await page(() => h('div', { hidden: hidden.value || undefined }, here.value ? h(SwitchRoot, { 'aria-label': 'Quiet', ...v(on) }) : null))
    expect(agent.snapshot().find(c => c.label === 'Quiet')).toMatchObject({ checked: false })
    hidden.value = true
    await settle()
    on.value = true
    await settle()
    here.value = false
    await settle()
    expect(agent.snapshot().filter(c => c.label === 'Quiet' && c.checked === true)).toEqual([])
  })

  it('5: a private number field fails the same way at its bound and out of range', async () => {
    const model = ref(10)
    const { agent } = await page(() => h('div', { 'data-agent-secret': '' }, h(NumberFieldRoot, { ...v(model), min: 0, max: 10 }, () => [h(NumberFieldInput, target), h(NumberFieldIncrement, () => '+')])))
    const messages: string[] = []
    for (const step of [{ action: 'increment' }, { action: 'setValue', args: [99] }]) {
      const result = await agent.act({ steps: [{ ref: 'Target', ...step }] })
      expect(result.ok).toBe(false)
      messages.push(result.error!.message.replace(step.action, 'ACTION'))
    }
    expect(messages[0]).toBe(messages[1])
    expect(messages.join(' ')).not.toMatch(/\b10\b|disabled/)
  })

  it('6a: a change to a private field reads the same whether the guess equals its value', async () => {
    const results: unknown[] = []
    for (const guess of ['secret', 'bravo']) {
      const model = ref('secret')
      const { agent, wrapper } = await page(() => secretSelect(model))
      const result = await agent.act({ steps: [{ ref: 'Target', action: 'setValue', args: [guess] }] })
      results.push(JSON.parse(json(result).replace(/c\d+/g, 'REF')))
      wrapper.unmount()
      agent.destroy()
    }
    expect(results[0]).toEqual(results[1])
  })

  it('6b: a mark on a private list\'s chosen item doesn\'t say which item is chosen', async () => {
    const messages: (string | undefined)[] = []
    for (const chosen of ['alpha', 'secret']) {
      const model = ref(chosen)
      const { agent, wrapper } = await page(() => secretSelect(model, value => (value === 'alpha' ? { 'data-agent-confirm': CONFIRM } : {})))
      messages.push((await agent.act({ steps: [{ ref: 'Target', action: 'setValue', args: ['bravo'] }] })).error?.message)
      wrapper.unmount()
      agent.destroy()
    }
    expect(messages[0]).toContain('Needs a person')
    expect(messages[1]).toBe(messages[0])
  })

  it('7: page content that copies a menu\'s content id is never taken for the menu', async () => {
    const archived = vi.fn()
    const { agent } = await page(() => h(DropdownMenuRoot, { defaultOpen: true, modal: false }, () => [
      h(DropdownMenuTrigger, target, () => 'Open'),
      h(DropdownMenuPortal, () => h(DropdownMenuContent, () => h(DropdownMenuItem, { onSelect: archived }, () => 'Archive'))),
    ]))
    const id = document.querySelector('[role=menu]')!.id
    const fake = document.createElement('div')
    fake.id = id
    const sent = vi.fn()
    fake.innerHTML = '<button>Send money</button><div role="menuitem">Archive</div>'
    fake.querySelector('button')!.addEventListener('click', sent)
    fake.querySelector('[role=menuitem]')!.addEventListener('click', sent)
    document.querySelector('[data-v-app]')!.prepend(fake)
    expect(targetOf(agent.snapshot())?.buttons).toEqual(['Archive'])
    await agent.act({ steps: [{ ref: 'Target', action: 'press', args: ['Archive'] }] })
    expect(sent).not.toHaveBeenCalled()
    expect(archived).toHaveBeenCalled()
  })

  it('a private switch hides both of its states', async () => {
    const { agent } = await page(() => h('div', { 'data-agent-secret': '' }, [h(SwitchRoot, { 'aria-label': 'Off one' }), h(SwitchRoot, { 'aria-label': 'On one', 'defaultValue': true })]))
    const snapshot = agent.snapshot()
    expect(snapshot.find(c => c.label === 'Off one')?.checked).toBe('[redacted]')
    expect(snapshot.find(c => c.label === 'On one')?.checked).toBe('[redacted]')
  })
})

// Each finding of the fourth review, as the case that showed it.
describe('fourth review findings', () => {
  const page = async (render: () => VNode | VNode[], options: Parameters<typeof createAgent>[0] = {}) => {
    const agent = createAgent(options)
    agents.push(agent)
    const wrapper = mount(defineComponent({ render }), { attachTo: document.body })
    await settle()
    return { agent, wrapper }
  }

  it('1: an unlabelled select whose chosen item is hidden is neither valued nor named by it', async () => {
    const model = ref('secret')
    const { agent } = await page(() => h(SelectRoot, v(model), () => [
      h(SelectTrigger, () => h(SelectValue)),
      h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () => ITEMS.map(([value, label]) => h(SelectItem, { value, ...(value === 'secret' ? { 'data-agent-hidden': '' } : {}) }, () => h(SelectItemText, () => label)))))),
    ]))
    const snapshot = agent.snapshot()
    expect(json(snapshot)).not.toMatch(new RegExp(`${SECRET}|"secret"`))
    expect(snapshot.find(c => c.component === 'select')).toMatchObject({ value: null })
  })

  it('2: a private combobox takes no setQuery, so its filter can\'t test its labels', async () => {
    const model = ref<string[]>([])
    const { agent } = await page(() => h('div', { 'data-agent-secret': '' }, h(ComboboxRoot, { ...v(model), multiple: true }, () => [
      h(ComboboxAnchor, () => h(ComboboxInput, target)),
      h(ComboboxContent, () => h(ComboboxViewport, () => ITEMS.map(([value, label]) => h(ComboboxItem, { value }, () => label)))),
    ])))
    expect(targetOf(agent.snapshot())?.actions).not.toContain('setQuery')
    expect((await agent.act({ steps: [{ ref: 'Target', action: 'setQuery', args: ['zqx'] }] })).ok).toBe(false)
  })

  it('3: a press whose button the page renamed while allow answered presses nothing', async () => {
    const labels = ref(['Archive'])
    const pressedLabels: string[] = []
    const { agent } = await page(() => h(DialogRoot, { defaultOpen: true, modal: false }, () => [
      h(DialogTrigger, target, () => 'Open'),
      h(DialogPortal, () => h(DialogContent, () => [h(DialogTitle, () => 'Mail'), ...labels.value.map(label => h('button', { onClick: () => pressedLabels.push(label) }, label))])),
    ]), {
      allow: async (step) => {
        if (step.action === 'press') {
          labels.value = ['Delete']
          await settle()
        }
        return true
      },
    })
    const result = await agent.act({ steps: [{ ref: 'Mail', action: 'press', args: ['Archive'] }] })
    expect(result.error?.message).toContain('changed while the step waited')
    expect(pressedLabels).toEqual([])
  })

  it('4a: an argless press that closes a dialog is held to its marked buttons', async () => {
    const open = ref(true)
    const { agent } = await page(() => h(DialogRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => (open.value = value), 'modal': false }, () => [
      h(DialogTrigger, target, () => 'Open'),
      h(DialogPortal, () => h(DialogContent, () => [h(DialogTitle, () => 'Transfer'), h('button', { 'data-agent-confirm': CONFIRM }, 'Cancel transfer')])),
    ]))
    // An open dialog is named by its title.
    const result = await agent.act({ steps: [{ ref: 'Transfer', action: 'press' }] })
    expect(result.error?.message).toContain('Needs a person')
    expect(open.value).toBe(true)
  })

  it('5: a dialog\'s buttons never list a private select\'s trigger by what it shows', async () => {
    const model = ref('secret')
    const { agent } = await page(() => h(DialogRoot, { defaultOpen: true, modal: false }, () => [
      h(DialogTrigger, () => 'Open'),
      h(DialogPortal, () => h(DialogContent, () => [h(DialogTitle, () => 'Pay'), h(SelectRoot, v(model), () => [
        h(SelectTrigger, target, () => h(SelectValue)),
        h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () => ITEMS.map(([value, label]) => h(SelectItem, { value, 'data-agent-secret': '' }, () => h(SelectItemText, () => label)))))),
      ])])),
    ]))
    expect(json(agent.snapshot())).not.toContain(SECRET)
    expect((await agent.act({ steps: [{ ref: 'Pay', action: 'press', args: [SECRET] }] })).ok).toBe(false)
  })

  it('6: a private component offers only the actions whose outcome says nothing of it', async () => {
    const { agent } = await page(() => h('div', { 'data-agent-secret': '' }, [
      h(NumberFieldRoot, { defaultValue: 3, max: 5 }, () => [h(NumberFieldInput, { 'aria-label': 'Count' }), h(NumberFieldIncrement, () => '+')]),
      h(TagsInputRoot, { defaultValue: ['a'] }, () => [h(TagsInputInput, { 'aria-label': 'Tags' })]),
      h(AccordionRoot, { 'type': 'single', 'aria-label': 'Sections', 'defaultValue': 'one' }, () => ['one', 'two'].map(value => h(AccordionItem, { value }, () => [h(AccordionHeader, () => h(AccordionTrigger, () => value)), h(AccordionContent, () => value)]))),
    ]))
    const actions = Object.fromEntries(agent.snapshot().map(c => [c.label, c.actions]))
    expect(actions.Count).toEqual(['setValue', 'clear'])
    expect(actions.Tags).toEqual(['setValue', 'clear'])
    expect(actions.Sections).toEqual(['setValue'])
    for (const step of [{ ref: 'Count', action: 'increment' }, { ref: 'Tags', action: 'add', args: ['a'] }, { ref: 'Sections', action: 'close', args: ['one'] }])
      expect((await agent.act({ steps: [step] })).ok, step.action).toBe(false)
  })

  it('7: a destroyed bridge reads nothing, and takes its WebMCP tools back', async () => {
    const unregistered = vi.fn()
    const context = { registerTool: vi.fn(() => ({ unregister: unregistered })) };
    (document as { modelContext?: unknown }).modelContext = context
    try {
      const { agent } = await page(() => h('input', { 'aria-label': 'Name', 'value': 'Ada' }))
      const { registerTools } = await import('.')
      registerTools(agent, { allow: () => true })
      agent.destroy()
      expect(agent.snapshot()).toEqual([])
      expect(await agent.query({ text: 'Name' })).toEqual([])
      expect(await agent.act({ steps: [{ ref: 'Name', action: 'setValue', args: ['Eve'] }] })).toMatchObject({ ok: false })
      expect(unregistered).toHaveBeenCalledTimes(3)
    }
    finally {
      delete (document as { modelContext?: unknown }).modelContext
    }
  })

  it('8: two bridges take turns, and a step waiting when its bridge is destroyed commits nothing', async () => {
    const on = ref(false)
    let answer!: (yes: boolean) => void
    const first = createAgent({ allow: () => new Promise<boolean>(resolve => (answer = resolve)) })
    const second = createAgent()
    agents.push(first, second)
    mount(defineComponent({ render: () => h('div', { 'data-agent-confirm': CONFIRM }, h(SwitchRoot, { 'aria-label': 'Wire', ...v(on) })) }), { attachTo: document.body })
    await settle()
    const waiting = first.act({ steps: [{ ref: 'Wire', action: 'setChecked', args: [true] }] })
    let secondDone = false
    const queued = second.query({ text: 'Wire' }).then(() => (secondDone = true))
    await settle()
    expect(secondDone).toBe(false)
    first.destroy()
    answer(true)
    expect((await waiting).ok).toBe(false)
    await queued
    expect(on.value).toBe(false)
  })

  it('9: a pin input mounted before the bridge never shows its digits', async () => {
    mount(defineComponent({ render: () => h(PinInputRoot, { 'defaultValue': ['4', '2'], 'aria-label': 'Code' }, () => [0, 1].map(index => h(PinInputInput, { index }))) }), { attachTo: document.body })
    await settle()
    const agent = createAgent()
    agents.push(agent)
    const snapshot = agent.snapshot()
    expect(snapshot.filter(c => c.value === '4' || c.value === '2')).toEqual([])
  })
})

// Arguments of the wrong shape, for every family and every action it takes: none may write the model or
// leave the page unable to render. A single list never takes a list, a multiple list never a nested one,
// and an action that takes an item never runs without one.
function fuzzOf(family: Family, step: Omit<AgentStep, 'ref'>): { name: string, args: unknown[] }[] {
  const args = step.args ?? []
  const out = [
    { name: 'one value too many', args: [...(args.length ? args : ['x']), 'extra'] },
    { name: 'a nested list', args: [[['bravo']]] },
  ]
  if (!args.length)
    out.push({ name: 'a value it takes none of', args: ['bravo'] })
  else
    out.push({ name: 'no value', args: [] })
  if (step.action === 'setValue' && family.single)
    out.push({ name: 'a list for a single list', args: [['bravo']] })
  if (step.action === 'setValue' && family.single === 'strict')
    out.push({ name: 'nothing for a list that always holds one', args: [null] })
  if (step.action !== 'setValue' && args.length && typeof args[0] === 'string')
    out.push({ name: 'a list for one item', args: [['bravo']] })
  // Numbers no component can hold, from values and from text.
  if (step.action === 'setValue' && family.numeric) {
    for (const [name, value] of [['NaN', Number.NaN], ['Infinity', Number.POSITIVE_INFINITY], ['-Infinity', Number.NEGATIVE_INFINITY], ['"Infinity"', 'Infinity'], ['"-Infinity"', '-Infinity'], ['"1e999"', '1e999'], ['empty text', ''], ['blank text', ' '], ['"0x10"', '0x10'], ['huge text', '9'.repeat(400)], ['"NaN"', 'NaN']] as const)
      out.push({ name: `the number ${name}`, args: [value] })
  }
  // An item of a kind the list's items aren't, alone or among items it has: objects, booleans and numbers
  // for a list of text.
  const takesItems = typeof args[0] === 'string' || (Array.isArray(args[0]) && typeof args[0][0] === 'string')
  if (takesItems && !family.numeric && !family.name.startsWith('native input') && family.name !== 'native date' && family.name !== 'pin-input' && family.name !== 'menu') {
    for (const [name, odd] of [['an object', { x: 1 }], ['a boolean', true], ['a number', 5]] as const)
      out.push({ name: `${name} for an item`, args: [Array.isArray(args[0]) ? [args[0][0], odd] : odd] })
  }
  return out
}
const fuzzCases = families.flatMap(family => family.actions
  .filter(step => step.action !== 'press')
  .flatMap(step => fuzzOf(family, step).map(fuzz => ({ family, step, fuzz }))))

describe('argument fuzz', () => {
  it('covers every family and action', () => {
    expect(fuzzCases.length).toBeGreaterThan(100)
  })
  for (const { family, step, fuzz } of fuzzCases) {
    it(`${family.name} · ${step.action} · ${fuzz.name}`, async () => {
      const { agent, model, errors } = await build(family, placements.inline!, marks['no mark']!)
      const initial = json(model.value)
      const result = await agent.act({ steps: [{ ref: 'Target', action: step.action, args: fuzz.args }] })
      await settle()
      expect(result.ok, json(result)).toBe(false)
      expect(json(model.value)).toBe(initial)
      expect(errors).toEqual([])
      expect(document.querySelector('[data-placed]')).toBeTruthy()
      // It still works with the right arguments afterwards.
      expect(targetOf(agent.snapshot())).toBeTruthy()
    })
  }
})

describe('fifth review findings', () => {
  const page = async (render: () => VNode | VNode[], options: Parameters<typeof createAgent>[0] = {}) => {
    const agent = createAgent(options)
    agents.push(agent)
    const wrapper = mount(defineComponent({ render }), { attachTo: document.body })
    await settle()
    return { agent, wrapper }
  }
  const marked = (value: string) => (value === 'bravo' ? { 'data-agent-confirm': CONFIRM } : {})
  const combobox = (model: Ref<any>, multiple: boolean) => h(ComboboxRoot, { ...v(model), multiple }, () => [
    h(ComboboxAnchor, () => h(ComboboxInput, target)),
    h(ComboboxContent, () => h(ComboboxViewport, () => ITEMS.map(([value, label]) => h(ComboboxItem, { value, ...marked(value) }, () => label)))),
  ])

  it('1a: a combobox filter that leaves out a marked chosen item still asks before it is taken out', async () => {
    const model = ref<string[]>(['bravo'])
    const { agent } = await page(() => combobox(model, true))
    // The agent opens the list once and sees every item and its mark.
    await agent.act({ steps: [{ ref: 'Target', action: 'setOpen', args: [true] }] })
    await agent.act({ steps: [{ ref: 'Target', action: 'setOpen', args: [false] }] })
    await agent.act({ steps: [{ ref: 'Target', action: 'setQuery', args: ['alp'] }] })
    await settle()
    for (const step of [{ action: 'setValue', args: [['alpha']] }, { action: 'clear' }]) {
      const result = await agent.act({ steps: [{ ref: 'Target', ...step }] })
      expect(result.error?.message, step.action).toContain('Needs a person')
      expect(model.value).toEqual(['bravo'])
    }
  })

  it('1b: a single combobox replacing a marked chosen item its filter left out asks first', async () => {
    const model = ref('bravo')
    const { agent } = await page(() => combobox(model, false))
    await agent.act({ steps: [{ ref: 'Target', action: 'setOpen', args: [true] }] })
    await agent.act({ steps: [{ ref: 'Target', action: 'setOpen', args: [false] }] })
    await agent.act({ steps: [{ ref: 'Target', action: 'setQuery', args: ['alp'] }] })
    await settle()
    const result = await agent.act({ steps: [{ ref: 'Target', action: 'setValue', args: ['alpha'] }] })
    expect(result.error?.message).toContain('Needs a person')
    expect(model.value).toBe('bravo')
  })

  it('1c: a chosen item a filter has kept off the page from the start stops the change', async () => {
    const model = ref<string[]>(['bravo'])
    const query = ref('alp')
    const { agent } = await page(() => h(ListboxRoot, { ...target, ...v(model), multiple: true }, () => h(ListboxContent, () => ITEMS.filter(([, label]) => label.toLowerCase().includes(query.value)).map(([value, label]) => h(ListboxItem, { value, ...marked(value) }, () => label)))))
    const result = await agent.act({ steps: [{ ref: 'Target', action: 'setValue', args: [['alpha']] }] })
    expect(result.error?.message).toContain('needs the list unfiltered')
    expect(model.value).toEqual(['bravo'])
    // With the filter cleared the item shows, and the change asks about its mark.
    query.value = ''
    await settle()
    expect((await agent.act({ steps: [{ ref: 'Target', action: 'setValue', args: [['alpha']] }] })).error?.message).toContain('Needs a person')
  })

  it('2: arguments of the wrong shape write nothing', async () => {
    const tab = ref('alpha')
    const radio = ref('alpha')
    const section = ref('alpha')
    const toggles = ref<string[]>(['alpha'])
    const tags = ref<string[]>(['alpha'])
    const { agent } = await page(() => [
      h(TabsRoot, v(tab), () => h(TabsList, { 'aria-label': 'Tabs' }, () => ITEMS.map(([value, label]) => h(TabsTrigger, { value }, () => label)))),
      h(RadioGroupRoot, { 'aria-label': 'Radios', ...v(radio) }, () => ITEMS.map(([value, label]) => h(RadioGroupItem, { value }, () => label))),
      h(AccordionRoot, { 'aria-label': 'Sections', ...v(section), 'type': 'single' }, () => ITEMS.map(([value, label]) => h(AccordionItem, { value }, () => [h(AccordionHeader, () => h(AccordionTrigger, () => label)), h(AccordionContent, () => label)]))),
      h(ToggleGroupRoot, { 'aria-label': 'Toggles', ...v(toggles), 'type': 'multiple' }, () => ITEMS.map(([value, label]) => h(ToggleGroupItem, { value }, () => label))),
      h(TagsInputRoot, v(tags), () => [h(TagsInputInput, { 'aria-label': 'Tags' })]),
    ])
    const before = json([tab.value, radio.value, section.value, toggles.value, tags.value])
    const steps: AgentStep[] = [
      { ref: 'Tabs', action: 'setValue', args: [['bravo']] },
      { ref: 'Tabs', action: 'setValue', args: [null] },
      { ref: 'Radios', action: 'setValue', args: [['bravo']] },
      { ref: 'Sections', action: 'setValue', args: [['bravo']] },
      { ref: 'Toggles', action: 'toggle', args: [['bravo']] },
      { ref: 'Tags', action: 'add' },
      { ref: 'Tags', action: 'add', args: [['x']] },
    ]
    for (const step of steps)
      expect((await agent.act({ steps: [step] })).ok, json(step)).toBe(false)
    expect(json([tab.value, radio.value, section.value, toggles.value, tags.value])).toBe(before)
  })

  it('3: allow is told the whole text of the button a press resolves to, and an exact match wins', async () => {
    const seen: unknown[] = []
    const presses: string[] = []
    const { agent } = await page(() => h(DialogRoot, { defaultOpen: true, modal: false }, () => [
      h(DialogTrigger, () => 'Open'),
      h(DialogPortal, () => h(DialogContent, () => [h(DialogTitle, () => 'Plan'), h('button', { onClick: () => presses.push('long') }, 'Cancel my subscription')])),
    ]), { allow: (step) => {
      seen.push(step.args)
      return step.args?.[0] !== 'Cancel my subscription'
    } })
    const result = await agent.act({ steps: [{ ref: 'Plan', action: 'press', args: ['Cancel'] }] })
    expect(result.ok).toBe(false)
    expect(seen).toContainEqual(['Cancel my subscription'])
    expect(presses).toEqual([])
  })

  it('4: an item hidden with `hidden` or `aria-hidden` is neither listed nor picked', async () => {
    const tab = ref('alpha')
    const { agent } = await page(() => h(TabsRoot, v(tab), () => h(TabsList, { 'aria-label': 'Tabs' }, () => ITEMS.map(([value, label]) => h(TabsTrigger, { value, ...(value === 'bravo' ? { hidden: '' } : value === 'secret' ? { 'aria-hidden': 'true' } : {}) }, () => label)))))
    expect(json(agent.snapshot())).not.toMatch(/Bravo|ZQXSECRET/)
    expect((await agent.act({ steps: [{ ref: 'Tabs', action: 'setValue', args: ['bravo'] }] })).ok).toBe(false)
    expect(tab.value).toBe('alpha')
  })

  it('5a: marks on a closed select\'s content apply to its items', async () => {
    const model = ref('alpha')
    const { agent } = await page(() => h(SelectRoot, v(model), () => [
      h(SelectTrigger, target, () => h(SelectValue)),
      h(SelectPortal, () => h(SelectContent, { 'data-agent-confirm': CONFIRM }, () => h(SelectViewport, () => ITEMS.map(([value, label]) => h(SelectItem, { value }, () => h(SelectItemText, () => label)))))),
    ]))
    expect((await agent.act({ steps: [{ ref: 'Target', action: 'setValue', args: ['bravo'] }] })).error?.message).toContain('Needs a person')
    expect(model.value).toBe('alpha')
  })

  it('5b: a secret mark on a combobox\'s content or on a native option makes the list private', async () => {
    const model = ref<string[]>([])
    const pick = ref('alpha')
    const { agent } = await page(() => [
      h(ComboboxRoot, { ...v(model), multiple: true }, () => [
        h(ComboboxAnchor, () => h(ComboboxInput, target)),
        h(ComboboxContent, { 'data-agent-secret': '' }, () => h(ComboboxViewport, () => ITEMS.map(([value, label]) => h(ComboboxItem, { value }, () => label)))),
      ]),
      h('select', { 'aria-label': 'Native', 'value': pick.value }, ITEMS.map(([value, label]) => h('option', { value, ...(value === 'secret' ? { 'data-agent-secret': '' } : {}) }, label))),
    ])
    // The combobox reads its content's marks once its items have rendered.
    await agent.act({ steps: [{ ref: 'Target', action: 'setOpen', args: [true] }] })
    await agent.act({ steps: [{ ref: 'Target', action: 'setOpen', args: [false] }] })
    const snapshot = agent.snapshot()
    expect(json(snapshot)).not.toContain(SECRET)
    expect(targetOf(snapshot)?.actions).not.toContain('setQuery')
    expect(snapshot.find(c => c.label === 'Native')?.items?.every(item => item.label === '[redacted]')).toBe(true)
  })

  it('6: a hidden or private chosen item\'s label never leaks through what the select\'s trigger shows', async () => {
    const model = ref('secret')
    const { agent } = await page(() => h('div', [h(DialogRoot, { defaultOpen: true }, () => [
      h(DialogTrigger, () => 'Open'),
      h(DialogPortal, () => h(DialogContent, () => [h(DialogTitle, () => 'Pay'), h('ul', h('li', [
        h(SelectRoot, v(model), () => [
          h(SelectTrigger, { 'aria-label': 'Account' }, () => h(SelectValue)),
          h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () => ITEMS.map(([value, label]) => h(SelectItem, { value, ...(value === 'secret' ? { 'data-agent-hidden': '' } : {}) }, () => h(SelectItemText, () => label)))))),
        ]),
        h(SwitchRoot, { 'aria-label': 'Wire' }),
      ])), h('button', 'OK')])),
    ]), h('button', 'Behind')]))
    const outputs = [agent.snapshot(), await agent.query({ text: SECRET }), await agent.query({ text: 'Wire' })]
    // A step on a name that isn't there lists the open modal's buttons.
    const behind = await agent.act({ steps: [{ ref: 'Nowhere', action: 'press' }] })
    expect(behind.error?.message).toContain('open over the rest of the page')
    outputs.push(behind)
    expect(json(outputs)).not.toContain(SECRET)
    expect(await agent.query({ text: SECRET })).toEqual([])
  })

  it('note: ids with selector characters, newlines included, are compared, not put in a selector', async () => {
    const { agent } = await page(() => [
      h('label', { for: 'a\nb"]' }, 'Odd'),
      h('input', { id: 'a\nb"]', value: 'x' }),
    ])
    expect(() => agent.snapshot()).not.toThrow()
    expect(agent.snapshot().find(c => c.label === 'Odd')).toBeTruthy()
    expect((await agent.act({ steps: [{ ref: 'Odd', action: 'setValue', args: ['y'] }] })).ok).toBe(true)
    expect(await agent.query({ text: 'Odd' })).toHaveLength(1)
  })

  it('note: a multiple list keeps a hidden chosen item through a change that doesn\'t touch it', async () => {
    const model = ref<string[]>(['secret', 'alpha'])
    const { agent } = await page(() => h(ListboxRoot, { ...target, ...v(model), multiple: true }, () => h(ListboxContent, () => ITEMS.map(([value, label]) => h(ListboxItem, { value, ...(value === 'secret' ? { 'data-agent-hidden': '' } : {}) }, () => label)))))
    expect(targetOf(agent.snapshot())?.value).toEqual(['alpha'])
    const result = await agent.act({ steps: [{ ref: 'Target', action: 'setValue', args: [['bravo']] }] })
    expect(result.error).toBeUndefined()
    expect([...model.value].sort()).toEqual(['bravo', 'secret'])
    expect(json(result)).not.toContain('secret')
  })
})

describe('sixth review findings', () => {
  const page = async (render: () => VNode | VNode[], options: Parameters<typeof createAgent>[0] = {}) => {
    const agent = createAgent(options)
    agents.push(agent)
    const wrapper = mount(defineComponent({ render }), { attachTo: document.body })
    await settle()
    return { agent, wrapper }
  }

  it('1: no number field, slider or native number takes a number it can\'t hold', async () => {
    const count = ref(3)
    const level = ref([40])
    const amount = ref(5)
    const { agent } = await page(() => [
      h(NumberFieldRoot, v(count), () => h(NumberFieldInput, { 'aria-label': 'Count' })),
      h(SliderRoot, { ...v(level), 'aria-label': 'Level' }, () => [h(SliderTrack, () => h(SliderRange)), h(SliderThumb, { 'aria-label': 'Level' })]),
      h('input', { 'aria-label': 'Amount', 'type': 'number', 'value': amount.value, 'onInput': (e: Event) => (amount.value = (e.target as HTMLInputElement).valueAsNumber) }),
    ])
    for (const [ref, value] of [['Count', 'Infinity'], ['Count', '1e999'], ['Count', '0x10'], ['Level', '-Infinity'], ['Amount', 'Infinity'], ['Amount', ' ']] as const)
      expect((await agent.act({ steps: [{ ref, action: 'setValue', args: [value] }] })).ok, `${ref} ${value}`).toBe(false)
    expect([count.value, level.value, amount.value]).toEqual([3, [40], 5])
  })

  it('2: a TagsInput takes only text tags', async () => {
    const tags = ref(['a'])
    const { agent } = await page(() => h(TagsInputRoot, v(tags), () => [h(TagsInputInput, { 'aria-label': 'Tags' })]))
    for (const step of [{ action: 'setValue', args: [['a', { x: 1 }]] }, { action: 'setValue', args: [['a', true]] }, { action: 'add', args: [5] }])
      expect((await agent.act({ steps: [{ ref: 'Tags', ...step }] })).ok, json(step)).toBe(false)
    expect(tags.value).toEqual(['a'])
  })

  it('3: clearing a multiple Combobox keeps its hidden chosen item', async () => {
    const model = ref<string[]>(['secret', 'alpha'])
    const { agent } = await page(() => h(ComboboxRoot, { ...v(model), multiple: true }, () => [
      h(ComboboxAnchor, () => h(ComboboxInput, target)),
      h(ComboboxContent, () => h(ComboboxViewport, () => ITEMS.map(([value, label]) => h(ComboboxItem, { value, ...(value === 'secret' ? { 'data-agent-hidden': '' } : {}) }, () => label)))),
    ]))
    const result = await agent.act({ steps: [{ ref: 'Target', action: 'clear' }] })
    expect(result.error).toBeUndefined()
    expect(model.value).toEqual(['secret'])
  })

  it('4: marks around a shadow host cover an app mounted in its shadow root', async () => {
    for (const mark of ['data-agent-hidden', 'data-agent-secret', 'data-agent-confirm']) {
      const outer = document.createElement('div')
      outer.setAttribute(mark, mark === 'data-agent-confirm' ? CONFIRM : '')
      const host = document.createElement('div')
      outer.append(host)
      document.body.append(outer)
      const root = host.attachShadow({ mode: 'open' })
      const mountPoint = document.createElement('div')
      root.append(mountPoint)
      const on = ref(true)
      const agent = createAgent()
      agents.push(agent)
      const app = mount(defineComponent({ render: () => [h(SwitchRoot, { 'aria-label': 'Wire', ...v(on) }), h('input', { 'aria-label': 'Note', 'value': SECRET })] }), { attachTo: mountPoint })
      await settle()
      const snapshot = agent.snapshot()
      const result = await agent.act({ steps: [{ ref: 'Wire', action: 'setChecked', args: [false] }] })
      if (mark === 'data-agent-hidden')
        expect(snapshot.filter(c => c.label === 'Wire' || c.label === 'Note'), mark).toEqual([])
      if (mark === 'data-agent-secret')
        expect(json(snapshot), mark).not.toContain(SECRET)
      if (mark !== 'data-agent-secret')
        expect(result.ok, mark).toBe(false)
      if (mark === 'data-agent-confirm')
        expect(result.error?.message).toContain('Needs a person')
      expect(on.value === false, mark).toBe(mark === 'data-agent-secret')
      app.unmount()
      agent.destroy()
      outer.remove()
    }
    // Unmarked, the app's native fields are found in its shadow root.
    const host = document.createElement('div')
    document.body.append(host)
    const mountPoint = document.createElement('div')
    host.attachShadow({ mode: 'open' }).append(mountPoint)
    const agent = createAgent()
    agents.push(agent)
    mount(defineComponent({ render: () => [h(SwitchRoot, { 'aria-label': 'Wire' }), h('input', { 'aria-label': 'Note', 'value': 'x' })] }), { attachTo: mountPoint })
    await settle()
    expect(agent.snapshot().find(c => c.label === 'Note')).toMatchObject({ value: 'x' })
    host.remove()
  })

  it('5: a section the app hid stays hidden when a modal hides everything else', async () => {
    const { hideOthers } = await import('aria-hidden')
    const { agentRegistrar } = await import('@/shared/useAgentRegistration')
    const { agent } = await page(() => h('div', [
      h('section', { 'aria-hidden': 'true' }, [h(SwitchRoot, { 'aria-label': 'Hidden wire' })]),
      h('div', { id: 'modal' }, h('button', 'Modal')),
    ]))
    // What a modal does: the bridge hears it first, then the rest of the page is hidden from screen readers.
    agentRegistrar.hiding?.()
    const undo = hideOthers(document.getElementById('modal')!)
    try {
      expect(document.querySelector('section')!.hasAttribute('data-aria-hidden')).toBe(true)
      expect(json(agent.snapshot())).not.toContain('Hidden wire')
    }
    finally {
      undo()
    }
  })

  it('note: text a CSS rule or v-show hides is never read into a row', async () => {
    const { agent } = await page(() => h('ul', h('li', [h('span', { style: { display: 'none' } }, NEARBY), 'Shown', h(SwitchRoot, { 'aria-label': 'Wire' })])))
    const wire = agent.snapshot().find(c => c.label === 'Wire')
    expect(wire?.row).toBe('Shown')
    expect(json(await agent.query({ text: NEARBY }))).not.toContain('Wire')
  })

  it('note: press "" presses no unnamed button', async () => {
    const pressedIcon = vi.fn()
    const { agent } = await page(() => h(DialogRoot, { defaultOpen: true, modal: false }, () => [
      h(DialogTrigger, () => 'Open'),
      h(DialogPortal, () => h(DialogContent, () => [h(DialogTitle, () => 'Tools'), h('button', { onClick: pressedIcon }, h('svg'))])),
    ]))
    expect((await agent.act({ steps: [{ ref: 'Tools', action: 'press', args: [''] }] })).ok).toBe(false)
    expect((await agent.act({ steps: [{ ref: 'Tools', action: 'press', args: [5] }] })).ok).toBe(false)
    expect(pressedIcon).not.toHaveBeenCalled()
  })

  it('note: a password stays private after a show toggle or a swap to a text field', async () => {
    const shown = ref(false)
    const swapped = ref(false)
    const { agent } = await page(() => [
      h('input', { 'aria-label': 'Password', 'type': shown.value ? 'text' : 'password', 'value': SECRET }),
      swapped.value
        // Keyed apart, so the swap renders a new element, as a \`v-if\` between two fields does.
        ? h('input', { 'key': 'text', 'aria-label': 'PIN', 'id': 'pin', 'type': 'text', 'value': SECRET })
        : h('input', { 'key': 'password', 'aria-label': 'PIN', 'id': 'pin', 'type': 'password', 'value': SECRET }),
    ])
    expect(json(agent.snapshot())).not.toContain(SECRET)
    shown.value = true
    swapped.value = true
    await settle()
    expect(json(agent.snapshot())).not.toContain(SECRET)
  })

  it('note: a native radio group spanning an open modal picks no radio behind it', async () => {
    const picked = ref('inside')
    const { agent } = await page(() => [
      h('label', [h('input', { type: 'radio', name: 'plan', value: 'behind', checked: picked.value === 'behind', onChange: () => (picked.value = 'behind') }), 'Behind']),
      h(DialogRoot, { defaultOpen: true }, () => h(DialogPortal, () => h(DialogContent, () => [
        h(DialogTitle, () => 'Plan'),
        h('label', [h('input', { type: 'radio', name: 'plan', value: 'inside', checked: picked.value === 'inside', onChange: () => (picked.value = 'inside') }), 'Inside']),
      ]))),
    ])
    const group = agent.snapshot().find(c => c.component === 'radio-group')
    expect(group).toBeTruthy()
    expect((await agent.act({ steps: [{ ref: group!.ref, action: 'setValue', args: ['behind'] }] })).ok).toBe(false)
    expect(picked.value).toBe('inside')
  })

  it('note: a date, color or range field keeps its value when it won\'t take one, and maxlength holds', async () => {
    const heard: string[] = []
    const { agent } = await page(() => [
      h('input', { 'aria-label': 'Day', 'type': 'date', 'value': '2024-01-01', 'onInput': (e: Event) => heard.push((e.target as HTMLInputElement).value) }),
      h('input', { 'aria-label': 'Code', 'maxlength': 3, 'value': 'abc', 'onInput': (e: Event) => heard.push((e.target as HTMLInputElement).value) }),
    ])
    expect((await agent.act({ steps: [{ ref: 'Day', action: 'setValue', args: ['tomorrow'] }] })).ok).toBe(false)
    expect((document.querySelector('[aria-label=Day]') as HTMLInputElement).value).toBe('2024-01-01')
    expect((await agent.act({ steps: [{ ref: 'Code', action: 'setValue', args: ['abcd'] }] })).ok).toBe(false)
    expect((document.querySelector('[aria-label=Code]') as HTMLInputElement).value).toBe('abc')
    expect(heard).toEqual([])
  })

  it('note: closing a dialog with a hidden button in it goes ahead, since closing presses none', async () => {
    const open = ref(true)
    const { agent } = await page(() => h(DialogRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => (open.value = value), 'modal': false }, () => [
      h(DialogTrigger, () => 'Open'),
      h(DialogPortal, () => h(DialogContent, () => [h(DialogTitle, () => 'Doc'), h('button', { 'data-agent-hidden': '' }, 'Delete')])),
    ]))
    expect((await agent.act({ steps: [{ ref: 'Doc', action: 'setOpen', args: [false] }] })).ok).toBe(true)
    expect(open.value).toBe(false)
  })
})
