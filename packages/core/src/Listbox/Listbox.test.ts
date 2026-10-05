import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useKbd } from '@/shared'
import { handleSubmit } from '@/test'
import { ListboxContent, ListboxFilter, ListboxItem, ListboxItemIndicator, ListboxRoot, ListboxVirtualizer } from '.'
import Listbox from './story/_Listbox.vue'

describe('given default Listbox', () => {
  const kbd = useKbd()
  let wrapper: VueWrapper<InstanceType<typeof Listbox>>
  let content: DOMWrapper<Element>
  let items: DOMWrapper<Element>[]

  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Listbox, { attachTo: document.body })
    content = wrapper.find('[role=listbox]')
    items = wrapper.findAll('[role=option]')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })
  // TODO: add make sure to select first item when have ListboxFilter

  describe('when focus on content', () => {
    beforeEach(async () => {
      await content.trigger('focus')
    })

    it('should pass the focus to the first item', () => {
      expect(document.activeElement).toBe(items[0].element)
    })

    it('should have highlighted state on first item', () => {
      expect(items[0].attributes('data-highlighted')).toBe('')
    })

    it('should emit `highlight` event', () => {
      expect(wrapper.emitted('highlight')?.[0]?.[0]).toBeTruthy()
    })

    it('should highlight and select item when clicked', async () => {
      const item = items[2]
      await item.trigger('click')
      expect(item.attributes('aria-selected')).toBe('true')
      expect(item.attributes('data-state')).toBe('checked')
    })

    describe('after pressing `Enter`', async () => {
      beforeEach(async () => {
        await content.trigger('keydown', { key: kbd.ENTER })
      })

      it('should select the highlighted item', () => {
        const item = items[0]
        expect(item.attributes('data-highlighted')).toBe('')
        expect(item.attributes('aria-selected')).toBe('true')
        expect(item.attributes('data-state')).toBe('checked')
      })

      it('should emit `update:modelValue` event', () => {
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe(items[0].text())
      })

      it('should deselect after pressing `Enter`', async () => {
        await content.trigger('keydown', { key: kbd.ENTER })
        const item = items[0]
        expect(item.attributes('data-highlighted')).toBe('')
        expect(item.attributes('aria-selected')).toBe('false')
        expect(item.attributes('data-state')).toBe('unchecked')
      })

      describe('after selecting other item and press `Enter`', async () => {
        beforeEach(async () => {
          await content.trigger('keydown', { key: kbd.ARROW_DOWN })
          await content.trigger('keydown', { key: kbd.ARROW_DOWN })
          await content.trigger('keydown', { key: kbd.ENTER })
        })

        it('should select the third item', () => {
          const item = items[0]
          const newItem = items[2]
          expect(item.attributes('aria-selected')).toBe('false')
          expect(item.attributes('data-state')).toBe('unchecked')
          expect(newItem.attributes('aria-selected')).toBe('true')
          expect(newItem.attributes('data-state')).toBe('checked')
        })
      })
    })
  })

  // Test: useTypeAhead
  describe('when typing letter', async () => {
    beforeEach(async () => {
      await content.trigger('keydown', { key: 'b' })
    })

    it('should highlight text starting with B', () => {
      const item = items.find(i => i.text().startsWith('B'))
      expect(document.activeElement).toBe(item?.element)
    })
  })

  describe('when selection behavior `replace`', () => {
    beforeEach(() => {
      wrapper.setProps({ selectionBehavior: 'replace' })
    })

    it('should not toggle off the selected value', async () => {
      const item = items[0]
      await item.trigger('click')
      await item.trigger('click')
      expect(document.activeElement).toBe(item.element)
    })

    it('should select and replace another item', async () => {
      const item = items[0]
      const newItem = items[1]
      await item.trigger('click')
      expect(document.activeElement).toBe(item.element)
      await newItem.trigger('click')
      expect(document.activeElement).toBe(newItem.element)
    })
  })
})

describe('given a Listbox with hover highlighting', () => {
  it('emits the highlighted item without querying the collection', async () => {
    const wrapper = mount(ListboxRoot, {
      attachTo: document.body,
      props: { highlightOnHover: true },
      slots: {
        default: () => h(ListboxContent, null, {
          default: () => ['first', 'second', 'third'].map(value =>
            h(ListboxItem, { value }, () => value)),
        }),
      },
    })
    await nextTick()
    await nextTick()

    const content = wrapper.find('[role=listbox]')
    const items = wrapper.findAll('[role=option]')
    const querySpy = vi.spyOn(content.element, 'querySelectorAll')
    try {
      for (const item of items.slice(1)) {
        await item.trigger('pointermove', { pointerType: 'mouse' })
        expect(wrapper.emitted('highlight')?.at(-1)?.[0]).toEqual({
          ref: item.element,
          value: item.text(),
        })
        expect(item.attributes('data-highlighted')).toBe('')
      }
      expect(querySpy).not.toHaveBeenCalled()

      const eventCount = wrapper.emitted('highlight')?.length
      await items[2].trigger('pointermove', { pointerType: 'mouse' })
      expect(wrapper.emitted('highlight')).toHaveLength(eventCount!)
      expect(querySpy).not.toHaveBeenCalled()
    }
    finally {
      querySpy.mockRestore()
      wrapper.unmount()
    }
  })
})

