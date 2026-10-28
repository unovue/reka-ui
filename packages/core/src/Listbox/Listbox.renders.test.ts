import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive, ref } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot } from '.'
import { ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot, ComboboxViewport } from '../Combobox'

// Optimisation-pinning tests: a highlight move or a selection change
// re-renders only the items whose state flipped (keyed selectors), not every
// item of the list.

const COUNT = 30

function mountListbox(options: { multiple?: boolean, modelValue?: unknown, highlightOnHover?: boolean } = {}) {
  const renders: number[] = Array.from<number>({ length: COUNT }).fill(0)
  const model = ref<any>(options.modelValue)
  // A compiled template, as an app writes it: a model change re-renders the
  // root, not the items (their slots are passed down unchanged). A render
  // function that reads the model re-creates every item's slot instead, and
  // a new slot function always re-renders its item.
  const wrapper = mount(defineComponent({
    components: { ListboxRoot, ListboxContent, ListboxItem },
    setup: () => ({ model, options, count: COUNT, track: (i: number) => { renders[i]++ } }),
    template: `<ListboxRoot v-model="model" :multiple="options.multiple" :highlight-on-hover="options.highlightOnHover">
      <ListboxContent>
        <ListboxItem v-for="i in count" :key="i - 1" :value="'item-' + (i - 1)">{{ track(i - 1) }}Item {{ i - 1 }}</ListboxItem>
      </ListboxContent>
    </ListboxRoot>`,
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

  // The content's roving `tabindex` flips when the highlight is set or
  // cleared; that must not re-render the content (and every item with it).
  it('re-renders only the item a pointer leave or re-enter flips', async () => {
    const { wrapper, reset, rerendered } = mountListbox({ highlightOnHover: true })
    await new Promise(resolve => setTimeout(resolve))
    const content = wrapper.find('[role=listbox]')
    const items = wrapper.findAll('[role=option]')
    // The first item takes the highlight on mount.
    expect(items[0].attributes('data-highlighted')).toBe('')
    reset()

    await items[3].trigger('pointermove')
    await nextTick()
    expect(rerendered()).toEqual([0, 3])
    expect(content.attributes('tabindex')).toBe('-1')
    reset()

    // The root clears the highlight on leave.
    content.element.parentElement!.dispatchEvent(new PointerEvent('pointerleave'))
    await nextTick()
    expect(rerendered()).toEqual([3])
    expect(content.attributes('tabindex')).toBe('0')
    reset()

    await items[7].trigger('pointermove')
    await nextTick()
    expect(rerendered()).toEqual([7])
    wrapper.unmount()
  })

  it('re-renders an item when `as` changes', async () => {
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
  // own effect): what the slot reads updates that item, alone.
  it('updates the slot content of an item when what it reads changes', async () => {
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
    // Only that item renders its slot, once.
    expect(renders).toEqual([0, 1, 0])
    wrapper.unmount()
  })

  it('updates the slot content of an item that a parent update re-renders with the same state', async () => {
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

  // Slot calls (item content renders) at 1,000 items: a hover move renders the
  // two items it flips; a filter keystroke renders the items it brings back,
  // once each (the item's element ref changing on remount does not re-render
  // it a second time).
  it('renders two items\' slots per hover move in a long list', async () => {
    let calls = 0
    const wrapper = mount(defineComponent({
      setup: () => () => h(ListboxRoot, { highlightOnHover: true }, () => h(ListboxContent, null, () =>
        Array.from({ length: 1000 }, (_, i) => h(ListboxItem, { key: i, value: `item-${i}` }, () => {
          calls++
          return `Item ${i}`
        })))),
    }), { attachTo: document.body })
    await new Promise(resolve => setTimeout(resolve))
    const items = wrapper.findAll('[role=option]')
    await items[0].trigger('pointermove')
    await nextTick()
    calls = 0
    for (let k = 1; k <= 20; k++) {
      await items[k * 10].trigger('pointermove')
      await nextTick()
    }
    expect(calls).toBe(40)
    wrapper.unmount()
  })

  it('renders each item a filter brings back once', async () => {
    let calls = 0
    const options = Array.from({ length: 1000 }, (_, i) => `opt ${i}`)
    const wrapper = mount(defineComponent({
      setup: () => () => h(ComboboxRoot, { open: true }, () => [
        h(ComboboxInput),
        h(ComboboxContent, null, () => h(ComboboxViewport, null, () =>
          options.map((option, i) => h(ComboboxItem, { key: i, value: option }, () => {
            calls++
            return option
          })))),
      ]),
    }), { attachTo: document.body })
    await new Promise(resolve => setTimeout(resolve))
    const input = wrapper.find('input')
    await input.setValue('opt 1')
    await new Promise(resolve => setTimeout(resolve))
    const visible = wrapper.findAll('[role=option]').length
    calls = 0
    await input.setValue('opt ')
    await new Promise(resolve => setTimeout(resolve))
    expect(wrapper.findAll('[role=option]').length).toBe(1000)
    // The items that come back, plus at most the two whose highlight moves.
    expect(calls).toBeLessThanOrEqual(1000 - visible + 2)
    wrapper.unmount()
  })
})
