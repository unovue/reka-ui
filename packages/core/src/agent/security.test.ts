import type { VNode } from 'vue'
import type { Agent, AgentComponent, AgentOptions } from '.'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '@/Accordion'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot, ComboboxViewport } from '@/Combobox'
import { DialogClose, DialogContent, DialogPortal, DialogRoot, DialogTitle } from '@/Dialog'
import { ListboxContent, ListboxItem, ListboxRoot } from '@/Listbox'
import { NumberFieldInput, NumberFieldRoot } from '@/NumberField'
import { PinInputInput, PinInputRoot } from '@/PinInput'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { SwitchRoot } from '@/Switch'
import { createAgent } from '.'

let agents: Agent[] = []

async function setup(render: () => VNode | VNode[], options?: AgentOptions) {
  const agent = createAgent(options)
  agents.push(agent)
  const wrapper = mount(defineComponent({ render }), { attachTo: document.body })
  for (let tick = 0; tick < 4; tick++)
    await nextTick()
  return { agent, wrapper }
}

afterEach(() => {
  agents.forEach(agent => agent.destroy())
  agents = []
  document.body.innerHTML = ''
})
enableAutoUnmount(afterEach)

const named = (agent: Agent, label: string) => agent.snapshot().find((c: AgentComponent) => c.label === label)
const fruits = ['Apple', 'Banana', 'Cherry']

// A dialog that is open, with a field and a switch in its portalled content.
const dialog = (inside: () => VNode[], portal: Record<string, unknown> = {}) => h(DialogRoot, { defaultOpen: true, modal: false }, () => h(DialogPortal, portal, () => h(DialogContent, () => [h(DialogTitle, () => 'Account'), ...inside()])))
const fields = () => [h('input', { 'aria-label': 'Email', 'value': 'boss@corp.com' }), h(SwitchRoot, { 'aria-label': 'Admin', 'defaultValue': true })]

describe('marks follow components into portals', () => {
  it('data-agent-hidden around a dialog hides its portalled fields', async () => {
    const { agent } = await setup(() => [h('div', { 'data-agent-hidden': '' }, dialog(fields)), h('button', 'Outside')])
    expect(agent.snapshot().map(c => c.label)).toEqual(['Outside'])
    expect(JSON.stringify(agent.snapshot())).not.toContain('boss@corp.com')
    expect((await agent.act({ steps: [{ ref: 'Email', action: 'setValue', args: ['x'] }] })).ok).toBe(false)
    expect((await agent.act({ steps: [{ ref: 'Admin', action: 'setChecked', args: [false] }] })).ok).toBe(false)
  })

  it('data-agent-secret around a dialog redacts its portalled fields', async () => {
    const { agent } = await setup(() => h('div', { 'data-agent-secret': '' }, dialog(fields)))
    expect(named(agent, 'Email')).toMatchObject({ value: '[redacted]' })
    expect(named(agent, 'Admin')).toMatchObject({ checked: '[redacted]' })
  })

  it('a popover inside a hidden dialog, and a portal to a custom target, stay hidden', async () => {
    const { agent } = await setup(() => [
      h('div', { id: 'elsewhere' }),
      h('div', { 'data-agent-hidden': '' }, [
        dialog(() => [h(PopoverRoot, { defaultOpen: true }, () => [h(PopoverTrigger, () => 'More'), h(PopoverPortal, () => h(PopoverContent, () => h('input', { 'aria-label': 'Nested', 'value': 'deep' })))])]),
        h(DialogRoot, { defaultOpen: true, modal: false }, () => h(DialogPortal, { to: '#elsewhere' }, () => h(DialogContent, () => [h(DialogTitle, () => 'Other'), h('input', { 'aria-label': 'Targeted', 'value': 'far' })]))),
      ]),
    ])
    const labels = agent.snapshot().map(c => c.label)
    expect(labels).not.toContain('Nested')
    expect(labels).not.toContain('Targeted')
    expect(JSON.stringify(agent.snapshot())).not.toMatch(/deep|far/)
  })
})

describe('disabled by the page', () => {
  it('native fields and reka components in a disabled fieldset are disabled', async () => {
    const { agent, wrapper } = await setup(() => h('fieldset', { disabled: true }, [
      h('input', { 'aria-label': 'Name', 'value': 'Ada' }),
      h('select', { 'aria-label': 'Plan' }, [h('option', { value: 'a' }, 'A'), h('option', { value: 'b' }, 'B')]),
      h(SwitchRoot, { 'aria-label': 'Wi-Fi' }),
    ]))
    for (const label of ['Name', 'Plan', 'Wi-Fi'])
      expect(named(agent, label)).toMatchObject({ disabled: true, actions: [] })
    expect((await agent.act({ steps: [{ ref: 'Name', action: 'setValue', args: ['Eve'] }] })).ok).toBe(false)
    expect((await agent.act({ steps: [{ ref: 'Wi-Fi', action: 'setChecked', args: [true] }] })).ok).toBe(false)
    expect((document.querySelector('input') as HTMLInputElement).value).toBe('Ada')
    expect(wrapper.findComponent(SwitchRoot).emitted('update:modelValue')).toBeUndefined()
  })
})

