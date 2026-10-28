import type { SelectItems } from './useSelect'
import type { AcceptableValue } from '@/shared/types'
import { fireEvent } from '@testing-library/vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { SelectContent, SelectGroup, SelectItem, SelectItemIndicator, SelectItemText, SelectLabel, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

beforeAll(() => {
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

enableAutoUnmount(afterEach)

beforeEach(() => {
  document.body.innerHTML = ''
})

interface Fruit { id: number, name: string }

const trigger = () => document.querySelector('[role=combobox]') as HTMLElement
const options = () => Array.from(document.querySelectorAll<HTMLElement>('[role=option]'))
const valueText = () => document.querySelector('[data-testid=value]')!.textContent
const nativeOptions = () => Array.from(document.querySelector('select')?.options ?? []).filter(option => !option.hasAttribute('data-nullable'))
const isOpen = () => trigger().getAttribute('aria-expanded') === 'true'

async function open() {
  await fireEvent.pointerDown(trigger(), { button: 0, ctrlKey: false })
  await flushPromises()
}

async function close() {
  document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  await flushPromises()
  // `SelectContent` keeps its presence for a task after closing.
  await new Promise(resolve => setTimeout(resolve))
  await flushPromises()
}

async function type(key: string) {
  trigger().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await flushPromises()
}

/** Waits for the idle-time render of a closed select's items (`setTimeout` in jsdom). */
async function idle() {
  await new Promise(resolve => setTimeout(resolve, 60))
  await flushPromises()
}

interface Option { value: AcceptableValue, text: string, disabled?: boolean, textValue?: string }

/**
 * A Select whose item texts count their renders in `itemTexts`. `list` is the
 * (reactive) list of options, optionally in groups.
 */
function mountSelect(rootProps: Record<string, unknown> | (() => Record<string, unknown>), list: () => (Option | { group: string, options: Option[] })[], { portal = true, form = false } = {}) {
  const itemTexts = vi.fn()
  const item = (option: Option) => h(SelectItem, { value: option.value, disabled: option.disabled, textValue: option.textValue }, () => [
    h(SelectItemText, () => {
      itemTexts(option.text)
      return option.text
    }),
    h(SelectItemIndicator, () => '✓'),
  ])
  const content = () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => list().map(entry => 'group' in entry
    ? h(SelectGroup, () => [h(SelectLabel, () => entry.group), ...entry.options.map(item)])
    : item(entry))))
  const select = () => h(SelectRoot, typeof rootProps === 'function' ? rootProps() : rootProps, () => [
    h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { 'data-testid': 'value', 'placeholder': 'Pick a fruit' })),
    portal ? h(SelectPortal, content) : content(),
  ])
  const wrapper = mount(defineComponent({
    setup: () => () => form ? h('form', select()) : select(),
  }), { attachTo: document.body })
  return { wrapper, itemTexts }
}

const fruits: Option[] = ['Apple', 'Banana', 'Blueberry', 'Cherry'].map(text => ({ value: text, text }))

