import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import type { ListboxFilterFunction } from './useListbox'
import { mount } from '@vue/test-utils'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, effectScope, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { AutocompleteAnchor, AutocompleteContent, AutocompleteInput, AutocompleteItem, AutocompleteRoot, AutocompleteViewport } from '@/Autocomplete'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot, ComboboxViewport } from '@/Combobox'
import { useFilter, useKbd } from '@/shared'
import { injectListboxRootContext, ListboxContent, ListboxFilter, ListboxGroup, ListboxGroupLabel, ListboxItem, ListboxRoot, ListboxVirtualizer } from '.'
import { useListboxRoot } from './useListbox'

const kbd = useKbd()

window.HTMLElement.prototype.releasePointerCapture = vi.fn()
window.HTMLElement.prototype.hasPointerCapture = vi.fn()
window.HTMLElement.prototype.scrollIntoView = vi.fn()
window.HTMLElement.prototype.scrollTo = vi.fn()

const fruits = ['Apple', 'Banana', 'Blueberry', 'Cherry', 'Grape', 'Mango']
const vegetables = ['Carrot', 'Spinach']

function createListbox(rootProps: Record<string, unknown> = {}, itemProps: (value: string) => Record<string, unknown> = () => ({})) {
  return defineComponent({
    setup(_, { expose }) {
      const root = ref()
      expose({ root })
      return () => h(ListboxRoot, { ref: root, ...rootProps }, () => [
        h(ListboxFilter, { 'aria-label': 'Search' }),
        h(ListboxContent, { 'aria-label': 'Food' }, () => [
          h(ListboxGroup, { 'data-testid': 'fruits' }, () => [
            h(ListboxGroupLabel, () => 'Fruits'),
            ...fruits.map(value => h(ListboxItem, { value, ...itemProps(value) }, () => value)),
          ]),
          h(ListboxGroup, { 'data-testid': 'vegetables' }, () => [
            h(ListboxGroupLabel, () => 'Vegetables'),
            ...vegetables.map(value => h(ListboxItem, { value, ...itemProps(value) }, () => value)),
          ]),
        ]),
      ])
    },
  })
}

async function settle() {
  await nextTick()
  await nextTick()
  await nextTick()
}

function optionTexts(wrapper: VueWrapper) {
  return wrapper.findAll('[role=option]').map(i => i.text())
}

function highlightedText(wrapper: VueWrapper) {
  return wrapper.find('[role=option][data-highlighted]').text()
}

async function type(input: DOMWrapper<HTMLInputElement>, value: string) {
  await input.setValue(value)
  await settle()
}

