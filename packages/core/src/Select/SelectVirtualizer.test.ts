import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectRoot, SelectTrigger, SelectValue, SelectViewport, SelectVirtualizer } from '.'
import { injectSelectContentContext } from './SelectContentImpl.vue'
import { getScrollStep } from './utils'

interface Fruit { id: number, name: string }

const fruits: Fruit[] = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: i === 900 ? 'Zucchini' : `Fruit ${i}` }))

const originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect
beforeAll(() => {
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  // jsdom does not scroll (`scrollTop` stays 0): keep the offset tanstack asks
  // for and report it, so the rendered window follows `scrollToIndex`.
  const scrollTops = new WeakMap<Element, number>()
  Object.defineProperty(window.HTMLElement.prototype, 'scrollTop', {
    configurable: true,
    get(this: HTMLElement) { return scrollTops.get(this) ?? 0 },
    set(this: HTMLElement, value: number) { scrollTops.set(this, value) },
  })
  Object.defineProperty(window.HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) { return Number.parseFloat(this.querySelector<HTMLElement>('[data-reka-virtualizer]')?.style.height ?? '0') || 0 },
  })
  window.HTMLElement.prototype.scrollTo = function (this: HTMLElement, options?: ScrollToOptions | number) {
    if (typeof options === 'object' && options.top !== undefined)
      this.scrollTop = options.top
    this.dispatchEvent(new Event('scroll'))
  } as HTMLElement['scrollTo']
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // floating-ui's layout-shift observer, reached once the rects below are non-zero.
  globalThis.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return [] }
  } as unknown as typeof IntersectionObserver
  // jsdom reports zero-sized rects, so tanstack would render no rows.
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    return { width: 200, height: 200, top: 0, left: 0, right: 200, bottom: 200, x: 0, y: 0, toJSON() {} }
  }
})
afterAll(() => {
  window.HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
})

function mountSelect(rootProps: Record<string, unknown> = {}, contentProps: Record<string, unknown> = { position: 'popper' }, options: unknown[] = fruits, grouped = false) {
  return mount(defineComponent({
    setup: () => () => h(SelectRoot, { by: 'id', ...rootProps }, () => [
      h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { placeholder: 'Pick a fruit' })),
      h(SelectContent, contentProps, () => h(SelectViewport, { style: 'height: 200px' }, () =>
        h(SelectVirtualizer as any, { options, grouped, textContent: (fruit: Fruit) => fruit.name }, {
          default: ({ option }: { option: Fruit }) => h(SelectItem, { value: option }, () => h(SelectItemText, () => option.name)),
          group: ({ group }: { group: { label: string } }) => h('div', { class: 'group-label' }, group.label),
        }))),
    ]),
  }), { attachTo: document.body })
}

async function flush() {
  await nextTick()
  await nextTick()
  await new Promise(resolve => requestAnimationFrame(() => resolve(null)))
  await nextTick()
}

async function press(key: string) {
  fireEvent.keyDown(document.activeElement!, { key })
  await new Promise(resolve => setTimeout(resolve))
  await flush()
}