describe('private text and items', () => {
  it('a row never carries private text or a field\'s own text', async () => {
    const { agent } = await setup(() => h('ul', h('li', [h('span', { 'data-agent-secret': '' }, 'hunter2'), h('textarea', 'draft note'), h('button', 'Edit')])))
    expect(JSON.stringify(named(agent, 'Edit'))).not.toMatch(/hunter2|draft note/)
  })

  it('a private list\'s labels are never listed in an error, nor name it', async () => {
    const { agent } = await setup(() => h('div', { 'data-agent-secret': '' }, h('select', { 'aria-label': 'Card' }, [h('option', { value: 'v' }, 'Visa'), h('option', { value: 'm' }, 'Mastercard')])))
    const wrong = await agent.act({ steps: [{ ref: 'Card', action: 'setValue', args: ['Amex'] }] })
    expect(wrong.error!.message).not.toMatch(/Visa|Mastercard/)
    const byLabel = await agent.act({ steps: [{ ref: 'Visa', action: 'press' }] })
    const missing = await agent.act({ steps: [{ ref: 'Zzz', action: 'press' }] })
    expect(byLabel.error!.message).toBe(missing.error!.message.replace('Zzz', 'Visa'))
  })

  it('a hidden button\'s text answers like a name that isn\'t there', async () => {
    const { agent } = await setup(() => [h('button', 'Save'), h('div', { 'data-agent-hidden': '' }, h('button', { 'aria-label': 'Wipe database' }, 'x'))])
    const hidden = await agent.act({ steps: [{ ref: 'Wipe database', action: 'press' }] })
    const missing = await agent.act({ steps: [{ ref: 'Zzz', action: 'press' }] })
    expect(hidden.error!.message).toBe(missing.error!.message.replace('Zzz', 'Wipe database'))
  })

  it('a PIN input is private whatever its type', async () => {
    const { agent } = await setup(() => h(PinInputRoot, { 'aria-label': 'Code', 'defaultValue': ['1', '2', '3', '4'] }, () => [0, 1, 2, 3].map(index => h(PinInputInput, { index }))))
    const snapshot = JSON.stringify(agent.snapshot())
    expect(snapshot).not.toMatch(/"[1-4]"|1234/)
    expect(agent.snapshot().find(c => c.component === 'pin-input')).toMatchObject({ value: '[redacted]' })
  })
})

