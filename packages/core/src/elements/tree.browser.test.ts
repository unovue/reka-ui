import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineRekaElements, treeElements } from '.'
import { cleanup, render } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([treeElements])
})
afterEach(cleanup)

interface Node {
  title: string
  children?: Node[]
}

const ITEMS: Node[] = [
  { title: 'components', children: [{ title: 'Tree.vue' }, { title: 'Select.vue' }] },
  { title: 'composables', children: [{ title: 'useTree.ts' }] },
  { title: 'README.md' },
]

type TreeRootElement = HTMLElement & {
  items: Node[]
  getKey: (item: Node) => string
  expanded: string[]
  modelValue: unknown
  multiple: boolean
}
type TreeItemElement = HTMLElement & { value: Node }

/**
 * What `TreeRoot`'s `flattenItems` slot prop gives a Vue template: the visible
 * items, depth first, with their level.
 */
function flatten(items: Node[], expanded: string[], level = 1): { item: Node, level: number }[] {
  return items.flatMap(item => [
    { item, level },
    ...(item.children && expanded.includes(item.title) ? flatten(item.children, expanded, level + 1) : []),
  ])
}

/**
 * Renders the visible items as `<reka-tree-item>`s, keyed by title: existing
 * elements stay where they are (and keep focus), new ones are inserted in order.
 */
function renderItems(root: TreeRootElement, expanded: string[]) {
  const existing = new Map(Array.from(root.querySelectorAll<TreeItemElement>('reka-tree-item'), el => [el.value.title, el]))
  let previous: Element | null = null
  for (const { item, level } of flatten(root.items, expanded)) {
    let el = existing.get(item.title)
    existing.delete(item.title)
    if (!el) {
      el = document.createElement('reka-tree-item') as unknown as TreeItemElement
      el.value = item
      el.setAttribute('level', String(level))
      el.textContent = item.title
      root.insertBefore(el, previous ? previous.nextSibling : root.firstChild)
    }
    previous = el
  }
  for (const el of existing.values())
    el.remove()
}

async function mount(attributes = '') {
  // `getKey` is required: set it (and `items`) before the root connects, as Vue
  // passes props on creation.
  const root = document.createElement('reka-tree-root') as unknown as TreeRootElement
  root.items = ITEMS
  root.getKey = item => item.title
  root.setAttribute('aria-label', 'Files')
  if (attributes)
    root.setAttribute(attributes, '')
  render('').append(root)
  let expanded: string[] = []
  root.addEventListener('update-expanded', (event) => {
    expanded = (event as CustomEvent<{ value: string[] }>).detail.value
    renderItems(root, expanded)
  })
  renderItems(root, expanded)
  await vi.waitFor(() => expect(treeItems().every(item => item.getAttribute('role') === 'treeitem')).toBe(true))
  return root
}

function treeItems() {
  return [...document.querySelectorAll<TreeItemElement>('reka-tree-item')]
}

function titles() {
  return treeItems().map(item => item.textContent)
}

describe('tree elements', () => {
  it('renders a tree of items you render from its `items`, with levels', async () => {
    const root = await mount()
    expect(root.getAttribute('role')).toBe('tree')
    expect(titles()).toEqual(['components', 'composables', 'README.md'])
    expect(treeItems().map(item => item.getAttribute('aria-level'))).toEqual(['1', '1', '1'])
    expect(treeItems()[0].getAttribute('aria-expanded')).toBe('false')
    // A leaf has no `aria-expanded`.
    expect(treeItems()[2].hasAttribute('aria-expanded')).toBe(false)
  })

  it('expands and walks the tree with the arrow keys, and selects with Enter', async () => {
    const root = await mount()
    const selections: unknown[] = []
    root.addEventListener('update-model-value', event => selections.push((event as CustomEvent).detail.value))

    treeItems()[0].focus()
    await userEvent.keyboard('{ArrowRight}')
    await vi.waitFor(() => expect(titles()).toEqual(['components', 'Tree.vue', 'Select.vue', 'composables', 'README.md']))
    expect(treeItems()[0].getAttribute('aria-expanded')).toBe('true')
    expect(treeItems()[1].getAttribute('aria-level')).toBe('2')
    expect(document.activeElement).toBe(treeItems()[0])

    // Into the children, down the list, back to the parent.
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement?.textContent).toBe('Tree.vue')
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement?.textContent).toBe('Select.vue')
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement?.textContent).toBe('components')
    await userEvent.keyboard('{End}')
    expect(document.activeElement?.textContent).toBe('README.md')
    // Typeahead (its search also collects the arrow keys for a second, as in Vue).
    await new Promise(resolve => setTimeout(resolve, 1100))
    await userEvent.keyboard('s')
    expect(document.activeElement?.textContent).toBe('Select.vue')

    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => expect(treeItems()[2].getAttribute('aria-selected')).toBe('true'))
    expect(selections).toEqual([{ title: 'Select.vue' }])
    expect(treeItems()[2].hasAttribute('data-selected')).toBe(true)

    // Collapsing takes the children out.
    treeItems()[0].focus()
    await userEvent.keyboard('{ArrowLeft}')
    await vi.waitFor(() => expect(titles()).toEqual(['components', 'composables', 'README.md']))
  })

  it('expands and selects on click, and selects several items with `multiple`', async () => {
    const root = await mount('multiple')
    expect(root.getAttribute('aria-multiselectable')).toBe('true')
    await userEvent.click(treeItems()[1])
    await vi.waitFor(() => expect(titles()).toEqual(['components', 'composables', 'useTree.ts', 'README.md']))
    await userEvent.click(treeItems()[3])
    await vi.waitFor(() => expect(treeItems()[3].getAttribute('aria-selected')).toBe('true'))
    expect(treeItems()[1].getAttribute('aria-selected')).toBe('true')
    expect(treeItems()[1].getAttribute('data-expanded')).toBe('')
  })

  it('takes a controlled selection and expansion through properties', async () => {
    const root = await mount()
    root.expanded = ['composables']
    renderItems(root, root.expanded)
    root.modelValue = ITEMS[1].children![0]
    await vi.waitFor(() => expect(titles()).toEqual(['components', 'composables', 'useTree.ts', 'README.md']))
    await vi.waitFor(() => expect(treeItems()[2].getAttribute('aria-selected')).toBe('true'))
    expect(treeItems()[1].getAttribute('aria-expanded')).toBe('true')
  })
})
