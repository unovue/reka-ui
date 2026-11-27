import type { VNode } from 'vue'
import type { Agent, AgentComponent, ObservedChange } from '.'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { AlertDialogContent, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle, AlertDialogTrigger } from '@/AlertDialog'
import { CheckboxRoot } from '@/Checkbox'
import { DialogContent, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { NumberFieldInput, NumberFieldRoot } from '@/NumberField'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '@/Select'
import { SwitchRoot } from '@/Switch'
import { createAgent } from '.'
import { offPage } from './registry'

let agent: Agent | undefined

async function setup(render: () => VNode | VNode[]) {
  agent = createAgent()
  const wrapper = mount(defineComponent({ render }), { attachTo: document.body })
  await nextTick()
  await nextTick()
  return { agent, wrapper }
}

afterEach(() => {
  agent?.destroy()
  agent = undefined
  document.body.innerHTML = ''
})

const named = (agent: Agent, label: string) => agent.snapshot().find((c: AgentComponent) => c.label === label)

describe('disabled popup triggers', () => {
  const menu = (onSelect: () => void, { trigger = {}, item = {} }: { trigger?: object, item?: object } = {}) => h(DropdownMenuRoot, { modal: false }, () => [
    h(DropdownMenuTrigger, trigger, () => 'Actions'),
    h(DropdownMenuPortal, () => h(DropdownMenuContent, () => [h(DropdownMenuItem, { onSelect, ...item }, () => 'Delete'), h(DropdownMenuItem, () => 'Rename')])),
  ])

  it('a menu whose trigger is disabled is disabled, takes no actions and refuses a press', async () => {
    let deleted = 0
    const { agent } = await setup(() => menu(() => deleted++, { trigger: { disabled: true } }))
    expect(named(agent, 'Actions')).toMatchObject({ component: 'menu', disabled: true, actions: [] })
    const pressed = await agent.act({ steps: [{ ref: 'Actions', action: 'press', args: ['Delete'] }] })
    expect(pressed.ok).toBe(false)
    // A value naming a button is a press on a menu, and is refused the same way.
    const viaValue = await agent.act({ steps: [{ ref: 'Actions', action: 'setValue', args: ['Delete'] }] })
    expect(viaValue.ok).toBe(false)
    expect((await agent.act({ steps: [{ ref: 'Actions', action: 'setOpen', args: [true] }] })).ok).toBe(false)
    expect(deleted).toBe(0)
  })

  it('a disabled menu item can\'t be pressed', async () => {
    let deleted = 0
    const { agent } = await setup(() => menu(() => deleted++, { item: { disabled: true } }))
    const result = await agent.act({ steps: [{ ref: 'Actions', action: 'press', args: ['Delete'] }] })
    expect(result.ok).toBe(false)
    expect(result.error!.message).toContain('disabled')
    expect(deleted).toBe(0)
  })

  it('popover, dialog and alert dialog triggers that are disabled disable them', async () => {
    const { agent } = await setup(() => [
      h(PopoverRoot, () => [h(PopoverTrigger, { disabled: true }, () => 'Filters'), h(PopoverPortal, () => h(PopoverContent, () => h('button', 'Apply')))]),
      h(DialogRoot, () => [h(DialogTrigger, { disabled: true }, () => 'Invite'), h(DialogPortal, () => h(DialogContent, () => [h(DialogTitle, () => 'Invite people'), h('button', 'Send')]))]),
      h(AlertDialogRoot, () => [h(AlertDialogTrigger, { disabled: true }, () => 'Delete project'), h(AlertDialogPortal, () => h(AlertDialogContent, () => [h(AlertDialogTitle, () => 'Delete it?'), h('button', 'Delete')]))]),
    ])
    for (const label of ['Filters', 'Invite', 'Delete project']) {
      expect(named(agent, label)).toMatchObject({ disabled: true, actions: [] })
      expect((await agent.act({ steps: [{ ref: label, action: 'setOpen', args: [true] }] })).ok).toBe(false)
    }
    expect(document.querySelector('[role=dialog], [role=alertdialog]')).toBeNull()
  })
})

describe('subscribe', () => {
  it('never hears a component inside data-agent-hidden, even before a snapshot', async () => {
    agent = createAgent()
    const seen: ObservedChange[] = []
    agent.subscribe(change => seen.push(change))
    const on = ref(false)
    mount(defineComponent({ render: () => h('div', { 'data-agent-hidden': '' }, h(SwitchRoot, { 'aria-label': 'Hidden', 'modelValue': on.value, 'onUpdate:modelValue': (v: boolean) => (on.value = v) })) }), { attachTo: document.body })
    await nextTick()
    on.value = true
    await nextTick()
    expect(seen).toEqual([])
  })

  it('redacts a component inside data-agent-secret, even before a snapshot', async () => {
    agent = createAgent()
    const seen: ObservedChange[] = []
    agent.subscribe(change => seen.push(change))
    const on = ref(false)
    mount(defineComponent({ render: () => h('div', { 'data-agent-secret': '' }, h(SwitchRoot, { 'aria-label': 'Private', 'modelValue': on.value, 'onUpdate:modelValue': (v: boolean) => (on.value = v) })) }), { attachTo: document.body })
    await nextTick()
    on.value = true
    await nextTick()
    expect(seen).toHaveLength(1)
    expect(seen[0]).toMatchObject({ value: '[redacted]', previous: '[redacted]' })
  })
})

describe('checkbox', () => {
  it('unchecks an indeterminate checkbox instead of checking it', async () => {
    const { agent, wrapper } = await setup(() => h(CheckboxRoot, { 'aria-label': 'All', 'defaultValue': 'indeterminate' }))
    const result = await agent.act({ steps: [{ ref: 'All', action: 'setChecked', args: [false] }] })
    expect(result.ok).toBe(true)
    expect(wrapper.findComponent(CheckboxRoot).emitted('update:modelValue')).toEqual([[false]])
    expect(named(agent, 'All')).toMatchObject({ checked: false })
  })

  it('fails a set that ends somewhere other than what was asked', async () => {
    // A parent that turns any change into "checked".
    const value = ref<boolean | 'indeterminate'>('indeterminate')
    const { agent } = await setup(() => h(CheckboxRoot, { 'aria-label': 'All', 'modelValue': value.value, 'onUpdate:modelValue': () => (value.value = true) }))
    const result = await agent.act({ steps: [{ ref: 'All', action: 'setChecked', args: [false] }] })
    expect(result.ok).toBe(false)
    expect(result.error!.message).toContain('didn\'t take')
  })
})

describe('number field', () => {
  it('keeps a set value on the field\'s step and reports the move', async () => {
    const { agent, wrapper } = await setup(() => h(NumberFieldRoot, { defaultValue: 2, step: 5, min: 0, max: 100 }, () => h(NumberFieldInput, { 'aria-label': 'Qty' })))
    const result = await agent.act({ steps: [{ ref: 'Qty', action: 'setValue', args: [3] }] })
    expect(result.ok).toBe(false)
    expect(result.error!.message).toContain('steps of 5')
    expect(wrapper.findComponent(NumberFieldRoot).emitted('update:modelValue')).toEqual([[5]])
    expect((await agent.act({ steps: [{ ref: 'Qty', action: 'setValue', args: [10] }] })).ok).toBe(true)
  })
})

describe('select', () => {
  it('refuses to empty a single select', async () => {
    const { agent, wrapper } = await setup(() => h(SelectRoot, { defaultValue: 'a' }, () => [
      h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue)),
      h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () => [h(SelectItem, { value: 'a' }, () => h(SelectItemText, () => 'A')), h(SelectItem, { value: 'b' }, () => h(SelectItemText, () => 'B'))]))),
    ]))
    const result = await agent.act({ steps: [{ ref: 'Fruit', action: 'setValue', args: [null] }] })
    expect(result.ok).toBe(false)
    expect(result.error!.message).toContain('can\'t be emptied')
    expect(wrapper.findComponent(SelectRoot).emitted('update:modelValue')).toBeUndefined()
  })
})

describe('destroy', () => {
  it('keeps nothing from components that unmount after the bridge is gone', async () => {
    const { agent, wrapper } = await setup(() => h(SwitchRoot, { 'aria-label': 'Wi-Fi', 'defaultValue': true }))
    expect(named(agent, 'Wi-Fi')).toBeDefined()
    agent.destroy()
    wrapper.unmount()
    expect(offPage.size).toBe(0)
  })
})
