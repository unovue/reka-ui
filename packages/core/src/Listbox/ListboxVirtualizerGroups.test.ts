import type { ListboxRootContext } from './ListboxRoot.vue'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot, ComboboxViewport, ComboboxVirtualizer } from '@/Combobox'
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot, ListboxVirtualizer } from '.'
import { injectListboxRootContext } from './ListboxRoot.vue'
import { flattenVirtualOptions, isGroupedOptions, useListVirtualizer } from './useListVirtualizer'

interface Fruit { id: number, name: string }

const fruit = (id: number, name: string): Fruit => ({ id, name })
const groups = [
  { label: 'Berries', options: [fruit(1, 'Blueberry'), fruit(2, 'Raspberry')] },
  { label: 'Citrus', options: [fruit(3, 'Lemon'), fruit(4, 'Lime')] },
  { label: 'Stone fruit', options: [fruit(5, 'Peach')], disabled: true },
]

const originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  window.HTMLElement.prototype.scrollTo = vi.fn()
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return [] }
  } as unknown as typeof IntersectionObserver
  // jsdom reports zero-sized rects, so tanstack would render no rows.
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    return { width: 200, height: 400, top: 0, left: 0, right: 200, bottom: 400, x: 0, y: 0, toJSON() {} }
  }
})
beforeEach(() => {
  document.body.innerHTML = ''
})
afterAll(() => {
  window.HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
})

async function flush() {
  await nextTick()
  await nextTick()
  await new Promise(resolve => requestAnimationFrame(() => resolve(null)))
  await nextTick()
}

let rootContext: ListboxRootContext<Fruit> | undefined
const Probe = defineComponent({
  setup() {
    rootContext = injectListboxRootContext() as unknown as ListboxRootContext<Fruit>
    return () => null
  },
})

function mountListbox(props: { options?: unknown[], filter?: boolean, modelValue?: Fruit, by?: unknown } = {}) {
  return mount(defineComponent({
    setup: () => () => h(ListboxRoot, {
      by: (props.by ?? 'id') as string,
      modelValue: props.modelValue,
      ...(props.filter ? { filter: (text: string, search: string) => text.toLowerCase().includes(search.toLowerCase()) } : {}),
    }, () => [
      h(Probe),
      props.filter ? h(ListboxFilter, { 'aria-label': 'Search' }) : null,
      h(ListboxContent, { 'style': 'height: 400px; overflow: auto', 'aria-label': 'Fruits' }, () =>
        h(ListboxVirtualizer as any, { options: props.options ?? groups, grouped: !props.options, textContent: (option: Fruit) => option.name }, {
          default: ({ option }: { option: Fruit }) => h(ListboxItem, { value: option }, () => option.name),
          group: ({ group }: { group: { label: string } }) => h('div', { class: 'group-label' }, group.label),
        })),
    ]),
  }), { attachTo: document.body })
}

const headers = () => [...document.querySelectorAll<HTMLElement>('[data-reka-virtualizer-group]')]
const options = () => [...document.querySelectorAll<HTMLElement>('[role=option]')]

