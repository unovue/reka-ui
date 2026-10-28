import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
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
})
