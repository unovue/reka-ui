// `ComboboxValue`: the text of the selection, outside the input. It renders no
// element: the labels joined, the placeholder, or its slot.
import type { Ref } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxValue, ComboboxViewport, createComboboxItems } from '.'

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as any
})
enableAutoUnmount(afterEach)
beforeEach(() => {
  document.body.innerHTML = ''
})

const users = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }, { id: 3, name: 'Linus' }]
const collection = createComboboxItems(users, { getValue: user => user.id, getLabel: user => user.name })

const holder = () => document.querySelector('[data-testid=value]') as HTMLElement
const text = () => holder().textContent
const option = (label: string) => Array.from(document.querySelectorAll('[role=option]')).find(el => el.textContent === label) as HTMLElement

function make(rootProps: () => Record<string, unknown>, options: { model?: Ref<any>, valueProps?: Record<string, unknown>, slot?: (props: { modelValue: any, selectedLabels: string[] }) => any } = {}) {
  const model = options.model ?? ref<any>(undefined)
  const wrapper = mount(defineComponent({
    setup: () => () => h(ComboboxRoot, {
      'modelValue': model.value,
      'onUpdate:modelValue': (value: any) => { model.value = value },
      ...rootProps(),
    }, () => [
      h('div', { 'data-testid': 'value' }, h(ComboboxValue, options.valueProps ?? null, options.slot ? { default: options.slot } : undefined)),
      h(ComboboxAnchor, () => [
        h(ComboboxInput, { 'aria-label': 'User' }),
        h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
      ]),
      h(ComboboxPortal, () => h(ComboboxContent, { 'aria-label': 'Users' }, () => h(ComboboxViewport, () =>
        users.map(user => h(ComboboxItem, { key: user.id, value: user.id }, () => user.name))))),
    ]),
  }), { attachTo: document.body })
  return { model, wrapper }
}