describe('listboxVirtualizer grouped rows', () => {
  it('renders a presentation header row per group and counts options only', async () => {
    mountListbox()
    await flush()
    expect(headers().map(header => header.textContent)).toEqual(['Berries', 'Citrus', 'Stone fruit'])
    expect(headers().every(header => header.getAttribute('role') === 'presentation')).toBe(true)
    const rendered = options()
    expect(rendered.map(option => option.textContent)).toEqual(['Blueberry', 'Raspberry', 'Lemon', 'Lime', 'Peach'])
    expect(rendered.map(option => option.getAttribute('aria-posinset'))).toEqual(['1', '2', '3', '4', '5'])
    expect(rendered.every(option => option.getAttribute('aria-setsize') === '5')).toBe(true)
    expect(rendered[2].getAttribute('aria-describedby')).toBe(headers()[1].id)
    // A disabled group disables its options.
    expect(rendered[4].hasAttribute('data-disabled')).toBe(true)
    // Rows share one index space: the header takes a `data-index` too.
    expect(headers()[1].getAttribute('data-index')).toBe('3')
  })

  it('skips header rows in keyboard navigation', async () => {
    mountListbox()
    await flush()
    const content = document.querySelector<HTMLElement>('[role=listbox]')!
    await fireEvent.focus(content)
    await flush()
    expect(document.activeElement?.textContent).toBe('Blueberry')
    await fireEvent.keyDown(content, { key: 'ArrowDown' })
    await fireEvent.keyDown(content, { key: 'ArrowDown' })
    expect(document.activeElement?.textContent).toBe('Lemon')
    await fireEvent.keyDown(content, { key: 'ArrowUp' })
    expect(document.activeElement?.textContent).toBe('Raspberry')
  })

  it('drops groups with no matching option when filtering', async () => {
    const wrapper = mountListbox({ filter: true })
    await flush()
    await wrapper.find('input').setValue('l')
    await flush()
    expect(options().map(option => option.textContent)).toEqual(['Blueberry', 'Lemon', 'Lime'])
    expect(headers().map(header => header.textContent)).toEqual(['Berries', 'Citrus'])
    expect(options().map(option => option.getAttribute('aria-setsize'))).toEqual(['3', '3', '3'])

    await wrapper.find('input').setValue('lem')
    await flush()
    expect(headers().map(header => header.textContent)).toEqual(['Citrus'])
  })

  it('passes axe', async () => {
    const wrapper = mountListbox()
    await flush()
    expect(await axe(wrapper.element.ownerDocument.body)).toHaveNoViolations()
  })
})

// #3086 review: the virtualizer registers no label eagerly. Each registration
// under a function `by` is a linear scan, so registering every option made a
// 10k-option mount quadratic (about 1 s per mount).
describe('listboxVirtualizer label registry', () => {
  it('registers only the rendered options', async () => {
    const many = Array.from({ length: 2000 }, (_, i) => fruit(i, `Fruit ${i}`))
    mountListbox({ options: many })
    await flush()
    expect(options().length).toBeLessThan(100)
    expect(rootContext!.labels.get(fruit(1500, 'ignored by `by`'))).toBeUndefined()
  })

  it('does not register primitive options as their string form', async () => {
    mount(defineComponent({
      setup: () => () => h(ListboxRoot, null, () => [
        h(Probe),
        h(ListboxContent, () => h(ListboxVirtualizer as any, { options: Array.from({ length: 500 }, (_, i) => `n${i}`) }, {
          default: ({ option }: { option: string }) => h(ListboxItem, { value: option }, () => option.toUpperCase()),
        })),
      ]),
    }), { attachTo: document.body })
    await flush()
    const labels = (rootContext as unknown as ListboxRootContext<string>).labels
    expect(labels.get('n499')).toBeUndefined()
    // A rendered item keeps the label its content registers.
    expect(labels.get('n0')).toBe('N0')
  })

  it('mounts 10k options under a function `by` without a quadratic registration', async () => {
    const many = Array.from({ length: 10000 }, (_, i) => fruit(i, `Fruit ${i}`))
    const byId = (a: Fruit | undefined, b: Fruit | undefined) => a?.id === b?.id
    const start = performance.now()
    const wrapper = mountListbox({ options: many, by: byId })
    await nextTick()
    await nextTick()
    const elapsed = performance.now() - start
    wrapper.unmount()
    // ~15 ms without registration, ~1 s with it; generous for slow CI.
    expect(elapsed).toBeLessThan(400)
  })
})

// #3086 review: an element without `data-index` is no option (`Number(null)` is 0).
describe('useListVirtualizer optionIndexOfElement', () => {
  it('maps an element that is not a row to -1, and a row to its option', () => {
    let list!: ReturnType<typeof useListVirtualizer<string>>
    mount(defineComponent({
      setup() {
        list = useListVirtualizer<string>({
          options: () => ['Apple', 'Banana'],
          textContent: () => undefined,
          estimateSize: () => 24,
          overscan: () => undefined,
          scrollElement: ref<HTMLElement>(),
          idPrefix: 'probe',
        })
        return () => null
      },
    }))
    expect(list.optionIndexOfElement(document.createElement('div'))).toBe(-1)
    expect(list.optionIndexOfElement(null)).toBe(-1)
    const row = document.createElement('div')
    row.setAttribute('data-index', '1')
    expect(list.optionIndexOfElement(row)).toBe(1)
  })
})