const options = () => [...document.querySelectorAll<HTMLElement>('[role=option]')]

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('selectVirtualizer', () => {
  it('renders a window of the options with the full set size', async () => {
    mountSelect({ open: true })
    await flush()
    const rendered = options()
    expect(rendered.length).toBeGreaterThan(0)
    expect(rendered.length).toBeLessThan(100)
    expect(rendered[0].getAttribute('aria-setsize')).toBe('1000')
    expect(rendered[0].getAttribute('aria-posinset')).toBe('1')
    expect(rendered[0].getAttribute('data-index')).toBe('0')
  })

  it('shows the label of a selected option whose row never rendered', async () => {
    const wrapper = mountSelect({ defaultValue: { id: 900, name: 'Zucchini' } })
    await flush()
    expect(document.querySelector('[role=option]')).toBeNull()
    expect(wrapper.find('[role=combobox]').text()).toContain('Zucchini')
  })

  it('reaches the last option with End and a far option with typeahead', async () => {
    mountSelect({ open: true })
    await flush()
    options()[0].focus()

    await press('End')
    expect(document.activeElement?.getAttribute('aria-posinset')).toBe('1000')

    await press('Home')
    expect(document.activeElement?.getAttribute('aria-posinset')).toBe('1')

    await press('z')
    expect(document.activeElement?.textContent).toBe('Zucchini')
    expect(document.activeElement?.getAttribute('aria-posinset')).toBe('901')
  })

  it('focuses a selected option whose row is not rendered when it opens', async () => {
    mountSelect({ defaultOpen: true, defaultValue: fruits[900] })
    await flush()
    await flush()
    expect(document.activeElement?.getAttribute('aria-posinset')).toBe('901')
    expect(document.activeElement?.getAttribute('data-state')).toBe('checked')
  })

  it('wraps to the far end with `loop`', async () => {
    mountSelect({ open: true }, { position: 'popper', loop: true })
    await flush()
    options()[0].focus()
    await press('ArrowUp')
    expect(document.activeElement?.getAttribute('aria-posinset')).toBe('1000')
    await press('ArrowDown')
    expect(document.activeElement?.getAttribute('aria-posinset')).toBe('1')
  })

  it('selects a virtualized option', async () => {
    const onUpdate = vi.fn()
    mountSelect({ 'open': true, 'onUpdate:modelValue': onUpdate })
    await flush()
    options()[0].focus()
    await press('End')
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' })
    await flush()
    expect(onUpdate).toHaveBeenCalledWith(fruits[999], expect.objectContaining({ reason: 'item-keydown' }))
  })

  it('renders flat and warns under item-aligned positioning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mountSelect({ open: true }, { position: 'item-aligned' }, fruits.slice(0, 30))
    await flush()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('SelectVirtualizer'))
    expect(options()).toHaveLength(30)
    expect(options()[29].getAttribute('aria-posinset')).toBe('30')
    expect(document.querySelector('[data-reka-virtualizer]')).toBeNull()
    warn.mockRestore()
  })

  describe('grouped options', () => {
    const groups = [
      { label: 'Red', options: fruits.slice(0, 3) },
      { label: 'Green', options: fruits.slice(3, 6), disabled: true },
    ]

    it('renders header rows and counts options only', async () => {
      mountSelect({ open: true }, { position: 'popper' }, groups, true)
      await flush()
      const headers = [...document.querySelectorAll<HTMLElement>('[data-reka-virtualizer-group]')]
      expect(headers.map(header => header.textContent)).toEqual(['Red', 'Green'])
      expect(headers[0].getAttribute('role')).toBe('presentation')
      const rendered = options()
      expect(rendered).toHaveLength(6)
      expect(rendered.map(option => option.getAttribute('aria-posinset'))).toEqual(['1', '2', '3', '4', '5', '6'])
      expect(rendered[0].getAttribute('aria-setsize')).toBe('6')
      expect(rendered[0].getAttribute('aria-describedby')).toBe(headers[0].id)
      expect(rendered[3].getAttribute('aria-describedby')).toBe(headers[1].id)
      expect(rendered[3].hasAttribute('data-disabled')).toBe(true)
    })

    it('passes axe', async () => {
      const wrapper = mountSelect({ open: true }, { position: 'popper' }, groups, true)
      await flush()
      expect(await axe(wrapper.element.ownerDocument.body)).toHaveNoViolations()
    })
  })

  it('passes axe', async () => {
    const wrapper = mountSelect({ open: true })
    await flush()
    expect(await axe(wrapper.element.ownerDocument.body)).toHaveNoViolations()
  })

  // #3086 review: primitive options without `textContent` registered their
  // string form, overwriting the `SelectItemText` label.
  describe('the label of a primitive option', () => {
    const produce = ['apple', 'banana', 'cherry']
    const label = (value: string) => value[0].toUpperCase() + value.slice(1)

    function mountPrimitive(options: { value: string[] }, open?: { value: boolean }) {
      return mount(defineComponent({
        setup: () => () => h(SelectRoot, { defaultValue: 'banana', ...(open ? { 'open': open.value, 'onUpdate:open': (value: boolean) => { open.value = value } } : {}) }, () => [
          h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { placeholder: 'Pick' })),
          h(SelectContent, { position: 'popper' }, () => h(SelectViewport, { style: 'height: 200px' }, () =>
            h(SelectVirtualizer as any, { options: options.value }, {
              default: ({ option }: { option: string }) => h(SelectItem, { value: option }, () => h(SelectItemText, () => label(option))),
            }))),
        ]),
      }), { attachTo: document.body })
    }

    it('is the `SelectItemText` while closed', async () => {
      const wrapper = mountPrimitive(ref(produce))
      await flush()
      expect(wrapper.find('[role=combobox]').text()).toBe('Banana')
    })

    it('stays the `SelectItemText` when `options` is replaced by an equal array', async () => {
      const list = ref([...produce])
      const wrapper = mountPrimitive(list, ref(true))
      await flush()
      await flush()
      expect(options()).toHaveLength(3)
      expect(wrapper.find('[role=combobox]').text()).toBe('Banana')
      list.value = [...produce]
      await flush()
      expect(wrapper.find('[role=combobox]').text()).toBe('Banana')
    })
  })

  // #3086 review: a function `by` makes each label registration a linear scan;
  // registering every option made a 10k-option Select quadratic.
  it('mounts and opens 10k options under a function `by` without a quadratic registration', async () => {
    const many = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }))
    const open = ref(false)
    const start = performance.now()
    const wrapper = mount(defineComponent({
      setup: () => () => h('form', [h(SelectRoot, { 'by': (a: any, b: any) => a?.id === b?.id, 'name': 'item', 'defaultValue': many[5000], 'open': open.value, 'onUpdate:open': (value: boolean) => { open.value = value } }, () => [
        h(SelectTrigger, { 'aria-label': 'Item' }, () => h(SelectValue)),
        h(SelectContent, { position: 'popper' }, () => h(SelectViewport, { style: 'height: 200px' }, () =>
          h(SelectVirtualizer as any, { options: many, textContent: (item: Fruit) => item.name }, {
            default: ({ option }: { option: Fruit }) => h(SelectItem, { value: option }, () => h(SelectItemText, () => option.name)),
          }))),
      ])]),
    }), { attachTo: document.body })
    await flush()
    expect(wrapper.find('[role=combobox]').text()).toBe('Item 5000')
    open.value = true
    await flush()
    open.value = false
    await flush()
    const elapsed = performance.now() - start
    wrapper.unmount()
    // ~0.1 s without eager registration, several seconds with it; generous for slow CI.
    expect(elapsed).toBeLessThan(1500)
  })

  // #3086 review: the virtualizer replaces the content's `focusSelectedItem`.
  it('restores the content `focusSelectedItem` when it unmounts', async () => {
    let contentContext: ReturnType<typeof injectSelectContentContext> | undefined
    const Probe = defineComponent({
      setup() {
        contentContext = injectSelectContentContext()
        return () => null
      },
    })
    const virtual = ref(true)
    mount(defineComponent({
      setup: () => () => h(SelectRoot, { open: true, by: 'id' }, () => [
        h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue)),
        h(SelectContent, { position: 'popper' }, () => h(SelectViewport, { style: 'height: 200px' }, () => [
          h(Probe),
          virtual.value
            ? h(SelectVirtualizer as any, { options: fruits.slice(0, 20), textContent: (fruit: Fruit) => fruit.name }, {
                default: ({ option }: { option: Fruit }) => h(SelectItem, { value: option }, () => h(SelectItemText, () => option.name)),
              })
            : null,
        ])),
      ]),
    }), { attachTo: document.body })
    await flush()
    const replaced = contentContext!.focusSelectedItem
    virtual.value = false
    await flush()
    expect(contentContext!.focusSelectedItem).not.toBe(replaced)
  })
})

describe('getScrollStep', () => {
  function el(height: number, attrs: Record<string, string> = {}) {
    const node = document.createElement('div')
    Object.entries(attrs).forEach(([name, value]) => node.setAttribute(name, value))
    Object.defineProperty(node, 'offsetHeight', { value: height })
    return node
  }

  it('steps by the selected item, or by a rendered option once that item was recycled', () => {
    const viewport = el(200)
    const selected = el(40)
    viewport.append(el(32, { role: 'option' }), selected)
    document.body.append(viewport)
    expect(getScrollStep(viewport, selected)).toBe(40)
    selected.remove()
    expect(getScrollStep(viewport, selected)).toBe(32)
    expect(getScrollStep(viewport, undefined)).toBe(32)
  })
})
