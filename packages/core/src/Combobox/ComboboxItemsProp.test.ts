// The `items` prop: the options as data, in the shape `SelectRoot` takes. It
// labels the selected value where no rendered item can (before the first open,
// filtered out, not rendered); the rendered items stay the list.
import type { Ref } from 'vue'
import type { ComboboxRootContext } from '.'
import { renderToString } from '@vue/server-renderer'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport, injectComboboxRootContext } from '.'

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as any
})
enableAutoUnmount(afterEach)
beforeEach(() => {
  document.body.innerHTML = ''
  // The blur reset runs on a timer after the close: drive it.
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

interface Rendered { value: any, text: string }
const rendered: Rendered[] = [{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }]

const input = () => document.querySelector('[data-testid=input]') as HTMLInputElement
const chips = () => Array.from(document.querySelectorAll('[data-testid=chip]')).map(el => el.textContent)
const options = () => Array.from(document.querySelectorAll('[role=option]')).map(el => el.textContent)
const option = (text: string) => Array.from(document.querySelectorAll('[role=option]')).find(el => el.textContent === text) as HTMLElement

async function settle() {
  await flushPromises()
  await vi.advanceTimersByTimeAsync(10)
  await flushPromises()
}

async function open() {
  ;(document.querySelector('[data-testid=trigger]') as HTMLElement).click()
  await settle()
}

async function pick(text: string) {
  await open()
  option(text).click()
  await settle()
}

function fixture(props: () => Record<string, unknown>, options: { children?: () => Rendered[], inputProps?: Record<string, unknown>, model?: Ref<any>, context?: (context: ComboboxRootContext) => void } = {}) {
  const model = options.model
  const Probe = defineComponent({
    setup() {
      options.context?.(injectComboboxRootContext())
      return () => null
    },
  })
  return defineComponent({
    setup: () => () => h(ComboboxRoot, {
      ...(model ? { 'modelValue': model.value, 'onUpdate:modelValue': (value: any) => { model.value = value } } : {}),
      ...props(),
    }, {
      default: ({ selectedLabels }: { selectedLabels: string[] }) => [
        selectedLabels.map(label => h('span', { 'data-testid': 'chip' }, label)),
        h(Probe),
        h(ComboboxAnchor, () => [
          h(ComboboxInput, { 'data-testid': 'input', ...options.inputProps }),
          h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
        ]),
        h(ComboboxPortal, () => h(ComboboxContent, () => h(ComboboxViewport, () =>
          (options.children?.() ?? rendered).map(item => h(ComboboxItem, { key: String(item.value), value: item.value }, () => item.text))))),
      ],
    }),
  })
}

function make(props: () => Record<string, unknown>, options: Parameters<typeof fixture>[1] & { model?: Ref<any> } = {}) {
  const model = options.model ?? ref<any>(undefined)
  const wrapper = mount(fixture(props, { ...options, model }), { attachTo: document.body })
  return { model, wrapper }
}

const fruits = [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }]

describe('given a Combobox without `items`', () => {
  it('shows the value itself in the input, as before', async () => {
    make(() => ({}), { model: ref('b') })
    await settle()
    expect(input().value).toBe('b')
    expect(chips()).toEqual(['b'])
  })

  it('keeps no index of items', async () => {
    let context!: ComboboxRootContext
    make(() => ({}), { model: ref('b'), context: value => context = value })
    await settle()
    await pick('Apple')
    expect(context.itemsIndex).toBeUndefined()
  })

  it('does not resolve an object value', async () => {
    make(() => ({}), { model: ref({ id: 1 }), children: () => [] })
    await settle()
    expect(input().value).toBe('')
    expect(chips()).toEqual([''])
  })
})

describe('given a Combobox with `items`', () => {
  it('shows the selected label before the list has ever rendered', async () => {
    make(() => ({ items: fruits }), { model: ref('b') })
    await settle()
    expect(options()).toEqual([])
    expect(input().value).toBe('Banana')
    expect(chips()).toEqual(['Banana'])
  })

  it('takes a record of value to label, also for a number value', async () => {
    const { model } = make(() => ({ items: { 1: 'One', 2: 'Two' } }), { model: ref<any>(2), children: () => [] })
    await settle()
    expect(input().value).toBe('Two')
    model.value = '1'
    await settle()
    expect(input().value).toBe('One')
  })

  it('takes groups, alone or mixed with plain options', async () => {
    const items = [{ value: 'a', label: 'Apple' }, { label: 'Vegetables', items: [{ value: 'c', label: 'Carrot' }] }]
    const { model } = make(() => ({ items }), { model: ref('c'), children: () => [] })
    await settle()
    expect(input().value).toBe('Carrot')
    model.value = 'a'
    await settle()
    expect(input().value).toBe('Apple')
  })

  it('matches object values with `by`', async () => {
    const items = [{ value: { id: 1 }, label: 'One' }, { value: { id: 2 }, label: 'Two' }]
    make(() => ({ items, by: 'id' }), { model: ref({ id: 2, extra: true }), children: () => [] })
    await settle()
    expect(input().value).toBe('Two')
  })

  it('shows the label of a picked item and of a value set by the parent', async () => {
    const { model } = make(() => ({ items: fruits }))
    await settle()
    expect(input().value).toBe('')
    await pick('Apple')
    expect(model.value).toBe('a')
    expect(input().value).toBe('Apple')
    model.value = 'b'
    await settle()
    expect(input().value).toBe('Banana')
  })

  it('lets `displayValue` win, on the root and on the input', async () => {
    make(() => ({ items: fruits, displayValue: (value: string) => `root:${value}` }), { model: ref('b') })
    await settle()
    expect(input().value).toBe('root:b')
    expect(chips()).toEqual(['root:b'])
    document.body.innerHTML = ''
    make(() => ({ items: fruits }), { model: ref('b'), inputProps: { displayValue: (value: string) => `input:${value}` } })
    await settle()
    expect(input().value).toBe('input:b')
  })

  it('keeps the input empty for `null`, also when `items` lists it', async () => {
    make(() => ({ items: [{ value: null, label: 'None' }, ...fruits] }), { model: ref(null) })
    await settle()
    expect(input().value).toBe('')
    expect(chips()).toEqual([])
  })

  it('follows `items` while the input rests, and leaves typed text alone', async () => {
    const items = ref<Record<string, string>>({})
    const { wrapper } = make(() => ({ items: items.value }), { model: ref('a') })
    await settle()
    // Not listed yet (labels still loading): the value itself, as without `items`.
    expect(input().value).toBe('a')
    items.value = { a: 'Apple' }
    await settle()
    expect(input().value).toBe('Apple')
    items.value.a = 'Pomme'
    await settle()
    expect(input().value).toBe('Pomme')

    await wrapper.find('[data-testid=input]').setValue('Ban')
    await settle()
    items.value = { a: 'Apfel' }
    await settle()
    expect(input().value).toBe('Ban')
    // Closing without a pick resets the text to the label of the value.
    await wrapper.find('[data-testid=input]').trigger('keydown', { key: 'Escape' })
    await settle()
    expect(input().value).toBe('Apfel')
  })

  it('reports a label change as `none`, with no value change', async () => {
    const items = ref<Record<string, string>>({ a: 'Apple' })
    const onText = vi.fn()
    const onValue = vi.fn()
    make(() => ({ 'items': items.value, 'onUpdate:modelValue': onValue }), { inputProps: { 'onUpdate:modelValue': onText } })
    await settle()
    await pick('Apple')
    onText.mockClear()
    onValue.mockClear()
    items.value = { a: 'Pomme' }
    await settle()
    expect(onText).toHaveBeenCalledTimes(1)
    expect(onText).toHaveBeenLastCalledWith('Pomme', expect.objectContaining({ reason: 'none' }))
    expect(onValue).not.toHaveBeenCalled()
  })

  it('hydrates the server-rendered label without a mismatch', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = fixture(() => ({ defaultValue: 'b', items: fruits }))
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(component))
    document.body.append(container)
    expect(container.querySelector('input')!.getAttribute('value')).toBe('Banana')
    const app = createSSRApp(component)
    app.mount(container)
    await nextTick()
    expect(warn.mock.calls.flat().join('\n')).not.toContain('Hydration')
    expect(input().value).toBe('Banana')
    app.unmount()
    warn.mockRestore()
  })
})

