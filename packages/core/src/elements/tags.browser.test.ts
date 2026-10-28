import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineRekaElements, tagGroupElements, tagsInputElements } from '.'
import { cleanup, query, render } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([tagsInputElements, tagGroupElements])
})
afterEach(cleanup)

type TagsInputRootElement = HTMLElement & { modelValue: unknown[], defaultValue: unknown[] }

/**
 * What `TagsInputRoot`'s `modelValue` slot prop renders in a Vue template: one
 * item per tag, keyed by index here. Existing items stay.
 */
function renderTags(root: HTMLElement, tags: string[]) {
  const items = [...root.querySelectorAll<HTMLElement & { value: string }>('reka-tags-input-item')]
  tags.forEach((tag, index) => {
    let item = items[index]
    if (!item) {
      item = document.createElement('reka-tags-input-item') as HTMLElement & { value: string }
      item.innerHTML = '<reka-tags-input-item-text></reka-tags-input-item-text><reka-tags-input-item-delete aria-label="Remove">×</reka-tags-input-item-delete>'
      // `value` is required: set before the item connects.
      item.value = tag
      root.insertBefore(item, root.querySelector('reka-tags-input-input'))
    }
    item.value = tag
  })
  for (const item of items.slice(tags.length))
    item.remove()
}

function tags() {
  return Array.from(document.querySelectorAll('reka-tags-input-item-text'), text => text.textContent)
}

async function mountTagsInput(attributes = '') {
  const container = render(`
    <form>
      <reka-tags-input-root name="tags" ${attributes}>
        <reka-tags-input-input placeholder="Add a tag"></reka-tags-input-input>
        <reka-tags-input-clear aria-label="Clear">Clear</reka-tags-input-clear>
      </reka-tags-input-root>
    </form>
  `)
  const root = query<TagsInputRootElement>('reka-tags-input-root')
  const changes: unknown[] = []
  root.addEventListener('update-model-value', (event) => {
    const value = (event as CustomEvent<{ value: string[] }>).detail.value
    changes.push(value)
    renderTags(root, value)
  })
  // The input element is created by `<reka-tags-input-input>` when it has none.
  await vi.waitFor(() => expect(query('reka-tags-input-input > input').getAttribute('placeholder')).toBe('Add a tag'))
  return { container, root, changes, input: query<HTMLInputElement>('reka-tags-input-input > input') }
}

describe('tags input elements', () => {
  it('adds tags on Enter and the delimiter, shows them, and submits them', async () => {
    const { container, input, changes } = await mountTagsInput()
    await userEvent.type(input, 'vue{Enter}')
    await userEvent.type(input, 'react,')
    await vi.waitFor(() => expect(tags()).toEqual(['vue', 'react']))
    expect(changes).toEqual([['vue'], ['vue', 'react']])
    expect(input.value).toBe('')
    // The text part shows the tag's `displayValue`, and labels the item.
    const [item] = document.querySelectorAll('reka-tags-input-item')
    expect(document.getElementById(item.getAttribute('aria-labelledby')!)!.textContent).toBe('vue')
    expect([...new FormData(container.querySelector('form')!).entries()]).toEqual([['tags[0]', 'vue'], ['tags[1]', 'react']])
  })

  it('selects the last tag with Backspace, removes it with another, and removes from the delete button', async () => {
    const { root, input } = await mountTagsInput()
    root.modelValue = ['a', 'b', 'c']
    root.addEventListener('update-model-value', event => root.modelValue = (event as CustomEvent).detail.value)
    renderTags(root, root.modelValue as string[])
    await vi.waitFor(() => expect(tags()).toEqual(['a', 'b', 'c']))

    input.focus()
    await userEvent.keyboard('{Backspace}')
    const items = () => [...document.querySelectorAll('reka-tags-input-item')]
    await vi.waitFor(() => expect(items()[2].getAttribute('data-state')).toBe('checked'))
    await userEvent.keyboard('{ArrowLeft}')
    await vi.waitFor(() => expect(items()[1].getAttribute('data-state')).toBe('checked'))
    await userEvent.keyboard('{Backspace}')
    await vi.waitFor(() => expect(tags()).toEqual(['a', 'c']))

    await userEvent.click(document.querySelectorAll('reka-tags-input-item-delete')[0])
    await vi.waitFor(() => expect(tags()).toEqual(['c']))
    await userEvent.click(query('reka-tags-input-clear'))
    await vi.waitFor(() => expect(tags()).toEqual([]))
  })

  it('takes object tags through `convertValue` and `displayValue` properties', async () => {
    const { root, input, changes } = await mountTagsInput()
    const tagsRoot = root as TagsInputRootElement & { convertValue: unknown, displayValue: unknown }
    tagsRoot.convertValue = (text: string) => ({ label: text })
    tagsRoot.displayValue = (tag: { label: string }) => `#${tag.label}`
    await userEvent.type(input, 'vue{Enter}')
    await vi.waitFor(() => expect(tags()).toEqual(['#vue']))
    expect(changes).toEqual([[{ label: 'vue' }]])
  })
})