// #3086 review: groups are declared with `grouped`, never sniffed from the shape.
describe('listboxVirtualizer group detection', () => {
  const presets = [
    { label: 'Small', options: [] as string[] },
    { label: 'Large', options: ['xl'] },
  ]

  it('treats flat object options with `label` and `options` fields as options', () => {
    expect(isGroupedOptions(presets)).toBe(false)
    expect(flattenVirtualOptions(presets)).toHaveLength(2)
    expect(isGroupedOptions(presets, true)).toBe(true)
    expect(flattenVirtualOptions(presets, true)).toEqual(['xl'])
  })

  it('renders such options as option rows without `grouped`', async () => {
    mount(defineComponent({
      setup: () => () => h(ListboxRoot, null, () =>
        h(ListboxContent, { 'aria-label': 'Presets' }, () => h(ListboxVirtualizer as any, { options: presets, textContent: (preset: { label: string }) => preset.label }, {
          default: ({ option }: { option: { label: string } }) => h(ListboxItem, { value: option }, () => option.label),
        }))),
    }), { attachTo: document.body })
    await flush()
    expect(headers()).toHaveLength(0)
    expect(options().map(option => option.textContent)).toEqual(['Small', 'Large'])
  })
})

// #3086 review: an option's `aria-describedby` names its group header, which
// must stay mounted once it scrolls out of the rendered window.
describe('listboxVirtualizer group headers', () => {
  const food = [
    { label: 'Fruits', options: Array.from({ length: 300 }, (_, i) => `Fruit ${i}`) },
    { label: 'Vegetables', options: Array.from({ length: 300 }, (_, i) => `Veg ${i}`) },
  ]

  async function mountScrolled() {
    const scrollTops = new WeakMap<Element, number>()
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'scrollTop')
    Object.defineProperty(window.HTMLElement.prototype, 'scrollTop', {
      configurable: true,
      get(this: HTMLElement) { return scrollTops.get(this) ?? 0 },
      set(this: HTMLElement, value: number) { scrollTops.set(this, value) },
    })
    const wrapper = mount(defineComponent({
      setup: () => () => h(ListboxRoot, null, () =>
        h(ListboxContent, { 'style': 'height: 400px; overflow: auto', 'aria-label': 'Food' }, () =>
          h(ListboxVirtualizer as any, { options: food, grouped: true, estimateSize: 28 }, {
            default: ({ option }: { option: string }) => h(ListboxItem, { value: option }, () => option),
            group: ({ group }: { group: { label: string } }) => h('div', group.label),
          }))),
    }), { attachTo: document.body })
    await flush()
    const content = document.querySelector<HTMLElement>('[role=listbox]')!
    content.scrollTop = 150 * 28
    content.dispatchEvent(new Event('scroll'))
    await flush()
    if (descriptor)
      Object.defineProperty(window.HTMLElement.prototype, 'scrollTop', descriptor)
    return wrapper
  }

  it('keeps the header of a group scrolled mid-way mounted', async () => {
    await mountScrolled()
    const rendered = options()
    expect(rendered[0].textContent).not.toBe('Fruit 0')
    const dangling = rendered.filter(option => !document.getElementById(option.getAttribute('aria-describedby')!))
    expect(dangling.map(option => option.textContent)).toEqual([])
    expect(headers().map(header => header.textContent)).toContain('Fruits')
  })

  it('passes axe mid-group', async () => {
    const wrapper = await mountScrolled()
    expect(await axe(wrapper.element as HTMLElement)).toHaveNoViolations()
  })
})

describe('comboboxVirtualizer grouped rows', () => {
  it('forwards the `group` slot', async () => {
    mount(defineComponent({
      setup: () => () => h(ComboboxRoot, { open: true, by: 'id' }, () => [
        h(ComboboxInput, { 'aria-label': 'Fruit' }),
        h(ComboboxContent, () => h(ComboboxViewport, { style: 'height: 400px' }, () =>
          h(ComboboxVirtualizer as any, { options: groups, grouped: true, textContent: (option: Fruit) => option.name }, {
            default: ({ option }: { option: Fruit }) => h(ComboboxItem, { value: option }, () => option.name),
            group: ({ group }: { group: { label: string } }) => h('div', group.label),
          }))),
      ]),
    }), { attachTo: document.body })
    await flush()
    expect(headers().map(header => header.textContent)).toEqual(['Berries', 'Citrus', 'Stone fruit'])
    expect(options()).toHaveLength(5)
  })
})