describe('given `items` and rendered items that disagree', () => {
  it('shows the `items` label in the input, and the item keeps its own text in the list', async () => {
    const { model } = make(() => ({ items: { a: 'Apple (data)' } }))
    await settle()
    await pick('Apple')
    expect(model.value).toBe('a')
    expect(input().value).toBe('Apple (data)')
    await open()
    expect(options()).toEqual(['Apple', 'Banana'])
  })

  it('filters by the text of the rendered items, not by the `items` labels', async () => {
    const { wrapper } = make(() => ({ items: { a: 'Zebra', b: 'Banana' } }))
    await settle()
    await wrapper.find('[data-testid=input]').setValue('Zeb')
    await settle()
    expect(options()).toEqual([])
    await wrapper.find('[data-testid=input]').setValue('App')
    await settle()
    expect(options()).toEqual(['Apple'])
  })

  it('shows a rendered item that `items` does not list as without `items`', async () => {
    const { model } = make(() => ({ items: { a: 'Apple' } }))
    await settle()
    await pick('Banana')
    expect(model.value).toBe('b')
    expect(input().value).toBe('b')
  })

  it('labels a value that no item renders', async () => {
    make(() => ({ items: { a: 'Apple', z: 'Zucchini' } }), { model: ref('z') })
    await settle()
    expect(input().value).toBe('Zucchini')
    await open()
    expect(options()).toEqual(['Apple', 'Banana'])
    expect(input().value).toBe('Zucchini')
  })

  it('ignores `disabled` in `items`: the rendered item decides', async () => {
    const { model } = make(() => ({ items: [{ value: 'a', label: 'Apple', disabled: true }] }))
    await settle()
    await pick('Apple')
    expect(model.value).toBe('a')
  })
})

describe('given a multiple Combobox with `items`', () => {
  it('lists the label of each selected value in `selectedLabels`, in the order of the value', async () => {
    const { model } = make(() => ({ items: fruits, multiple: true }), { model: ref(['b', 'a']) })
    await settle()
    expect(options()).toEqual([])
    expect(chips()).toEqual(['Banana', 'Apple'])
    expect(input().value).toBe('')
    model.value = ['a']
    await settle()
    expect(chips()).toEqual(['Apple'])
  })

  it('adds the label of a picked item, and the string form of a value `items` does not list', async () => {
    const { model } = make(() => ({ items: { a: 'Apple (data)' }, multiple: true }), { model: ref<string[]>([]) })
    await settle()
    await open()
    option('Apple').click()
    await settle()
    option('Banana').click()
    await settle()
    expect(model.value).toEqual(['a', 'b'])
    expect(chips()).toEqual(['Apple (data)', 'b'])
  })

  it('follows `items`', async () => {
    const items = ref<Record<string, string>>({ a: 'Apple' })
    make(() => ({ items: items.value, multiple: true }), { model: ref(['a']) })
    await settle()
    items.value = { a: 'Pomme' }
    await settle()
    expect(chips()).toEqual(['Pomme'])
  })
})
