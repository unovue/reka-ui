import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createAgent } from '@/agent'
import Fixture from './fixtures/Agent.vue'
import { byId, mount, until, warnings } from './utils'

declare const __VAPOR__: boolean

// The agent bridge has no Vapor path yet: components from `reka-ui/vapor` call its hooks, which must do
// nothing there, so a page with a bridge renders and works as one without.
describe('the agent bridge beside Vapor components', () => {
  let agent: ReturnType<typeof createAgent> | undefined
  afterEach(() => {
    agent?.destroy()
    agent = undefined
  })

  it('mounts and works with a bridge created first, and registers none of them', async () => {
    agent = createAgent()
    await mount(Fixture)
    await userEvent.click(byId('wire'))
    await until(() => expect(byId('wire').getAttribute('aria-checked')).toBe('true'))
    const kinds = agent.snapshot().map(component => component.component)
    if (__VAPOR__)
      expect(kinds.filter(kind => kind !== 'input' && kind !== 'button')).toEqual([])
    expect(warnings.filter(warning => /agent|getCurrentInstance/i.test(warning))).toEqual([])
  })
})