describe('given a Listbox on initial mount', () => {
  let wrapper: VueWrapper<InstanceType<typeof Listbox>>
  let scrollSpy: ReturnType<typeof vi.fn>

  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()

  beforeEach(async () => {
    scrollSpy = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollSpy
    document.body.innerHTML = ''
    wrapper = mount(Listbox, { attachTo: document.body })
    // let the immediate watcher's highlight cycle resolve
    await nextTick()
    await nextTick()
  })

  it('should highlight the first item without scrolling the page or stealing focus', () => {
    const items = wrapper.findAll('[role=option]')
    // the item is highlighted for keyboard entry...
    expect(items[0].attributes('data-highlighted')).toBe('')
    // ...but the mount highlight must not focus it or scroll it into view,
    // otherwise a Listbox below the fold scrolls the whole page on load.
    expect(scrollSpy).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(items[0].element)
  })

  it('should focus and scroll once the user interacts', async () => {
    await wrapper.find('[role=listbox]').trigger('focus')
    const items = wrapper.findAll('[role=option]')
    expect(document.activeElement).toBe(items[0].element)
    expect(scrollSpy).toHaveBeenCalled()
  })
})

describe('given a virtualized Listbox on initial mount', () => {
  let scrollSpy: ReturnType<typeof vi.fn>

  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollTo = vi.fn()
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // jsdom reports zero-sized rects, so `@tanstack/virtual-core` would render no
  // items. Give the virtualizer a non-zero viewport so items actually mount.
  const originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect
  beforeAll(() => {
    window.HTMLElement.prototype.getBoundingClientRect = function () {
      return { width: 200, height: 200, top: 0, left: 0, right: 200, bottom: 200, x: 0, y: 0, toJSON() {} }
    }
  })
  afterAll(() => {
    window.HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
  })

  const VirtualListbox = defineComponent({
    props: { multiple: Boolean, loop: Boolean, count: { type: Number, default: 100 }, disabled: { type: Array, default: () => [] }, modelValue: { type: null, default: undefined } },
    setup(props) {
      const options = Array.from({ length: props.count }, (_, i) => ({ label: `Item ${i}`, value: i }))
      return () => h(ListboxRoot, { multiple: props.multiple, loop: props.loop, modelValue: props.modelValue }, () =>
        h(ListboxContent, { style: 'height: 200px; overflow: auto' }, () =>
          h(ListboxVirtualizer, { options, textContent: (o: any) => o.label }, {
            default: ({ option }: any) => h(ListboxItem, { value: option, disabled: props.disabled.includes(option.value) }, () => option.label),
          })))
    },
  })

  async function flush() {
    // watcher → nextTick → highlightSelected (await nextTick) → virtualFocusHook → rAF
    await nextTick()
    await nextTick()
    await new Promise(resolve => requestAnimationFrame(() => resolve(null)))
    await nextTick()
  }

  beforeEach(() => {
    scrollSpy = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollSpy
    document.body.innerHTML = ''
  })

  it('should highlight the first item without scrolling the page or stealing focus', async () => {
    const wrapper = mount(VirtualListbox, { props: { multiple: true }, attachTo: document.body })
    await flush()

    const items = wrapper.findAll('[role=option]')
    expect(items.length).toBeGreaterThan(0)
    // the first item is highlighted for keyboard entry...
    expect(items[0].attributes('data-highlighted')).toBe('')
    // ...but the mount highlight must not focus it or scroll, otherwise a
    // virtualized Listbox below the fold scrolls the whole page on load.
    expect(scrollSpy).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(items[0].element)
  })

  it('should highlight a pre-selected item on mount without scrolling the page or stealing focus', async () => {
    // A selected value below the fold must not pull the page to the listbox on
    // mount. The checked item is brought into the internal scroll container
    // (`scrollToIndex`) and made the roving-tabindex target, but it is neither
    // focused nor scrolled into view at the document level.
    // `modelValue` is the option object (items hold the whole option as value);
    // it matches option #3 structurally via the default `isEqual` comparison.
    const wrapper = mount(VirtualListbox, { props: { modelValue: { label: 'Item 3', value: 3 } }, attachTo: document.body })
    await flush()

    const checked = wrapper.find('[data-index="3"]')
    expect(checked.exists()).toBe(true)
    // the checked item (not the first item) becomes the highlight target...
    expect(checked.attributes('data-highlighted')).toBe('')
    expect(wrapper.find('[data-index="0"]').attributes('data-highlighted')).toBeUndefined()
    // ...without focusing it or scrolling the page.
    expect(scrollSpy).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(checked.element)
  })

  it('should focus and scroll the first item when the user enters the listbox', async () => {
    // Entry focus (`onEnter`) is user-driven, so focusing and scrolling the
    // first item into view is expected here — unlike the mount highlight above.
    const wrapper = mount(VirtualListbox, { props: { multiple: true }, attachTo: document.body })
    await flush()
    scrollSpy.mockClear()

    await wrapper.find('[role=listbox]').trigger('focus')
    const items = wrapper.findAll('[role=option]')
    expect(document.activeElement).toBe(items[0].element)
    expect(scrollSpy).toHaveBeenCalled()
  })

  describe('with `loop`', () => {
    const kbd = useKbd()

    async function press(content: DOMWrapper<Element>, key: string) {
      await content.trigger('keydown', { key })
      await new Promise(resolve => requestAnimationFrame(() => resolve(null)))
      await nextTick()
    }

    it('should wrap from the first option to the last on `ArrowUp`', async () => {
      const wrapper = mount(VirtualListbox, { props: { loop: true, count: 5 }, attachTo: document.body })
      await flush()
      const content = wrapper.find('[role=listbox]')
      await content.trigger('focus')

      await press(content, kbd.ARROW_UP)
      expect(document.activeElement?.getAttribute('data-index')).toBe('4')
    })

    it('should wrap from the last option to the first on `ArrowDown`', async () => {
      const wrapper = mount(VirtualListbox, { props: { loop: true, count: 5 }, attachTo: document.body })
      await flush()
      const content = wrapper.find('[role=listbox]')
      await content.trigger('focus')

      await press(content, kbd.END)
      expect(document.activeElement?.getAttribute('data-index')).toBe('4')
      await press(content, kbd.ARROW_DOWN)
      expect(document.activeElement?.getAttribute('data-index')).toBe('0')
    })

    it('should wrap past disabled boundary options', async () => {
      const wrapper = mount(VirtualListbox, { props: { loop: true, count: 5, disabled: [0, 4] }, attachTo: document.body })
      await flush()
      const content = wrapper.find('[role=listbox]')
      await content.trigger('focus')
      expect(document.activeElement?.getAttribute('data-index')).toBe('1')

      await press(content, kbd.ARROW_UP)
      expect(document.activeElement?.getAttribute('data-index')).toBe('3')
      await press(content, kbd.ARROW_DOWN)
      expect(document.activeElement?.getAttribute('data-index')).toBe('1')
    })

    it('should not wrap at the end of the rendered window', async () => {
      // jsdom never scrolls, so only the first window of the 100 options is rendered.
      const wrapper = mount(VirtualListbox, { props: { loop: true }, attachTo: document.body })
      await flush()
      const content = wrapper.find('[role=listbox]')
      await content.trigger('focus')

      const rendered = wrapper.findAll('[role=option]')
      const lastRendered = rendered.at(-1)!.attributes('data-index')
      expect(Number(lastRendered)).toBeLessThan(99)

      await press(content, kbd.END)
      expect(document.activeElement?.getAttribute('data-index')).toBe(lastRendered)
      await press(content, kbd.ARROW_DOWN)
      expect(document.activeElement?.getAttribute('data-index')).toBe(lastRendered)
    })
  })
})