describe('given a ComboboxValue in a single Combobox', () => {
  it('renders no element of its own', async () => {
    make(() => ({ items: collection }), { model: ref(2) })
    await flushPromises()
    expect(holder().children.length).toBe(0)
    expect(holder().innerHTML).toBe('Grace')
  })

  it('shows the label of the selected id through a collection, before the list has rendered', async () => {
    const { model } = make(() => ({ items: collection }), { model: ref(2) })
    await flushPromises()
    expect(document.querySelectorAll('[role=option]').length).toBe(0)
    expect(text()).toBe('Grace')
    model.value = 3
    await flushPromises()
    expect(text()).toBe('Linus')
  })

  it('shows the placeholder while nothing is selected, and nothing without one', async () => {
    const { model } = make(() => ({ items: collection }), { model: ref<any>(null), valueProps: { placeholder: 'Pick a user' } })
    await flushPromises()
    expect(text()).toBe('Pick a user')
    model.value = 1
    await flushPromises()
    expect(text()).toBe('Ada')
    model.value = undefined
    await flushPromises()
    expect(text()).toBe('Pick a user')
    document.body.innerHTML = ''
    make(() => ({ items: collection }), { model: ref<any>(null) })
    await flushPromises()
    expect(text()).toBe('')
  })

  it('follows a pick', async () => {
    const { model } = make(() => ({ items: collection }), { valueProps: { placeholder: 'Pick a user' } })
    await flushPromises()
    ;(document.querySelector('[data-testid=trigger]') as HTMLElement).click()
    await flushPromises()
    option('Linus').click()
    await flushPromises()
    expect(model.value).toBe(3)
    expect(text()).toBe('Linus')
  })

  it('shows the string form of a primitive value and the `label` key of an object value without `items`', async () => {
    const { model } = make(() => ({}), { model: ref<any>(2) })
    await flushPromises()
    expect(text()).toBe('2')
    model.value = { id: 2, label: 'Grace' }
    await flushPromises()
    expect(text()).toBe('Grace')
  })

  it('finds the label of a primitive value among `{ value, label }` items', async () => {
    const items = [{ value: 1, label: 'Ada' }, { label: 'More', items: [{ value: 2, label: 'Grace' }] }]
    const { model } = make(() => ({ items }), { model: ref<any>(2) })
    await flushPromises()
    expect(text()).toBe('Grace')
    // The input does not: ids resolve there through a collection only.
    expect((document.querySelector('input') as HTMLInputElement).value).toBe('2')
    model.value = 7
    await flushPromises()
    expect(text()).toBe('7')
  })

  it('lets the root `displayValue` win', async () => {
    make(() => ({ items: collection, displayValue: (value: number) => `#${value}` }), { model: ref(2) })
    await flushPromises()
    expect(text()).toBe('#2')
  })

  it('follows `items`', async () => {
    const data = ref(users)
    make(() => ({ items: createComboboxItems(data.value, { getValue: user => user.id, getLabel: user => user.name }) }), { model: ref(2) })
    await flushPromises()
    data.value = [{ id: 2, name: 'Grace Hopper' }]
    await flushPromises()
    expect(text()).toBe('Grace Hopper')
  })

  it('passes the value and its label to the slot', async () => {
    const slot = vi.fn(({ selectedLabels }: { selectedLabels: string[] }) => h('b', selectedLabels.join('|')))
    make(() => ({ items: collection }), { model: ref(2), slot })
    await flushPromises()
    expect(slot).toHaveBeenLastCalledWith({ modelValue: 2, selectedLabels: ['Grace'] })
    expect(holder().innerHTML).toBe('<b>Grace</b>')
  })

  it('passes no label to the slot while nothing is selected', async () => {
    const slot = vi.fn(() => null)
    make(() => ({ items: collection }), { model: ref<any>(null), valueProps: { placeholder: 'Pick a user' }, slot })
    await flushPromises()
    expect(slot).toHaveBeenLastCalledWith({ modelValue: null, selectedLabels: [] })
  })

  it('should pass axe accessibility tests', async () => {
    const { wrapper } = make(() => ({ items: collection }), { model: ref(2) })
    await flushPromises()
    expect(await axe(wrapper.element.parentElement!)).toHaveNoViolations()
    ;(document.querySelector('[data-testid=trigger]') as HTMLElement).click()
    await flushPromises()
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe('given a ComboboxValue in a multiple Combobox', () => {
  it('joins the labels with a comma, in the order of the value', async () => {
    const { model } = make(() => ({ items: collection, multiple: true }), { model: ref([3, 1]) })
    await flushPromises()
    expect(text()).toBe('Linus, Ada')
    model.value = [1]
    await flushPromises()
    expect(text()).toBe('Ada')
  })

  it('shows the placeholder for an empty selection', async () => {
    make(() => ({ items: collection, multiple: true }), { model: ref([]), valueProps: { placeholder: 'Nobody' } })
    await flushPromises()
    expect(text()).toBe('Nobody')
  })

  it('adds the label of a picked item, and the string form of a value `items` does not list', async () => {
    const items = createComboboxItems(users.slice(0, 1), { getValue: user => user.id, getLabel: user => `${user.name} (data)` })
    const { model } = make(() => ({ items, multiple: true }), { model: ref<number[]>([]) })
    await flushPromises()
    ;(document.querySelector('[data-testid=trigger]') as HTMLElement).click()
    await flushPromises()
    option('Ada').click()
    await flushPromises()
    option('Grace').click()
    await flushPromises()
    expect(model.value).toEqual([1, 2])
    expect(text()).toBe('Ada (data), 2')
  })

  it('follows a value changed in place', async () => {
    const model = ref([1])
    make(() => ({ items: collection, multiple: true }), { model })
    await flushPromises()
    model.value.push(2)
    await flushPromises()
    expect(text()).toBe('Ada, Grace')
  })

  it('passes each label to the slot, for chips', async () => {
    make(() => ({ items: collection, multiple: true }), {
      model: ref([2, 3]),
      slot: ({ modelValue, selectedLabels }) => selectedLabels.map((label, index) => h('span', { 'data-id': modelValue[index] }, label)),
    })
    await flushPromises()
    expect(holder().innerHTML).toContain('<span data-id="2">Grace</span><span data-id="3">Linus</span>')
  })
})
