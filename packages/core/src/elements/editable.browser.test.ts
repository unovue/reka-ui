import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineRekaElements, editableElements } from '.'
import { cleanup, query, render } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([editableElements])
})
afterEach(cleanup)

function EDITABLE(attributes = '') {
  return `
  <form>
    <reka-editable-root name="title" placeholder="Untitled" ${attributes}>
      <reka-editable-area>
        <reka-editable-preview></reka-editable-preview>
        <reka-editable-input><input aria-label="Title"></reka-editable-input>
      </reka-editable-area>
      <reka-editable-edit-trigger>Edit</reka-editable-edit-trigger>
      <reka-editable-submit-trigger>Save</reka-editable-submit-trigger>
      <reka-editable-cancel-trigger>Cancel</reka-editable-cancel-trigger>
    </reka-editable-root>
  </form>
`
}

async function mount(attributes = '') {
  const container = render(EDITABLE(attributes))
  // Enter in the form's only text field submits it, as in a Vue app.
  container.querySelector('form')!.addEventListener('submit', event => event.preventDefault())
  const preview = query('reka-editable-preview')
  const input = query<HTMLInputElement>('reka-editable-input > input')
  await vi.waitFor(() => expect(preview.getAttribute('tabindex')).toBe('0'))
  return { container, preview, input, form: container.querySelector('form')! }
}

describe('editable elements', () => {
  it('previews the value, or the placeholder, and edits it in the `<input>` it holds', async () => {
    const { preview, input, form } = await mount('default-value="Hello"')
    expect(preview.textContent).toBe('Hello')
    expect(input.hidden).toBe(true)
    expect(query('reka-editable-submit-trigger').hasAttribute('hidden')).toBe(true)
    const root = query('reka-editable-root')
    const changes: unknown[] = []
    root.addEventListener('update-model-value', event => changes.push((event as CustomEvent).detail.value))

    await userEvent.click(query('reka-editable-edit-trigger'))
    await vi.waitFor(() => expect(document.activeElement).toBe(input))
    expect(input.value).toBe('Hello')
    expect(preview.hasAttribute('hidden')).toBe(true)
    expect(query('reka-editable-area').getAttribute('data-focus')).toBe('')
    await userEvent.clear(input)
    await userEvent.type(input, 'World')
    await userEvent.click(query('reka-editable-submit-trigger'))
    await vi.waitFor(() => expect(preview.textContent).toBe('World'))
    expect(changes).toEqual(['World'])
    expect(new FormData(form).get('title')).toBe('World')

    // Empty: the preview shows the placeholder.
    await userEvent.click(query('reka-editable-edit-trigger'))
    await vi.waitFor(() => expect(document.activeElement).toBe(input))
    await userEvent.clear(input)
    await userEvent.click(query('reka-editable-submit-trigger'))
    await vi.waitFor(() => expect(preview.textContent).toBe('Untitled'))
  })

  it('submits with Enter, cancels with Escape, and starts editing on focus', async () => {
    const { preview, input } = await mount('default-value="Draft" submit-mode="enter"')
    preview.focus()
    await vi.waitFor(() => expect(document.activeElement).toBe(input))
    await userEvent.type(input, '!')
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(preview.textContent).toBe('Draft'))

    preview.focus()
    await vi.waitFor(() => expect(document.activeElement).toBe(input))
    await userEvent.type(input, ' 2{Enter}')
    await vi.waitFor(() => expect(preview.textContent).toBe('Draft 2'))
    expect(input.hidden).toBe(true)
  })

  it('resets with its form', async () => {
    const { preview, input, form } = await mount('default-value="One" submit-mode="enter"')
    preview.focus()
    await vi.waitFor(() => expect(document.activeElement).toBe(input))
    await userEvent.type(input, 'Two{Enter}')
    await vi.waitFor(() => expect(new FormData(form).get('title')).toBe('OneTwo'))
    form.reset()
    await vi.waitFor(() => expect(preview.textContent).toBe('One'))
    expect(new FormData(form).get('title')).toBe('One')
  })
})