describe('given multiple `true` Listbox', () => {
  const kbd = useKbd()
  let wrapper: VueWrapper<InstanceType<typeof Listbox>>
  let content: DOMWrapper<Element>
  let items: DOMWrapper<Element>[]

  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()

  beforeEach(async () => {
    document.body.innerHTML = ''
    wrapper = mount(Listbox, { props: { multiple: true, selectionBehavior: 'toggle' }, attachTo: document.body })
    await nextTick()
    content = wrapper.find('[role=listbox]')
    items = wrapper.findAll('[role=option]')
    await content.trigger('focus')
  })

  it('should select multiple items', async () => {
    await content.trigger('keydown', { key: kbd.ENTER })
    await content.trigger('keydown', { key: kbd.ARROW_DOWN })
    await content.trigger('keydown', { key: kbd.ENTER })
    await content.trigger('keydown', { key: kbd.ARROW_DOWN })
    await content.trigger('keydown', { key: kbd.ENTER })
    await content.trigger('keydown', { key: kbd.ARROW_DOWN })
    await content.trigger('keydown', { key: kbd.ARROW_DOWN })
    await content.trigger('keydown', { key: kbd.ENTER })

    expect(items[0].attributes('aria-selected')).toBe('true')
    expect(items[1].attributes('aria-selected')).toBe('true')
    expect(items[2].attributes('aria-selected')).toBe('true')
    expect(items[3].attributes('aria-selected')).toBe('false')
    expect(items[4].attributes('aria-selected')).toBe('true')
  })

  it('should emit `update:modelValue` event', async () => {
    await content.trigger('keydown', { key: kbd.ENTER })
    await content.trigger('keydown', { key: kbd.ARROW_DOWN })
    await content.trigger('keydown', { key: kbd.ENTER })
    await content.trigger('keydown', { key: kbd.ARROW_UP })
    await content.trigger('keydown', { key: kbd.ENTER })
    // v3: the second emit argument is the `ChangeEventDetails`; only the value is asserted here.
    expect(wrapper.emitted('update:modelValue')?.map(args => args[0])).toEqual([
      [items[0].text()],
      [items[0].text(), items[1].text()],
      [items[1].text()],
    ])
  })

  describe('when selection behavior `replace`', () => {
    beforeEach(async () => {
      wrapper.setProps({ selectionBehavior: 'replace' })
      await nextTick()
      await items[0].trigger('click')
    })

    it('should not toggle off the selected value', async () => {
      const item = items[0]
      await item.trigger('click')
      expect(document.activeElement).toBe(item.element)
    })

    it('should select and replace another item', async () => {
      const item = items[0]
      const newItem = items[1]
      expect(document.activeElement).toBe(item.element)
      await newItem.trigger('click')
      expect(document.activeElement).toBe(newItem.element)
    })

    it('should emit `update:modelValue` event', async () => {
      await content.trigger('keydown', { key: kbd.ENTER })
      await content.trigger('keydown', { key: kbd.ARROW_DOWN })
      await content.trigger('keydown', { key: kbd.ENTER })
      // v3: the second emit argument is the `ChangeEventDetails`; only the value is asserted here.
      // v3: re-selecting the current value emits nothing, also for a multiple selection.
      expect(wrapper.emitted('update:modelValue')?.map(args => args[0])).toEqual([
        [items[0].text()],
        [items[1].text()],
      ])
    })

    describe('when keypress Shift + ArrowDown', () => {
      it('should select the next item', async () => {
        await content.trigger('keydown.shift', { key: kbd.ARROW_DOWN })
        expect(items[0].attributes('aria-selected')).toBe('true')
        expect(items[1].attributes('aria-selected')).toBe('true')
        expect(items[2].attributes('aria-selected')).toBe('false')
      })

      it('should select more items', async () => {
        for (let i = 0; i <= 10; i++)
          await content.trigger('keydown.shift', { key: kbd.ARROW_DOWN })
        for (let i = 0; i <= 10; i++)
          expect(items[i].attributes('aria-selected')).toBe('true')
      })
    })
  })
})

