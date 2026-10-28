import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { autocompleteElements, comboboxElements, defineRekaElements } from '.'
import { cleanup, query, render, settle } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([comboboxElements, autocompleteElements])
})
afterEach(cleanup)

const COMBOBOX = `
  <button id="outside">Outside</button>
  <form>
    <reka-combobox-root name="fruit">
      <reka-combobox-anchor>
        <reka-combobox-input><input aria-label="Fruit" placeholder="Pick a fruit"></reka-combobox-input>
        <reka-combobox-trigger aria-label="Show fruits">▾</reka-combobox-trigger>
        <reka-combobox-cancel aria-label="Clear">×</reka-combobox-cancel>
      </reka-combobox-anchor>
      <reka-combobox-portal>
        <reka-combobox-content position="popper" style="background: white">
          <reka-combobox-viewport>
            <reka-combobox-empty>No fruit</reka-combobox-empty>
            <reka-combobox-group>
              <reka-combobox-label>Fruits</reka-combobox-label>
              <reka-combobox-item value="apple">Apple<reka-combobox-item-indicator>✓</reka-combobox-item-indicator></reka-combobox-item>
              <reka-combobox-item value="banana">Banana</reka-combobox-item>
              <reka-combobox-item value="blueberry">Blueberry</reka-combobox-item>
            </reka-combobox-group>
            <reka-combobox-separator></reka-combobox-separator>
            <reka-combobox-item value="carrot"></reka-combobox-item>
          </reka-combobox-viewport>
        </reka-combobox-content>
      </reka-combobox-portal>
    </reka-combobox-root>
  </form>
`

function items() {
  return [...document.querySelectorAll<HTMLElement>('reka-combobox-item')]
}

function shown() {
  return items().filter(item => !item.hasAttribute('data-reka-unmounted')).map(item => item.textContent)
}

async function mount(html = COMBOBOX) {
  const container = render(html)
  const input = query<HTMLInputElement>('reka-combobox-input > input')
  await vi.waitFor(() => expect(input.getAttribute('role')).toBe('combobox'))
  return { container, input, content: query('reka-combobox-content') }
}

