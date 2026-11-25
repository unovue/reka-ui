import type { VNode } from 'vue'
import type { Agent, AgentComponent, AgentOptions, ObservedChange } from '.'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '@/Accordion'
import { CheckboxGroupRoot, CheckboxRoot } from '@/Checkbox'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot, ComboboxViewport } from '@/Combobox'
import { FieldRoot } from '@/Field'
import { ListboxContent, ListboxItem, ListboxRoot } from '@/Listbox'
import { NumberFieldInput, NumberFieldRoot } from '@/NumberField'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '@/Select'
import { SwitchRoot } from '@/Switch'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
import { createAgent, registerTools } from '.'

let agents: Agent[] = []

function bridge(options?: AgentOptions) {
  const agent = createAgent(options)
  agents.push(agent)
  return agent
}

async function setup(render: () => VNode | VNode[], options?: AgentOptions) {
  const agent = bridge(options)
  const wrapper = mount(defineComponent({ render }), { attachTo: document.body })
  await nextTick()
  await nextTick()
  return { agent, wrapper }
}

afterEach(() => {
  agents.forEach(agent => agent.destroy())
  agents = []
  document.body.innerHTML = ''
  delete (document as any).modelContext
})

// Components unmount after each test, so their effects end with it; the bridges and the page go after.
enableAutoUnmount(afterEach)

const named = (agent: Agent, label: string) => agent.snapshot().find((c: AgentComponent) => c.label === label)
const fruits = ['Apple', 'Banana', 'Cherry']

