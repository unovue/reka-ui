import type { ListboxRootContext } from './ListboxRoot.vue'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick } from 'vue'
import { ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot, ComboboxViewport, ComboboxVirtualizer } from '@/Combobox'
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot, ListboxVirtualizer } from '.'
import { injectListboxRootContext } from './ListboxRoot.vue'

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

function mountListbox(props: { options?: unknown[], filter?: boolean, modelValue?: Fruit } = {}) {
  return mount(defineComponent({
    setup: () => () => h(ListboxRoot, {
      by: 'id',
      modelValue: props.modelValue,
      ...(props.filter ? { filter: (text: string, search: string) => text.toLowerCase().includes(search.toLowerCase()) } : {}),
    }, () => [
      h(Probe),
      props.filter ? h(ListboxFilter, { 'aria-label': 'Search' }) : null,
      h(ListboxContent, { 'style': 'height: 400px; overflow: auto', 'aria-label': 'Fruits' }, () =>
        h(ListboxVirtualizer as any, { options: props.options ?? groups, textContent: (option: Fruit) => option.name }, {
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

describe('listboxVirtualizer label registry', () => {
  it('registers the label of every option, rendered or not', async () => {
    const many = Array.from({ length: 2000 }, (_, i) => fruit(i, `Fruit ${i}`))
    mountListbox({ options: many })
    await flush()
    expect(options().length).toBeLessThan(100)
    expect(document.querySelector('[aria-posinset="1500"]')).toBeNull()
    expect(rootContext!.labels.get(fruit(1500, 'ignored by `by`'))).toBe('Fruit 1500')
  })

  it('registers primitive options without `textContent`', async () => {
    mount(defineComponent({
      setup: () => () => h(ListboxRoot, null, () => [
        h(Probe),
        h(ListboxContent, () => h(ListboxVirtualizer as any, { options: Array.from({ length: 500 }, (_, i) => `n${i}`) }, {
          default: ({ option }: { option: string }) => h(ListboxItem, { value: option }, () => option),
        })),
      ]),
    }), { attachTo: document.body })
    await flush()
    expect((rootContext as unknown as ListboxRootContext<string>).labels.get('n499')).toBe('n499')
  })
})

describe('comboboxVirtualizer grouped rows', () => {
  it('forwards the `group` slot', async () => {
    mount(defineComponent({
      setup: () => () => h(ComboboxRoot, { open: true, by: 'id' }, () => [
        h(ComboboxInput, { 'aria-label': 'Fruit' }),
        h(ComboboxContent, () => h(ComboboxViewport, { style: 'height: 400px' }, () =>
          h(ComboboxVirtualizer as any, { options: groups, textContent: (option: Fruit) => option.name }, {
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
