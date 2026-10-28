import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive, ref } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot } from '.'

// Optimisation-pinning tests: a highlight move or a selection change
// re-renders only the items whose state flipped (keyed selectors), not every
// item of the list.

const COUNT = 30

function mountListbox(options: { multiple?: boolean, modelValue?: unknown, highlightOnHover?: boolean } = {}) {
  const renders: number[] = Array.from<number>({ length: COUNT }).fill(0)
  const model = ref<any>(options.modelValue)
  const wrapper = mount(defineComponent({
    setup: () => () => h(ListboxRoot, {
      'multiple': options.multiple,
      'highlightOnHover': options.highlightOnHover,
      'modelValue': model.value,
      'onUpdate:modelValue': (value: unknown) => { model.value = value },
    }, () => h(ListboxContent, null, () => Array.from({ length: COUNT }, (_: unknown, i: number) =>
      h(ListboxItem, { key: i, value: `item-${i}` }, () => {
        renders[i]++
        return `Item ${i}`
      })))),
  }), { attachTo: document.body })
  const reset = () => renders.fill(0)
  const rerendered = () => renders.flatMap((count, i) => count ? [i] : [])
  return { wrapper, model, reset, rerendered }
}

describe('listbox render counts', () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('re-renders only the old and the new item on a highlight move', async () => {
    const { wrapper, reset, rerendered } = mountListbox({ highlightOnHover: true })
    const items = wrapper.findAll('[role=option]')
    await new Promise(resolve => setTimeout(resolve))
    await items[3].trigger('pointermove')
    await nextTick()
    expect(items[3].attributes('data-highlighted')).toBe('')
    reset()

    await items[7].trigger('pointermove')
    await nextTick()
    expect(items[7].attributes('data-highlighted')).toBe('')
    expect(rerendered()).toEqual([3, 7])
    wrapper.unmount()
  })

  it('re-renders only the items a single selection change flips', async () => {
    const { wrapper, model, reset, rerendered } = mountListbox({ modelValue: 'item-2' })
    await nextTick()
    reset()

    model.value = 'item-9'
    await nextTick()
    expect(rerendered()).toEqual([2, 9])
    wrapper.unmount()
  })

  it('re-renders only the items a multiple selection change flips', async () => {
    const { wrapper, model, reset, rerendered } = mountListbox({ multiple: true, modelValue: ['item-1', 'item-4'] })
    await nextTick()
    reset()

    model.value = ['item-1', 'item-5']
    await nextTick()
    // Item 1, the first selected, also takes the highlight on a model change.
    expect(wrapper.find('[data-highlighted]').text()).toBe('Item 1')
    expect(rerendered()).toEqual([1, 4, 5])
    wrapper.unmount()
  })

  it('re-renders a memoized item when `as` changes', async () => {
    const tag = ref('div')
    const wrapper = mount(defineComponent({
      setup: () => () => h(ListboxRoot, null, () => h(ListboxContent, null, () =>
        h(ListboxItem, { value: 'a', as: tag.value }, () => 'A'))),
    }), { attachTo: document.body })
    await nextTick()
    expect(wrapper.find('[role=option]').element.tagName).toBe('DIV')
    tag.value = 'li'
    await nextTick()
    expect(wrapper.find('[role=option]').element.tagName).toBe('LI')
    wrapper.unmount()
  })

  // The item renders its slot content itself (no `Primitive` child with its
  // own effect): what the slot reads must still update a memoized item, alone.
  it('updates the slot content of a memoized item when what it reads changes', async () => {
    const labels = reactive(['Apple', 'Banana', 'Cherry'])
    const renders = [0, 0, 0]
    const wrapper = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem },
      setup: () => ({ labels, count: (i: number) => renders[i]++ }),
      template: `<ListboxRoot><ListboxContent>
        <ListboxItem v-for="(label, i) in ['Apple', 'Banana', 'Cherry']" :key="i" :value="i">{{ count(i) }}{{ labels[i] }}</ListboxItem>
      </ListboxContent></ListboxRoot>`,
    }), { attachTo: document.body })
    // Let the mount-time highlight settle first.
    await new Promise(resolve => setTimeout(resolve))
    await nextTick()
    renders.fill(0)

    labels[1] = 'Blueberry'
    await nextTick()
    expect(wrapper.findAll('[role=option]').map(o => o.text().replace(/^\d+/, ''))).toEqual(['Apple', 'Blueberry', 'Cherry'])
    // Only that item renders its slot (twice under Vue 3.5, which also runs it
    // to see whether the render is due).
    expect(renders.map(count => count > 0)).toEqual([false, true, false])
    wrapper.unmount()
  })

  it('updates the slot content of a memoized item that a parent update re-renders with the same state', async () => {
    const text = ref('Apple')
    const wrapper = mount(defineComponent({
      setup: () => () => h(ListboxRoot, { 'data-text': text.value }, () => h(ListboxContent, null, () =>
        h(ListboxItem, { value: 'a' }, () => text.value))),
    }), { attachTo: document.body })
    await nextTick()
    text.value = 'Apricot'
    await nextTick()
    expect(wrapper.find('[role=option]').text()).toBe('Apricot')
    wrapper.unmount()
  })
})
