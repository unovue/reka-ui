// The `items` prop: the items as data (an array, groups, or a
// `createComboboxItems()` collection). It labels the selected value where no
// rendered item can (before the first open, filtered out, not rendered); the
// rendered items stay the list.
import type { Ref } from 'vue'
import type { ComboboxRootContext } from '.'
import { renderToString } from '@vue/server-renderer'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxValue, ComboboxViewport, createComboboxItems, injectComboboxRootContext } from '.'

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
      default: (slotProps: Record<string, unknown>) => [
        h('output', { 'data-testid': 'root-slot' }, Object.keys(slotProps).sort().join(',')),
        h(ComboboxValue, null, {
          default: ({ selectedLabels }: { selectedLabels: string[] }) => selectedLabels.map(label => h('span', { 'data-testid': 'chip' }, label)),
        }),
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

interface Fruit { id: string, name: string }
const fruitData: Fruit[] = [{ id: 'a', name: 'Apple' }, { id: 'b', name: 'Banana' }]
const collect = (data: Fruit[] | { items: Fruit[] }[]) => createComboboxItems(data, { getValue: fruit => fruit.id, getLabel: fruit => fruit.name })
const fruits = collect(fruitData)

interface Option { id: number, label: string }
const one: Option = { id: 1, label: 'One' }
const two: Option = { id: 2, label: 'Two' }
const objectChildren = () => [{ value: one, text: 'One' }, { value: two, text: 'Two' }]

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

  it('does not resolve an object value without a `label`', async () => {
    make(() => ({}), { model: ref({ id: 1 }), children: () => [] })
    await settle()
    expect(input().value).toBe('')
    expect(chips()).toEqual([''])
  })

  it('shows the `label` key of an object value', async () => {
    const { model } = make(() => ({}), { model: ref<any>(two), children: objectChildren })
    await settle()
    expect(options()).toEqual([])
    expect(input().value).toBe('Two')
    expect(chips()).toEqual(['Two'])
    await pick('One')
    expect(model.value).toEqual(one)
    expect(input().value).toBe('One')
    // A label that is not a string shows as its string form; `null` is no label.
    model.value = { id: 3, label: 3 }
    await settle()
    expect(input().value).toBe('3')
    model.value = { id: 4, label: null }
    await settle()
    expect(input().value).toBe('')
  })

  it('follows the `label` of the selected object when it is changed in place', async () => {
    const model = ref<any>({ id: 1, label: 'One' })
    make(() => ({}), { model, children: () => [] })
    await settle()
    model.value.label = 'Uno'
    await settle()
    expect(input().value).toBe('Uno')
  })

  it('lets `displayValue` win over the `label` key, on the root and on the input', async () => {
    make(() => ({ displayValue: (value: Option) => `root:${value.id}` }), { model: ref(two), children: () => [] })
    await settle()
    expect(input().value).toBe('root:2')
    expect(chips()).toEqual(['root:2'])
    document.body.innerHTML = ''
    make(() => ({ displayValue: (value: Option) => `root:${value.id}` }), { model: ref(two), children: () => [], inputProps: { displayValue: (value: Option) => `input:${value.id}` } })
    await settle()
    expect(input().value).toBe('input:2')
  })

  it('does not pass `selectedLabels` to the root slot', async () => {
    make(() => ({ items: fruits }), { model: ref('b') })
    await settle()
    expect(document.querySelector('[data-testid=root-slot]')!.textContent).toBe('modelValue,open')
  })
})