describe('given horizontal Listbox with a filter', () => {
  it('leaves ArrowLeft/ArrowRight to the text input instead of navigating', async () => {
    document.body.innerHTML = ''
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(ListboxRoot, { orientation: 'horizontal' }, () => [
          h(ListboxFilter, { autoFocus: true }),
          h(ListboxContent, { 'aria-label': 'Letters' }, () => ['a', 'b', 'c'].map(value => h(ListboxItem, { value }, () => value))),
        ])
      },
    }), { attachTo: document.body })
    const filter = wrapper.find('input')
    const items = wrapper.findAll('[role=option]')
    // The mount highlight lands on the first item (nothing is selected). It is
    // queued through two `nextTick`s inside `highlightSelected`, so wait for it.
    await vi.waitFor(() => expect(items[0].attributes('data-highlighted')).toBe(''))
    // ArrowRight would map to `next` in a horizontal listbox; the caret keeps it
    // (no highlight move, default not prevented). End still navigates.
    const right = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true, bubbles: true })
    filter.element.dispatchEvent(right)
    await nextTick()
    expect(right.defaultPrevented).toBe(false)
    expect(items[0].attributes('data-highlighted')).toBe('')
    expect(items[1].attributes('data-highlighted')).toBeUndefined()
    await filter.trigger('keydown', { key: 'End' })
    expect(items[2].attributes('data-highlighted')).toBe('')
    await filter.trigger('keydown', { key: 'ArrowLeft' })
    expect(items[2].attributes('data-highlighted')).toBe('')
    expect(items[1].attributes('data-highlighted')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('given multiple `replace` Listbox with an initial selection', () => {
  it('pressing the selected item anchors a following Shift+Arrow range on it', async () => {
    document.body.innerHTML = ''
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(ListboxRoot, { multiple: true, selectionBehavior: 'replace', defaultValue: ['b'] }, () =>
          h(ListboxContent, { 'aria-label': 'Letters' }, () => ['a', 'b', 'c', 'd'].map(value => h(ListboxItem, { value }, () => value))))
      },
    }), { attachTo: document.body })
    const items = wrapper.findAll('[role=option]')
    await vi.waitFor(() => expect(items[1].attributes('data-highlighted')).toBe(''))
    // Re-pressing the current selection emits nothing, but it still anchors the range.
    await items[1].trigger('click')
    await wrapper.find('[role=listbox]').trigger('keydown', { key: 'ArrowDown', shiftKey: true })
    expect(wrapper.findComponent(ListboxRoot).emitted('update:modelValue')?.map(args => args[0])).toEqual([
      ['b', 'c'],
    ])
    wrapper.unmount()
  })
})