describe('the confirm plan', () => {
  const section = (value: string, attrs: Record<string, unknown> = {}) => h(AccordionItem, { value, ...attrs }, () => [h(AccordionHeader, () => h(AccordionTrigger, () => value.toUpperCase())), h(AccordionContent, () => `${value} body`)])

  it('openAll asks about a marked section it opens', async () => {
    const { agent, wrapper } = await setup(() => h(AccordionRoot, { 'type': 'multiple', 'aria-label': 'Sections' }, () => [section('a', { 'data-agent-confirm': 'Shows salaries.' }), section('b')]))
    const ref_ = agent.snapshot().find(c => c.component === 'accordion')!.ref
    const result = await agent.act({ steps: [{ ref: ref_, action: 'openAll' }] })
    expect(result.error!.message).toContain('Needs a person: "Shows salaries."')
    expect(wrapper.findComponent(AccordionRoot).emitted('update:modelValue')).toBeUndefined()
  })

  it('closeAll leaves a disabled open section, and setValue refuses to close it', async () => {
    const value = ref(['a', 'b'])
    const { agent } = await setup(() => h(AccordionRoot, { 'type': 'multiple', 'aria-label': 'Sections', 'modelValue': value.value, 'onUpdate:modelValue': (v: string[]) => (value.value = v) }, () => [section('a', { disabled: true }), section('b')]))
    const ref_ = agent.snapshot().find(c => c.component === 'accordion')!.ref
    expect((await agent.act({ steps: [{ ref: ref_, action: 'closeAll' }] })).ok).toBe(true)
    expect(value.value).toEqual(['a'])
    const result = await agent.act({ steps: [{ ref: ref_, action: 'setValue', args: [[]] }] })
    expect(result.error!.message).toContain('disabled')
    expect(value.value).toEqual(['a'])
  })

  it('setOpen(false) on a dialog with a marked close button needs a person', async () => {
    const { agent, wrapper } = await setup(() => h(DialogRoot, { defaultOpen: true, modal: false }, () => h(DialogPortal, () => h(DialogContent, () => [h(DialogTitle, () => 'Discard draft'), h(DialogClose, { 'data-agent-confirm': 'Discards the draft.' }, () => 'Discard')]))))
    const result = await agent.act({ steps: [{ ref: 'Discard draft', action: 'setOpen', args: [false] }] })
    expect(result.error!.message).toContain('Needs a person: "Discards the draft."')
    expect(wrapper.findComponent(DialogRoot).emitted('update:open')).toBeUndefined()
  })

  it('a combobox option marked after approval, while the list reopens, isn\'t picked', async () => {
    const opens = ref(0)
    const { agent, wrapper } = await setup(() => h(ComboboxRoot, { 'onUpdate:open': (open: boolean) => open && opens.value++ }, () => [
      h(ComboboxAnchor, () => h(ComboboxInput, { 'aria-label': 'Fruit' })),
      h(ComboboxContent, () => h(ComboboxViewport, () => fruits.map(fruit => h(ComboboxItem, { 'value': fruit.toLowerCase(), 'data-agent-confirm': fruit === 'Banana' && opens.value >= 2 ? 'Orders a crate.' : undefined }, () => fruit)))),
    ]), { allow: () => true })
    const result = await agent.act({ steps: [{ ref: 'Fruit', action: 'setValue', args: ['Banana'] }] })
    expect(result.ok).toBe(false)
    expect(wrapper.findComponent(ComboboxRoot).emitted('update:modelValue')).toBeUndefined()
  })

  it('allow is shown every distinct mark a change touches', async () => {
    const allow = vi.fn(() => true)
    const { agent } = await setup(() => h(ListboxRoot, { 'aria-label': 'Fruits', 'multiple': true }, () => h(ListboxContent, () => fruits.map(fruit =>
      h(ListboxItem, { 'value': fruit.toLowerCase(), 'data-agent-confirm': fruit === 'Apple' ? 'Apple costs extra.' : fruit === 'Banana' ? 'Banana is out of stock.' : undefined }, () => fruit)))), { allow })
    expect((await agent.act({ steps: [{ ref: 'Fruits', action: 'setValue', args: [['apple', 'banana']] }] })).ok).toBe(true)
    const shown = allow.mock.calls.map(call => (call as unknown as [{ confirm?: string }])[0].confirm ?? '').join(' ')
    expect(shown).toContain('Apple costs extra.')
    expect(shown).toContain('Banana is out of stock.')
  })

  it('a later item that an earlier pick hides stops the change', async () => {
    const { agent, wrapper } = await setup(() => h(ListboxRoot, { 'aria-label': 'Fruits', 'multiple': true }, () => h(ListboxContent, () => fruits.map(fruit =>
      h(ListboxItem, { value: fruit.toLowerCase(), id: `item-${fruit.toLowerCase()}`, onSelect: () => fruit === 'Apple' && document.getElementById('item-banana')!.setAttribute('data-agent-hidden', '') }, () => fruit)))))
    expect((await agent.act({ steps: [{ ref: 'Fruits', action: 'setValue', args: [['apple', 'banana']] }] })).ok).toBe(false)
    expect(wrapper.findComponent(ListboxRoot).emitted('update:modelValue')).toEqual([[['apple']]])
  })
})

describe('input shapes', () => {
  it('query refuses inputs of the wrong type with a message', async () => {
    const { agent } = await setup(() => h('button', 'Save'))
    for (const bad of [{ text: 5 }, { within: ['x'] }, { kind: {} }, { closed: 'yes' }, { within: 'Save', from: -1 }])
      expect(await agent.query(bad as any)).toEqual({ error: expect.any(String) })
  })

  it('act takes at most 100 steps', async () => {
    const { agent } = await setup(() => h('button', 'Save'))
    const result = await agent.act({ steps: Array.from({ length: 101 }, () => ({ ref: 'Save', action: 'press' })) })
    expect(result.error!.message).toContain('at most 100 steps')
  })

  it('a number field takes one number, even empty and unbounded', async () => {
    const { agent, wrapper } = await setup(() => h(NumberFieldRoot, { allowInvalid: true }, () => h(NumberFieldInput, { 'aria-label': 'Qty' })))
    expect((await agent.act({ steps: [{ ref: 'Qty', action: 'setValue', args: [[1, 2]] }] })).error!.message).toContain('takes one number')
    expect(wrapper.findComponent(NumberFieldRoot).emitted('update:modelValue')).toBeUndefined()
  })
})
