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
const CONFIRM = 'Changes something that matters.'
type Attrs = Record<string, unknown>

/** The marks a family's fixture places on its own parts. */
interface Marks {
  /** On the item an action picks or takes out, `bravo`. */
  item: (value: string) => Attrs
  /** On the control an action stands for, like the increment button. */
  part: Attrs
  disabled: boolean
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
  /** No `disabled` prop to set. */
  noDisabledProp?: boolean
  /** Changes it the way the app would, for `subscribe`. */
  poke?: (model: Ref<any>) => void
  /** Always private, so a secret mark changes nothing. */
  alwaysSecret?: boolean
  /** Whether a step changed it, from its model, or a spy. */
  changed?: (model: Ref<any>, initial: unknown) => boolean
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
  },
  {
    name: 'native radio',
    initial: () => 'secret',
    render: (m, model) => h('fieldset', target, ITEMS.map(([value, label]) => h('label', [h('input', { type: 'radio', name: 'contract', value, checked: model.value === value, disabled: m.disabled, onChange: () => (model.value = value), ...m.item(value) }), label]))),
    actions: [{ action: 'setValue', args: ['bravo'] }],
    itemStep: { action: 'setValue', args: ['bravo'] },
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
  },
  {
    name: 'select',
    initial: () => 'secret',
    render: (m, model) => h(SelectRoot, { ...v(model), disabled: m.disabled }, () => [
      h(SelectTrigger, target, () => h(SelectValue)),
      h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () => ITEMS.map(([value, label]) => h(SelectItem, { value, ...m.item(value) }, () => h(SelectItemText, () => label)))))),
    ]),
    actions: [{ action: 'setValue', args: ['bravo'] }, { action: 'setOpen', args: [true] }],
    itemStep: { action: 'setValue', args: ['bravo'] },
  },
  {
    name: 'combobox',
    initial: () => ['secret'],
    render: (m, model) => h(ComboboxRoot, { ...v(model), multiple: true, disabled: m.disabled }, () => [
      h(ComboboxAnchor, () => [h(ComboboxInput, target), h(ComboboxCancel, m.part, () => 'Clear')]),
      h(ComboboxContent, () => h(ComboboxViewport, () => ITEMS.map(([value, label]) => h(ComboboxItem, { value, ...m.item(value) }, () => label)))),
    ]),
    actions: [{ action: 'setValue', args: [['secret', 'bravo']] }, { action: 'setOpen', args: [true] }, { action: 'setQuery', args: ['a'] }, { action: 'clear' }],
    itemStep: { action: 'setValue', args: [['secret', 'bravo']] },
    partStep: { action: 'clear' },
  },
  {
    name: 'listbox',
    initial: () => 'secret',
    render: (m, model) => h(ListboxRoot, { ...target, ...v(model), disabled: m.disabled }, () => h(ListboxContent, () => ITEMS.map(([value, label]) => h(ListboxItem, { value, ...m.item(value) }, () => label)))),
    actions: [{ action: 'setValue', args: ['bravo'] }],
    itemStep: { action: 'setValue', args: ['bravo'] },
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
  },
  {
    name: 'toggle-group',
    initial: () => 'secret',
    render: (m, model) => h(ToggleGroupRoot, { ...target, ...v(model), type: 'single', disabled: m.disabled }, () => ITEMS.map(([value, label]) => h(ToggleGroupItem, { value, ...m.item(value) }, () => label))),
    actions: [{ action: 'setValue', args: ['bravo'] }, { action: 'toggle', args: ['bravo'] }],
    itemStep: { action: 'setValue', args: ['bravo'] },
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
    poke: model => (model.value = [60]),
  },
  {
    name: 'number-field',
    initial: () => 4242,
    render: (m, model) => h(NumberFieldRoot, { ...v(model), disabled: m.disabled }, () => [
      h(NumberFieldDecrement, () => '-'),
      h(NumberFieldInput, target),
      h(NumberFieldIncrement, m.part, () => '+'),
    ]),
    actions: [{ action: 'setValue', args: [5] }, { action: 'increment' }, { action: 'decrement' }, { action: 'clear' }],
    partStep: { action: 'increment' },
    poke: model => (model.value = 7),
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
const placements: Record<string, Wrap> = {
  'inline': inner => h('div', inner()),
  'portal': inner => h(PopoverRoot, { defaultOpen: true }, () => [h(PopoverTrigger, () => 'Holder'), h(PopoverPortal, () => h(PopoverContent, inner))]),
  'nested portal': inner => h(DialogRoot, { defaultOpen: true, modal: false }, () => h(DialogPortal, () => h(DialogContent, () => [
    h(DialogTitle, () => 'Shell'),
    placements.portal!(inner),
  ]))),
}

type Expect = 'hidden' | 'secret' | 'confirm' | 'disabled' | 'item-hidden' | 'none'
interface Mark {
  expect: Expect
  /** Around the whole placement, outside its portals. */
  ancestor?: Attrs
  /** Around the component, inside its placement. */
  around?: { tag?: string, attrs: Attrs }
  item?: Attrs
  part?: Attrs
  disabled?: boolean
  applies?: (family: Family) => boolean
}
const marks: Record<string, Mark> = {
  'no mark': { expect: 'none' },
  'hidden on component': { expect: 'hidden', around: { attrs: { 'data-agent-hidden': '' } } },
  'hidden on ancestor': { expect: 'hidden', ancestor: { 'data-agent-hidden': '' } },
  'aria-hidden on component': { expect: 'hidden', around: { attrs: { 'aria-hidden': 'true' } } },
  '[hidden] on component': { expect: 'hidden', around: { attrs: { hidden: '' } } },
  'hidden on item': { expect: 'item-hidden', item: { 'data-agent-hidden': '' }, applies: f => !!f.itemStep },
  'secret on component': { expect: 'secret', around: { attrs: { 'data-agent-secret': '' } } },
  'secret on ancestor': { expect: 'secret', ancestor: { 'data-agent-secret': '' } },
  'confirm on item': { expect: 'confirm', item: { 'data-agent-confirm': CONFIRM }, applies: f => !!f.itemStep },
  'confirm on part': { expect: 'confirm', part: { 'data-agent-confirm': CONFIRM }, applies: f => !!f.partStep },
  'disabled by prop': { expect: 'disabled', disabled: true, applies: f => !f.noDisabledProp },
  'disabled by fieldset': { expect: 'disabled', around: { tag: 'fieldset', attrs: { disabled: true } } },
  'disabled by inert': { expect: 'disabled', around: { attrs: { inert: '' } } },
}

let agents: Agent[] = []
afterEach(() => {
  agents.forEach(agent => agent.destroy())
  agents = []
  document.body.innerHTML = ''
  pressed.count = 0
})
enableAutoUnmount(afterEach)

// Popups mount their content a few ticks after they open, the first one on the page slowest.
async function settle() {
  for (let round = 0; round < 3; round++) {
    for (let tick = 0; tick < 4; tick++)
      await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}

async function build(family: Family, place: Wrap, mark: Mark, allow?: (step: any) => boolean) {
  const agent = createAgent(allow ? { allow } : {})
  agents.push(agent)
  const model = ref(family.initial())
  const m: Marks = {
    item: value => (value === 'bravo' && mark.item ? mark.item : {}),
    part: mark.part ?? {},
    disabled: !!mark.disabled,
  }
  const component = () => {
    const inner = family.render(m, model)
    return mark.around ? h(mark.around.tag ?? 'div', mark.around.attrs, [inner].flat()) : inner
  }
  const wrapper = mount(defineComponent({ render: () => h('div', mark.ancestor ?? {}, [place(component), h('button', 'Elsewhere')]) }), { attachTo: document.body })
  await settle()
  return { agent, model, wrapper }
}

const targetOf = (list: AgentComponent[]) => list.find(c => c.label === 'Target')
const json = (value: unknown) => JSON.stringify(value)

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
      const { agent, model, wrapper } = await build(family, place, mark)
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