describe('given a Listbox with `loop`', () => {
  const kbd = useKbd()

  window.HTMLElement.prototype.scrollIntoView = vi.fn()

  function setup(loop: boolean) {
    document.body.innerHTML = ''
    const wrapper = mount(Listbox, { props: { loop }, attachTo: document.body })
    return { wrapper, content: wrapper.find('[role=listbox]'), items: wrapper.findAll('[role=option]') }
  }

  it('should wrap from the last item to the first on `ArrowDown`', async () => {
    const { content, items } = setup(true)
    await content.trigger('focus')
    await content.trigger('keydown', { key: kbd.END })
    expect(items.at(-1)!.attributes('data-highlighted')).toBe('')

    await content.trigger('keydown', { key: kbd.ARROW_DOWN })
    expect(items[0].attributes('data-highlighted')).toBe('')
    expect(document.activeElement).toBe(items[0].element)
  })

  it('should wrap from the first item to the last on `ArrowUp`', async () => {
    const { content, items } = setup(true)
    await content.trigger('focus')
    expect(items[0].attributes('data-highlighted')).toBe('')

    await content.trigger('keydown', { key: kbd.ARROW_UP })
    expect(items.at(-1)!.attributes('data-highlighted')).toBe('')
    expect(document.activeElement).toBe(items.at(-1)!.element)
  })

  it('should stay on the boundary items without `loop`', async () => {
    const { content, items } = setup(false)
    await content.trigger('focus')
    await content.trigger('keydown', { key: kbd.ARROW_UP })
    expect(items[0].attributes('data-highlighted')).toBe('')

    await content.trigger('keydown', { key: kbd.END })
    await content.trigger('keydown', { key: kbd.ARROW_DOWN })
    expect(items.at(-1)!.attributes('data-highlighted')).toBe('')
  })
})

describe('given horizontal Listbox', () => {
  const kbd = useKbd()
  let wrapper: VueWrapper<InstanceType<typeof Listbox>>
  let content: DOMWrapper<Element>
  let items: DOMWrapper<Element>[]

  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Listbox, { attachTo: document.body, props: { orientation: 'horizontal' } })
    content = wrapper.find('[role=listbox]')
    items = wrapper.findAll('[role=option]')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('when focus on content', () => {
    beforeEach(async () => {
      await content.trigger('focus')
    })

    it('should pass the focus to the first item', () => {
      expect(document.activeElement).toBe(items[0].element)
    })

    it('should have highlighted state on first item', () => {
      expect(items[0].attributes('data-highlighted')).toBe('')
    })

    it('should emit `highlight` event', () => {
      expect(wrapper.emitted('highlight')?.[0]?.[0]).toBeTruthy()
    })

    it('should highlight and select item when clicked', async () => {
      const item = items[2]
      await item.trigger('click')
      expect(item.attributes('aria-selected')).toBe('true')
      expect(item.attributes('data-state')).toBe('checked')
    })

    describe('after pressing `Enter`', async () => {
      beforeEach(async () => {
        await content.trigger('keydown', { key: kbd.ENTER })
      })

      it('should select the highlighted item', () => {
        const item = items[0]
        expect(item.attributes('data-highlighted')).toBe('')
        expect(item.attributes('aria-selected')).toBe('true')
        expect(item.attributes('data-state')).toBe('checked')
      })

      it('should emit `update:modelValue` event', () => {
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe(items[0].text())
      })

      it('should deselect after pressing `Enter`', async () => {
        await content.trigger('keydown', { key: kbd.ENTER })
        const item = items[0]
        expect(item.attributes('data-highlighted')).toBe('')
        expect(item.attributes('aria-selected')).toBe('false')
        expect(item.attributes('data-state')).toBe('unchecked')
      })

      describe('after selecting other item and press `Enter`', async () => {
        beforeEach(async () => {
          await content.trigger('keydown', { key: kbd.ARROW_RIGHT })
          await content.trigger('keydown', { key: kbd.ARROW_RIGHT })
          await content.trigger('keydown', { key: kbd.ENTER })
        })

        it('should select the third item', () => {
          const item = items[0]
          const newItem = items[2]
          expect(item.attributes('aria-selected')).toBe('false')
          expect(item.attributes('data-state')).toBe('unchecked')
          expect(newItem.attributes('aria-selected')).toBe('true')
          expect(newItem.attributes('data-state')).toBe('checked')
        })
      })
    })
  })
})