describe('given a Listbox with a `filter`', () => {
  let wrapper: VueWrapper<any>
  let input: DOMWrapper<HTMLInputElement>

  beforeEach(async () => {
    document.body.innerHTML = ''
    const { contains } = useFilter({ sensitivity: 'base' })
    wrapper = mount(createListbox({ filter: contains }), { attachTo: document.body })
    input = wrapper.find('input')
    await settle()
  })

  it('renders every item while the search is empty', () => {
    expect(optionTexts(wrapper)).toEqual([...fruits, ...vegetables])
    expect(wrapper.vm.root.filtered).toEqual({ search: '', active: false, count: 8 })
  })

  it('renders only the matching items', async () => {
    await type(input, 'an')
    expect(optionTexts(wrapper)).toEqual(['Banana', 'Mango'])
    expect(wrapper.vm.root.filtered).toEqual({ search: 'an', active: true, count: 2 })
  })

  it('matches case- and accent-insensitively with `useFilter` `sensitivity: base`', async () => {
    await type(input, 'BLUÉ')
    expect(optionTexts(wrapper)).toEqual(['Blueberry'])
  })

  it('hides a group whose items are all filtered out', async () => {
    await type(input, 'rr')
    expect(optionTexts(wrapper)).toEqual(['Blueberry', 'Cherry', 'Carrot'])
    expect(wrapper.find('[data-testid=fruits]').attributes('hidden')).toBeUndefined()
    expect(wrapper.find('[data-testid=vegetables]').attributes('hidden')).toBeUndefined()

    await type(input, 'berry')
    expect(wrapper.find('[data-testid=fruits]').attributes('hidden')).toBeUndefined()
    expect(wrapper.find('[data-testid=vegetables]').attributes('hidden')).toBe('')
  })

  it('restores every item when the search is cleared', async () => {
    await type(input, 'an')
    await type(input, '')
    expect(optionTexts(wrapper)).toEqual([...fruits, ...vegetables])
    expect(wrapper.find('[data-testid=vegetables]').attributes('hidden')).toBeUndefined()
  })

  it('highlights the first match on input', async () => {
    await type(input, 'an')
    expect(highlightedText(wrapper)).toBe('Banana')
    expect(input.attributes('aria-activedescendant')).toBe(wrapper.find('[role=option][data-highlighted]').attributes('id'))
  })

  it('skips filtered-out items in keyboard navigation', async () => {
    await type(input, 'an')
    await input.trigger('keydown', { key: kbd.ARROW_DOWN })
    expect(highlightedText(wrapper)).toBe('Mango')
    // Mango is the last match: nothing below it (Carrot, Spinach) is reachable.
    await input.trigger('keydown', { key: kbd.ARROW_DOWN })
    expect(highlightedText(wrapper)).toBe('Mango')
    await input.trigger('keydown', { key: kbd.ARROW_UP })
    expect(highlightedText(wrapper)).toBe('Banana')
    await input.trigger('keydown', { key: kbd.END })
    expect(highlightedText(wrapper)).toBe('Mango')
    await input.trigger('keydown', { key: kbd.HOME })
    expect(highlightedText(wrapper)).toBe('Banana')
  })

  it('selects the highlighted match on Enter', async () => {
    await type(input, 'an')
    await input.trigger('keydown', { key: kbd.ARROW_DOWN })
    await input.trigger('keydown', { key: kbd.ENTER })
    expect(wrapper.findComponent(ListboxRoot).emitted('update:modelValue')?.[0]?.[0]).toBe('Mango')
  })

  it('drops the highlight when no item matches', async () => {
    await type(input, 'an')
    expect(input.attributes('aria-activedescendant')).toBeTruthy()
    await type(input, 'zzz')
    expect(optionTexts(wrapper)).toEqual([])
    expect(wrapper.vm.root.filtered.count).toBe(0)
    expect(wrapper.find('[data-highlighted]').exists()).toBe(false)
    expect(input.attributes('aria-activedescendant')).toBeUndefined()
  })

  it('renders a filtered-out item again once it matches', async () => {
    await type(input, 'an')
    await type(input, '')
    expect(optionTexts(wrapper)).toContain('Cherry')
  })

  it('should pass axe accessibility tests while filtering', async () => {
    await type(input, 'berry')
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })
})

describe('given a Listbox with a custom `filter`', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('calls the filter with the item text, the search term and the item value', async () => {
    const filter = vi.fn<ListboxFilterFunction<any>>((text, search) => text.toLowerCase().startsWith(search.toLowerCase()))
    const wrapper = mount(createListbox({ filter }), { attachTo: document.body })
    await settle()
    expect(filter).not.toHaveBeenCalled()

    await type(wrapper.find('input'), 'b')
    expect(filter).toHaveBeenCalledWith('Cherry', 'b', 'Cherry')
    expect(optionTexts(wrapper)).toEqual(['Banana', 'Blueberry'])
  })

  it('matches against `textValue` when given', async () => {
    const { contains } = useFilter({ sensitivity: 'base' })
    const wrapper = mount(createListbox({ filter: contains }, value => ({ textValue: value === 'Cherry' ? 'Cerise' : value })), { attachTo: document.body })
    await settle()

    await type(wrapper.find('input'), 'cerise')
    expect(optionTexts(wrapper)).toEqual(['Cherry'])
  })

  it('applies a `filter` set after mount to the current search term', async () => {
    const { contains } = useFilter({ sensitivity: 'base' })
    const filter = ref<ListboxFilterFunction | null>(null)
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(ListboxRoot, { filter: filter.value }, () => [
          h(ListboxFilter, { 'aria-label': 'Search' }),
          h(ListboxContent, { 'aria-label': 'Fruits' }, () => fruits.map(value => h(ListboxItem, { value }, () => value))),
        ])
      },
    }), { attachTo: document.body })
    await settle()

    await type(wrapper.find('input'), 'an')
    expect(optionTexts(wrapper)).toEqual(fruits)
    filter.value = contains
    await settle()
    expect(optionTexts(wrapper)).toEqual(['Banana', 'Mango'])
    filter.value = null
    await settle()
    expect(optionTexts(wrapper)).toEqual(fruits)
  })
})

