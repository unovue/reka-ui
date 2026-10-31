// Regression (#3111 review): the native options of a named Select must not cost O(n²) on a model change.
// The bench's SelectLarge has no form, no object values and no typing, so this pins it by counting work.
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as any
})
enableAutoUnmount(afterEach)
beforeEach(() => {
  document.body.innerHTML = ''
})
afterEach(() => {
  vi.restoreAllMocks()
})

const N = 200
const values = Array.from({ length: N }, (_, i) => ({ id: i, name: `n${i}` }))

function make(model: { value: unknown }, by?: unknown, list = values) {
  mount(defineComponent({
    setup: () => () => h('form', [h(SelectRoot, { 'name': 'f', by, 'modelValue': model.value, 'onUpdate:modelValue': (v: unknown) => { model.value = v } } as any, () => [
      h(SelectTrigger, { 'aria-label': 'x' }, () => h(SelectValue, { placeholder: 'pick' })),
      h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => list.map(value =>
        h(SelectItem, { key: value.id, value } as any, () => h(SelectItemText, () => value.name)))))),
    ])]),
  }), { attachTo: document.body })
}

describe('native options of a named Select, on a model change', () => {
  it('does not sort the items again', async () => {
    const model = ref<unknown>(values[0])
    make(model)
    await flushPromises()
    expect(document.querySelectorAll('select option')).toHaveLength(N)
    const position = vi.spyOn(Node.prototype, 'compareDocumentPosition')
    model.value = values[1]
    await flushPromises()
    expect(position).not.toHaveBeenCalled()
  })

  it('compares each option a bounded number of times with a function `by`', async () => {
    const by = vi.fn((a: any, b: any) => a?.id === b?.id)
    const model = ref<unknown>(values[0])
    make(model, by)
    await flushPromises()
    by.mockClear()
    model.value = values[1]
    await flushPromises()
    // Linear in the options; the bug scanned every option per option (N² = 40,000).
    expect(by.mock.calls.length).toBeLessThan(N * 12)
  })

  it('finds the order of object values through the registry with no `by`', async () => {
    const list = ref(values.slice(0, 3))
    mount(defineComponent({
      setup: () => () => h('form', [h(SelectRoot, { name: 'f' }, () => [
        h(SelectTrigger, { 'aria-label': 'x' }, () => h(SelectValue, { placeholder: 'pick' })),
        h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => list.value.map(value =>
          h(SelectItem, { key: value.id, value } as any, () => h(SelectItemText, () => value.name)))))),
      ])]),
    }), { attachTo: document.body })
    await flushPromises()
    list.value = [...list.value].reverse()
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve))
    await flushPromises()
    expect(Array.from(document.querySelectorAll('select option:not([data-nullable])')).map(option => option.textContent?.trim())).toEqual(['n2', 'n1', 'n0'])
  })
})