// Regression test for https://github.com/unovue/reka-ui/issues/2644
// `v-memo` on ListboxItem must invalidate when `disabled` (or
// `rootContext.focusable.value`) changes, otherwise `data-disabled` / `disabled`
// attributes go stale and the item still participates in keyboard navigation.
describe('given ListboxItem with reactive `disabled` prop', () => {
  it('should update DOM attributes when `disabled` toggles without highlight/selection change', async () => {
    const isDisabled = ref(false)
    const ReactiveDisabledListbox = defineComponent({
      setup() {
        return () =>
          h(ListboxRoot, null, {
            default: () => [
              h(ListboxItem, { value: { id: 1 }, disabled: isDisabled.value }, () => 'toggleable'),
              h(ListboxItem, { value: { id: 2 } }, () => 'other'),
            ],
          })
      },
    })

    const wrapper = mount(ReactiveDisabledListbox, { attachTo: document.body })
    const items = wrapper.findAll('[role=option]')

    expect(items[0].attributes('data-disabled')).toBeUndefined()
    expect(items[0].attributes('disabled')).toBeUndefined()

    isDisabled.value = true
    await nextTick()

    expect(items[0].attributes('data-disabled')).toBe('')
    expect(items[0].attributes('disabled')).toBe('')

    isDisabled.value = false
    await nextTick()

    expect(items[0].attributes('data-disabled')).toBeUndefined()
    expect(items[0].attributes('disabled')).toBeUndefined()
  })
})

// Regression test for https://github.com/unovue/reka-ui/issues/2904
// The VNode memoized by ListboxItem's `v-memo` spreads `$attrs`, so the memo
// must also invalidate when a fallthrough attribute changes. Otherwise a
// surviving virtualizer row whose `option` changes after filtering keeps the
// previous option's attributes (`data-testid`, `aria-setsize`, ...) while its
// slot content updates.
describe('given ListboxItem with reactive fallthrough attrs', () => {
  it('should update DOM attributes when an attr changes without highlight/selection change', async () => {
    const testId = ref('option-a')
    const ReactiveAttrListbox = defineComponent({
      setup() {
        return () =>
          h(ListboxRoot, null, {
            default: () => [
              h(ListboxItem, { 'value': { id: 1 }, 'data-testid': testId.value }, () => 'first'),
              h(ListboxItem, { value: { id: 2 } }, () => 'other'),
            ],
          })
      },
    })

    const wrapper = mount(ReactiveAttrListbox, { attachTo: document.body })
    const items = wrapper.findAll('[role=option]')
    expect(items[0].attributes('data-testid')).toBe('option-a')

    testId.value = 'option-b'
    await nextTick()

    expect(items[0].attributes('data-testid')).toBe('option-b')
  })

  it('should update DOM attributes when an attr key changes while its value stays the same', async () => {
    const attrName = ref('data-variant-a')
    const ReactiveAttrKeyListbox = defineComponent({
      setup() {
        return () =>
          h(ListboxRoot, null, {
            default: () => [
              h(ListboxItem, { value: { id: 1 }, [attrName.value]: 'same' }, () => 'first'),
              h(ListboxItem, { value: { id: 2 } }, () => 'other'),
            ],
          })
      },
    })

    const wrapper = mount(ReactiveAttrKeyListbox, { attachTo: document.body })
    const items = wrapper.findAll('[role=option]')
    expect(items[0].attributes('data-variant-a')).toBe('same')

    attrName.value = 'data-variant-b'
    await nextTick()

    expect(items[0].attributes('data-variant-a')).toBeUndefined()
    expect(items[0].attributes('data-variant-b')).toBe('same')
  })

  it('should re-render a surviving virtualizer row when filtering shrinks the options', async () => {
    const originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect
    window.HTMLElement.prototype.getBoundingClientRect = function () {
      return { width: 200, height: 200, top: 0, left: 0, right: 200, bottom: 200, x: 0, y: 0, toJSON() {} } as DOMRect
    }

    try {
      const options = ref([
        { label: 'cdi', value: 'cdi' },
        { label: 'alpha', value: 'alpha' },
        { label: 'default', value: 'default' },
      ])
      const VirtualFilterListbox = defineComponent({
        setup() {
          return () =>
            h(ListboxRoot, null, () =>
              h(ListboxContent, { style: 'height: 200px; overflow: auto' }, () =>
                h(ListboxVirtualizer, { options: options.value, textContent: (o: any) => o.label }, {
                  default: ({ option }: any) =>
                    h(ListboxItem, { 'value': option, 'data-testid': `option-${option.label}` }, () => option.label),
                })))
        },
      })

      const wrapper = mount(VirtualFilterListbox, { attachTo: document.body })
      await nextTick()
      expect(wrapper.find('[data-index="0"]').attributes('data-testid')).toBe('option-cdi')

      // a filter that keeps only the last option: index 0 survives but maps to a different option
      options.value = [{ label: 'default', value: 'default' }]
      await nextTick()

      const survivor = wrapper.find('[data-index="0"]')
      expect(survivor.text()).toBe('default')
      expect(survivor.attributes('data-testid')).toBe('option-default')
      expect(survivor.attributes('aria-setsize')).toBe('1')
    }
    finally {
      window.HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
    }
  })
})