describe('given a Listbox without a `filter`', () => {
  it.each([
    ['omitted', {}],
    ['`null`', { filter: null }],
  ])('does not filter the items when `filter` is %s (opt-in)', async (_, rootProps) => {
    document.body.innerHTML = ''
    const wrapper = mount(createListbox(rootProps), { attachTo: document.body })
    await settle()

    await type(wrapper.find('input'), 'an')
    expect(optionTexts(wrapper)).toEqual([...fruits, ...vegetables])
    expect(wrapper.vm.root.filtered).toEqual({ search: 'an', active: false, count: 8 })
    // The ListboxFilter still highlights the first item on input, as before.
    expect(highlightedText(wrapper)).toBe('Apple')
  })
})

describe('given a virtualized Listbox with a `filter`', () => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // jsdom reports zero-sized rects; give the virtualizer a viewport so rows mount.
  const originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect
  beforeAll(() => {
    window.HTMLElement.prototype.getBoundingClientRect = function () {
      return { width: 200, height: 200, top: 0, left: 0, right: 200, bottom: 200, x: 0, y: 0, toJSON() {} }
    }
  })
  afterAll(() => {
    window.HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
  })

  // 100 options; every tenth one is named "Match N", the rest "Item N".
  const options = Array.from({ length: 100 }, (_, i) => ({ value: i, label: i % 10 === 0 ? `Match ${i}` : `Item ${i}` }))

  function createVirtualListbox(rootProps: Record<string, unknown> = {}, textContent: ((o: any) => string) | undefined = o => o.label) {
    return defineComponent({
      setup(_, { expose }) {
        const root = ref()
        expose({ root })
        return () => h(ListboxRoot, { ref: root, ...rootProps }, () => [
          h(ListboxFilter, { 'aria-label': 'Search' }),
          h(ListboxContent, { 'aria-label': 'Options', 'style': 'height: 200px; overflow: auto' }, () =>
            h(ListboxVirtualizer, { options, textContent }, {
              default: ({ option }: any) => h(ListboxItem, { value: option }, () => option.label),
            })),
        ])
      },
    })
  }

  async function flush() {
    await settle()
    await new Promise(resolve => requestAnimationFrame(() => resolve(null)))
    await nextTick()
  }

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('filters `options` before virtualizing them', async () => {
    const { contains } = useFilter({ sensitivity: 'base' })
    const wrapper = mount(createVirtualListbox({ filter: contains }), { attachTo: document.body })
    await flush()
    expect(wrapper.vm.root.filtered.count).toBe(100)

    await wrapper.find('input').setValue('match')
    await flush()

    const rows = wrapper.findAll('[role=option]')
    expect(rows.map(r => r.text())).toEqual(options.filter(o => o.label.startsWith('Match')).map(o => o.label))
    // Filtered-out options take no virtual index and are not counted in the set size.
    expect(rows.map(r => r.attributes('data-index'))).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
    expect(rows.map(r => r.attributes('aria-posinset'))).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
    expect(rows.every(r => r.attributes('aria-setsize') === '10')).toBe(true)
    expect(wrapper.vm.root.filtered).toEqual({ search: 'match', active: true, count: 10 })
  })

  it('skips filtered-out options in keyboard navigation', async () => {
    const { contains } = useFilter({ sensitivity: 'base' })
    const wrapper = mount(createVirtualListbox({ filter: contains }), { attachTo: document.body })
    await flush()
    const input = wrapper.find('input')

    await input.setValue('match')
    await flush()
    expect(highlightedText(wrapper)).toBe('Match 0')

    await input.trigger('keydown', { key: kbd.ARROW_DOWN })
    await flush()
    expect(highlightedText(wrapper)).toBe('Match 10')

    await input.trigger('keydown', { key: kbd.END })
    await flush()
    expect(highlightedText(wrapper)).toBe('Match 90')
  })

  it('selects the highlighted match on Enter', async () => {
    const { contains } = useFilter({ sensitivity: 'base' })
    const wrapper = mount(createVirtualListbox({ filter: contains }), { attachTo: document.body })
    await flush()
    const input = wrapper.find('input')

    await input.setValue('match')
    await flush()
    await input.trigger('keydown', { key: kbd.ARROW_DOWN })
    await flush()
    await input.trigger('keydown', { key: kbd.ENTER })
    expect(wrapper.findComponent(ListboxRoot).emitted('update:modelValue')?.[0]?.[0]).toEqual({ value: 10, label: 'Match 10' })
  })

  it('matches the option\'s string form without `textContent`', async () => {
    const { contains } = useFilter({ sensitivity: 'base' })
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(ListboxRoot, { filter: contains }, () => [
          h(ListboxFilter, { 'aria-label': 'Search' }),
          h(ListboxContent, { 'aria-label': 'Fruits', 'style': 'height: 200px; overflow: auto' }, () =>
            h(ListboxVirtualizer, { options: fruits }, {
              default: ({ option }: any) => h(ListboxItem, { value: option }, () => option),
            })),
        ])
      },
    }), { attachTo: document.body })
    await flush()

    await wrapper.find('input').setValue('an')
    await flush()
    expect(optionTexts(wrapper)).toEqual(['Banana', 'Mango'])
  })

  it('does not filter without a `filter`', async () => {
    const wrapper = mount(createVirtualListbox(), { attachTo: document.body })
    await flush()
    await wrapper.find('input').setValue('match')
    await flush()
    expect(wrapper.findAll('[role=option]')[1].text()).toBe('Item 1')
    expect(wrapper.find('[role=option]').attributes('aria-setsize')).toBe('100')
  })

  it('should pass axe accessibility tests while filtering', async () => {
    const { contains } = useFilter({ sensitivity: 'base' })
    const wrapper = mount(createVirtualListbox({ filter: contains }), { attachTo: document.body })
    await flush()
    await wrapper.find('input').setValue('match')
    await flush()
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })
})