describe('privacy', () => {
  it('a list item inside data-agent-hidden is neither listed nor picked', async () => {
    const { agent, wrapper } = await setup(() => h(ListboxRoot, { 'aria-label': 'Fruits' }, () => h(ListboxContent, () => fruits.map(fruit =>
      h(ListboxItem, { 'value': fruit.toLowerCase(), 'data-agent-hidden': fruit === 'Banana' ? '' : undefined }, () => fruit)))))
    expect(named(agent, 'Fruits')!.items).toEqual([{ value: 'apple', label: 'Apple' }, { value: 'cherry', label: 'Cherry' }])
    expect((await agent.query({ within: 'Fruits' }) as AgentComponent[])[0]!.items).toHaveLength(2)
    const result = await agent.act({ steps: [{ ref: 'Fruits', action: 'setValue', args: ['banana'] }] })
    expect(result.ok).toBe(false)
    expect(result.error!.message).toContain('isn\'t available to agents')
    expect(wrapper.findComponent(ListboxRoot).emitted('update:modelValue')).toBeUndefined()
  })

  it('a private list\'s items read without labels on every query path, and text never matches them', async () => {
    const { agent } = await setup(() => h('div', { 'data-agent-secret': '' }, h('select', { 'aria-label': 'Card' }, [h('option', { value: 'v' }, 'Visa'), h('option', { value: 'm' }, 'Mastercard')])))
    expect(named(agent, 'Card')!.items).toEqual([{ value: 'v', label: '[redacted]' }, { value: 'm', label: '[redacted]' }])
    const within = await agent.query({ within: 'Card' }) as AgentComponent[]
    expect(within[0]!.items).toEqual([{ value: 'v', label: '[redacted]' }, { value: 'm', label: '[redacted]' }])
    expect((await agent.query({ within: 'Card', text: 'Visa' }) as AgentComponent[])[0]!.items).toEqual([])
    expect(await agent.query({ text: 'Visa' })).toEqual([])
  })

  it('a component marked private just before it unmounts keeps nothing off the page', async () => {
    const shown = ref(true)
    const { agent } = await setup(() => h('div', { id: 'box' }, shown.value ? h(SwitchRoot, { 'aria-label': 'Wi-Fi', 'defaultValue': true }) : undefined))
    expect(named(agent, 'Wi-Fi')).toMatchObject({ checked: true })
    document.getElementById('box')!.setAttribute('data-agent-secret', '')
    shown.value = false
    await nextTick()
    expect(agent.snapshot().filter(c => c.offPage)).toEqual([])
  })

  it('a step whose target goes off-limits while allow waits doesn\'t run', async () => {
    let clicks = 0
    const { agent, wrapper } = await setup(() => h('div', { id: 'box' }, [h('button', { onClick: () => clicks++ }, 'Save'), h(SwitchRoot, { 'aria-label': 'Wi-Fi' })]), {
      allow: async () => {
        document.getElementById('box')!.setAttribute('data-agent-hidden', '')
        return true
      },
    })
    expect((await agent.act({ steps: [{ ref: 'Save', action: 'press' }] })).ok).toBe(false)
    document.getElementById('box')!.removeAttribute('data-agent-hidden')
    expect((await agent.act({ steps: [{ ref: 'Wi-Fi', action: 'setChecked', args: [true] }] })).ok).toBe(false)
    expect(clicks).toBe(0)
    expect(wrapper.findComponent(SwitchRoot).emitted('update:modelValue')).toBeUndefined()
  })

  it('a step whose confirm changes while allow waits doesn\'t run on the old answer', async () => {
    let clicks = 0
    const { agent } = await setup(() => h('div', { id: 'box' }, h('button', { onClick: () => clicks++ }, 'Save')), {
      allow: async () => {
        document.getElementById('box')!.setAttribute('data-agent-confirm', 'Deletes everything.')
        return true
      },
    })
    const result = await agent.act({ steps: [{ ref: 'Save', action: 'press' }] })
    expect(result.ok).toBe(false)
    expect(result.error!.message).toContain('changed while the step waited')
    expect(clicks).toBe(0)
  })

  it('closing a marked accordion section needs a person, by setValue or closeAll', async () => {
    const section = (value: string, attrs: Record<string, unknown> = {}) => h(AccordionItem, { value, ...attrs }, () => [h(AccordionHeader, () => h(AccordionTrigger, () => value.toUpperCase())), h(AccordionContent, () => `${value} body`)])
    const { agent, wrapper } = await setup(() => h(AccordionRoot, { 'type': 'multiple', 'defaultValue': ['a', 'b'], 'aria-label': 'Sections' }, () => [section('a', { 'data-agent-confirm': 'Discards draft A.' }), section('b')]))
    const ref = agent.snapshot().find(c => c.component === 'accordion')!.ref
    for (const step of [{ ref, action: 'setValue', args: [['b']] }, { ref, action: 'closeAll' }]) {
      const result = await agent.act({ steps: [step] })
      expect(result.ok).toBe(false)
      expect(result.error!.message).toContain('Needs a person: "Discards draft A."')
    }
    expect(wrapper.findComponent(AccordionRoot).emitted('update:modelValue')).toBeUndefined()
  })
})

