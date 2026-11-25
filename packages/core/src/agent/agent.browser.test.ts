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

describe('a native modal dialog, in a real browser', () => {
  it('covers the rest of the page while it is open with showModal()', async () => {
    const agent = createAgent()
    const behind = vi.fn()
    const page = document.createElement('div')
    page.innerHTML = '<input aria-label="Behind field" value="x"><button>Behind button</button><dialog><input aria-label="In dialog" value="y"></dialog>'
    document.body.append(page)
    page.querySelector('button')!.addEventListener('click', behind)
    page.querySelector('dialog')!.showModal()
    try {
      const snapshot = agent.snapshot()
      expect(snapshot.find(c => c.label === 'Behind field')).toMatchObject({ disabled: true, actions: [] })
      expect(snapshot.find(c => c.label === 'In dialog')?.disabled).toBeUndefined()
      const result = await agent.act({ steps: [{ ref: 'Behind button', action: 'press' }] })
      expect(result.ok).toBe(false)
      expect(behind).not.toHaveBeenCalled()
    }
    finally {
      page.querySelector('dialog')!.close()
      page.remove()
      agent.destroy()
    }
  })
})

describe('ids with selector characters, in a real browser', () => {
  it('reads and changes a field whose id holds a newline and quotes, which a selector would reject', async () => {
    const page = document.createElement('div')
    // In a row, so the bridge looks for a \`label[for]\` by its id to keep the field's own label out of the row.
    page.innerHTML = '<ul><li>Row <input aria-label="Odd" value="x"></li></ul>'
    page.querySelector('input')!.id = 'a\nb"]\\'
    document.body.append(page)
    const agent = createAgent()
    try {
      expect(() => agent.snapshot()).not.toThrow()
      expect(agent.snapshot().find(c => c.label === 'Odd')).toMatchObject({ value: 'x' })
      expect((await agent.act({ steps: [{ ref: 'Odd', action: 'setValue', args: ['y'] }] })).ok).toBe(true)
      expect(page.querySelector('input')!.value).toBe('y')
      expect(await agent.query({ text: 'Odd' })).toHaveLength(1)
    }
    finally {
      page.remove()
      agent.destroy()
    }
  })
})