describe('useListboxRoot filtering', () => {
  it('filters registered items against a ref-owned `filterSearch`', () => {
    const scope = effectScope()
    scope.run(() => {
      const search = ref('')
      const filter = ref<ListboxFilterFunction<string> | null>((text, term) => text.includes(term))
      const listbox = useListboxRoot<string>({ filter, filterSearch: search })
      const label = ref<string | undefined>('Apple')
      listbox.context.registerFilterItem('a', { value: () => 'apple', label: () => label.value })
      listbox.context.registerFilterItem('b', { value: () => 'banana', label: () => 'Banana', group: 'g' })

      expect(listbox.filterState.value).toEqual({ search: '', active: false, count: 2 })

      listbox.setFilterSearch('an')
      expect(search.value).toBe('an')
      expect(listbox.filterState.value).toEqual({ search: 'an', active: true, count: 1 })
      expect(listbox.context.isFilteredOut('a')).toBe(true)
      expect(listbox.context.isFilteredOut('b')).toBe(false)
      expect(listbox.context.isGroupFilteredOut('g')).toBe(false)

      // An item that was not measured yet stays rendered.
      label.value = undefined
      expect(listbox.context.isFilteredOut('a')).toBe(false)

      search.value = 'zz'
      expect(listbox.context.isGroupFilteredOut('g')).toBe(true)

      filter.value = null
      expect(listbox.filterState.value.active).toBe(false)
      expect(listbox.context.isFilteredOut('b')).toBe(false)
    })
    scope.stop()
  })
})

// Hands the test the root context, to drive the search without a `ListboxFilter`
// (which would also take the keyboard away from the content).
const ContextProbe = defineComponent({
  setup(_, { expose }) {
    expose({ context: injectListboxRootContext() })
    return () => null
  },
})

