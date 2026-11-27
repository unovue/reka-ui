import type { VNode } from 'vue'
import type { Agent, AgentComponent } from '.'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '@/Accordion'
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle, AlertDialogTrigger } from '@/AlertDialog'
import { CheckboxRoot } from '@/Checkbox'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '@/Collapsible'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot, ComboboxViewport } from '@/Combobox'
import { DialogClose, DialogContent, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { ListboxContent, ListboxItem, ListboxRoot } from '@/Listbox'
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from '@/NumberField'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '@/Select'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '@/Slider'
import { SwitchRoot } from '@/Switch'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
import { TagsInputInput, TagsInputItem, TagsInputItemText, TagsInputRoot } from '@/TagsInput'
import { Toggle } from '@/Toggle'
import { ToggleGroupItem, ToggleGroupRoot } from '@/ToggleGroup'
import { createAgent } from '.'

let agent: Agent | undefined

// jsdom lacks ResizeObserver, which the slider measures its thumbs with.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

async function setup(render: () => VNode | VNode[]) {
  agent = createAgent()
  const wrapper = mount(defineComponent({ render }), { attachTo: document.body })
  await nextTick()
  await nextTick()
  return { agent, wrapper }
}

const byKind = (components: AgentComponent[], kind: string) => components.find(component => component.component === kind)!

afterEach(() => {
  agent?.destroy()
  agent = undefined
  document.body.innerHTML = ''
})

const fruits = ['Apple', 'Banana', 'Cherry']

describe('form controls', () => {
  it('checkbox: reads checked and sets it through its click handler', async () => {
    const { agent, wrapper } = await setup(() => h(CheckboxRoot, { 'aria-label': 'Accept terms' }))
    expect(byKind(agent.snapshot(), 'checkbox')).toEqual({ ref: expect.any(String), component: 'checkbox', label: 'Accept terms', checked: false, actions: ['setChecked', 'toggle'] })
    const result = await agent.act({ steps: [{ ref: 'Accept terms', action: 'setChecked', args: [true] }] })
    expect(result.ok).toBe(true)
    expect(wrapper.findComponent(CheckboxRoot).emitted('update:modelValue')).toEqual([[true]])
    expect(result.values).toMatchObject({ [`${result.steps[0]!.ref} Accept terms`]: true })
  })

  it('switch: refuses a value that is not a boolean', async () => {
    const { agent, wrapper } = await setup(() => h(SwitchRoot, { 'aria-label': 'Wi-Fi' }))
    expect(byKind(agent.snapshot(), 'switch')).toMatchObject({ label: 'Wi-Fi', checked: false, actions: ['setChecked', 'toggle'] })
    const refused = await agent.act({ steps: [{ ref: 'Wi-Fi', action: 'setChecked', args: ['yes'] }] })
    expect(refused.error?.message).toContain('takes true or false')
    await agent.act({ steps: [{ ref: 'wifi', action: 'toggle' }] }).then(r => expect(r.ok).toBe(false))
    expect((await agent.act({ steps: [{ ref: 'Wi-Fi', action: 'toggle' }] })).ok).toBe(true)
    expect(wrapper.findComponent(SwitchRoot).emitted('update:modelValue')).toEqual([[true]])
  })

  it('toggle: setPressed', async () => {
    const { agent, wrapper } = await setup(() => h(Toggle, { 'aria-label': 'Bold' }, () => 'B'))
    expect(byKind(agent.snapshot(), 'toggle')).toMatchObject({ label: 'Bold', pressed: false, actions: ['setPressed', 'toggle'] })
    expect((await agent.act({ steps: [{ ref: 'Bold', action: 'setPressed', args: [true] }] })).ok).toBe(true)
    expect(wrapper.findComponent(Toggle).emitted('update:modelValue')).toEqual([[true]])
  })

  it('radio-group: lists its items and takes a label', async () => {
    const { agent, wrapper } = await setup(() => h(RadioGroupRoot, { 'aria-label': 'Plan', 'defaultValue': 'free' }, () => [
      h(RadioGroupItem, { value: 'free' }, () => 'Free'),
      h(RadioGroupItem, { value: 'pro' }, () => 'Pro'),
      h(RadioGroupItem, { value: 'team', disabled: true }, () => 'Team'),
    ]))
    expect(byKind(agent.snapshot(), 'radio-group')).toMatchObject({
      label: 'Plan',
      value: 'free',
      items: [{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }, { value: 'team', label: 'Team' }],
      actions: ['setValue'],
    })
    expect((await agent.act({ steps: [{ ref: 'Plan', action: 'setValue', args: ['Pro'] }] })).ok).toBe(true)
    expect(wrapper.findComponent(RadioGroupRoot).emitted('update:modelValue')).toEqual([['pro']])
    const disabled = await agent.act({ steps: [{ ref: 'Plan', action: 'setValue', args: ['Team'] }] })
    expect(disabled.error?.message).toContain('"Team" in Plan')
    const unknown = await agent.act({ steps: [{ ref: 'Plan', action: 'setValue', args: ['Enterprise'] }] })
    expect(unknown.error?.message).toContain('No item "Enterprise" in Plan')
  })

  it('toggle-group: single value by label', async () => {
    const { agent, wrapper } = await setup(() => h(ToggleGroupRoot, { 'aria-label': 'Align', 'type': 'single' }, () => ['left', 'center', 'right'].map(value => h(ToggleGroupItem, { value }, () => value[0]!.toUpperCase() + value.slice(1)))))
    expect(byKind(agent.snapshot(), 'toggle-group')).toMatchObject({ label: 'Align', value: null, items: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] })
    expect((await agent.act({ steps: [{ ref: 'Align', action: 'setValue', args: ['Center'] }] })).ok).toBe(true)
    expect(wrapper.findComponent(ToggleGroupRoot).emitted('update:modelValue')).toEqual([['center']])
  })

  it('slider: sets a number, refuses one out of range or off its steps', async () => {
    const { agent, wrapper } = await setup(() => h(SliderRoot, { 'aria-label': 'Volume', 'defaultValue': [50], 'step': 5 }, () => [
      h(SliderTrack, () => h(SliderRange)),
      h(SliderThumb, { 'aria-label': 'Volume' }),
    ]))
    expect(byKind(agent.snapshot(), 'slider')).toMatchObject({ label: 'Volume', value: 50, min: 0, max: 100, step: 5, actions: ['setValue', 'increment', 'decrement'] })
    expect((await agent.act({ steps: [{ ref: 'Volume', action: 'setValue', args: ['75'] }] })).ok).toBe(true)
    const slider = wrapper.findComponent(SliderRoot)
    expect(slider.emitted('update:modelValue')).toEqual([[[75]]])
    expect(slider.emitted('valueCommit')).toEqual([[[75]]])
    expect((await agent.act({ steps: [{ ref: 'Volume', action: 'setValue', args: [150] }] })).error?.message).toContain('from 0 to 100, not 150')
    expect((await agent.act({ steps: [{ ref: 'Volume', action: 'setValue', args: [72] }] })).error?.message).toContain('moves in steps of 5')
    expect((await agent.act({ steps: [{ ref: 'Volume', action: 'increment' }] })).ok).toBe(true)
    expect(slider.emitted('update:modelValue')!.at(-1)).toEqual([[75]])
  })

  it('number-field: setValue, increment, and refuses out of range', async () => {
    const { agent, wrapper } = await setup(() => h(NumberFieldRoot, { defaultValue: 2, min: 0, max: 10 }, () => [
      h(NumberFieldDecrement, () => '-'),
      h(NumberFieldInput, { 'aria-label': 'Quantity' }),
      h(NumberFieldIncrement, () => '+'),
    ]))
    const snapshot = agent.snapshot()
    expect(byKind(snapshot, 'number-field')).toMatchObject({ label: 'Quantity', value: 2, min: 0, max: 10, actions: ['setValue', 'increment', 'decrement', 'clear'] })
    // Its stepper buttons are its own, not buttons of the page.
    expect(snapshot.filter(component => component.component === 'button')).toEqual([])
    expect((await agent.act({ steps: [{ ref: 'Quantity', action: 'setValue', args: [7] }, { ref: 'Quantity', action: 'increment' }] })).ok).toBe(true)
    expect(wrapper.findComponent(NumberFieldRoot).emitted('update:modelValue')).toEqual([[7], [8]])
    expect((await agent.act({ steps: [{ ref: 'Quantity', action: 'setValue', args: [11] }] })).error?.message).toContain('from 0 to 10, not 11')
  })

  it('tags-input: add, remove and setValue', async () => {
    const { agent, wrapper } = await setup(() => h(TagsInputRoot, { defaultValue: ['vue'] }, {
      default: ({ modelValue }: { modelValue: string[] }) => [
        ...modelValue.map(tag => h(TagsInputItem, { key: tag, value: tag }, () => h(TagsInputItemText))),
        h(TagsInputInput, { 'aria-label': 'Tags' }),
      ],
    }))
    expect(byKind(agent.snapshot(), 'tags-input')).toMatchObject({ label: 'Tags', value: ['vue'], actions: ['setValue', 'add', 'remove', 'clear'] })
    expect((await agent.act({ steps: [{ ref: 'Tags', action: 'add', args: ['nuxt'] }, { ref: 'Tags', action: 'remove', args: ['vue'] }] })).ok).toBe(true)
    expect(wrapper.findComponent(TagsInputRoot).emitted('update:modelValue')).toEqual([[['vue', 'nuxt']], [['nuxt']]])
    expect((await agent.act({ steps: [{ ref: 'Tags', action: 'setValue', args: [['a', 'b']] }] })).ok).toBe(true)
    expect(wrapper.findComponent(TagsInputRoot).emitted('update:modelValue')!.at(-1)).toEqual([['a', 'b']])
  })
})