describe('tag group elements', () => {
  const GROUP = `
    <reka-tag-group-root aria-label="Frameworks" selection-mode="multiple">
      <reka-tag-group-item value="vue"><span role="gridcell"><reka-tag-group-item-text>Vue</reka-tag-group-item-text><reka-tag-group-item-delete>×</reka-tag-group-item-delete></span></reka-tag-group-item>
      <reka-tag-group-item value="react"><span role="gridcell"><reka-tag-group-item-text>React</reka-tag-group-item-text><reka-tag-group-item-delete>×</reka-tag-group-item-delete></span></reka-tag-group-item>
      <reka-tag-group-item value="svelte" disabled><span role="gridcell"><reka-tag-group-item-text>Svelte</reka-tag-group-item-text></span></reka-tag-group-item>
    </reka-tag-group-root>
  `

  function groupItems() {
    return [...document.querySelectorAll<HTMLElement>('reka-tag-group-item')]
  }

  it('is a grid of rows, navigated with the arrow keys and selected with Space', async () => {
    render(`<button id="before">Before</button>${GROUP}`)
    const root = query('reka-tag-group-root')
    await vi.waitFor(() => expect(root.getAttribute('role')).toBe('grid'))
    expect(root.getAttribute('aria-multiselectable')).toBe('true')
    expect(groupItems().map(item => item.getAttribute('role'))).toEqual(['row', 'row', 'row'])
    const changes: unknown[] = []
    root.addEventListener('update-model-value', event => changes.push((event as CustomEvent).detail.value))

    await userEvent.click(query('#before'))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(groupItems()[0])
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(groupItems()[1])
    await userEvent.keyboard(' ')
    await vi.waitFor(() => expect(groupItems()[1].getAttribute('aria-selected')).toBe('true'))
    await userEvent.click(groupItems()[0])
    await vi.waitFor(() => expect(groupItems()[0].getAttribute('data-state')).toBe('checked'))
    expect(changes).toEqual([['react'], ['react', 'vue']])
    // Disabled: skipped by the arrow keys.
    groupItems()[1].focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(groupItems()[0])
  })

  it('asks to remove tags through `remove`, from the delete button and the Delete key', async () => {
    render(GROUP)
    const root = query('reka-tag-group-root')
    await vi.waitFor(() => expect(root.getAttribute('role')).toBe('grid'))
    const removed: unknown[] = []
    root.addEventListener('remove', (event) => {
      const values = (event as CustomEvent<{ value: string[] }>).detail.value
      removed.push(values)
      for (const item of groupItems()) {
        if (values.includes(item.getAttribute('value')!))
          item.remove()
      }
    })
    const deleteButton = query('reka-tag-group-item-delete')
    expect(deleteButton.getAttribute('role')).toBe('button')
    await userEvent.click(deleteButton)
    await vi.waitFor(() => expect(groupItems()).toHaveLength(2))
    groupItems()[0].focus()
    await userEvent.keyboard('{Delete}')
    await vi.waitFor(() => expect(groupItems()).toHaveLength(1))
    expect(removed).toEqual([['vue'], ['react']])
  })
})