describe('a closed Select keeps no items mounted', () => {
  it('renders no item, portal or content while closed and empty', async () => {
    const { itemTexts } = mountSelect({}, () => fruits)
    await flushPromises()
    expect(itemTexts).not.toHaveBeenCalled()
    expect(valueText()).toBe('Pick a fruit')
    // No portal anchors in the body either: only the mounted app.
    expect(document.body.childNodes).toHaveLength(1)
  })

  it.each([true, false])('renders the items once for a selected value, then unmounts them (portal: %s)', async (portal) => {
    const { itemTexts } = mountSelect({ defaultValue: 'Cherry' }, () => fruits, { portal })
    await flushPromises()
    expect(valueText()).toBe('Cherry')
    expect(itemTexts).toHaveBeenCalledTimes(fruits.length)
    expect(options()).toHaveLength(0)
    expect(document.querySelectorAll('[data-reka-collection-item]')).toHaveLength(0)
    await flushPromises()
    expect(itemTexts).toHaveBeenCalledTimes(fruits.length)
  })

  it('shows the label of a value whose item renders later', async () => {
    const list = ref<Option[]>([])
    const { itemTexts } = mountSelect({ defaultValue: 'Cherry' }, () => list.value)
    await flushPromises()
    expect(valueText()).toBe('Pick a fruit')

    // The value has no label: the items stay mounted until one registers it.
    list.value = fruits
    await flushPromises()
    expect(valueText()).toBe('Cherry')
    expect(itemTexts).toHaveBeenCalledTimes(fruits.length)

    // ...then unmount, and stay unmounted.
    list.value = [...fruits, { value: 'Date', text: 'Date' }]
    await flushPromises()
    expect(itemTexts).toHaveBeenCalledTimes(fruits.length)
  })

  it('renders the items again for a programmatic value it has no label for', async () => {
    const model = ref<Fruit>({ id: 1, name: 'Apple' })
    const list = ref<Option[]>([{ value: { id: 1, name: 'Apple' }, text: 'Apple' }])
    const { itemTexts } = mountSelect(() => ({ 'by': 'id', 'modelValue': model.value, 'onUpdate:modelValue': (value: Fruit) => model.value = value }), () => list.value)
    await flushPromises()
    expect(valueText()).toBe('Apple')
    list.value = [...list.value, { value: { id: 2, name: 'Banana' }, text: 'Banana' }]
    model.value = { id: 2, name: 'Banana' }
    await flushPromises()
    expect(valueText()).toBe('Banana')
    expect(itemTexts).toHaveBeenCalledTimes(3)
  })

  it('keeps the selected label after an open and a close, and renders no closed items after it', async () => {
    const { itemTexts } = mountSelect({}, () => fruits)
    await open()
    expect(options()).toHaveLength(fruits.length)
    options()[2].focus()
    await fireEvent.pointerUp(options()[2])
    await fireEvent.pointerUp(options()[2])
    await flushPromises()
    await close()
    expect(isOpen()).toBe(false)
    expect(valueText()).toBe('Blueberry')
    expect(options()).toHaveLength(0)
    const renders = itemTexts.mock.calls.length
    await flushPromises()
    expect(document.querySelectorAll('[data-reka-collection-item]')).toHaveLength(0)
    expect(itemTexts).toHaveBeenCalledTimes(renders)
  })

  it.each([true, false])('first opens with data-starting-style, as it did with the items mounted (value: %s)', async (withValue) => {
    // jsdom has no `getAnimations`; stub it so the presence lifecycle runs.
    Element.prototype.getAnimations = () => []
    try {
      mountSelect(withValue ? { defaultValue: 'Cherry' } : {}, () => fruits)
      await flushPromises()
      await fireEvent.pointerDown(trigger(), { button: 0, ctrlKey: false })
      await nextTick()
      expect(document.querySelector('[role=listbox]')!.hasAttribute('data-starting-style')).toBe(true)
    }
    finally {
      // @ts-expect-error restoring jsdom's missing implementation
      delete Element.prototype.getAnimations
    }
  })

  it('passes axe while closed and open', async () => {
    const { wrapper } = mountSelect({ defaultValue: 'Banana' }, () => fruits)
    await flushPromises()
    expect(await axe(wrapper.element)).toHaveNoViolations()
    await open()
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe('typeahead on a closed Select that keeps no items mounted', () => {
  it('renders the items on the first key, selects, and unmounts them', async () => {
    const onUpdate = vi.fn()
    const { itemTexts } = mountSelect({ 'onUpdate:modelValue': onUpdate }, () => fruits)
    await flushPromises()
    expect(itemTexts).not.toHaveBeenCalled()
    await type('b')
    expect(onUpdate).toHaveBeenLastCalledWith('Banana', expect.objectContaining({ reason: 'typeahead' }))
    expect(valueText()).toBe('Banana')
    expect(itemTexts).toHaveBeenCalledTimes(fruits.length)
    expect(options()).toHaveLength(0)
    // The next keys match the items it kept.
    await type('b')
    expect(valueText()).toBe('Blueberry')
    expect(itemTexts).toHaveBeenCalledTimes(fruits.length)
  })

  it('readies the items on focus, before the first key, except for a multiple select', async () => {
    const { itemTexts } = mountSelect({}, () => fruits)
    await flushPromises()
    trigger().focus()
    await flushPromises()
    expect(itemTexts).toHaveBeenCalledTimes(fruits.length)
    expect(options()).toHaveLength(0)

    document.body.innerHTML = ''
    const multiple = mountSelect({ multiple: true }, () => fruits)
    await flushPromises()
    trigger().focus()
    await flushPromises()
    expect(multiple.itemTexts).not.toHaveBeenCalled()
  })

  it('matches textValue, skips disabled items and follows groups in document order', async () => {
    mountSelect({}, () => [
      { group: 'Berries', options: [{ value: 'blue', text: 'Blueberry', disabled: true }, { value: 'black', text: '⚫', textValue: 'Blackberry' }] },
      { group: 'Others', options: [{ value: 'banana', text: 'Banana' }] },
    ])
    await flushPromises()
    await type('b')
    expect(valueText()).toBe('⚫')
    await type('b')
    expect(valueText()).toBe('Banana')
  })

  it('matches object values with `by`', async () => {
    const onUpdate = vi.fn()
    mountSelect({ 'by': 'id', 'defaultValue': { id: 2, name: 'Banana' }, 'onUpdate:modelValue': onUpdate }, () =>
      [{ id: 1, name: 'Apple' }, { id: 2, name: 'Banana' }, { id: 3, name: 'Blueberry' }].map(fruit => ({ value: fruit, text: fruit.name })))
    await flushPromises()
    expect(valueText()).toBe('Banana')
    await type('b')
    expect(onUpdate).toHaveBeenLastCalledWith({ id: 3, name: 'Blueberry' }, expect.anything())
    expect(valueText()).toBe('Blueberry')
  })

  it('matches the items as they were when the content last closed', async () => {
    const list = ref(fruits)
    mountSelect({}, () => list.value)
    await open()
    list.value = [...fruits, { value: 'Coconut', text: 'Coconut' }]
    await flushPromises()
    await close()
    await type('c')
    expect(valueText()).toBe('Cherry')
    await type('o')
    expect(valueText()).toBe('Coconut')
  })
})

describe('the hidden native select of a closed Select', () => {
  it('holds every option once idle, with no items left mounted', async () => {
    const { itemTexts } = mountSelect({ name: 'fruit' }, () => fruits.map((fruit, index) => ({ ...fruit, disabled: index === 1 })), { form: true })
    await flushPromises()
    expect(itemTexts).not.toHaveBeenCalled()
    await idle()
    expect(nativeOptions().map(option => [option.value, option.textContent?.trim(), option.disabled])).toEqual([
      ['Apple', 'Apple', false],
      ['Banana', 'Banana', true],
      ['Blueberry', 'Blueberry', false],
      ['Cherry', 'Cherry', false],
    ])
    expect(options()).toHaveLength(0)
    expect(itemTexts).toHaveBeenCalledTimes(fruits.length)
  })

  it('submits the selected value', async () => {
    mountSelect({ name: 'fruit', defaultValue: 'Cherry' }, () => fruits, { form: true })
    await flushPromises()
    expect(new FormData(document.querySelector('form')!).get('fruit')).toBe('Cherry')
  })
})

describe('items', () => {
  const record = { apple: 'Apple', banana: 'Banana', blueberry: 'Blueberry', cherry: 'Cherry' }
  const array = Object.entries(record).map(([value, label]) => ({ value, label, disabled: value === 'banana' }))
  const grouped = [{ label: 'B', items: array.filter(item => item.value.startsWith('b')) }, { label: 'Rest', items: array.filter(item => !item.value.startsWith('b')) }]
  const listOf = (items: { value: string, label: string }[]) => items.map(item => ({ value: item.value, text: `${item.label} (rendered)` }))

  it.each([
    ['a record', record, ['Apple', 'Banana', 'Blueberry', 'Cherry']],
    ['an array', array, ['Apple', 'Banana', 'Blueberry', 'Cherry']],
    ['groups', grouped, ['Banana', 'Blueberry', 'Apple', 'Cherry']],
  ] as [string, SelectItems<string>, string[]][])('labels the value from %s and renders no closed items', async (_, items, native) => {
    const { itemTexts } = mountSelect({ name: 'fruit', items, defaultValue: 'cherry' }, () => listOf(array), { form: true })
    await idle()
    expect(valueText()).toBe('Cherry')
    expect(itemTexts).not.toHaveBeenCalled()
    expect(nativeOptions().map(option => option.textContent?.trim())).toEqual(native)
    expect(new FormData(document.querySelector('form')!).get('fruit')).toBe('cherry')
  })

  it('types ahead over the items, skipping disabled ones, with no item mounted', async () => {
    const { itemTexts } = mountSelect({ items: array }, () => listOf(array))
    await flushPromises()
    await type('b')
    expect(valueText()).toBe('Blueberry')
    expect(itemTexts).not.toHaveBeenCalled()
  })

  it('wins over the item text, and shows the open list from the items', async () => {
    const { itemTexts } = mountSelect({ items: array, defaultValue: 'apple' }, () => listOf(array))
    await flushPromises()
    expect(itemTexts).not.toHaveBeenCalled()
    await open()
    expect(options()).toHaveLength(array.length)
    expect(options()[0].textContent).toContain('Apple (rendered)')
    expect(valueText()).toBe('Apple')
  })

  it('matches object values with `by`, and follows a new array', async () => {
    const items = ref([{ value: { id: 1 }, label: 'One' }, { value: { id: 2 }, label: 'Two' }])
    mountSelect({ by: 'id', items: items.value, defaultValue: { id: 2, extra: true } }, () => [])
    await flushPromises()
    expect(valueText()).toBe('Two')
  })

  it('reacts to a new `items`', async () => {
    const items = ref<Record<string, string>>({ apple: 'Apple' })
    mount(defineComponent({
      setup: () => () => h(SelectRoot, { items: items.value, defaultValue: 'apple' }, () => [
        h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { 'data-testid': 'value' })),
      ]),
    }), { attachTo: document.body })
    await flushPromises()
    expect(valueText()).toBe('Apple')
    items.value = { apple: 'Green apple' }
    await flushPromises()
    expect(valueText()).toBe('Green apple')
  })

  it('falls back to the item text for a value missing from `items`', async () => {
    mountSelect({ items: { apple: 'Apple' }, defaultValue: 'cherry' }, () => listOf(array))
    await open()
    await close()
    expect(valueText()).toBe('Cherry (rendered)')
  })
})