describe('combobox elements', () => {
  it('renders onto the `<input>` it holds, and opens a portaled listbox wired to it', async () => {
    const { input, content } = await mount()
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(input.placeholder).toBe('Pick a fruit')
    expect(content.hasAttribute('data-reka-unmounted')).toBe(true)

    await userEvent.click(query('reka-combobox-trigger'))
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(query('reka-combobox-portal').parentElement).toBe(document.body)
    expect(content.getAttribute('role')).toBe('listbox')
    expect(input.getAttribute('aria-controls')).toBe(content.id)
    const group = query('reka-combobox-group')
    expect(group.getAttribute('role')).toBe('group')
    expect(document.getElementById(group.getAttribute('aria-labelledby')!)!.textContent).toBe('Fruits')
    // An item without children shows its value, like the Vue component's fallback.
    expect(shown()).toEqual(['Apple✓', 'Banana', 'Blueberry', 'carrot'])
    expect(document.activeElement).toBe(input)
  })

  it('renders `<reka-combobox-arrow>`\'s SVG inside it', async () => {
    const { content } = await mount(COMBOBOX.replace('</reka-combobox-viewport>', '</reka-combobox-viewport><reka-combobox-arrow width="20" height="10"></reka-combobox-arrow>'))
    await userEvent.click(query('reka-combobox-trigger'))
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    const arrow = query('reka-combobox-arrow')
    await vi.waitFor(() => expect(arrow.querySelector('svg')).toBeInstanceOf(SVGSVGElement))
    expect(arrow.querySelector('svg')!.getAttribute('width')).toBe('20')
    // Below the trigger, pointing up at it from the content's top edge.
    await vi.waitFor(() => expect(Math.round(arrow.querySelector('svg')!.getBoundingClientRect().bottom)).toBe(Math.round(content.getBoundingClientRect().top)))
  })

  it('filters while typing, highlights with the arrow keys and selects with Enter', async () => {
    const { input, content } = await mount()
    const root = query('reka-combobox-root')
    const values: unknown[] = []
    const texts: unknown[] = []
    root.addEventListener('update-model-value', event => values.push((event as CustomEvent).detail.value))
    query('reka-combobox-input').addEventListener('update-model-value', event => texts.push((event as CustomEvent).detail.value))

    await userEvent.type(input, 'b')
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    await vi.waitFor(() => expect(shown()).toEqual(['Banana', 'Blueberry']))
    expect(texts).toEqual(['b'])
    expect(query('reka-combobox-empty').hasAttribute('data-reka-unmounted')).toBe(true)
    await vi.waitFor(() => expect(input.getAttribute('aria-activedescendant')).toBe(items()[1].id))
    await userEvent.keyboard('{ArrowDown}')
    expect(input.getAttribute('aria-activedescendant')).toBe(items()[2].id)
    expect(items()[2].hasAttribute('data-highlighted')).toBe(true)

    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
    expect(values).toEqual(['blueberry'])
    expect(input.value).toBe('blueberry')
    expect(new FormData(query('form')).get('fruit')).toBe('blueberry')

    await userEvent.clear(input)
    await userEvent.type(input, 'xyz')
    await vi.waitFor(() => expect(query('reka-combobox-empty').hasAttribute('data-reka-unmounted')).toBe(false))
    expect(shown()).toEqual([])
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
  })

  it('shows the selection with a `displayValue` set before it connects, and clears it from the cancel button', async () => {
    // `displayValue` (like `by`) is read once, when the root sets up: set it before
    // the element is connected (or defined).
    const template = document.createElement('template')
    template.innerHTML = COMBOBOX
    const root = template.content.querySelector('reka-combobox-root') as HTMLElement & { displayValue: unknown, defaultValue: unknown }
    root.displayValue = (value: string) => value.toUpperCase()
    root.defaultValue = 'apple'
    render('').append(template.content)
    const input = query<HTMLInputElement>('reka-combobox-input > input')
    await vi.waitFor(() => expect(input.value).toBe('APPLE'))
    const cleared: unknown[] = []
    query('reka-combobox-input').addEventListener('update-model-value', event => cleared.push((event as CustomEvent).detail.value))
    await userEvent.click(query('reka-combobox-cancel'))
    await vi.waitFor(() => expect(input.value).toBe(''))
    expect(cleared).toEqual([''])
  })

  it('selects objects with `multiple`, compared with `by`, and submits each of them', async () => {
    const { container, input, content } = await mount(COMBOBOX.replace('<reka-combobox-root name="fruit">', '<reka-combobox-root name="fruit" multiple by="id">'))
    const fruits = [{ id: 'a', name: 'Apple' }, { id: 'b', name: 'Banana' }, { id: 'c', name: 'Blueberry' }, { id: 'd', name: 'Carrot' }]
    items().forEach((item, index) => (item as HTMLElement & { value: unknown }).value = fruits[index])
    const root = query<HTMLElement & { modelValue: unknown }>('reka-combobox-root')
    root.modelValue = [{ id: 'b' }]
    root.addEventListener('update-model-value', event => root.modelValue = (event as CustomEvent).detail.value)

    await userEvent.click(query('reka-combobox-trigger'))
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    expect(content.getAttribute('aria-multiselectable')).toBe('true')
    expect(items().map(item => item.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false', 'false'])
    await userEvent.click(items()[3])
    await vi.waitFor(() => expect(items()[3].getAttribute('aria-selected')).toBe('true'))
    // Stays open for more.
    expect(content.getAttribute('data-state')).toBe('open')
    expect(root.modelValue).toEqual([{ id: 'b' }, { id: 'd', name: 'Carrot' }])
    const form = container.querySelector('form')!
    await vi.waitFor(() => expect([...new FormData(form).keys()]).toEqual(['fruit[0][id]', 'fruit[1][id]', 'fruit[1][name]']))
    expect(document.activeElement).toBe(input)
  })

  it('closes on an outside click', async () => {
    const { content } = await mount()
    await userEvent.click(query('reka-combobox-trigger'))
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    await userEvent.click(query('#outside'))
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
  })
})

describe('combobox inside a shadow root', () => {
  it('portals its content into the shadow root, filters and selects there', async () => {
    const host = render('<div></div>').firstElementChild!
    const shadowRoot = host.attachShadow({ mode: 'open' })
    shadowRoot.innerHTML = COMBOBOX
    const get = (selector: string) => shadowRoot.querySelector<HTMLElement>(selector)!
    const input = get('reka-combobox-input > input') as HTMLInputElement
    await vi.waitFor(() => expect(input.getAttribute('role')).toBe('combobox'))

    await userEvent.type(input, 'ban')
    const content = get('reka-combobox-content')
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    expect(get('reka-combobox-portal').parentNode).toBe(shadowRoot)
    expect(shadowRoot.getElementById(input.getAttribute('aria-controls')!)).toBe(content)
    // The viewport's scrollbar style goes into the shadow root, where it applies.
    expect([...shadowRoot.querySelectorAll('style')].some(style => style.textContent!.includes('data-reka-combobox-viewport'))).toBe(true)
    const items = [...shadowRoot.querySelectorAll<HTMLElement>('reka-combobox-item')]
    await vi.waitFor(() => expect(items.filter(item => !item.hasAttribute('data-reka-unmounted'))).toEqual([items[1]]))
    expect(input.getAttribute('aria-activedescendant')).toBe(items[1].id)
    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => expect(input.value).toBe('banana'))
    expect(content.hasAttribute('data-reka-unmounted')).toBe(true)
  })
})

describe('autocomplete elements', () => {
  it('suggests from the typed text and completes it with the highlighted item', async () => {
    render(`
      <reka-autocomplete-root name="city">
        <reka-autocomplete-anchor>
          <reka-autocomplete-input><input aria-label="City"></reka-autocomplete-input>
        </reka-autocomplete-anchor>
        <reka-autocomplete-portal>
          <reka-autocomplete-content style="background: white">
            <reka-autocomplete-viewport>
              <reka-autocomplete-item value="Paris"></reka-autocomplete-item>
              <reka-autocomplete-item value="Prague"></reka-autocomplete-item>
              <reka-autocomplete-item value="Rome"></reka-autocomplete-item>
            </reka-autocomplete-viewport>
          </reka-autocomplete-content>
        </reka-autocomplete-portal>
      </reka-autocomplete-root>
    `)
    const input = query<HTMLInputElement>('reka-autocomplete-input > input')
    await vi.waitFor(() => expect(input.getAttribute('role')).toBe('combobox'))
    const root = query('reka-autocomplete-root')
    const values: unknown[] = []
    root.addEventListener('update-model-value', event => values.push((event as CustomEvent).detail.value))

    await userEvent.type(input, 'p')
    const content = query('reka-autocomplete-content')
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    const shownItems = () => Array.from(document.querySelectorAll('reka-autocomplete-item:not([data-reka-unmounted])'), item => item.textContent)
    await vi.waitFor(() => expect(shownItems()).toEqual(['Paris', 'Prague']))
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    await vi.waitFor(() => expect(input.value).toBe('Prague'))
    // The model is the text: free text included.
    expect(values.at(-1)).toBe('Prague')
    expect(values[0]).toBe('p')
  })
})

void settle
