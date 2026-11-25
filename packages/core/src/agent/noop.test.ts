import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { agentRegistrar, useAgentRegistration } from '@/shared/useAgentRegistration'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport, SwitchRoot, TabsContent, TabsList, TabsRoot, TabsTrigger } from '..'

const screen = defineComponent({
  render: () => [
    h(SwitchRoot, { 'aria-label': 'Wi-Fi' }),
    h(TabsRoot, { defaultValue: 'a' }, () => [h(TabsList, () => h(TabsTrigger, { value: 'a' }, () => 'A')), h(TabsContent, { value: 'a' }, () => 'A')]),
    h(SelectRoot, () => [h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue)), h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () => h(SelectItem, { value: 'a' }, () => h(SelectItemText, () => 'A')))))]),
  ],
})

describe('without the agent entry', () => {
  it('components register nothing: the hooks find no registrar and return', async () => {
    expect(agentRegistrar.root).toBeUndefined()
    expect(agentRegistrar.item).toBeUndefined()
    const wrapper = mount(screen, { attachTo: document.body })
    await nextTick()
    expect(agentRegistrar).toEqual({})
    expect((globalThis as any)[Symbol.for('reka-ui:agent')]).toBe(agentRegistrar)
    wrapper.unmount()
  })

  it('a hook call outside any bridge is a single property read', () => {
    const context = {}
    const spy = vi.fn()
    useAgentRegistration('switch', context, {})
    agentRegistrar.root = spy
    useAgentRegistration('switch', context, {})
    agentRegistrar.root = undefined
    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith('switch', context, {}, undefined, undefined, undefined)
  })

  it('a bridge created after mount sees native fields but not components set up before it', async () => {
    const wrapper = mount(defineComponent({ render: () => [h(screen), h('button', { type: 'button' }, 'Save')] }), { attachTo: document.body })
    await nextTick()
    const { createAgent } = await import('.')
    const agent = createAgent()
    expect(agent.snapshot().map(component => component.component)).toEqual(['button'])
    agent.destroy()
    expect(agentRegistrar).toEqual({ root: undefined, item: undefined })
    wrapper.unmount()
  })
})
