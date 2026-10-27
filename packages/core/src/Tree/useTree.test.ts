import type { UseTreeProps } from './useTree'
import { fireEvent, render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { TreeItem, TreeRoot, TreeVirtualizer } from '.'
import { useTree } from './useTree'

type Node = { title: string, children?: Node[] }

const fruits: Node = { title: 'fruits', children: [{ title: 'apple' }, { title: 'kiwi' }] }
const items: Node[] = [
  { title: 'index' },
  fruits,
  { title: 'veg', children: [{ title: 'leek', children: [{ title: 'baby leek' }] }] },
]

function tree(props: Partial<UseTreeProps<Node>> = {}) {
  return useTree<Node>({ items, getKey: n => n.title, ...props })
}

function noDataAttrs(props: Record<string, any>) {
  return Object.keys(props).every(k => !k.startsWith('data-'))
}

describe('useTree — models', () => {
  it('starts uncontrolled with nothing selected or expanded', () => {
    const t = tree()
    expect(t.modelValue.value).toBeUndefined()
    expect(t.expanded.value).toEqual([])
    expect(t.isControlled.value).toBe(false)
    expect(t.isExpandedControlled.value).toBe(false)
    expect(t.lastChangeDetails.value.reason).toBe('none')
    expect(t.flattenItems.value.map(i => i._id)).toEqual(['index', 'fruits', 'veg'])
    expect(tree({ multiple: true }).modelValue.value).toEqual([])
  })

  it('single toggle: selects a copy, deselects on re-press', () => {
    const onUpdate = vi.fn()
    const t = tree({ onUpdate })
    expect(t.select(items[0])).toBe(true)
    expect(t.modelValue.value).toEqual(items[0])
    expect(t.selectedKeys.value).toEqual(['index'])
    expect(t.select(items[0])).toBe(true)
    expect(t.modelValue.value).toBeUndefined()
    expect(onUpdate).toHaveBeenCalledTimes(2)
  })

  it('single replace: re-pressing the selected item emits nothing (key identity)', () => {
    const onUpdate = vi.fn()
    const t = tree({ selectionBehavior: 'replace', onUpdate })
    t.select(items[0])
    expect(t.select(items[0])).toBe(false)
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  it('expand / collapse through toggle; leaves are ignored', () => {
    const onUpdateExpanded = vi.fn()
    const t = tree({ onUpdateExpanded })
    expect(t.toggle(fruits)).toBe(true)
    expect(t.expanded.value).toEqual(['fruits'])
    expect(t.flattenItems.value.map(i => i._id)).toEqual(['index', 'fruits', 'apple', 'kiwi', 'veg'])
    expect(t.toggle(items[0])).toBe(false)
    expect(t.toggle(fruits)).toBe(true)
    expect(t.expanded.value).toEqual([])
    expect(onUpdateExpanded).toHaveBeenCalledTimes(2)
    expect(onUpdateExpanded).toHaveBeenLastCalledWith([], expect.objectContaining({ reason: 'imperative-action' }))
  })

  it('setExpanded emits only on a real change', () => {
    const onUpdateExpanded = vi.fn()
    const t = tree({ defaultExpanded: ['fruits'], onUpdateExpanded })
    expect(t.setExpanded(['fruits'])).toBe(false)
    expect(onUpdateExpanded).not.toHaveBeenCalled()
  })

  it('controlled getters + emit: emits both pairs, writes nothing', () => {
    const emit = vi.fn()
    const t = tree({ modelValue: () => items[0], expanded: () => ['veg'], emit })
    expect(t.isControlled.value).toBe(true)
    expect(t.isExpandedControlled.value).toBe(true)
    t.select(fruits, 'item-press')
    t.toggle(fruits, 'item-keydown')
    expect(t.modelValue.value).toEqual(items[0])
    expect(t.expanded.value).toEqual(['veg'])
    expect(emit.mock.calls.map(c => [c[0], c[2].reason])).toEqual([
      ['beforeUpdate:modelValue', 'item-press'],
      ['update:modelValue', 'item-press'],
      ['beforeUpdate:expanded', 'item-keydown'],
      ['update:expanded', 'item-keydown'],
    ])
  })

  it('ref-owned: writes back to the passed refs', () => {
    const model = ref<Node | Node[] | undefined>([])
    const expanded = ref<string[] | undefined>([])
    const t = tree({ multiple: true, modelValue: model, expanded })
    t.select(items[0])
    t.toggle(fruits)
    expect(model.value).toEqual([items[0]])
    expect(expanded.value).toEqual(['fruits'])
  })

  it('cancel in onBeforeUpdate / onBeforeUpdateExpanded keeps the state', () => {
    const onUpdate = vi.fn()
    const onUpdateExpanded = vi.fn()
    const t = tree({
      onBeforeUpdate: (_v, details) => details.cancel(),
      onBeforeUpdateExpanded: (_v, details) => details.cancel(),
      onUpdate,
      onUpdateExpanded,
    })
    expect(t.select(items[0])).toBe(false)
    expect(t.toggle(fruits)).toBe(false)
    expect(t.modelValue.value).toBeUndefined()
    expect(t.expanded.value).toEqual([])
    expect(onUpdate).not.toHaveBeenCalled()
    expect(onUpdateExpanded).not.toHaveBeenCalled()
    expect(t.lastChangeDetails.value.isCanceled).toBe(true)
    expect(t.lastExpandedChangeDetails.value.isCanceled).toBe(true)
  })
})

describe('useTree — multiple selection', () => {
  it('toggle adds and removes by key', () => {
    const t = tree({ multiple: true })
    t.select(items[0])
    t.select(fruits)
    expect(t.selectedKeys.value).toEqual(['index', 'fruits'])
    t.select({ title: 'index' })
    expect(t.selectedKeys.value).toEqual(['fruits'])
  })

  it('propagateSelect selects and clears the descendants in ONE change', () => {
    const onUpdate = vi.fn()
    const t = tree({ multiple: true, propagateSelect: true, onUpdate })
    t.select(items[2], 'item-press')
    expect(t.selectedKeys.value).toEqual(['veg', 'leek', 'baby leek'])
    t.select(items[2], 'item-press')
    expect(t.selectedKeys.value).toEqual([])
    expect(onUpdate).toHaveBeenCalledTimes(2)
  })

  it('bubbleSelect selects the parent once every child is selected, in ONE change', () => {
    const onUpdate = vi.fn()
    const t = tree({ multiple: true, bubbleSelect: true, defaultExpanded: ['fruits'], onUpdate })
    t.select(fruits.children![0])
    expect(t.selectedKeys.value).toEqual(['apple'])
    t.select(fruits.children![1])
    expect(t.selectedKeys.value).toEqual(['apple', 'kiwi', 'fruits'])
    expect(onUpdate).toHaveBeenCalledTimes(2)
    t.select(fruits.children![0])
    expect(t.selectedKeys.value).toEqual(['kiwi'])
  })

  it('indeterminate state follows partial child selection', () => {
    const t = tree({ multiple: true, bubbleSelect: true, defaultExpanded: ['fruits'] })
    const status = t.getItemStatus(fruits)
    expect(status.isIndeterminate.value).toBe(false)
    t.select(fruits.children![0])
    expect(status.isIndeterminate.value).toBe(true)
  })
})

describe('useTree — surfaces', () => {
  it('root is role="tree" with aria-multiselectable', () => {
    expect(tree().root.attrs.value).toMatchObject({ role: 'tree' })
    expect(tree().root.attrs.value['aria-multiselectable']).toBeUndefined()
    expect(tree({ multiple: true }).root.attrs.value['aria-multiselectable']).toBe(true)
  })

  it('item props carry aria and the data-indent selector; state carries the rest', () => {
    const t = tree({ defaultValue: fruits, defaultExpanded: ['fruits'] })
    const item = t.getItemSurface({ value: fruits, level: 1 })
    const props = { ...item.props.value }
    delete props['data-indent']
    expect(noDataAttrs(props)).toBe(true)
    expect(item.attrs.value).toMatchObject({
      'role': 'treeitem',
      'aria-selected': true,
      'aria-expanded': true,
      'aria-level': 1,
      'data-indent': 1,
      'data-selected': '',
      'data-expanded': '',
    })
    const leaf = t.getItemSurface({ value: items[0], level: 1, disabled: true })
    expect(leaf.attrs.value).toMatchObject({ 'aria-disabled': true, 'data-disabled': '' })
    expect(leaf.attrs.value['aria-expanded']).toBeUndefined()
  })
})

describe('useTree — standalone render', () => {
  const Standalone = defineComponent({
    setup() {
      const t = tree({ defaultExpanded: [] })
      return () => h('ul', { 'aria-label': 'Files', ...t.root.attrs.value }, t.flattenItems.value.map(item =>
        h('li', {
          'key': item._id,
          'tabindex': 0,
          'data-testid': item._id,
          ...t.getItemSurface({ value: item.value, level: item.level }).attrs.value,
        }, item.value.title)))
    },
  })

  it('renders, selects and expands with reasons, and passes axe', async () => {
    const { container, getByTestId, queryByTestId } = render(Standalone)
    await fireEvent.click(getByTestId('fruits'))
    expect(getByTestId('fruits')).toHaveAttribute('aria-selected', 'true')
    expect(getByTestId('fruits')).toHaveAttribute('aria-expanded', 'true')
    expect(queryByTestId('apple')).not.toBeNull()

    await fireEvent.keyDown(getByTestId('fruits'), { key: 'ArrowLeft' })
    expect(queryByTestId('apple')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('treeRoot — details contract', () => {
  function mountTree(props: Record<string, any>) {
    return mount(defineComponent({
      setup: () => () => h(TreeRoot as any, { items, getKey: (n: Node) => n.title, ...props }, {
        default: ({ flattenItems }: any) => flattenItems.map((item: any) =>
          h(TreeItem as any, { 'key': item._id, ...item.bind, 'data-testid': item._id }, () => item.value.title)),
      }),
    }), { attachTo: document.body })
  }
  const find = (wrapper: ReturnType<typeof mountTree>, id: string) => wrapper.find(`[data-testid="${id}"]`)

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('click reports item-press for both models; Enter item-keydown; arrows item-keydown', async () => {
    const onUpdate = vi.fn()
    const onUpdateExpanded = vi.fn()
    const wrapper = mountTree({ 'onUpdate:modelValue': onUpdate, 'onUpdate:expanded': onUpdateExpanded })
    await find(wrapper, 'fruits').trigger('click')
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'fruits' }), expect.objectContaining({ reason: 'item-press' }))
    expect(onUpdateExpanded).toHaveBeenLastCalledWith(['fruits'], expect.objectContaining({ reason: 'item-press' }))

    await find(wrapper, 'index').trigger('keydown', { key: 'Enter' })
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'index' }), expect.objectContaining({ reason: 'item-keydown' }))

    await find(wrapper, 'fruits').trigger('keydown', { key: 'ArrowLeft' })
    expect(onUpdateExpanded).toHaveBeenLastCalledWith([], expect.objectContaining({ reason: 'item-keydown' }))
    const event = onUpdateExpanded.mock.lastCall![1].event
    expect(event).toBeInstanceOf(KeyboardEvent)
  })

  it('beforeUpdate:* cancel keeps selection and expansion', async () => {
    const wrapper = mountTree({
      'onBeforeUpdate:modelValue': (_v: unknown, details: any) => details.cancel(),
      'onBeforeUpdate:expanded': (_v: unknown, details: any) => details.cancel(),
    })
    await find(wrapper, 'fruits').trigger('click')
    expect(find(wrapper, 'fruits').attributes('aria-selected')).toBe('false')
    expect(find(wrapper, 'fruits').attributes('aria-expanded')).toBe('false')
    expect(find(wrapper, 'apple').exists()).toBe(false)
  })

  it('controlled: stays as bound until the parent updates', async () => {
    const onUpdate = vi.fn()
    const onUpdateExpanded = vi.fn()
    const wrapper = mountTree({ 'modelValue': items[0], 'expanded': [], 'onUpdate:modelValue': onUpdate, 'onUpdate:expanded': onUpdateExpanded })
    await find(wrapper, 'fruits').trigger('click')
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdateExpanded).toHaveBeenCalledTimes(1)
    expect(find(wrapper, 'index').attributes('aria-selected')).toBe('true')
    expect(find(wrapper, 'fruits').attributes('aria-selected')).toBe('false')
    expect(find(wrapper, 'apple').exists()).toBe(false)
  })

  it('a multiple propagate + bubble press emits once', async () => {
    const onUpdate = vi.fn()
    const wrapper = mountTree({ 'multiple': true, 'propagateSelect': true, 'bubbleSelect': true, 'defaultExpanded': ['fruits'], 'onUpdate:modelValue': onUpdate })
    await find(wrapper, 'fruits').trigger('click')
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.lastCall![0].map((n: Node) => n.title)).toEqual(['fruits', 'apple', 'kiwi'])
  })

  it('shift+ArrowDown in a multiple replace tree reports range-select', async () => {
    const onUpdate = vi.fn()
    const wrapper = mountTree({ 'multiple': true, 'selectionBehavior': 'replace', 'onUpdate:modelValue': onUpdate })
    await nextTick()
    await find(wrapper, 'index').trigger('click')
    ;(find(wrapper, 'index').element as HTMLElement).focus()
    await find(wrapper, 'index').trigger('keydown', { key: 'ArrowDown', shiftKey: true })
    await nextTick()
    expect(onUpdate).toHaveBeenLastCalledWith([items[0], fruits], expect.objectContaining({ reason: 'range-select' }))
  })
})