describe('given a Combobox with a `createComboboxItems()` collection', () => {
  it('shows the selected label before the list has ever rendered', async () => {
    make(() => ({ items: fruits }), { model: ref('b') })
    await settle()
    expect(options()).toEqual([])
    expect(input().value).toBe('Banana')
    expect(chips()).toEqual(['Banana'])
  })

  it('resolves number values, and not their string form', async () => {
    const items = createComboboxItems([{ id: 1, name: 'One' }, { id: 2, name: 'Two' }], { getValue: item => item.id, getLabel: item => item.name })
    const { model } = make(() => ({ items }), { model: ref<any>(2), children: () => [] })
    await settle()
    expect(input().value).toBe('Two')
    model.value = '1'
    await settle()
    expect(input().value).toBe('1')
  })

  it('takes groups', async () => {
    const { model } = make(() => ({ items: collect([{ items: [{ id: 'a', name: 'Apple' }] }, { items: [{ id: 'c', name: 'Carrot' }] }]) }), { model: ref('c'), children: () => [] })
    await settle()
    expect(input().value).toBe('Carrot')
    model.value = 'a'
    await settle()
    expect(input().value).toBe('Apple')
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

  it('keeps the input empty for `null`', async () => {
    make(() => ({ items: fruits }), { model: ref(null) })
    await settle()
    expect(input().value).toBe('')
    expect(chips()).toEqual([])
  })

  it('follows `items` while the input rests, and leaves typed text alone', async () => {
    const data = ref<Fruit[]>([])
    const { wrapper } = make(() => ({ items: collect(data.value) }), { model: ref('a') })
    await settle()
    // Not listed yet (items still loading): the value itself, as without `items`.
    expect(input().value).toBe('a')
    data.value = [{ id: 'a', name: 'Apple' }]
    await settle()
    expect(input().value).toBe('Apple')
    data.value[0].name = 'Pomme'
    await settle()
    expect(input().value).toBe('Pomme')

    await wrapper.find('[data-testid=input]').setValue('Ban')
    await settle()
    data.value = [{ id: 'a', name: 'Apfel' }]
    await settle()
    expect(input().value).toBe('Ban')
    // Closing without a pick resets the text to the label of the value.
    await wrapper.find('[data-testid=input]').trigger('keydown', { key: 'Escape' })
    await settle()
    expect(input().value).toBe('Apfel')
  })

  it('reports a label change as `none`, with no value change', async () => {
    const data = ref<Fruit[]>([{ id: 'a', name: 'Apple' }])
    const onText = vi.fn()
    const onValue = vi.fn()
    make(() => ({ 'items': collect(data.value), 'onUpdate:modelValue': onValue }), { inputProps: { 'onUpdate:modelValue': onText } })
    await settle()
    await pick('Apple')
    onText.mockClear()
    onValue.mockClear()
    data.value = [{ id: 'a', name: 'Pomme' }]
    await settle()
    expect(onText).toHaveBeenCalledTimes(1)
    expect(onText).toHaveBeenLastCalledWith('Pomme', expect.objectContaining({ reason: 'none' }))
    expect(onValue).not.toHaveBeenCalled()
  })

  it('keeps typed text that a close retained when `items` is replaced', async () => {
    const data = ref<Fruit[]>([{ id: 'a', name: 'Apple' }])
    const onText = vi.fn()
    const { wrapper } = make(() => ({ items: collect(data.value), resetSearchTermOnBlur: false }), { model: ref('a'), inputProps: { 'onUpdate:modelValue': onText } })
    await settle()
    expect(input().value).toBe('Apple')
    await wrapper.find('[data-testid=input]').setValue('Ban')
    await settle()
    await wrapper.find('[data-testid=input]').trigger('keydown', { key: 'Escape' })
    await settle()
    expect(options()).toEqual([])
    expect(input().value).toBe('Ban')
    onText.mockClear()

    // The same label in a new array.
    data.value = [{ id: 'a', name: 'Apple' }]
    await settle()
    expect(input().value).toBe('Ban')
    // Another item added in place.
    data.value.push({ id: 'c', name: 'Cherry' })
    await settle()
    expect(input().value).toBe('Ban')
    // A new label: the input does not show the selection, so there is nothing to follow.
    data.value = [{ id: 'a', name: 'Pomme' }]
    await settle()
    expect(input().value).toBe('Ban')
    expect(onText).not.toHaveBeenCalled()
  })

  it('writes nothing when `items` is replaced by an equal collection while the input rests', async () => {
    const data = ref<Fruit[]>([{ id: 'a', name: 'Apple' }])
    const onText = vi.fn()
    const onValue = vi.fn()
    make(() => ({ 'items': collect(data.value), 'onUpdate:modelValue': onValue }), { inputProps: { 'onUpdate:modelValue': onText } })
    await settle()
    await pick('Apple')
    onText.mockClear()
    onValue.mockClear()
    const setValue = vi.spyOn(input(), 'value', 'set')
    data.value = [{ id: 'a', name: 'Apple' }]
    await settle()
    expect(input().value).toBe('Apple')
    expect(onText).not.toHaveBeenCalled()
    expect(onValue).not.toHaveBeenCalled()
    expect(setValue).not.toHaveBeenCalled()
  })

  it('shows a label that arrives after the value, when `items` was not set at first', async () => {
    const data = ref<Fruit[] | undefined>(undefined)
    const onText = vi.fn()
    make(() => ({ items: data.value && collect(data.value) }), { model: ref('a'), inputProps: { 'onUpdate:modelValue': onText } })
    await settle()
    expect(input().value).toBe('a')
    onText.mockClear()
    data.value = [{ id: 'a', name: 'Apple' }]
    await settle()
    expect(input().value).toBe('Apple')
    expect(onText).toHaveBeenCalledTimes(1)
    expect(onText).toHaveBeenLastCalledWith('Apple', expect.objectContaining({ reason: 'none' }))
    data.value = [{ id: 'a', name: 'Pomme' }]
    await settle()
    expect(input().value).toBe('Pomme')
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

describe('given a Combobox with an array of `items`', () => {
  it('does not resolve a primitive value to the label of a `{ value, label }` item in the input', async () => {
    make(() => ({ items: [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }] }), { model: ref('b') })
    await settle()
    expect(input().value).toBe('b')
  })

  it('shows the label of the item that `by` matches to an object value', async () => {
    const items = [{ id: 1, label: 'One' }, { id: 2, label: 'Two' }]
    const { model } = make(() => ({ items, by: 'id' }), { model: ref<any>({ id: 2 }), children: () => [] })
    await settle()
    expect(input().value).toBe('Two')
    // The item's label, not the one the value carries.
    model.value = { id: 1, label: 'Stale' }
    await settle()
    expect(input().value).toBe('One')
    // Not listed: the value's own label.
    model.value = { id: 9, label: 'Nine' }
    await settle()
    expect(input().value).toBe('Nine')
  })

  it('matches with a `by` function, and through groups', async () => {
    const items = [{ label: 'Low', items: [{ id: 1, label: 'One' }] }, { label: 'High', items: [{ id: 2, label: 'Two' }] }]
    make(() => ({ items, by: (a: Option, b: Option) => a.id === b.id }), { model: ref<any>({ id: 2 }), children: () => [] })
    await settle()
    expect(input().value).toBe('Two')
  })

  it('follows a label that changes in `items` for the same selection', async () => {
    const items = ref([{ id: 1, label: 'One' }])
    const onText = vi.fn()
    make(() => ({ items: items.value, by: 'id' }), { model: ref<any>({ id: 1, label: 'One' }), children: () => [], inputProps: { 'onUpdate:modelValue': onText } })
    await settle()
    expect(input().value).toBe('One')
    onText.mockClear()
    items.value = [{ id: 1, label: 'Uno' }]
    await settle()
    expect(input().value).toBe('Uno')
    expect(onText).toHaveBeenLastCalledWith('Uno', expect.objectContaining({ reason: 'none' }))
  })

  it('takes plain strings, which are their own text', async () => {
    make(() => ({ items: ['a', 'b'] }), { model: ref('b') })
    await settle()
    expect(input().value).toBe('b')
    expect(chips()).toEqual(['b'])
  })

  it('ignores a record, which is not a shape of `items`', async () => {
    make(() => ({ items: { a: 'Apple' } }), { model: ref('a') })
    await settle()
    expect(input().value).toBe('a')
    expect(chips()).toEqual(['a'])
  })
})

describe('given `items` and rendered items that disagree', () => {
  const data = (entries: Record<string, string>) => collect(Object.entries(entries).map(([id, name]) => ({ id, name })))

  it('shows the `items` label in the input, and the item keeps its own text in the list', async () => {
    const { model } = make(() => ({ items: data({ a: 'Apple (data)' }) }))
    await settle()
    await pick('Apple')
    expect(model.value).toBe('a')
    expect(input().value).toBe('Apple (data)')
    await open()
    expect(options()).toEqual(['Apple', 'Banana'])
  })

  it('filters by the text of the rendered items, not by the `items` labels', async () => {
    const { wrapper } = make(() => ({ items: data({ a: 'Zebra', b: 'Banana' }) }))
    await settle()
    await wrapper.find('[data-testid=input]').setValue('Zeb')
    await settle()
    expect(options()).toEqual([])
    await wrapper.find('[data-testid=input]').setValue('App')
    await settle()
    expect(options()).toEqual(['Apple'])
  })

  it('shows a rendered item that `items` does not list as without `items`', async () => {
    const { model } = make(() => ({ items: data({ a: 'Apple' }) }))
    await settle()
    await pick('Banana')
    expect(model.value).toBe('b')
    expect(input().value).toBe('b')
  })

  it('labels a value that no item renders', async () => {
    make(() => ({ items: data({ a: 'Apple', z: 'Zucchini' }) }), { model: ref('z') })
    await settle()
    expect(input().value).toBe('Zucchini')
    await open()
    expect(options()).toEqual(['Apple', 'Banana'])
    expect(input().value).toBe('Zucchini')
  })
})