describe('given Listbox in a form', async () => {
  let items: DOMWrapper<Element>[]

  const wrapper = mount({
    props: ['handleSubmit'],
    components: { Listbox },
    template: '<form @submit="handleSubmit"><Listbox name="test" default-value="Afghanistan" /></form>',
  }, {
    props: { handleSubmit },
  })

  beforeEach(() => {
    items = wrapper.findAll('[role=option]')
  })

  afterAll(() => {
    document.body.innerHTML = ''
  })

  it('should have hidden input field', async () => {
    expect(wrapper.find('input[data-hidden]').exists()).toBe(true)
  })

  describe('after selecting option and clicking submit button', () => {
    beforeEach(async () => {
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ test: items[0].text() })
    })
  })

  describe('after selecting other option and click submit button again', () => {
    beforeEach(async () => {
      await items[4].trigger('click')
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ test: items[4].text() })
    })
  })
})

describe('listboxItem attribute forwarding', () => {
  it.each([false, true])('chains consumer listeners once (asChild=%s) and preserves attributes', async (asChild) => {
    const click = vi.fn()
    const select = vi.fn()
    const wrapper = mount(() => h(ListboxRoot, {}, () => h(ListboxContent, {}, () => h(ListboxItem, {
      'value': 'red',
      asChild,
      'onClick': click,
      'onSelect': select,
      'aria-label': 'Red',
      'class': 'custom-option',
      'style': { color: 'red' },
    }, () => asChild ? h('button', {}, 'Red') : 'Red'))))
    try {
      const item = wrapper.find('[role=option]')
      await item.trigger('click')
      expect(click).toHaveBeenCalledOnce()
      expect(select).toHaveBeenCalledOnce()
      expect(item.attributes('aria-selected')).toBe('true')
      expect(item.attributes('aria-label')).toBe('Red')
      expect(item.classes()).toContain('custom-option')
      expect(item.attributes('style')).toContain('color: red')
    }
    finally {
      wrapper.unmount()
    }
  })

  it.each([false, true])('updates forwarded attributes after mount (asChild=%s)', async (asChild) => {
    const label = ref('Red')
    const ReactiveAttributeListbox = defineComponent({
      setup() {
        return () => h(ListboxRoot, {}, () => h(ListboxContent, {}, () => h(ListboxItem, {
          'value': 'red',
          asChild,
          'aria-label': label.value,
        }, () => asChild ? h('button', {}, 'Red') : 'Red')))
      },
    })
    const wrapper = mount(ReactiveAttributeListbox)

    try {
      expect(wrapper.find('[role=option]').attributes('aria-label')).toBe('Red')

      label.value = 'Rouge'
      await nextTick()

      expect(wrapper.find('[role=option]').attributes('aria-label')).toBe('Rouge')
    }
    finally {
      wrapper.unmount()
    }
  })
})

