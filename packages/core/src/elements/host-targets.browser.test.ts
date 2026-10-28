import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { comboboxElements, defineRekaElements, editableElements, listboxElements, selectElements, tagsInputElements } from '.'
import { cleanup, query, render, settle } from './elements.test.helpers'

// Foundation pieces the collection families needed: parts rendered onto an
// `<input>` child (`target: 'input'`), fallback text (`text`), and a Teleport
// into a detached fragment (closed `SelectContent`).

beforeAll(() => {
  defineRekaElements([listboxElements, comboboxElements, selectElements, tagsInputElements, editableElements])
})
afterEach(cleanup)

describe('parts rendered onto an `<input>` child', () => {
  it('render onto the input you give them, keeping your attributes, and let go of it when removed', async () => {
    render(`
      <reka-listbox-root>
        <reka-listbox-filter disabled><input id="search" class="field" aria-label="Search"></reka-listbox-filter>
        <reka-listbox-content aria-label="Items"><reka-listbox-item value="a">A</reka-listbox-item></reka-listbox-content>
      </reka-listbox-root>
    `)
    const filter = query('reka-listbox-filter')
    const input = query<HTMLInputElement>('#search')
    await vi.waitFor(() => expect(input.getAttribute('type')).toBe('text'))
    // The host stays a plain wrapper; the input is the part.
    expect(filter.hasAttribute('type')).toBe(false)
    expect(input.className).toBe('field')
    // DOM state is set as properties, as Vue sets it on an input.
    expect(input.disabled).toBe(true)
    expect(input.getAttribute('data-disabled')).toBe('')

    filter.remove()
    await settle()
    expect(input.hasAttribute('type')).toBe(false)
    expect(input.hasAttribute('data-disabled')).toBe(false)
    expect(input.disabled).toBe(false)
    expect(input.getAttribute('aria-label')).toBe('Search')
  })

  it('give back the input\'s own DOM properties', async () => {
    render(`
      <reka-listbox-root>
        <reka-listbox-filter><input id="search" aria-label="Search" disabled></reka-listbox-filter>
        <reka-listbox-content aria-label="Items"><reka-listbox-item value="a">A</reka-listbox-item></reka-listbox-content>
      </reka-listbox-root>
    `)
    const input = query<HTMLInputElement>('#search')
    await vi.waitFor(() => expect(input.getAttribute('type')).toBe('text'))
    expect(input.disabled).toBe(false)

    query('reka-listbox-filter').remove()
    await settle()
    expect(input.disabled).toBe(true)
  })

  it('create an input when they have none', async () => {
    render(`
      <reka-tags-input-root>
        <reka-tags-input-input placeholder="Add"></reka-tags-input-input>
      </reka-tags-input-root>
    `)
    const host = query('reka-tags-input-input')
    await vi.waitFor(() => expect(host.querySelector('input')?.placeholder).toBe('Add'))
    expect(host.children).toHaveLength(1)
  })

  it('type into the input: the value is the part\'s', async () => {
    render(`
      <reka-editable-root default-value="Hi" activation-mode="dblclick">
        <reka-editable-area><reka-editable-preview></reka-editable-preview><reka-editable-input></reka-editable-input></reka-editable-area>
      </reka-editable-root>
    `)
    await vi.waitFor(() => expect(query('reka-editable-preview').textContent).toBe('Hi'))
    await userEvent.dblClick(query('reka-editable-preview'))
    const input = query<HTMLInputElement>('reka-editable-input > input')
    await vi.waitFor(() => expect(document.activeElement).toBe(input))
    expect(input.value).toBe('Hi')
  })
})

describe('fallback text', () => {
  it('is the element\'s text while it has no children, and goes away with the part', async () => {
    render(`
      <reka-select-root default-value="b">
        <reka-select-trigger aria-label="Letter"><reka-select-value placeholder="Pick"></reka-select-value></reka-select-trigger>
        <reka-select-portal><reka-select-content>
          <reka-select-viewport><reka-select-item value="b"><reka-select-item-text>Bee</reka-select-item-text></reka-select-item></reka-select-viewport>
        </reka-select-content></reka-select-portal>
      </reka-select-root>
    `)
    const value = query('reka-select-value')
    await vi.waitFor(() => expect(value.textContent).toBe('Bee'))
    const trigger = query('reka-select-trigger')
    value.remove()
    await settle()
    expect(value.textContent).toBe('')
    // Back under its parent, it renders the text again.
    trigger.append(value)
    await vi.waitFor(() => expect(value.textContent).toBe('Bee'))
  })
})

describe('a Teleport into a detached fragment', () => {
  it('keeps the closed select content in place and hidden, with its items rendered', async () => {
    render(`
      <reka-select-root>
        <reka-select-trigger aria-label="Letter"><reka-select-value placeholder="Pick"></reka-select-value></reka-select-trigger>
        <reka-select-portal><reka-select-content>
          <reka-select-viewport><reka-select-item value="b"><reka-select-item-text>Bee</reka-select-item-text></reka-select-item></reka-select-viewport>
        </reka-select-content></reka-select-portal>
      </reka-select-root>
    `)
    const content = query('reka-select-content')
    const item = query('reka-select-item')
    await vi.waitFor(() => expect(item.getAttribute('role')).toBe('option'))
    expect(content.isConnected).toBe(true)
    expect(content.hasAttribute('data-reka-unmounted')).toBe(true)
    expect(content.getBoundingClientRect().height).toBe(0)
    // Setting the value shows its label, registered by the closed items.
    ;(query('reka-select-root') as HTMLElement & { modelValue: string }).modelValue = 'b'
    await vi.waitFor(() => expect(query('reka-select-value').textContent).toBe('Bee'))
  })
})
