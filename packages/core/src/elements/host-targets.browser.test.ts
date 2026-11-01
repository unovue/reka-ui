import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { comboboxElements, defineRekaElements, editableElements, listboxElements, selectElements, switchElements, tagsInputElements } from '.'
import { cleanup, query, render, settle } from './elements.test.helpers'

// Foundation pieces the collection families needed: parts rendered onto an
// `<input>` child (`target: 'input'`), fallback text (`text`), and a Teleport
// into a detached fragment (closed `SelectContent`).

beforeAll(() => {
  defineRekaElements([listboxElements, comboboxElements, selectElements, switchElements, tagsInputElements, editableElements])
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
    // `disabled` is owned like any attribute the part renders.
    expect(input.disabled).toBe(true)
    expect(input.getAttribute('data-disabled')).toBe('')

    filter.remove()
    await settle()
    expect(input.hasAttribute('type')).toBe(false)
    expect(input.hasAttribute('data-disabled')).toBe(false)
    expect(input.disabled).toBe(false)
    expect(input.getAttribute('aria-label')).toBe('Search')
  })

  it('own `disabled` like an attribute: the consumer\'s value, and writes to it while rendered, are what remain', async () => {
    render(`
      <reka-listbox-root>
        <reka-listbox-filter id="first"><input id="kept" aria-label="Kept" disabled></reka-listbox-filter>
        <reka-listbox-content aria-label="Items"><reka-listbox-item value="a">A</reka-listbox-item></reka-listbox-content>
      </reka-listbox-root>
      <reka-listbox-root>
        <reka-listbox-filter id="second"><input id="written" aria-label="Written"></reka-listbox-filter>
        <reka-listbox-content aria-label="Items"><reka-listbox-item value="b">B</reka-listbox-item></reka-listbox-content>
      </reka-listbox-root>
    `)
    const kept = query<HTMLInputElement>('#kept')
    const written = query<HTMLInputElement>('#written')
    await vi.waitFor(() => expect(written.getAttribute('type')).toBe('text'))
    expect(kept.disabled).toBe(true)
    written.setAttribute('disabled', '')
    await settle()

    query('#first').remove()
    query('#second').remove()
    await settle()
    expect(kept.disabled).toBe(true)
    expect(written.disabled).toBe(true)
  })

  it('a `cloneNode()` copy starts from the input\'s own state', async () => {
    render(`
      <reka-combobox-root disabled>
        <reka-combobox-anchor><reka-combobox-input id="original"><input aria-label="Fruit"></reka-combobox-input></reka-combobox-anchor>
      </reka-combobox-root>
      <reka-combobox-root><reka-combobox-anchor id="other"></reka-combobox-anchor></reka-combobox-root>
    `)
    const host = query('#original')
    await vi.waitFor(() => expect(host.querySelector('input')!.getAttribute('role')).toBe('combobox'))
    expect(host.querySelector('input')!.disabled).toBe(true)
    const copy = host.cloneNode(true) as HTMLElement
    copy.id = 'copy'
    query('#other').append(copy)
    const input = copy.querySelector('input')!
    await vi.waitFor(() => expect(input.getAttribute('role')).toBe('combobox'))
    expect(input.disabled).toBe(false)
    copy.remove()
    await settle()
    expect(input.disabled).toBe(false)
    expect(input.hasAttribute('role')).toBe(false)
  })

  it('move to an input that replaces theirs', async () => {
    render(`
      <reka-listbox-root>
        <reka-listbox-filter><input id="old" aria-label="Search"></reka-listbox-filter>
        <reka-listbox-content aria-label="Items"><reka-listbox-item value="a">A</reka-listbox-item></reka-listbox-content>
      </reka-listbox-root>
    `)
    const old = query<HTMLInputElement>('#old')
    await vi.waitFor(() => expect(old.getAttribute('type')).toBe('text'))
    const next = document.createElement('input')
    next.setAttribute('aria-label', 'Search')
    old.replaceWith(next)
    await vi.waitFor(() => expect(next.getAttribute('type')).toBe('text'))
    expect(old.hasAttribute('type')).toBe(false)
    expect(query('reka-listbox-filter').children).toHaveLength(1)
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
    // It is the element's, not yours: it goes when the element is removed.
    host.remove()
    await settle()
    expect(host.children).toHaveLength(0)
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

describe('fallback text and the consumer\'s children', () => {
  const SELECT = (value = '') => `
    <reka-select-root>
      <reka-select-trigger aria-label="Letter"><reka-select-value placeholder="Pick">${value}</reka-select-value></reka-select-trigger>
      <reka-select-portal><reka-select-content>
        <reka-select-viewport><reka-select-item value="b"><reka-select-item-text>Bee</reka-select-item-text></reka-select-item></reka-select-viewport>
      </reka-select-content></reka-select-portal>
    </reka-select-root>
  `

  it('children added later take the text\'s place, and stay through renders and removal', async () => {
    render(SELECT())
    const value = query('reka-select-value')
    await vi.waitFor(() => expect(value.textContent).toBe('Pick'))
    const icon = document.createElement('span')
    icon.textContent = 'Custom'
    value.append(icon)
    await settle()
    expect(value.textContent).toBe('Custom')
    ;(query('reka-select-root') as HTMLElement & { modelValue: string }).modelValue = 'b'
    await settle()
    expect(value.childNodes).toEqual(expect.objectContaining({ length: 1 }))
    expect(value.firstChild).toBe(icon)

    const trigger = query('reka-select-trigger')
    value.remove()
    await settle()
    expect(value.firstChild).toBe(icon)
    trigger.append(value)
  })

  it('comes back when the consumer removes its children', async () => {
    render(SELECT('<span id="mine">Mine</span>'))
    const value = query('reka-select-value')
    await vi.waitFor(() => expect(query('reka-select-trigger').getAttribute('role')).toBe('combobox'))
    await settle()
    expect(value.textContent).toBe('Mine')
    query('#mine').remove()
    await vi.waitFor(() => expect(value.textContent).toBe('Pick'))
  })
})

describe('form association', () => {
  const LISTBOX = (attributes = '') => `
    <reka-listbox-root name="x" default-value="a" ${attributes}>
      <reka-listbox-content aria-label="Items"><reka-listbox-item value="a">A</reka-listbox-item></reka-listbox-content>
    </reka-listbox-root>
  `

  it('a root associated with a form by `form="id"` submits with it', async () => {
    render(`<form id="f"></form>${LISTBOX('form="f"')}`)
    await vi.waitFor(() => expect(new FormData(query<HTMLFormElement>('#f')).get('x')).toBe('a'))
    expect((query('reka-listbox-root') as HTMLElement & { form: HTMLFormElement | null }).form).toBe(query('#f'))
  })

  it('a root moved into a form after it rendered submits with it', async () => {
    render(`<form id="f"></form>${LISTBOX()}`)
    await vi.waitFor(() => expect(query('reka-listbox-item').getAttribute('role')).toBe('option'))
    query('#f').append(query('reka-listbox-root'))
    await vi.waitFor(() => expect(new FormData(query<HTMLFormElement>('#f')).get('x')).toBe('a'))
  })

  it('a switch associated by `form="id"` submits with it', async () => {
    render(`<form id="g"></form><reka-switch-root name="s" form="g" default-value aria-label="S"></reka-switch-root>`)
    await vi.waitFor(() => expect(new FormData(query<HTMLFormElement>('#g')).get('s')).toBe('on'))
  })
})

describe('a part\'s root-level `<style>`', () => {
  it('goes into the head while the part renders, and leaves with it', async () => {
    const styles = () => document.head.querySelectorAll('style').length
    const before = styles()
    const container = render('')
    const mount = async () => {
      container.innerHTML = `
        <reka-select-root default-open>
          <reka-select-trigger aria-label="Letter"><reka-select-value placeholder="Pick"></reka-select-value></reka-select-trigger>
          <reka-select-portal><reka-select-content position="popper">
            <reka-select-viewport><reka-select-item value="b"><reka-select-item-text>Bee</reka-select-item-text></reka-select-item></reka-select-viewport>
          </reka-select-content></reka-select-portal>
        </reka-select-root>
      `
      await vi.waitFor(() => expect(query('reka-select-item').getAttribute('role')).toBe('option'))
      await settle()
    }
    await mount()
    const mounted = styles()
    expect(mounted).toBeGreaterThan(before)
    for (let cycle = 0; cycle < 3; cycle++) {
      container.innerHTML = ''
      await settle()
      expect(styles()).toBe(before)
      await mount()
      expect(styles()).toBe(mounted)
    }
  })
})

describe('a Teleport into a detached fragment', () => {
  it('keeps the closed select content in place and hidden, its items rendered only for their labels', async () => {
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
    await vi.waitFor(() => expect(query('reka-select-value').textContent).toBe('Pick'))
    // A closed select keeps no items mounted.
    expect(item.getAttribute('role')).toBeNull()
    expect(content.isConnected).toBe(true)
    expect(content.hasAttribute('data-reka-unmounted')).toBe(true)
    expect(content.getBoundingClientRect().height).toBe(0)
    // Setting the value renders the closed items once, out of the page, to register its label.
    ;(query('reka-select-root') as HTMLElement & { modelValue: string }).modelValue = 'b'
    await vi.waitFor(() => expect(query('reka-select-value').textContent).toBe('Bee'))
    expect(content.isConnected).toBe(true)
    expect(content.getBoundingClientRect().height).toBe(0)
  })
})
