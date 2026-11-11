import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '.'

function mountTabs() {
  document.body.innerHTML = ''
  const Fixture = defineComponent({
    setup() {
      // Default (automatic) activation: a focused tab is selected.
      return () => h(TabsRoot, { defaultValue: 'one' }, () => [
        h(TabsList, () => [
          h(TabsTrigger, { 'value': 'one', 'data-testid': 'one' }, () => 'One'),
          h(TabsTrigger, { 'value': 'two', 'data-testid': 'two' }, () => 'Two'),
        ]),
        h(TabsContent, { value: 'one' }, () => 'One content'),
        h(TabsContent, { value: 'two' }, () => 'Two content'),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  return (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
}

describe('given Tabs with automatic activation, in a real browser', () => {
  it('activates a tab on left click', async () => {
    const get = mountTabs()

    await userEvent.click(get('two'))
    await expect.poll(() => get('two').getAttribute('data-state')).toBe('active')
  })

  // jsdom never moves focus on mousedown, so the focus-driven activation in #2258 only shows up here.
  it.each(['right', 'middle'] as const)('does not focus or activate a tab on %s click', async (button) => {
    const get = mountTabs()

    await userEvent.click(get('two'), { button })

    expect(document.activeElement).not.toBe(get('two'))
    expect(get('two').getAttribute('data-state')).toBe('inactive')
    expect(get('one').getAttribute('data-state')).toBe('active')
  })
})