describe('treeVirtualizer — details contract', () => {
  const originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect
  beforeAll(() => {
    window.HTMLElement.prototype.scrollTo = vi.fn()
    globalThis.ResizeObserver ??= class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.HTMLElement.prototype.getBoundingClientRect = function () {
      return { width: 200, height: 200, top: 0, left: 0, right: 200, bottom: 200, x: 0, y: 0, toJSON() {} }
    }
  })
  beforeEach(() => {
    document.body.innerHTML = ''
  })
  afterAll(() => {
    window.HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
  })

  function mountVirtualTree(props: Record<string, any>) {
    const many = Array.from({ length: 20 }, (_, i) => ({ title: `item ${i}` }))
    return mount(defineComponent({
      setup: () => () => h('div', { style: 'height: 200px; overflow: auto' }, h(TreeRoot as any, {
        items: many,
        getKey: (n: Node) => n.title,
        ...props,
      }, () => h(TreeVirtualizer as any, { textContent: (n: Node) => n.title }, {
        default: ({ item }: any) => h(TreeItem as any, item.bind, () => item.value.title),
      }))),
    }), { attachTo: document.body })
  }

  it('selects with item-press and cancels through beforeUpdate', async () => {
    const onUpdate = vi.fn()
    const wrapper = mountVirtualTree({ 'onUpdate:modelValue': onUpdate })
    await nextTick()
    await wrapper.find('[data-index="2"]').trigger('click')
    expect(onUpdate).toHaveBeenLastCalledWith({ title: 'item 2' }, expect.objectContaining({ reason: 'item-press' }))

    const cancelled = mountVirtualTree({ 'onBeforeUpdate:modelValue': (_v: unknown, d: any) => d.cancel() })
    await nextTick()
    await cancelled.find('[data-index="2"]').trigger('click')
    expect(cancelled.find('[data-index="2"]').attributes('aria-selected')).toBe('false')
  })

  it('shift+ArrowDown extends a multiple replace selection as range-select', async () => {
    const onUpdate = vi.fn()
    const wrapper = mountVirtualTree({ 'multiple': true, 'selectionBehavior': 'replace', 'onUpdate:modelValue': onUpdate })
    await nextTick()
    const first = wrapper.find('[data-index="0"]')
    await first.trigger('click')
    ;(first.element as HTMLElement).focus()
    first.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true }))
    await nextTick()
    await nextTick()
    const [value, details] = onUpdate.mock.lastCall!
    expect(details.reason).toBe('range-select')
    expect(details.event).toBeInstanceOf(KeyboardEvent)
    expect(value.map((n: Node) => n.title)).toEqual(['item 0', 'item 1'])
  })
})