describe('lists', () => {
  const select = () => h(SelectRoot, { defaultValue: 'apple' }, () => [
    h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue)),
    h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () => fruits.map(fruit => h(SelectItem, { value: fruit.toLowerCase() }, () => h(SelectItemText, () => fruit)))))),
  ])

  it('select: knows its items while closed and sets one by label', async () => {
    const { agent, wrapper } = await setup(select)
    expect(byKind(agent.snapshot(), 'select')).toMatchObject({
      label: 'Fruit',
      value: 'apple',
      open: false,
      items: [{ value: 'apple', label: 'Apple' }, { value: 'banana', label: 'Banana' }, { value: 'cherry', label: 'Cherry' }],
      actions: ['setValue', 'setOpen'],
    })
    expect((await agent.act({ steps: [{ ref: 'Fruit', action: 'setValue', args: ['Banana'] }] })).ok).toBe(true)
    expect(wrapper.findComponent(SelectRoot).emitted('update:modelValue')).toEqual([['banana']])
    const query = await agent.query({ within: 'Fruit', text: 'err' })
    expect(query).toMatchObject([{ items: [{ value: 'cherry', label: 'Cherry' }] }])
    expect((await agent.act({ steps: [{ ref: 'Fruit', action: 'open' }] })).ok).toBe(true)
    expect(wrapper.findComponent(SelectRoot).emitted('update:open')).toEqual([[true]])
  })

  it('select: a list of more than 10 gives `more` and query pages it', async () => {
    const many = Array.from({ length: 60 }, (_, index) => `Item ${index + 1}`)
    const { agent } = await setup(() => h(SelectRoot, () => [
      h(SelectTrigger, { 'aria-label': 'Many' }, () => h(SelectValue)),
      h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () => many.map(label => h(SelectItem, { value: label }, () => h(SelectItemText, () => label)))))),
    ]))
    const entry = byKind(agent.snapshot(), 'select')
    expect(entry.items).toBeUndefined()
    expect(entry.more).toBe(60)
    const first = await agent.query({ within: 'Many' }) as AgentComponent[]
    expect(first[0]!.items).toHaveLength(50)
    expect(first[0]!.more).toBe(10)
    const rest = await agent.query({ within: 'Many', from: 50 }) as AgentComponent[]
    expect(rest[0]!.items!.map(item => item.label)).toEqual(many.slice(50))
    expect(await agent.query({ text: 'Item', from: 50 })).toEqual({ error: expect.stringContaining('from goes with within') })
  })

  it('combobox: items show only while open, so a set opens it to read them', async () => {
    const allow = vi.fn(() => true)
    agent = createAgent({ allow })
    const wrapper = mount(defineComponent({
      render: () => h(ComboboxRoot, () => [
        h(ComboboxAnchor, () => h(ComboboxInput, { 'aria-label': 'Fruit' })),
        h(ComboboxContent, () => h(ComboboxViewport, () => fruits.map(fruit => h(ComboboxItem, { value: fruit.toLowerCase() }, () => fruit)))),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    const entry = byKind(agent.snapshot(), 'combobox')
    expect(entry).toMatchObject({ label: 'Fruit', value: null, open: false, actions: ['setValue', 'setOpen', 'setQuery', 'clear'] })
    expect(entry.items).toBeUndefined()
    expect(await agent.query({ within: 'Fruit' })).toMatchObject([{ items: [], note: expect.stringContaining('show while it\'s open') }])
    const result = await agent.act({ steps: [{ ref: 'Fruit', action: 'setValue', args: ['Banana'] }] })
    expect(result.ok).toBe(true)
    expect(wrapper.findComponent(ComboboxRoot).emitted('update:modelValue')).toEqual([['banana']])
    expect(allow).toHaveBeenCalledWith(expect.objectContaining({ action: 'setValue', component: 'combobox', args: ['Banana'] }), expect.anything())
  })

  it('listbox: setValue by label', async () => {
    const { agent, wrapper } = await setup(() => h(ListboxRoot, { 'aria-label': 'Fruits' }, () => h(ListboxContent, () => fruits.map(fruit => h(ListboxItem, { value: fruit.toLowerCase() }, () => fruit)))))
    expect(byKind(agent.snapshot(), 'listbox')).toMatchObject({ label: 'Fruits', value: null, items: [{ value: 'apple', label: 'Apple' }, { value: 'banana', label: 'Banana' }, { value: 'cherry', label: 'Cherry' }] })
    expect((await agent.act({ steps: [{ ref: 'Fruits', action: 'setValue', args: ['Cherry'] }] })).ok).toBe(true)
    expect(wrapper.findComponent(ListboxRoot).emitted('update:modelValue')).toEqual([['cherry']])
  })
})

describe('disclosure', () => {
  it('tabs: setValue by label, and a field on another tab is reached by its label', async () => {
    const { agent, wrapper } = await setup(() => h(TabsRoot, { defaultValue: 'one' }, () => [
      h(TabsList, { 'aria-label': 'Sections' }, () => [h(TabsTrigger, { value: 'one' }, () => 'One'), h(TabsTrigger, { value: 'two' }, () => 'Two')]),
      h(TabsContent, { value: 'one' }, () => 'First'),
      h(TabsContent, { value: 'two' }, () => h(SwitchRoot, { 'aria-label': 'Hidden switch' })),
    ]))
    expect(byKind(agent.snapshot(), 'tabs')).toMatchObject({ label: 'Sections', value: 'one', items: [{ value: 'one', label: 'One' }, { value: 'two', label: 'Two' }], actions: ['setValue'] })
    expect(agent.snapshot().some(component => component.label === 'Hidden switch')).toBe(false)
    const result = await agent.act({ steps: [{ ref: 'Hidden switch', action: 'setChecked', args: [true] }] })
    expect(result.ok).toBe(true)
    // It looked behind the tab, went back, then opened the one way to the switch.
    expect(wrapper.findComponent(TabsRoot).emitted('update:modelValue')).toEqual([['two'], ['one'], ['two']])
    expect(wrapper.findComponent(SwitchRoot).emitted('update:modelValue')).toEqual([[true]])
    expect((await agent.act({ steps: [{ ref: 'Sections', action: 'setValue', args: ['One'] }] })).ok).toBe(true)
    expect(wrapper.findComponent(TabsRoot).emitted('update:modelValue')!.at(-1)).toEqual(['one'])
  })

  it('accordion: open, close and press a section by its label', async () => {
    const { agent, wrapper } = await setup(() => h(AccordionRoot, { 'type': 'multiple', 'aria-label': 'FAQ' }, () => ['a', 'b'].map(value => h(AccordionItem, { value }, () => [
      h(AccordionHeader, () => h(AccordionTrigger, () => `Section ${value.toUpperCase()}`)),
      h(AccordionContent, () => `Content ${value}`),
    ]))))
    const snapshot = agent.snapshot()
    expect(byKind(snapshot, 'accordion')).toMatchObject({ value: [], items: [{ value: 'a', label: 'Section A' }, { value: 'b', label: 'Section B' }], actions: ['setValue', 'open', 'close', 'toggle', 'openAll', 'closeAll'] })
    // Its triggers are its own, and no collapsible of its items shows on its own.
    expect(snapshot.map(component => component.component)).toEqual(['accordion'])
    expect((await agent.act({ steps: [{ ref: 'FAQ', action: 'open', args: ['Section B'] }, { ref: 'Section A', action: 'open' }] })).ok).toBe(true)
    expect(wrapper.findComponent(AccordionRoot).emitted('update:modelValue')).toEqual([[['b']], [['b', 'a']]])
    expect((await agent.act({ steps: [{ ref: 'FAQ', action: 'closeAll' }] })).ok).toBe(true)
    expect(wrapper.findComponent(AccordionRoot).emitted('update:modelValue')!.at(-1)).toEqual([[]])
  })

  it('collapsible: setOpen', async () => {
    const { agent, wrapper } = await setup(() => h(CollapsibleRoot, () => [h(CollapsibleTrigger, () => 'Details'), h(CollapsibleContent, () => 'More')]))
    expect(byKind(agent.snapshot(), 'collapsible')).toMatchObject({ label: 'Details', open: false, actions: ['setOpen'] })
    expect((await agent.act({ steps: [{ ref: 'Details', action: 'setOpen', args: [true] }] })).ok).toBe(true)
    expect(wrapper.findComponent(CollapsibleRoot).emitted('update:open')).toEqual([[true]])
  })
})

describe('popups', () => {
  it('dialog: press a button inside opens it first', async () => {
    const { agent, wrapper } = await setup(() => h(DialogRoot, () => [
      h(DialogTrigger, () => 'Edit profile'),
      h(DialogPortal, () => h(DialogContent, { 'aria-describedby': undefined }, () => [h(DialogTitle, () => 'Profile'), h(DialogClose, () => 'Done')])),
    ]))
    expect(byKind(agent.snapshot(), 'dialog')).toMatchObject({ label: 'Edit profile', open: false, actions: ['setOpen', 'press'] })
    const result = await agent.act({ steps: [{ ref: 'Edit profile', action: 'press', args: ['Done'] }] })
    expect(result.ok).toBe(true)
    expect(result.steps[0]!.result).toContain('Pressed "Done", after opening')
    expect(wrapper.findComponent(DialogRoot).emitted('update:open')).toEqual([[true], [false]])
  })

  it('alert-dialog: is found by its kind, lists its buttons, and blocks what it covers', async () => {
    const remove = vi.fn()
    const { agent, wrapper } = await setup(() => [
      h(AlertDialogRoot, () => [
        h(AlertDialogTrigger, () => 'Delete project'),
        h(AlertDialogPortal, () => h(AlertDialogContent, { 'aria-describedby': undefined }, () => [
          h(AlertDialogTitle, () => 'Delete the project?'),
          h(AlertDialogCancel, () => 'Cancel'),
          h(AlertDialogAction, { onClick: remove }, () => 'Delete'),
        ])),
      ]),
      h('button', { type: 'button' }, 'Save'),
    ])
    expect(byKind(agent.snapshot(), 'alert-dialog')).toMatchObject({ label: 'Delete project', open: false })
    expect((await agent.act({ steps: [{ ref: 'dialog', action: 'setOpen', args: [true] }] })).ok).toBe(true)
    const open = agent.snapshot()
    expect(byKind(open, 'alert-dialog')).toMatchObject({ label: 'Delete the project?', open: true, text: ['Delete the project?'], buttons: ['Cancel', 'Delete'], actions: ['setOpen', 'press'] })
    expect(byKind(open, 'button')).toMatchObject({ label: 'Save', disabled: true, actions: [] })
    const blocked = await agent.act({ steps: [{ ref: 'Save', action: 'press' }] })
    expect(blocked.error?.message).toMatch(/behind Delete the project\? \(c\d+\), which is open/)
    expect((await agent.act({ steps: [{ ref: 'alert-dialog', action: 'press', args: ['Delete'] }] })).ok).toBe(true)
    expect(remove).toHaveBeenCalledOnce()
    expect(wrapper.findComponent(AlertDialogRoot).emitted('update:open')).toEqual([[true], [false]])
  })

  it('dropdown menu: items are pressable, and the menu opens as needed', async () => {
    const onEdit = vi.fn()
    const { agent, wrapper } = await setup(() => h(DropdownMenuRoot, () => [
      h(DropdownMenuTrigger, { 'aria-label': 'Options' }, () => '⋯'),
      h(DropdownMenuPortal, () => h(DropdownMenuContent, () => [h(DropdownMenuItem, { onSelect: onEdit }, () => 'Edit'), h(DropdownMenuItem, () => 'Archive')])),
    ]))
    expect(byKind(agent.snapshot(), 'menu')).toMatchObject({ label: 'Options', open: false, actions: ['setOpen', 'press'] })
    const missing = await agent.act({ steps: [{ ref: 'Options', action: 'press', args: ['Rename'] }] })
    expect(missing.error?.message).toContain('No button "Rename" in')
    expect(missing.error?.message).toContain('Buttons: Edit, Archive')
    expect((await agent.act({ steps: [{ ref: 'Options', action: 'press', args: ['Edit'] }] })).ok).toBe(true)
    expect(onEdit).toHaveBeenCalledOnce()
    expect(wrapper.findComponent(DropdownMenuRoot).emitted('update:open')).toEqual([[true], [false], [true], [false]])
  })

  it('popover: setOpen, and its fields are the page\'s', async () => {
    const { agent, wrapper } = await setup(() => h(PopoverRoot, () => [
      h(PopoverTrigger, () => 'Dimensions'),
      h(PopoverPortal, () => h(PopoverContent, () => [h('label', { for: 'width' }, 'Width'), h('input', { id: 'width', value: '100' }), h('button', { type: 'button' }, 'Apply')])),
    ]))
    expect(byKind(agent.snapshot(), 'popover')).toMatchObject({ label: 'Dimensions', open: false })
    expect((await agent.act({ steps: [{ ref: 'Dimensions', action: 'setOpen', args: [true] }] })).ok).toBe(true)
    expect(wrapper.findComponent(PopoverRoot).emitted('update:open')).toEqual([[true]])
    const open = agent.snapshot()
    expect(byKind(open, 'popover')).toMatchObject({ open: true, buttons: ['Apply'] })
    expect(byKind(open, 'input')).toMatchObject({ label: 'Width', value: '100' })
    expect(open.some(component => component.component === 'button')).toBe(false)
  })
})

describe('native fields', () => {
  it('reads and sets inputs, checkboxes, selects and radios through their events', async () => {
    const onInput = vi.fn()
    const onChange = vi.fn()
    const onSave = vi.fn()
    const { agent } = await setup(() => h('form', [
      h('label', [h('span', 'Email'), h('input', { type: 'email', onInput })]),
      h('label', { for: 'bio' }, 'Bio'),
      h('textarea', { id: 'bio' }),
      h('label', [h('input', { type: 'checkbox', onChange }), 'Subscribe']),
      h('label', { for: 'size' }, 'Size'),
      h('select', { id: 'size' }, [h('option', { value: 's' }, 'Small'), h('option', { value: 'l' }, 'Large')]),
      h('fieldset', [h('legend', 'Color'), ...['red', 'blue'].map(color => h('label', [h('input', { type: 'radio', name: 'color', value: color }), color]))]),
      h('input', { 'type': 'password', 'aria-label': 'Password', 'value': 'hunter2' }),
      h('button', { type: 'button', onClick: onSave }, 'Save'),
    ]))
    const snapshot = agent.snapshot()
    expect(snapshot.map(({ component, label }) => `${component}:${label}`)).toEqual([
      'input:Email',
      'textarea:Bio',
      'checkbox:Subscribe',
      'select:Size',
      'radio-group:Color',
      'input:Password',
      'button:Save',
    ])
    expect(snapshot.find(component => component.label === 'Password')!.value).toBe('[redacted]')
    expect(snapshot.find(component => component.label === 'Size')!.items).toEqual([{ value: 's', label: 'Small' }, { value: 'l', label: 'Large' }])
    const result = await agent.act({
      steps: [
        { ref: 'Email', action: 'setValue', args: ['a@b.co'] },
        { ref: 'Bio', action: 'setValue', args: ['Hi'] },
        { ref: 'Subscribe', action: 'setChecked', args: [true] },
        { ref: 'Size', action: 'setValue', args: ['Large'] },
        { ref: 'Color', action: 'setValue', args: ['blue'] },
        { ref: 'Save', action: 'press' },
      ],
    })
    expect(result.ok).toBe(true)
    expect(onInput).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalled()
    expect(onSave).toHaveBeenCalledOnce()
    expect((document.querySelector('select') as HTMLSelectElement).value).toBe('l')
    expect((document.querySelector('input[value=blue]') as HTMLInputElement).checked).toBe(true)
  })
})