describe('selection', () => {
  it('a controlled multiple Select keeps every toggle of one setValue', async () => {
    const value = ref<string[]>(['a'])
    const { agent } = await setup(() => h(SelectRoot, { 'multiple': true, 'modelValue': value.value, 'onUpdate:modelValue': (v: string[]) => (value.value = v) }, () => [
      h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue)),
      h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () => ['a', 'b', 'c'].map(v => h(SelectItem, { value: v }, () => h(SelectItemText, () => v.toUpperCase())))))),
    ]))
    const result = await agent.act({ steps: [{ ref: 'Fruit', action: 'setValue', args: [['b', 'c']] }] })
    expect(result.ok).toBe(true)
    expect(value.value).toEqual(['b', 'c'])
  })

  it('an option in a disabled optgroup can\'t be picked', async () => {
    const { agent } = await setup(() => h('select', { 'aria-label': 'Plan' }, [h('option', { value: 'free' }, 'Free'), h('optgroup', { label: 'Paid', disabled: true }, [h('option', { value: 'pro' }, 'Pro')])]))
    expect(named(agent, 'Plan')!.items).toEqual([{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }])
    const result = await agent.act({ steps: [{ ref: 'Plan', action: 'setValue', args: ['Pro'] }] })
    expect(result.ok).toBe(false)
    expect(result.error!.message).toContain('disabled')
    expect((document.querySelector('select') as HTMLSelectElement).value).toBe('free')
  })

  it('a listbox item whose select event is prevented isn\'t picked by an agent either', async () => {
    const { agent, wrapper } = await setup(() => h(ListboxRoot, { 'aria-label': 'Fruits' }, () => h(ListboxContent, () => fruits.map(fruit =>
      h(ListboxItem, { value: fruit.toLowerCase(), onSelect: (event: Event) => fruit === 'Banana' && event.preventDefault() }, () => fruit)))))
    expect((await agent.act({ steps: [{ ref: 'Fruits', action: 'setValue', args: ['Banana'] }] })).ok).toBe(false)
    expect(wrapper.findComponent(ListboxRoot).emitted('update:modelValue')).toBeUndefined()
    expect((await agent.act({ steps: [{ ref: 'Fruits', action: 'setValue', args: ['Cherry'] }] })).ok).toBe(true)
    expect(wrapper.findComponent(ListboxRoot).emitted('update:modelValue')).toEqual([['cherry']])
  })

  it('a combobox item whose select event is prevented isn\'t picked, and setOpen(false) on a closed one opens nothing', async () => {
    const { agent, wrapper } = await setup(() => h(ComboboxRoot, () => [
      h(ComboboxAnchor, () => h(ComboboxInput, { 'aria-label': 'Fruit' })),
      h(ComboboxContent, () => h(ComboboxViewport, () => fruits.map(fruit => h(ComboboxItem, { value: fruit.toLowerCase(), onSelect: (event: Event) => fruit === 'Banana' && event.preventDefault() }, () => fruit)))),
    ]), { allow: () => true })
    const root = wrapper.findComponent(ComboboxRoot)
    expect((await agent.act({ steps: [{ ref: 'Fruit', action: 'setOpen', args: [false] }] })).ok).toBe(true)
    expect(root.emitted('update:open')).toBeUndefined()
    expect((await agent.act({ steps: [{ ref: 'Fruit', action: 'setValue', args: ['Banana'] }] })).ok).toBe(false)
    expect(root.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('setters', () => {
  it('a text field that ends at another value than asked fails', async () => {
    const value = ref('')
    const { agent } = await setup(() => h('input', { 'aria-label': 'Project name', 'value': value.value, 'onInput': (event: Event) => (value.value = `${(event.target as HTMLInputElement).value.toUpperCase()}!`) }))
    const result = await agent.act({ steps: [{ ref: 'Project name', action: 'setValue', args: ['Atlas'] }] })
    expect(result.ok).toBe(false)
    expect(result.error!.message).toContain('didn\'t take')
  })

  it('unchecks a mixed group parent through the group', async () => {
    const value = ref(['a'])
    const { agent } = await setup(() => h(CheckboxGroupRoot, { 'modelValue': value.value, 'onUpdate:modelValue': (v: string[]) => (value.value = v), 'allValues': ['a', 'b'] }, () => [
      h(CheckboxRoot, { 'parent': true, 'aria-label': 'All' }),
      h(CheckboxRoot, { 'value': 'a', 'aria-label': 'A' }),
      h(CheckboxRoot, { 'value': 'b', 'aria-label': 'B' }),
    ]))
    expect(named(agent, 'All')).toMatchObject({ checked: 'indeterminate' })
    expect((await agent.act({ steps: [{ ref: 'All', action: 'setChecked', args: [false] }] })).ok).toBe(true)
    expect(value.value).toEqual([])
  })

  it('unchecking an indeterminate checkbox sets its falseValue, even null, and marks its Field dirty', async () => {
    const { agent, wrapper } = await setup(() => h(FieldRoot, () => h(CheckboxRoot, { 'aria-label': 'All', 'defaultValue': 'indeterminate', 'falseValue': null })))
    expect((await agent.act({ steps: [{ ref: 'All', action: 'setChecked', args: [false] }] })).ok).toBe(true)
    expect(wrapper.findComponent(CheckboxRoot).emitted('update:modelValue')).toEqual([[null]])
    await nextTick()
    expect(document.querySelector('[data-dirty]')).not.toBeNull()
  })

  it('checks a controlled checkbox with one change, not two', async () => {
    const value = ref(false)
    const { agent, wrapper } = await setup(() => h(CheckboxRoot, { 'aria-label': 'Terms', 'modelValue': value.value, 'onUpdate:modelValue': (v: boolean) => (value.value = v) }))
    expect((await agent.act({ steps: [{ ref: 'Terms', action: 'setChecked', args: [true] }] })).ok).toBe(true)
    expect(wrapper.findComponent(CheckboxRoot).emitted('update:modelValue')).toEqual([[true]])
  })
})

describe('disclosures', () => {
  const tabs = (value?: { value: string }, onChange?: (v: string) => void) => h(TabsRoot, value ? { 'modelValue': value.value, 'onUpdate:modelValue': onChange } : { defaultValue: 'one' }, () => [
    h(TabsList, { 'aria-label': 'Sections' }, () => [h(TabsTrigger, { value: 'one' }, () => 'One'), h(TabsTrigger, { value: 'two' }, () => 'Two')]),
    h(TabsContent, { value: 'one' }, () => 'First'),
    h(TabsContent, { value: 'two' }, () => h(SwitchRoot, { 'aria-label': 'Hidden switch' })),
  ])

  it('an expect that looks behind a tab goes back, whether it passes or fails', async () => {
    const { agent } = await setup(() => tabs())
    expect((await agent.act({ steps: [{ ref: 'Hidden switch', action: 'expect', args: [true] }] })).ok).toBe(false)
    expect(named(agent, 'Sections')).toMatchObject({ value: 'one' })
    expect((await agent.act({ steps: [{ ref: 'Hidden switch', action: 'expect', args: [false] }] })).ok).toBe(true)
    expect(named(agent, 'Sections')).toMatchObject({ value: 'one' })
  })

  it('a closed survey stops when a place won\'t go back', async () => {
    const value = ref('one')
    // A parent that lets the agent leave the first tab but never return to it.
    const { agent } = await setup(() => tabs(value, (v) => {
      if (v !== 'one')
        value.value = v
    }))
    const result = await agent.query({ closed: true })
    expect(result).toEqual({ error: expect.stringContaining('didn\'t go back') })
  })
})

describe('refs and natives', () => {
  it('a ref isn\'t reused when two controls with one name left and one came back', async () => {
    const first = ref(true)
    const second = ref(true)
    const { agent } = await setup(() => [first.value ? h(SwitchRoot, { 'aria-label': 'Notify' }) : undefined, second.value ? h(SwitchRoot, { 'aria-label': 'Notify', 'defaultValue': true }) : undefined])
    const [one, two] = agent.snapshot().filter(c => c.label === 'Notify').map(c => c.ref)
    first.value = false
    second.value = false
    await nextTick()
    agent.snapshot()
    second.value = true
    await nextTick()
    const back = agent.snapshot().find(c => c.label === 'Notify' && !c.offPage)!
    expect([one, two]).not.toContain(back.ref)
  })

  it('radios group by their form, not its id', async () => {
    const plan = (checked: string) => h('form', ['free', 'pro'].map(value => h('label', [h('input', { type: 'radio', name: 'plan', value, checked: value === checked }), value])))
    const { agent } = await setup(() => [plan('free'), plan('pro')])
    expect(agent.snapshot().filter(c => c.component === 'radio-group').map(c => c.value)).toEqual(['free', 'pro'])
  })

  it('hears a native field changed before any scan, with what it held before', async () => {
    mount(defineComponent({ render: () => h('input', { 'aria-label': 'Name', 'value': 'Ada' }) }), { attachTo: document.body })
    const agent = bridge()
    const seen: ObservedChange[] = []
    agent.subscribe(change => seen.push(change))
    const input = document.querySelector('input')!
    input.value = 'Ada L'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    expect(seen).toMatchObject([{ key: 'value', value: 'Ada L', previous: 'Ada' }])
  })
})

describe('bridges', () => {
  it('destroying one bridge drops its listeners and queued calls, and leaves another\'s', async () => {
    const on = ref(false)
    let answer!: (ok: boolean) => void
    const first = bridge({ allow: () => new Promise<boolean>(resolve => (answer = resolve)) })
    const second = bridge()
    mount(defineComponent({ render: () => h(SwitchRoot, { 'aria-label': 'Wi-Fi', 'modelValue': on.value, 'onUpdate:modelValue': (v: boolean) => (on.value = v) }) }), { attachTo: document.body })
    await nextTick()
    const heardFirst = vi.fn()
    const heardSecond = vi.fn()
    first.subscribe(heardFirst)
    second.subscribe(heardSecond)
    const waiting = first.act({ steps: [{ ref: 'Wi-Fi', action: 'setChecked', args: [true] }] })
    const queued = first.act({ steps: [{ ref: 'Wi-Fi', action: 'setChecked', args: [false] }] })
    await new Promise(resolve => setTimeout(resolve, 20))
    first.destroy()
    answer(false)
    await waiting
    await expect(queued).rejects.toThrow('destroyed')
    on.value = true
    await nextTick()
    expect(heardFirst).not.toHaveBeenCalled()
    expect(heardSecond).toHaveBeenCalled()
  })

  it('registerTools unregisters only the names it registered', () => {
    const owned = new Set<string>()
    const unregisterTool = vi.fn((name: string) => owned.delete(name))
    ;(document as any).modelContext = {
      registerTool: (tool: { name: string }) => {
        if (owned.has(tool.name))
          throw new DOMException('Duplicate tool', 'InvalidStateError')
        owned.add(tool.name)
      },
      unregisterTool,
    }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const first = registerTools(bridge(), { allow: () => true })
    const second = registerTools(bridge(), { allow: () => true })
    second()
    expect(unregisterTool).not.toHaveBeenCalled()
    expect([...owned]).toEqual(['act', 'query', 'snapshot'])
    first()
    expect(unregisterTool).toHaveBeenCalledTimes(3)
    warn.mockRestore()
  })
})

describe('second review', () => {
  const fruitList = (attrs: Record<string, unknown>, item: (fruit: string) => Record<string, unknown> = () => ({})) =>
    h(ListboxRoot, { 'aria-label': 'Fruits', 'multiple': true, ...attrs }, () => h(ListboxContent, () => fruits.map(fruit => h(ListboxItem, { value: fruit.toLowerCase(), id: `item-${fruit.toLowerCase()}`, ...item(fruit) }, () => fruit))))

  it('stops a multi-item change when an earlier pick marks a later item', async () => {
    const { agent, wrapper } = await setup(() => fruitList({}, fruit => (fruit === 'Apple' ? { onSelect: () => document.getElementById('item-banana')!.setAttribute('data-agent-confirm', 'Orders a crate.') } : {})))
    const result = await agent.act({ steps: [{ ref: 'Fruits', action: 'setValue', args: [['apple', 'banana']] }] })
    expect(result.ok).toBe(false)
    expect(result.error!.message).toContain('needs a person now: "Orders a crate."')
    expect(wrapper.findComponent(ListboxRoot).emitted('update:modelValue')).toEqual([[['apple']]])
  })

  it('clear asks about the selected items it takes out', async () => {
    const { agent, wrapper } = await setup(() => fruitList({ defaultValue: ['apple'] }, fruit => (fruit === 'Apple' ? { 'data-agent-confirm': 'Apple is the order.' } : {})))
    const result = await agent.act({ steps: [{ ref: 'Fruits', action: 'clear' }] })
    expect(result.ok).toBe(false)
    expect(result.error!.message).toContain('Needs a person: "Apple is the order."')
    expect(wrapper.findComponent(ListboxRoot).emitted('update:modelValue')).toBeUndefined()
  })

  it('refuses a change that would take out more than was approved', async () => {
    const value = ref(['b', 'c'])
    const section = (v: string, attrs: Record<string, unknown> = {}) => h(AccordionItem, { value: v, ...attrs }, () => [h(AccordionHeader, () => h(AccordionTrigger, () => v.toUpperCase())), h(AccordionContent, () => `${v} body`)])
    const { agent } = await setup(() => h(AccordionRoot, { 'type': 'multiple', 'modelValue': value.value, 'onUpdate:modelValue': (v: string[]) => (value.value = v), 'aria-label': 'Sections' }, () => [section('a', { 'data-agent-confirm': 'Discards draft A.' }), section('b'), section('c')]), {
      allow: async () => {
        // The app opens the marked section while the answer is pending.
        value.value = ['a', 'b', 'c']
        await nextTick()
        return true
      },
    })
    const ref_ = agent.snapshot().find(c => c.component === 'accordion')!.ref
    const result = await agent.act({ steps: [{ ref: ref_, action: 'setValue', args: [['b']] }] })
    expect(result.ok).toBe(false)
    expect(result.error!.message).toContain('take out more than was asked')
    expect(value.value).toEqual(['a', 'b', 'c'])
  })

  it('a combobox set finishes when the page renders no frames', async () => {
    vi.stubGlobal('requestAnimationFrame', () => 0)
    try {
      const { agent, wrapper } = await setup(() => h(ComboboxRoot, () => [
        h(ComboboxAnchor, () => h(ComboboxInput, { 'aria-label': 'Fruit' })),
        h(ComboboxContent, () => h(ComboboxViewport, () => fruits.map(fruit => h(ComboboxItem, { value: fruit.toLowerCase() }, () => fruit)))),
      ]), { allow: () => true })
      const result = await agent.act({ steps: [{ ref: 'Fruit', action: 'setValue', args: ['banana'] }] })
      expect(result.ok).toBe(true)
      expect(wrapper.findComponent(ComboboxRoot).emitted('update:modelValue')).toEqual([['banana']])
    }
    finally {
      vi.unstubAllGlobals()
    }
  })

  it('a closed survey doesn\'t leave a marked tab', async () => {
    const { agent, wrapper } = await setup(() => h(TabsRoot, { defaultValue: 'one' }, () => [
      h(TabsList, { 'aria-label': 'Sections' }, () => [h(TabsTrigger, { 'value': 'one', 'data-agent-confirm': 'Leaving discards edits.' }, () => 'One'), h(TabsTrigger, { value: 'two' }, () => 'Two')]),
      h(TabsContent, { value: 'one' }, () => 'First'),
      h(TabsContent, { value: 'two' }, () => h(SwitchRoot, { 'aria-label': 'Hidden switch' })),
    ]), { allow: () => true })
    await agent.query({ closed: true })
    expect(wrapper.findComponent(TabsRoot).emitted('update:modelValue')).toBeUndefined()
  })

  it('goes back when what a survey found is gone on the way back to it', async () => {
    const there = ref(true)
    let asked = 0
    const { agent } = await setup(() => h(TabsRoot, { defaultValue: 'one' }, () => [
      h(TabsList, { 'aria-label': 'Sections' }, () => [h(TabsTrigger, { value: 'one' }, () => 'One'), h(TabsTrigger, { value: 'two' }, () => 'Two')]),
      h(TabsContent, { value: 'one' }, () => 'First'),
      h(TabsContent, { value: 'two' }, () => (there.value ? h(SwitchRoot, { 'aria-label': 'Hidden switch' }) : 'Empty')),
    ]), {
      allow: () => {
        // The second look, the one that goes back to the switch, finds it gone.
        if (++asked === 2)
          there.value = false
        return true
      },
    })
    expect((await agent.act({ steps: [{ ref: 'Hidden switch', action: 'expect', args: [false] }] })).ok).toBe(false)
    expect(named(agent, 'Sections')).toMatchObject({ value: 'one' })
  })

  it('a number field takes one number, also from a list of one', async () => {
    const { agent, wrapper } = await setup(() => h(NumberFieldRoot, { defaultValue: 10 }, () => h(NumberFieldInput, { 'aria-label': 'Qty' })))
    const result = await agent.act({ steps: [{ ref: 'Qty', action: 'setValue', args: [[30, 40]] }] })
    expect(result.ok).toBe(false)
    expect(result.error!.message).toContain('takes one number')
    expect(wrapper.findComponent(NumberFieldRoot).emitted('update:modelValue')).toBeUndefined()
    expect((await agent.act({ steps: [{ ref: 'Qty', action: 'setValue', args: [[30]] }] })).ok).toBe(true)
    expect(wrapper.findComponent(NumberFieldRoot).emitted('update:modelValue')).toEqual([[30]])
  })

  it('the same callback on two bridges is two subscriptions', async () => {
    const on = ref(false)
    const first = bridge()
    const second = bridge()
    mount(defineComponent({ render: () => h(SwitchRoot, { 'aria-label': 'Wi-Fi', 'modelValue': on.value, 'onUpdate:modelValue': (v: boolean) => (on.value = v) }) }), { attachTo: document.body })
    await nextTick()
    const heard = vi.fn()
    first.subscribe(heard)
    second.subscribe(heard)
    first.destroy()
    on.value = true
    await nextTick()
    expect(heard).toHaveBeenCalledTimes(1)
  })

  it('a radio moved to another form reports under that form\'s group', async () => {
    const plan = (id: string, checked: string) => h('form', { id }, ['free', 'pro'].map(value => h('label', [h('input', { type: 'radio', name: 'plan', value, checked: value === checked }), value])))
    const { agent } = await setup(() => [plan('f1', 'pro'), plan('f2', 'pro')])
    const groups = agent.snapshot().filter(c => c.component === 'radio-group')
    const seen: ObservedChange[] = []
    agent.subscribe(change => seen.push(change))
    const moved = document.querySelector<HTMLInputElement>('#f1 input')!
    document.getElementById('f2')!.appendChild(moved)
    moved.click()
    expect(seen.at(-1)).toMatchObject({ ref: groups[1]!.ref, value: 'free' })
  })

  it('takes a native field\'s baseline again when it gets focus', async () => {
    const { agent } = await setup(() => h('input', { 'aria-label': 'Name', 'value': 'Ada' }))
    const seen: ObservedChange[] = []
    agent.subscribe(change => seen.push(change))
    const input = document.querySelector('input')!
    input.value = 'Grace'
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    input.value = 'Grace L'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    expect(seen).toMatchObject([{ value: 'Grace L', previous: 'Grace' }])
  })

  it('checking a mixed parent with no room left changes nothing, and a click still does what it did', async () => {
    const value = ref(['a'])
    const { agent } = await setup(() => h(CheckboxGroupRoot, { 'modelValue': value.value, 'onUpdate:modelValue': (v: string[]) => (value.value = v), 'allValues': ['a', 'b'], 'max': 1 }, () => [
      h(CheckboxRoot, { 'parent': true, 'aria-label': 'All' }),
      h(CheckboxRoot, { 'value': 'a', 'aria-label': 'A' }),
      h(CheckboxRoot, { 'value': 'b', 'aria-label': 'B' }),
    ]))
    expect((await agent.act({ steps: [{ ref: 'All', action: 'setChecked', args: [true] }] })).ok).toBe(false)
    expect(value.value).toEqual(['a'])
    // A person's click on the same parent clears it, as before.
    ;(document.querySelector('[aria-label="All"]') as HTMLElement).click()
    await nextTick()
    expect(value.value).toEqual([])
  })
})