describe('given a filtered Listbox driven through the context', () => {
  function mountListbox(rootProps: Record<string, unknown> = {}) {
    const { contains } = useFilter({ sensitivity: 'base' })
    const probe = ref()
    const root = ref()
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(ListboxRoot, { ref: root, filter: contains, ...rootProps }, () => [
          h(ContextProbe, { ref: probe }),
          h(ListboxContent, { 'aria-label': 'Fruits' }, () => fruits.map(value => h(ListboxItem, { value }, () => value))),
        ])
      },
    }), { attachTo: document.body })
    return { wrapper, probe, root, content: wrapper.find('[role=listbox]') }
  }

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('skips filtered-out items in typeahead', async () => {
    const { wrapper, probe, content } = mountListbox()
    await settle()
    probe.value.context.setFilterSearch('an')
    await settle()
    await content.trigger('focus')
    expect(highlightedText(wrapper)).toBe('Banana')

    // "Apple" starts with "a" but is filtered out: typeahead stays put.
    await content.trigger('keydown', { key: 'a' })
    expect(highlightedText(wrapper)).toBe('Banana')
    await new Promise(resolve => setTimeout(resolve, 1100))
    await content.trigger('keydown', { key: 'm' })
    expect(highlightedText(wrapper)).toBe('Mango')
  })

  it('selects only the matching items on Ctrl+A', async () => {
    const { wrapper, probe, content } = mountListbox({ multiple: true })
    await settle()
    probe.value.context.setFilterSearch('an')
    await settle()
    await content.trigger('focus')
    await content.trigger('keydown', { key: 'a', ctrlKey: true })
    expect(wrapper.findComponent(ListboxRoot).emitted('update:modelValue')?.at(-1)?.[0]).toEqual(['Banana', 'Mango'])
  })

  it('leaves hidden items out of a Shift range', async () => {
    const { wrapper, probe, content } = mountListbox({ multiple: true, selectionBehavior: 'replace' })
    await settle()
    probe.value.context.setFilterSearch('an')
    await settle()
    await content.trigger('focus')
    await wrapper.findAll('[role=option]')[0].trigger('click')
    // Blueberry, Cherry and Grape sit between Banana and Mango but are filtered out.
    await content.trigger('keydown', { key: kbd.ARROW_DOWN, shiftKey: true })
    expect(wrapper.findComponent(ListboxRoot).emitted('update:modelValue')?.at(-1)?.[0]).toEqual(['Banana', 'Mango'])
  })

  it('counts the matches in `filtered.count`', async () => {
    const { probe, root } = mountListbox()
    await settle()
    expect(root.value.filtered.count).toBe(6)
    probe.value.context.setFilterSearch('b')
    await settle()
    expect(root.value.filtered.count).toBe(2)
    probe.value.context.setFilterSearch('zz')
    await settle()
    expect(root.value.filtered.count).toBe(0)
    probe.value.context.setFilterSearch('')
    await settle()
    expect(root.value.filtered.count).toBe(6)
  })
})

describe('given a filtered Listbox whose index-keyed items are reused', () => {
  it('re-measures an item that now holds another value', async () => {
    document.body.innerHTML = ''
    const { contains } = useFilter({ sensitivity: 'base' })
    const data = ref(['Apple', 'Banana', 'Grape'])
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(ListboxRoot, { filter: contains }, () => [
          h(ListboxFilter, { 'aria-label': 'Search' }),
          h(ListboxContent, { 'aria-label': 'Fruits' }, () => data.value.map((value, index) => h(ListboxItem, { key: index, value }, () => value))),
        ])
      },
    }), { attachTo: document.body })
    await settle()
    await type(wrapper.find('input'), 'ap')
    expect(optionTexts(wrapper)).toEqual(['Apple', 'Grape'])

    // The hidden second item (was Banana) now holds Apricot, which matches.
    data.value = ['Cherry', 'Apricot', 'Grapefruit']
    await settle()
    expect(optionTexts(wrapper)).toEqual(['Apricot', 'Grapefruit'])
  })
})

describe('given a Listbox with a non-empty search during SSR', () => {
  it('does not render a group hidden before its items registered', async () => {
    const { contains } = useFilter({ sensitivity: 'base' })
    const app = createSSRApp(defineComponent({
      setup() {
        return () => h(ListboxRoot, { filter: contains }, () => [
          h(ListboxFilter, { 'aria-label': 'Search', 'modelValue': 'berry' }),
          h(ListboxContent, { 'aria-label': 'Food' }, () => [
            h(ListboxGroup, { 'data-testid': 'fruits' }, () => fruits.map(value => h(ListboxItem, { value, textValue: value }, () => value))),
            h(ListboxGroup, { 'data-testid': 'vegetables' }, () => vegetables.map(value => h(ListboxItem, { value, textValue: value }, () => value))),
          ]),
        ])
      },
    }))
    const html = await renderToString(app)
    expect(html).toContain('Blueberry')
    const fruitsGroup = html.match(/<div[^>]*data-testid="fruits"[^>]*>/)![0]
    expect(fruitsGroup).not.toContain('hidden')
  })
})

describe('given a Combobox or Autocomplete with a `filter` attribute', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps the inner Listbox filter off in Combobox', async () => {
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(ComboboxRoot, { open: true, filter: (text: string) => text === 'Apple' } as any, () => [
          h(ComboboxAnchor, null, () => h(ComboboxInput)),
          h(ComboboxContent, null, () => h(ComboboxViewport, null, () => fruits.map(value => h(ComboboxItem, { value }, () => value)))),
        ])
      },
    }), { attachTo: document.body })
    await settle()
    await type(wrapper.find('input'), 'a')
    // Combobox's own `contains` filter only.
    expect(optionTexts(wrapper)).toEqual(['Apple', 'Banana', 'Grape', 'Mango'])
  })

  it('keeps the inner Listbox filter off in Autocomplete', async () => {
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(AutocompleteRoot, { open: true, filter: (text: string) => text === 'Apple' } as any, () => [
          h(AutocompleteAnchor, null, () => h(AutocompleteInput)),
          h(AutocompleteContent, null, () => h(AutocompleteViewport, null, () => fruits.map(value => h(AutocompleteItem, { value }, () => value)))),
        ])
      },
    }), { attachTo: document.body })
    await settle()
    await type(wrapper.find('input'), 'a')
    expect(optionTexts(wrapper)).toEqual(['Apple', 'Banana', 'Grape', 'Mango'])
  })
})

