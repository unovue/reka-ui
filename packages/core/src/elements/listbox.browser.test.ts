import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineRekaElements, listboxElements } from '.'
import { cleanup, query, render } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([listboxElements])
})
afterEach(cleanup)

const LISTBOX = `
  <button id="before">Before</button>
  <reka-listbox-root name="fruit">
    <reka-listbox-content aria-label="Fruits" style="display: block">
      <reka-listbox-item value="apple">Apple<reka-listbox-item-indicator>✓</reka-listbox-item-indicator></reka-listbox-item>
      <reka-listbox-item value="banana">Banana</reka-listbox-item>
      <reka-listbox-item value="cherry" disabled>Cherry</reka-listbox-item>
      <reka-listbox-item value="date">Date</reka-listbox-item>
    </reka-listbox-content>
  </reka-listbox-root>
`

function items() {
  return [...document.querySelectorAll<HTMLElement>('reka-listbox-item')]
}

async function mounted() {
  await vi.waitFor(() => expect(items().every(item => item.getAttribute('role') === 'option')).toBe(true))
}

function highlighted() {
  return document.querySelector('reka-listbox-item[data-highlighted]')?.textContent
}

describe('listbox elements', () => {
  it('renders the listbox and its options, wired with ARIA', async () => {
    render(LISTBOX)
    await mounted()
    const content = query('reka-listbox-content')
    expect(content.getAttribute('role')).toBe('listbox')
    expect(items().map(item => item.getAttribute('aria-selected'))).toEqual(['false', 'false', 'false', 'false'])
    expect(items()[2].hasAttribute('data-disabled')).toBe(true)
    // Unchecked: the indicator is not rendered.
    expect(query('reka-listbox-item-indicator').hasAttribute('data-reka-unmounted')).toBe(true)
  })

  it('highlights with the arrow keys and typeahead, skipping disabled items, and selects with Enter', async () => {
    render(LISTBOX)
    await mounted()
    const root = query('reka-listbox-root')
    const changes: unknown[] = []
    root.addEventListener('update-model-value', event => changes.push((event as CustomEvent).detail.value))

    await userEvent.click(query('#before'))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(items()[0])
    expect(highlighted()).toContain('Apple')
    await userEvent.keyboard('{ArrowDown}')
    expect(highlighted()).toBe('Banana')
    expect(document.activeElement).toBe(items()[1])
    await userEvent.keyboard('{ArrowDown}')
    expect(highlighted()).toBe('Date')
    await userEvent.keyboard('{Home}')
    expect(highlighted()).toContain('Apple')
    await userEvent.keyboard('b')
    expect(highlighted()).toBe('Banana')

    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => expect(items()[1].getAttribute('aria-selected')).toBe('true'))
    expect(changes).toEqual(['banana'])
    await userEvent.click(items()[0])
    await vi.waitFor(() => expect(items()[0].getAttribute('data-state')).toBe('checked'))
    expect(query('reka-listbox-item-indicator').hasAttribute('data-reka-unmounted')).toBe(false)
    expect(changes).toEqual(['banana', 'apple'])
  })

  it('submits the selection with its form, and resets', async () => {
    const container = render(`<form>${LISTBOX}</form>`)
    await mounted()
    const form = container.querySelector('form')!
    // Nothing selected: an empty value, as the Vue component's hidden input submits.
    expect(new FormData(form).get('fruit')).toBe('')
    await userEvent.click(items()[1])
    await vi.waitFor(() => expect(new FormData(form).get('fruit')).toBe('banana'))
    form.reset()
    await vi.waitFor(() => expect(new FormData(form).get('fruit')).toBe(''))
    await vi.waitFor(() => expect(items()[1].getAttribute('aria-selected')).toBe('false'))
  })

  it('selects several values with `multiple`, and submits each of them', async () => {
    const container = render(`<form>${LISTBOX.replace('<reka-listbox-root', '<reka-listbox-root multiple')}</form>`)
    await mounted()
    const form = container.querySelector('form')!
    const root = query('reka-listbox-root')
    const changes: unknown[] = []
    root.addEventListener('update-model-value', event => changes.push((event as CustomEvent).detail.value))
    expect(query('reka-listbox-content').getAttribute('aria-multiselectable')).toBe('true')

    await userEvent.click(items()[1])
    await userEvent.click(items()[3])
    await vi.waitFor(() => expect([...new FormData(form).entries()]).toEqual([['fruit[0]', 'banana'], ['fruit[1]', 'date']]))
    expect(items().map(item => item.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false', 'true'])
    expect(changes).toEqual([['banana'], ['banana', 'date']])
    // Toggles off again.
    await userEvent.click(items()[1])
    await vi.waitFor(() => expect([...new FormData(form).entries()]).toEqual([['fruit[0]', 'date']]))
  })

  it('takes object values through properties, compared with `by`', async () => {
    render(`
      <reka-listbox-root by="id">
        <reka-listbox-content aria-label="Users">
          <reka-listbox-item>Ada</reka-listbox-item>
          <reka-listbox-item>Grace</reka-listbox-item>
        </reka-listbox-content>
      </reka-listbox-root>
    `)
    const [ada, grace] = items() as (HTMLElement & { value: unknown })[]
    ada.value = { id: 1, name: 'Ada' }
    grace.value = { id: 2, name: 'Grace' }
    const root = query<HTMLElement & { modelValue: unknown }>('reka-listbox-root')
    // Another object with the same `id`: selected through `by`.
    root.modelValue = { id: 2 }
    await vi.waitFor(() => expect(grace.getAttribute('aria-selected')).toBe('true'))
    expect(ada.getAttribute('aria-selected')).toBe('false')

    const changes: unknown[] = []
    root.addEventListener('update-model-value', (event) => {
      changes.push((event as CustomEvent).detail.value)
      root.modelValue = (event as CustomEvent).detail.value
    })
    await userEvent.click(ada)
    await vi.waitFor(() => expect(ada.getAttribute('aria-selected')).toBe('true'))
    expect(changes).toEqual([{ id: 1, name: 'Ada' }])
    expect(grace.getAttribute('aria-selected')).toBe('false')
  })

  it('navigates items in DOM order after they are inserted and reordered', async () => {
    render(LISTBOX)
    await mounted()
    const content = query('reka-listbox-content')
    const fig = document.createElement('reka-listbox-item')
    fig.setAttribute('value', 'fig')
    fig.textContent = 'Fig'
    // Inserted first, and the last item moved before the second.
    content.prepend(fig)
    content.insertBefore(items()[4], items()[2])
    await vi.waitFor(() => expect(fig.getAttribute('role')).toBe('option'))
    expect(items().map(item => item.textContent)).toEqual(['Fig', 'Apple✓', 'Date', 'Banana', 'Cherry'])

    await userEvent.click(query('#before'))
    await userEvent.keyboard('{Tab}')
    await userEvent.keyboard('{Home}')
    expect(highlighted()).toBe('Fig')
    expect(document.activeElement).toBe(fig)
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(highlighted()).toBe('Date')
    await userEvent.keyboard('{ArrowDown}')
    expect(highlighted()).toBe('Banana')
    await userEvent.keyboard('{End}')
    expect(highlighted()).toBe('Banana')
  })

  it('filters through `<reka-listbox-filter>` with a `filter` property', async () => {
    render(`
      <reka-listbox-root>
        <reka-listbox-filter><input aria-label="Search"></reka-listbox-filter>
        <reka-listbox-content aria-label="Fruits">
          <reka-listbox-group>
            <reka-listbox-group-label>Fruits</reka-listbox-group-label>
            <reka-listbox-item value="apple">Apple</reka-listbox-item>
            <reka-listbox-item value="banana">Banana</reka-listbox-item>
            <reka-listbox-item value="blueberry">Blueberry</reka-listbox-item>
          </reka-listbox-group>
        </reka-listbox-content>
      </reka-listbox-root>
    `)
    const root = query<HTMLElement & { filter: unknown }>('reka-listbox-root')
    root.filter = (text: string, search: string) => text.toLowerCase().startsWith(search.toLowerCase())
    const input = query<HTMLInputElement>('reka-listbox-filter > input')
    await vi.waitFor(() => expect(input.getAttribute('type')).toBe('text'))
    expect(query('reka-listbox-group').getAttribute('role')).toBe('group')
    expect(document.getElementById(query('reka-listbox-group').getAttribute('aria-labelledby')!)!.textContent).toBe('Fruits')

    const filter = query('reka-listbox-filter')
    const searches: unknown[] = []
    filter.addEventListener('update-model-value', event => searches.push((event as CustomEvent).detail.value))
    await userEvent.type(input, 'b')
    await vi.waitFor(() => expect(items()[0].hasAttribute('data-reka-unmounted')).toBe(true))
    expect(searches).toEqual(['b'])
    expect(items().filter(item => !item.hasAttribute('data-reka-unmounted')).map(item => item.textContent)).toEqual(['Banana', 'Blueberry'])
    // The input keeps focus; the options are highlighted through `aria-activedescendant`.
    expect(input.getAttribute('aria-activedescendant')).toBe(items()[1].id)
    await userEvent.keyboard('{ArrowDown}')
    expect(input.getAttribute('aria-activedescendant')).toBe(items()[2].id)
    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => expect(items()[2].getAttribute('aria-selected')).toBe('true'))
    expect(document.activeElement).toBe(input)
  })
})