describe('given Listbox with ListboxFilter handling IME composition', () => {
  let wrapper: VueWrapper
  let input: DOMWrapper<HTMLInputElement>
  let updates: string[]

  window.HTMLElement.prototype.scrollIntoView = vi.fn()

  const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'

  beforeEach(() => {
    document.body.innerHTML = ''
    updates = []
    const search = ref('')
    wrapper = mount(defineComponent({
      setup() {
        return () => h(ListboxRoot, {}, {
          default: () => [
            h(ListboxFilter, {
              'modelValue': search.value,
              'onUpdate:modelValue': (v: string) => {
                updates.push(v)
                search.value = v
              },
            }),
            h(ListboxContent, {}, {
              default: () => ['Apple', 'Banana'].map(i => h(ListboxItem, { value: i }, { default: () => i })),
            }),
          ],
        })
      },
    }), { attachTo: document.body })
    input = wrapper.find('input')
  })

  afterEach(() => {
    delete (window.navigator as { userAgent?: string }).userAgent
  })

  it('should not update modelValue during plain-text composition off Android (desktop Pinyin preedit)', async () => {
    await input.trigger('compositionstart')
    input.element.dispatchEvent(new CompositionEvent('compositionupdate', { data: 'xiang', bubbles: true }))
    input.element.value = 'xiang'
    await input.trigger('input')

    expect(updates).toEqual([])
  })

  it('should update modelValue live during plain-text (autocorrect) composition on Android', async () => {
    Object.defineProperty(window.navigator, 'userAgent', { value: ANDROID_UA, configurable: true })

    await input.trigger('compositionstart')
    input.element.dispatchEvent(new CompositionEvent('compositionupdate', { data: 'Br', bubbles: true }))
    input.element.value = 'Br'
    await input.trigger('input')

    expect(updates).toEqual(['Br'])
  })

  it('should not update modelValue during CJK IME composition on Android until compositionend', async () => {
    Object.defineProperty(window.navigator, 'userAgent', { value: ANDROID_UA, configurable: true })

    await input.trigger('compositionstart')
    input.element.dispatchEvent(new CompositionEvent('compositionupdate', { data: 'かんじ', bubbles: true }))
    input.element.value = 'かんじ'
    await input.trigger('input')

    expect(updates).toEqual([])

    await input.trigger('compositionend')
    await nextTick()

    expect(updates).toEqual(['かんじ'])
  })
})

describe('given ListboxItem slot props and ListboxItemIndicator', () => {
  function mountListbox(forceMount = false) {
    return mount(defineComponent({
      setup() {
        const modelValue = ref('a')
        return () => h(ListboxRoot, {
          'modelValue': modelValue.value,
          'onUpdate:modelValue': (v: any) => { modelValue.value = v },
        }, () => h(ListboxContent, () => ['a', 'b'].map(value =>
          h(ListboxItem, { value }, {
            default: ({ selected }: { selected: boolean }) => [
              h('span', { 'data-testid': `label-${value}` }, `${value}:${selected}`),
              h(ListboxItemIndicator, { 'forceMount': forceMount, 'data-testid': `indicator-${value}` }, () => '✓'),
            ],
          }),
        )))
      },
    }), { attachTo: document.body })
  }

  window.HTMLElement.prototype.scrollIntoView = vi.fn()

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should expose `selected` slot prop', async () => {
    const wrapper = mountListbox()
    expect(wrapper.find('[data-testid=label-a]').text()).toBe('a:true')
    expect(wrapper.find('[data-testid=label-b]').text()).toBe('b:false')

    await wrapper.findAll('[role=option]')[1].trigger('click')
    expect(wrapper.find('[data-testid=label-a]').text()).toBe('a:false')
    expect(wrapper.find('[data-testid=label-b]').text()).toBe('b:true')
  })

  it('should only mount the indicator of the selected item', async () => {
    const wrapper = mountListbox()
    expect(wrapper.find('[data-testid=indicator-a]').exists()).toBe(true)
    expect(wrapper.find('[data-testid=indicator-b]').exists()).toBe(false)

    await wrapper.findAll('[role=option]')[1].trigger('click')
    expect(wrapper.find('[data-testid=indicator-a]').exists()).toBe(false)
    expect(wrapper.find('[data-testid=indicator-b]').exists()).toBe(true)
  })

  it('should keep indicators mounted with `forceMount` and reflect `data-state`', async () => {
    const wrapper = mountListbox(true)
    const a = wrapper.find('[data-testid=indicator-a]')
    const b = wrapper.find('[data-testid=indicator-b]')
    expect(a.attributes('data-state')).toBe('checked')
    expect(b.attributes('data-state')).toBe('unchecked')
    expect(a.attributes('forcemount')).toBeUndefined()
    expect(a.attributes('aria-hidden')).toBe('true')
  })
})