describe('given a virtualized Listbox driven through the context', () => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  const originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect
  beforeAll(() => {
    window.HTMLElement.prototype.getBoundingClientRect = function () {
      return { width: 200, height: 200, top: 0, left: 0, right: 200, bottom: 200, x: 0, y: 0, toJSON() {} }
    }
  })
  afterAll(() => {
    window.HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
  })

  const options = Array.from({ length: 100 }, (_, i) => ({ value: i, label: i % 10 === 0 ? `Match ${i}` : `Item ${i}` }))

  function mountVirtual(rootProps: Record<string, unknown> = {}, textContent: ((o: any) => string) | null = o => o.label) {
    const { contains } = useFilter({ sensitivity: 'base' })
    const probe = ref()
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(ListboxRoot, { filter: contains, ...rootProps }, () => [
          h(ContextProbe, { ref: probe }),
          h(ListboxContent, { 'aria-label': 'Options', 'style': 'height: 200px; overflow: auto' }, () =>
            h(ListboxVirtualizer, { options, textContent: textContent ?? undefined }, {
              default: ({ option }: any) => h(ListboxItem, { value: option }, () => option.label),
            })),
        ])
      },
    }), { attachTo: document.body })
    return { wrapper, probe, content: wrapper.find('[role=listbox]') }
  }

  async function flush() {
    await settle()
    await new Promise(resolve => requestAnimationFrame(() => resolve(null)))
    await nextTick()
  }

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('drops a highlight whose option no longer matches, although its row is reused', async () => {
    const { wrapper, probe, content } = mountVirtual()
    await flush()
    await content.trigger('focus')
    await content.trigger('keydown', { key: kbd.ARROW_DOWN })
    await flush()
    expect(highlightedText(wrapper)).toBe('Item 1')
    const row = wrapper.find('[data-index="1"]').element

    probe.value.context.setFilterSearch('match')
    await flush()
    // Row 1 now renders "Match 10"; it must not inherit the highlight of "Item 1".
    expect(wrapper.find('[data-index="1"]').element).toBe(row)
    expect(wrapper.find('[data-index="1"]').text()).toBe('Match 10')
    expect(wrapper.find('[data-highlighted]').exists()).toBe(false)
    expect(probe.value.context.highlightedElement.value).toBeNull()
  })

  it('selects only the matching options on Ctrl+A', async () => {
    const { wrapper, probe, content } = mountVirtual({ multiple: true })
    await flush()
    probe.value.context.setFilterSearch('match')
    await flush()
    await content.trigger('focus')
    await content.trigger('keydown', { key: 'a', ctrlKey: true })
    await flush()
    const value = wrapper.findComponent(ListboxRoot).emitted('update:modelValue')?.at(-1)?.[0] as Array<{ value: number }>
    expect(value.map(o => o.value)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90])
  })

  it('leaves filtered-out options out of a Shift range', async () => {
    const { wrapper, probe, content } = mountVirtual({ multiple: true, selectionBehavior: 'replace' })
    await flush()
    probe.value.context.setFilterSearch('match')
    await flush()
    await content.trigger('focus')
    await wrapper.find('[data-index="0"]').trigger('click')
    await content.trigger('keydown', { key: kbd.ARROW_DOWN, shiftKey: true })
    await flush()
    await content.trigger('keydown', { key: kbd.ARROW_DOWN, shiftKey: true })
    await flush()
    const value = wrapper.findComponent(ListboxRoot).emitted('update:modelValue')?.at(-1)?.[0] as Array<{ value: number }>
    expect(value.map(o => o.value)).toEqual([0, 10, 20])
  })

  it('warns in development when object options are filtered without `textContent`', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { probe } = mountVirtual({}, null)
    await flush()
    expect(warn).not.toHaveBeenCalled()
    probe.value.context.setFilterSearch('match')
    await flush()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('textContent')
    warn.mockRestore()
  })
})
