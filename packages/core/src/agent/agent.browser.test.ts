import type { Settings } from './test/_SettingsScreen.vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { agentTools, createAgent, registerTools } from '.'
import SettingsScreen from './test/_SettingsScreen.vue'
import { benchmarkSteps, isCorrect } from './test/benchmark'

// The browser's agent as WebMCP gives it the page's tools: `document.modelContext.registerTool`.
function fakeModelContext() {
  const tools = new Map<string, { name: string, execute: (input: unknown) => unknown, annotations: Record<string, boolean> }>()
  return {
    tools,
    registerTool: vi.fn((tool: any, options?: { signal?: AbortSignal }) => {
      tools.set(tool.name, tool)
      options?.signal?.addEventListener('abort', () => tools.delete(tool.name))
      return Promise.resolve()
    }),
  }
}

afterEach(() => {
  delete (document as { modelContext?: unknown }).modelContext
})

describe('the agent benchmark\'s settings screen, in a real browser', () => {
  it('completes the task in one act call after one snapshot, through WebMCP', async () => {
    const context = fakeModelContext();
    (document as { modelContext?: unknown }).modelContext = context
    // Created before the app mounts, so it hears every component.
    const agent = createAgent()
    const allow = vi.fn(() => true)
    const unregister = registerTools(agent, { allow })
    expect([...context.tools.keys()]).toEqual(agentTools.map(tool => tool.name))
    expect(context.tools.get('act')!.annotations).toEqual({ readOnlyHint: false, untrustedContentHint: true, consequentialHint: true })
    expect(context.tools.get('snapshot')!.annotations).toEqual({ readOnlyHint: true, untrustedContentHint: true, consequentialHint: false })

    const saved: Settings[] = []
    const wrapper = mount(SettingsScreen, { attachTo: document.body, props: { onSave: (settings: Settings) => saved.push(settings) } })
    await nextTick()

    // Call 1: snapshot.
    const snapshot = await context.tools.get('snapshot')!.execute({}) as { component: string, label?: string }[]
    expect(snapshot.map(({ component, label }) => `${component}:${label}`)).toEqual(['tabs:Settings', 'input:Project name', 'select:Visibility', 'button:Save settings'])

    // Call 2: one act with every step and the save.
    const result = await context.tools.get('act')!.execute({ steps: benchmarkSteps }) as { ok: boolean, error?: unknown }
    expect(result.error).toBeUndefined()
    expect(result.ok).toBe(true)
    expect(isCorrect(saved)).toBe(true)
    // The browser agent's allow saw every step it took, the confirm in the dialog included.
    expect(allow.mock.calls.map(([step]) => (step as { action: string }).action)).toEqual(expect.arrayContaining(['setValue', 'press', 'setChecked']))

    unregister()
    expect(context.tools.size).toBe(0)
    wrapper.unmount()
    agent.destroy()
  }, 30_000)
})
