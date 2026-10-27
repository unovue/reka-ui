import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { mountInShadowRoot } from '@/shared/test/shadowDom'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

const fruits = ['Apple', 'Banana', 'Blueberry', 'Cherry']

function mountSelect(contentProps: Record<string, unknown> = {}) {
  const Fixture = defineComponent({
    setup() {
      return () => h('div', { style: 'padding: 200px 100px;' }, [
        h('button', { 'data-testid': 'outside' }, 'Outside'),
        h(SelectRoot, { name: 'fruit' }, () => [
          h(SelectTrigger, { 'data-testid': 'trigger', 'aria-label': 'Fruit', 'style': 'width: 160px; height: 32px;' }, () =>
            h(SelectValue, { 'data-testid': 'value', 'placeholder': 'Pick a fruit' })),
          h(SelectPortal, () => h(SelectContent, { 'data-testid': 'content', 'style': 'background: white;', ...contentProps }, () =>
            h(SelectViewport, () => fruits.map(value => h(SelectItem, { value, 'data-testid': `item-${value}`, 'style': 'height: 24px;' }, () =>
              h(SelectItemText, () => value)))))),
        ]),
      ])
    },
  })
  return mountInShadowRoot(Fixture)
}

describe.each(['item-aligned', 'popper'] as const)('given a Select (%s) inside a shadow root, in a real browser', (position) => {
  it('selects with the pointer', async () => {
    const { get, shadowRoot, activeElement } = mountSelect({ position })

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('item-Banana')).not.toBeNull()
    expect(get('content')!.getRootNode()).toBe(shadowRoot)
    await userEvent.click(get('item-Banana')!)
    await expect.poll(() => get('value')?.textContent).toBe('Banana')
    expect(get('content')).toBeNull()
    expect(activeElement()).toBe(get('trigger'))
  })

  it('navigates with the keyboard and typeahead', async () => {
    const { get, activeElement } = mountSelect({ position })

    get('trigger')!.focus()
    await userEvent.keyboard('{Enter}')
    await expect.poll(activeElement).toBe(get('item-Apple'))
    await userEvent.keyboard('{ArrowDown}')
    expect(activeElement()).toBe(get('item-Banana'))
    await userEvent.keyboard('c')
    expect(activeElement()).toBe(get('item-Cherry'))
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => get('value')?.textContent).toBe('Cherry')
    expect(activeElement()).toBe(get('trigger'))
  })

  it('closes on Escape and on an outside press without selecting', async () => {
    const { get, query } = mountSelect({ position })

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    await userEvent.click(query('[data-reka-internal-backdrop]') ?? get('outside')!, { position: { x: 5, y: 5 } })
    await expect.poll(() => get('content')).toBeNull()
    expect(get('value')?.textContent).toBe('Pick a fruit')
  })
})
