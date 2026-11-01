import { renderToString } from '@vue/server-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

const fruits = ['Apple', 'Banana', 'Cherry']

function fixture(rootProps: Record<string, unknown> = {}) {
  return defineComponent({
    setup: () => () => h('form', h(SelectRoot, { name: 'fruit', ...rootProps }, () => [
      h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { placeholder: 'Pick a fruit' })),
      h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () =>
        fruits.map(value => h(SelectItem, { value }, () => h(SelectItemText, () => value)))))),
    ])),
  })
}

/** Server-renders `component`, then hydrates it; returns the server HTML and the client's hydration warnings. */
async function hydrate(component: ReturnType<typeof fixture>) {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const html = await renderToString(createSSRApp(component))
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.innerHTML = ''
  document.body.append(container)
  const app = createSSRApp(component)
  app.mount(container)
  await nextTick()
  const messages = [...warn.mock.calls, ...error.mock.calls].flat().join('\n')
  app.unmount()
  return { html, messages }
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('given a closed Select on the server', () => {
  it('renders the placeholder and no items, and hydrates without mismatches', async () => {
    const { html, messages } = await hydrate(fixture({ defaultValue: 'Banana' }))
    // The server mounts nothing, so no item text registers a label: the value
    // shows once the client resolved it.
    expect(html).toContain('Pick a fruit')
    expect(html).not.toContain('role="option"')
    expect(messages).not.toContain('Hydration')
  })

  it('renders the selected label from `items`, and hydrates without mismatches', async () => {
    const items = fruits.map(value => ({ value, label: `${value}!` }))
    const { html, messages } = await hydrate(fixture({ defaultValue: 'Banana', items }))
    expect(html).toContain('Banana!')
    expect(html).not.toContain('Pick a fruit')
    expect(html).not.toContain('role="option"')
    expect(messages).not.toContain('Hydration')
  })
})
