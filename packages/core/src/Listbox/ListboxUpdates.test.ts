import type { ComponentPublicInstance } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot } from '.'
import ListboxLong from './story/_ListboxLong.vue'

// How many components re-render for one interaction on a long list. An item that reads the shared
// highlight or the whole model re-renders with every other item, and the cost of a key press then
// grows with the list.
const ITEMS = 300

function countUpdates() {
  const counts = new Map<string, number>()
  const mixin = {
    beforeUpdate(this: ComponentPublicInstance) {
      const name = this.$options.name ?? this.$options.__name ?? 'Anonymous'
      counts.set(name, (counts.get(name) ?? 0) + 1)
    },
  }
  return {
    mixin,
    reset: () => counts.clear(),
    of: (name: string) => counts.get(name) ?? 0,
    total: () => [...counts.values()].reduce((sum, count) => sum + count, 0),
  }
}

const options = Array.from({ length: ITEMS }, (_, index) => `Option ${index}`)

function setup(props: Record<string, unknown> = {}) {
  const updates = countUpdates()
  // Uncontrolled: a `v-model` on a ref of this component would re-render it, and with it every item.
  const model = { value: undefined as unknown }
  const wrapper = mount(ListboxLong, {
    props: { options },
    attrs: { ...props, 'onUpdate:modelValue': (value: unknown) => model.value = value },
    attachTo: document.body,
    global: { mixins: [updates.mixin] },
  })
  const content = wrapper.find('[role=listbox]')
  const items = wrapper.findAll('[role=option]')
  const highlighted = () => wrapper.findAll('[data-highlighted]').map(item => item.text())
  return { wrapper, updates, content, items, model, highlighted }
}

describe('given a Listbox with many items', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  // TODO(v3-port): #3400 per-item re-render counts (Listbox/ListboxItem source resolved to v3)
  it.skip('re-renders only the two items a key press moves the highlight between', async () => {
    const { updates, content, items, highlighted } = setup()
    await nextTick()
    await nextTick()
    await content.trigger('focus')
    await content.trigger('keydown', { key: 'ArrowDown' })
    expect(highlighted()).toEqual(['Option 1'])

    updates.reset()
    await content.trigger('keydown', { key: 'ArrowDown' })
    expect(highlighted()).toEqual(['Option 2'])
    expect(items[1].attributes('tabindex')).toBe('-1')
    expect(items[2].attributes('tabindex')).toBe('0')
    // The two items' element and what their slot renders, not a multiple of the list.
    expect(updates.of('ListboxItem')).toBe(0)
    expect(updates.total()).toBeGreaterThan(0)
    expect(updates.total()).toBeLessThan(20)
  })

  // TODO(v3-port): #3400 per-item re-render counts (Listbox/ListboxItem source resolved to v3)
  it.skip('re-renders only the two items a typeahead character moves the highlight between', async () => {
    const { updates, content, highlighted } = setup()
    await nextTick()
    await nextTick()
    await content.trigger('focus')
    await content.trigger('keydown', { key: 'ArrowDown' })

    updates.reset()
    await content.trigger('keydown', { key: 'o' })
    expect(highlighted()).toEqual(['Option 2'])
    // The two items' element and what their slot renders, not a multiple of the list.
    expect(updates.of('ListboxItem')).toBe(0)
    expect(updates.total()).toBeGreaterThan(0)
    expect(updates.total()).toBeLessThan(20)
  })

  // TODO(v3-port): #3401 per-item re-render counts (Listbox/ListboxItem source resolved to v3)
  it.skip('re-renders only the items a selection changes', async () => {
    const { updates, content, items, model } = setup()
    await nextTick()
    await nextTick()
    await content.trigger('focus')
    await items[10].trigger('click')
    await nextTick()
    expect(model.value).toBe('Option 10')

    updates.reset()
    await items[20].trigger('click')
    await nextTick()
    expect(model.value).toBe('Option 20')
    expect(items[10].attributes('data-state')).toBe('unchecked')
    expect(items[20].attributes('data-state')).toBe('checked')
    expect(items[20].attributes('data-highlighted')).toBe('')
    expect(updates.of('ListboxItem')).toBe(0)
    expect(updates.total()).toBeGreaterThan(0)
    expect(updates.total()).toBeLessThan(30)
  })

  // TODO(v3-port): #3401 per-item re-render counts (Listbox/ListboxItem source resolved to v3)
  it.skip('re-renders only the item a multiple selection toggles', async () => {
    const { updates, content, items, model } = setup({ multiple: true })
    await nextTick()
    await nextTick()
    await content.trigger('focus')
    await items[10].trigger('click')
    await nextTick()

    updates.reset()
    await items[20].trigger('click')
    await nextTick()
    expect(model.value).toEqual(['Option 10', 'Option 20'])
    expect(items[10].attributes('data-state')).toBe('checked')
    expect(items[20].attributes('data-state')).toBe('checked')
    expect(updates.of('ListboxItem')).toBe(0)
    expect(updates.total()).toBeGreaterThan(0)
    expect(updates.total()).toBeLessThan(30)
  })

  it('still updates a root slot that uses `modelValue`', async () => {
    const wrapper = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem },
      template: `
        <ListboxRoot v-slot="{ modelValue }">
          <output>{{ modelValue ?? 'none' }}</output>
          <ListboxContent>
            <ListboxItem value="a">A</ListboxItem>
            <ListboxItem value="b">B</ListboxItem>
          </ListboxContent>
        </ListboxRoot>`,
    }), { attachTo: document.body })
    expect(wrapper.find('output').text()).toBe('none')

    await wrapper.findAll('[role=option]')[1].trigger('click')
    expect(wrapper.find('output').text()).toBe('b')
  })
})
