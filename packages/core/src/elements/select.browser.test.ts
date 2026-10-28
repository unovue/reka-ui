import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineRekaElements, selectElements } from '.'
import { cleanup, query, render } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([selectElements])
})
afterEach(cleanup)

function SELECT(rootAttributes = '', contentAttributes = '') {
  return `
  <button id="outside">Outside</button>
  <form>
    <reka-select-root name="fruit" ${rootAttributes}>
      <reka-select-trigger aria-label="Fruit" style="display: inline-block; width: 160px">
        <reka-select-value placeholder="Pick a fruit"></reka-select-value>
        <reka-select-icon>▾</reka-select-icon>
      </reka-select-trigger>
      <reka-select-portal>
        <reka-select-content ${contentAttributes} style="display: block; background: white">
          <reka-select-scroll-up-button>▴</reka-select-scroll-up-button>
          <reka-select-viewport>
            <reka-select-group>
              <reka-select-label>Fruits</reka-select-label>
              <reka-select-item value="apple">
                <reka-select-item-text>Apple</reka-select-item-text>
                <reka-select-item-indicator>✓</reka-select-item-indicator>
              </reka-select-item>
              <reka-select-item value="banana"><reka-select-item-text>Banana</reka-select-item-text></reka-select-item>
              <reka-select-item value="blueberry" disabled><reka-select-item-text>Blueberry</reka-select-item-text></reka-select-item>
              <reka-select-item value="cherry"><reka-select-item-text>Cherry</reka-select-item-text></reka-select-item>
            </reka-select-group>
            <reka-select-separator></reka-select-separator>
          </reka-select-viewport>
          <reka-select-scroll-down-button>▾</reka-select-scroll-down-button>
        </reka-select-content>
      </reka-select-portal>
    </reka-select-root>
  </form>
`
}

function items() {
  return [...document.querySelectorAll<HTMLElement>('reka-select-item')]
}

async function mount(html = SELECT()) {
  const container = render(html)
  const trigger = query('reka-select-trigger')
  await vi.waitFor(() => expect(trigger.getAttribute('role')).toBe('combobox'))
  return { container, trigger, content: query('reka-select-content'), value: query('reka-select-value') }
}

async function open(trigger: HTMLElement) {
  await userEvent.click(trigger)
  const content = query('reka-select-content')
  await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
  return content
}

describe('select elements', () => {
  it('shows the placeholder, then the selected label, in `<reka-select-value>`', async () => {
    const { trigger, value } = await mount()
    expect(value.textContent).toBe('Pick a fruit')
    expect(value.hasAttribute('data-placeholder')).toBe(true)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    const content = await open(trigger)
    expect(query('reka-select-portal').parentElement).toBe(document.body)
    expect(content.getAttribute('role')).toBe('listbox')
    expect(trigger.getAttribute('aria-controls')).toBe(content.id)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    await userEvent.click(items()[1])
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
    expect(value.textContent).toBe('Banana')
    expect(value.hasAttribute('data-placeholder')).toBe(false)
  })

  it('shows the label of a default value before it was ever opened', async () => {
    const { value } = await mount(SELECT('default-value="cherry"'))
    await vi.waitFor(() => expect(value.textContent).toBe('Cherry'))
  })

  it('keeps children you give `<reka-select-value>` instead of its text', async () => {
    render(SELECT().replace('<reka-select-value placeholder="Pick a fruit"></reka-select-value>', '<reka-select-value placeholder="Pick a fruit"><b>Custom</b></reka-select-value>'))
    const value = query('reka-select-value')
    await vi.waitFor(() => expect(query('reka-select-trigger').getAttribute('role')).toBe('combobox'))
    expect(value.innerHTML).toBe('<b>Custom</b>')
  })

  it('navigates with the keyboard, skipping disabled items, and selects with Enter', async () => {
    const { trigger, value } = await mount(SELECT('', 'position="popper"'))
    const root = query('reka-select-root')
    const changes: unknown[] = []
    root.addEventListener('update-model-value', event => changes.push((event as CustomEvent).detail.value))
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    const content = query('reka-select-content')
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    await vi.waitFor(() => expect(document.activeElement).toBe(items()[0]))
    expect(items()[0].hasAttribute('data-highlighted')).toBe(true)
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(items()[1])
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(items()[3])
    // Typeahead.
    await userEvent.keyboard('a')
    expect(document.activeElement).toBe(items()[0])
    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
    expect(changes).toEqual(['apple'])
    expect(value.textContent).toBe('Apple')
    expect(document.activeElement).toBe(trigger)

    // The selected item is checked, and its indicator rendered.
    await open(trigger)
    expect(items()[0].getAttribute('aria-selected')).toBe('true')
    expect(query('reka-select-item-indicator').hasAttribute('data-reka-unmounted')).toBe(false)
    expect(document.getElementById(query('reka-select-group').getAttribute('aria-labelledby')!)!.textContent).toBe('Fruits')
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
  })

  it('submits through a native select, resets, and reports `required`', async () => {
    const { container, trigger } = await mount(SELECT('required'))
    const form = container.querySelector('form')!
    expect(form.checkValidity()).toBe(false)
    expect(query('reka-select-root').matches(':invalid')).toBe(true)
    await open(trigger)
    await userEvent.click(items()[3])
    await vi.waitFor(() => expect(new FormData(form).get('fruit')).toBe('cherry'))
    expect(form.checkValidity()).toBe(true)
    form.reset()
    await vi.waitFor(() => expect(query('reka-select-value').textContent).toBe('Pick a fruit'))
    expect(form.checkValidity()).toBe(false)
  })

  it('selects several objects with `multiple`, compared with `by`', async () => {
    const { container, trigger, value } = await mount(SELECT('multiple by="id"', 'position="popper"'))
    const fruits = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]
    items().forEach((item, index) => (item as HTMLElement & { value: unknown }).value = fruits[index])
    const root = query<HTMLElement & { modelValue: unknown }>('reka-select-root')
    root.modelValue = [{ id: 4 }]
    root.addEventListener('update-model-value', event => root.modelValue = (event as CustomEvent).detail.value)
    const content = await open(trigger)
    expect(items()[3].getAttribute('aria-selected')).toBe('true')
    await userEvent.click(items()[0])
    await vi.waitFor(() => expect(items()[0].getAttribute('aria-selected')).toBe('true'))
    // Stays open.
    expect(content.getAttribute('data-state')).toBe('open')
    expect(root.modelValue).toEqual([{ id: 4 }, { id: 1 }])
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(value.textContent).toBe('Cherry, Apple'))
    expect(new FormData(container.querySelector('form')!).getAll('fruit')).toHaveLength(2)
  })
})
