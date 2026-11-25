import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { SwitchRoot } from '@/Switch'
import { AgentPlugin, agentTools, createAgent, registerTools, useAgent } from '.'

function fakeModelContext() {
  const tools = new Map<string, any>()
  const registerTool = vi.fn((tool: any, options?: { signal?: AbortSignal }) => {
    tools.set(tool.name, tool)
    options?.signal?.addEventListener('abort', () => tools.delete(tool.name))
    return Promise.resolve()
  })
  return { tools, registerTool }
}

afterEach(() => {
  delete (document as any).modelContext
  delete (navigator as any).modelContext
  document.body.innerHTML = ''
})

describe('registerTools', () => {
  it('needs an allow', () => {
    const agent = createAgent()
    expect(() => registerTools(agent, {} as any)).toThrow('registerTools needs an `allow`')
    agent.destroy()
  })

  it('does nothing where the browser has no WebMCP', () => {
    const agent = createAgent()
    const unregister = registerTools(agent, { allow: () => true })
    expect(unregister).toBeTypeOf('function')
    expect(() => unregister()).not.toThrow()
    agent.destroy()
  })

  it('registers act, query and snapshot on document.modelContext, with their annotations', async () => {
    const context = fakeModelContext();
    (document as any).modelContext = context
    const agent = createAgent()
    const allow = vi.fn(() => true)
    mount(defineComponent({ render: () => h(SwitchRoot, { 'aria-label': 'Wi-Fi' }) }), { attachTo: document.body })
    await nextTick()
    const unregister = registerTools(agent, { allow })
    expect([...context.tools.keys()]).toEqual(['act', 'query', 'snapshot'])
    for (const tool of agentTools) {
      expect(context.tools.get(tool.name)).toMatchObject({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: { readOnlyHint: tool.name === 'snapshot', untrustedContentHint: true, consequentialHint: tool.name === 'act' },
      })
    }
    expect(context.tools.get('snapshot').execute({})).toMatchObject([{ component: 'switch', label: 'Wi-Fi' }])
    const result = await context.tools.get('act').execute({ steps: [{ ref: 'Wi-Fi', action: 'setChecked', args: [true] }] })
    expect(result.ok).toBe(true)
    expect(allow).toHaveBeenCalledWith(expect.objectContaining({ action: 'setChecked', label: 'Wi-Fi' }), expect.anything())
    // The browser agent's allow decides on its own steps only.
    allow.mockClear()
    await agent.act({ steps: [{ ref: 'Wi-Fi', action: 'setChecked', args: [false] }] })
    expect(allow).not.toHaveBeenCalled()
    // A refusal by registerTools' allow fails the step.
    allow.mockReturnValue(false)
    const refused = await context.tools.get('act').execute({ steps: [{ ref: 'Wi-Fi', action: 'toggle' }] })
    expect(refused.error.message).toMatch(/The app refused toggle/)
    unregister()
    expect(context.tools.size).toBe(0)
    agent.destroy()
  })

  it('falls back to navigator.modelContext, and unregisters by name there', () => {
    const unregisterTool = vi.fn()
    const registerTool = vi.fn();
    (navigator as any).modelContext = { registerTool, unregisterTool }
    const agent = createAgent()
    const unregister = registerTools(agent, { allow: () => true })
    expect(registerTool).toHaveBeenCalledTimes(3)
    unregister()
    expect(unregisterTool.mock.calls.map(([name]) => name)).toEqual(['act', 'query', 'snapshot'])
    agent.destroy()
  })
})

describe('agentPlugin', () => {
  it('creates the bridge before mount, provides it and registers WebMCP tools', async () => {
    const context = fakeModelContext();
    (document as any).modelContext = context
    let injected: ReturnType<typeof useAgent> = null
    const app = createApp(defineComponent({
      setup() {
        injected = useAgent()
        return () => h(SwitchRoot, { 'aria-label': 'Wi-Fi' })
      },
    }))
    app.use(AgentPlugin, { webmcp: { allow: () => true } })
    const root = document.createElement('div')
    document.body.append(root)
    app.mount(root)
    await nextTick()
    expect(injected!.snapshot()).toMatchObject([{ component: 'switch', label: 'Wi-Fi' }])
    expect(context.tools.size).toBe(3)
    app.unmount()
    expect(context.tools.size).toBe(0)
  })
})
