import type { Settings } from './test/_SettingsScreen.vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createAgent } from '.'
import SettingsScreen from './test/_SettingsScreen.vue'
import { benchmarkSteps, isCorrect } from './test/benchmark'

describe('agent bridge on the benchmark settings screen (jsdom)', () => {
  let agent: ReturnType<typeof createAgent> | undefined
  afterEach(() => {
    agent?.destroy()
    agent = undefined
    document.body.innerHTML = ''
  })

  it('completes the task in one act after one snapshot', async () => {
    agent = createAgent()
    const saved: Settings[] = []
    mount(SettingsScreen, { attachTo: document.body, props: { onSave: (s: Settings) => saved.push(s) } })
    const snapshot = agent.snapshot()
    // What a closed tab holds isn't listed: the act finds it.
    expect(snapshot.map(({ component, label }) => `${component}:${label}`)).toEqual(['tabs:Settings', 'input:Project name', 'select:Visibility', 'button:Save settings'])
    const result = await agent.act({ steps: benchmarkSteps })
    expect(result.error).toBeUndefined()
    expect(result.ok).toBe(true)
    expect(result.steps.map(step => step.result).filter(Boolean)).toEqual([
      expect.stringMatching(/^Pressed "Make admin", after opening c\d+\. c\d+ is closed now\.$/),
      expect.stringMatching(/^Pressed "Remove", after opening c\d+\. c\d+ is closed now\.$/),
      'Pressed "Remove".',
      'Pressed "Save settings".',
    ])
    expect(Object.entries(result.values).filter(([key]) => /Deploy failures|Weekly digest|Mentions|New members/.test(key)).map(([key, value]) => [key.replace(/^c\d+ /, ''), value])).toEqual([
      ['Email > Deploy failures', true],
      ['Weekly digest', false],
      ['Mentions', true],
      ['Slack > Deploy failures', true],
      ['New members', false],
    ])
    expect(isCorrect(saved)).toBe(true)
  }, 30000)
})
