import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '.'

function mountTabs(activationMode?: 'automatic' | 'manual') {
  document.body.innerHTML = ''
  const Fixture = defineComponent({
    setup() {
      return () => h(TabsRoot, { defaultValue: 'one', activationMode }, () => [
        h(TabsList, () => [
          h(TabsTrigger, { 'value': 'one', 'data-testid': 'one' }, () => 'One'),
          h(TabsTrigger, { 'value': 'two', 'data-testid': 'two' }, () => 'Two'),
        ]),
        h(TabsContent, { 'value': 'one', 'data-testid': 'panel' }, () => 'One content'),
        h(TabsContent, { 'value': 'two', 'data-testid': 'panel' }, () => 'Two content'),
        h('div', { 'data-testid': 'outside', 'style': 'height: 40px' }, 'Outside'),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  return (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
}

function center(el: Element) {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

describe.each(['automatic', 'manual'] as const)('given Tabs with %s activation, in a real browser', (activationMode) => {
  it('activates a tab on left click', async () => {
    const get = mountTabs(activationMode)

    await userEvent.click(get('two'))
    await expect.poll(() => get('two').getAttribute('data-state')).toBe('checked')
    expect(get('panel').textContent).toBe('Two content')
  })

  // jsdom never moves focus on mousedown, so the focus-driven activation in #2258 only shows up here.
  it.each(['right', 'middle'] as const)('does not focus or activate a tab on %s click', async (button) => {
    const get = mountTabs(activationMode)

    await userEvent.click(get('two'), { button })

    expect(document.activeElement).not.toBe(get('two'))
    expect(get('two').getAttribute('data-state')).toBe('unchecked')
    expect(get('one').getAttribute('data-state')).toBe('checked')
  })
})

// Base UI (#842): a press selects a tab once it is released over it, unless
// the press's focus selects it first (automatic activation).
describe('given Tabs with the default (manual) activation, in a real browser', () => {
  it('does not activate a tab pressed and then released outside it', async () => {
    const get = mountTabs()
    const from = center(get('two'))
    const to = center(get('outside'))

    await commands.mouseDrag(from.x, from.y, to.x, to.y)
    await new Promise(resolve => requestAnimationFrame(resolve))

    expect(document.activeElement).toBe(get('two'))
    expect(get('two').getAttribute('data-state')).toBe('unchecked')
    expect(get('one').getAttribute('data-state')).toBe('checked')
    expect(get('panel').textContent).toBe('One content')
  })

  it('moves focus with the arrow keys without activating, and activates on Enter or Space', async () => {
    const get = mountTabs()
    get('one').focus()

    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(get('two'))
    expect(get('two').getAttribute('data-state')).toBe('unchecked')
    expect(get('panel').textContent).toBe('One content')

    await userEvent.keyboard('{Enter}')
    await expect.poll(() => get('two').getAttribute('data-state')).toBe('checked')

    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(get('one'))
    expect(get('one').getAttribute('data-state')).toBe('unchecked')
    await userEvent.keyboard(' ')
    await expect.poll(() => get('one').getAttribute('data-state')).toBe('checked')
  })
})

describe('given Tabs with automatic activation, in a real browser', () => {
  it('activates a tab on press, before it is released', async () => {
    const get = mountTabs('automatic')
    const from = center(get('two'))
    const to = center(get('outside'))

    await commands.mouseDrag(from.x, from.y, to.x, to.y)

    await expect.poll(() => get('two').getAttribute('data-state')).toBe('checked')
  })

  it('activates a tab when the arrow keys focus it', async () => {
    const get = mountTabs('automatic')
    get('one').focus()

    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(() => get('two').getAttribute('data-state')).toBe('checked')
  })
})
