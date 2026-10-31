// Regression (#3111 review): the `items` prop.
// Focus 4: the new `items` prop (PR only — base has no such prop, so run on PR side).
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

beforeAll(() => {
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as any
})
enableAutoUnmount(afterEach)
beforeEach(() => { document.body.innerHTML = '' })

async function settle() {
  await flushPromises()
  await new Promise(r => setTimeout(r, 120))
  await flushPromises()
}
const valueText = () => document.querySelector('[data-testid=value]')!.textContent
const trigger = () => document.querySelector('[role=combobox]') as HTMLElement
const nativeOpts = () => Array.from((document.querySelector('select') as HTMLSelectElement)?.options ?? []).filter(o => !o.hasAttribute('data-nullable')).map(o => `${o.value}:${o.textContent?.trim()}`)
async function type(key: string) {
  trigger().focus()
  trigger().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await settle()
  await new Promise(r => setTimeout(r, 1100))
}

function make(props: () => Record<string, unknown>, children: () => { value: any, text: string }[], model = ref<any>(undefined)) {
  mount(defineComponent({
    setup() {
      return () => h('form', [h(SelectRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => { model.value = v }, 'name': 'f', ...props() }, () => [
        h(SelectTrigger, { 'aria-label': 'x' }, () => h(SelectValue, { 'data-testid': 'value', 'placeholder': 'pick' })),
        h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => children().map(o =>
          h(SelectItem, { value: o.value }, () => h(SelectItemText, () => o.text)))))),
      ])])
    },
  }), { attachTo: document.body })
  return model
}

describe('items prop', { timeout: 15000 }, () => {
  it('record shape: label, native options, typeahead', async () => {
    const model = make(() => ({ items: { a: 'Apple', b: 'Banana' } }), () => [{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }], ref('a'))
    await settle()
    expect(valueText()).toBe('Apple')
    expect(nativeOpts()).toEqual(['a:Apple', 'b:Banana'])
    await type('b')
    expect(model.value).toBe('b')
  })

  it('array shape with disabled: typeahead skips disabled', async () => {
    const model = make(() => ({ items: [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana', disabled: true }] }), () => [], ref('a'))
    await settle()
    expect(valueText()).toBe('Apple')
    await type('b')
    expect(model.value).toBe('a')
  })

  it('group shape', async () => {
    const model = make(() => ({ items: [{ label: 'Fruits', items: [{ value: 'a', label: 'Apple' }] }, { label: 'Veg', items: [{ value: 'c', label: 'Carrot' }] }] }), () => [], ref('c'))
    await settle()
    expect(valueText()).toBe('Carrot')
    expect(nativeOpts()).toEqual(['a:Apple', 'c:Carrot'])
  })

  it('items changing at runtime update the label', async () => {
    const items = ref<Record<string, string>>({ a: 'Apple' })
    make(() => ({ items: items.value }), () => [], ref('a'))
    await settle()
    items.value = { a: 'Pomme' }
    await settle()
    expect(valueText()).toBe('Pomme')
  })

  it('record shape with number values (Base UI looks up items[value])', async () => {
    make(() => ({ items: { 1: 'One', 2: 'Two' } }), () => [{ value: 1, text: 'One' }, { value: 2, text: 'Two' }], ref(1))
    await settle()
    expect(valueText()).toBe('One')
  })

  it('items mixed with SelectItem children that have an extra option: native select lists it', async () => {
    make(() => ({ items: { a: 'Apple' } }), () => [{ value: 'a', text: 'Apple' }, { value: 'c', text: 'Cherry' }])
    await settle()
    expect(nativeOpts()).toEqual(['a:Apple', 'c:Cherry'])
  })

  it('items mixed with SelectItem children: closed typeahead reaches the extra child', async () => {
    const model = make(() => ({ items: { a: 'Apple' } }), () => [{ value: 'a', text: 'Apple' }, { value: 'c', text: 'Cherry' }])
    await settle()
    await type('c')
    expect(model.value).toBe('c')
  })

  it('object values with `by`', async () => {
    const items = [{ value: { id: 1, n: 'x' }, label: 'One' }, { value: { id: 2, n: 'y' }, label: 'Two' }]
    const model = make(() => ({ items, by: 'id' }), () => [], ref({ id: 2 }))
    await settle()
    expect(valueText()).toBe('Two')
    await type('o')
    expect(model.value).toEqual({ id: 1, n: 'x' })
  })

  it('a mixed list whose first entry is a plain option and a later one is a group', async () => {
    make(() => ({ items: [{ value: 'a', label: 'Apple' }, { label: 'G', items: [{ value: 'c', label: 'Carrot' }] }] }), () => [], ref('c'))
    await settle()
    expect(valueText()).toBe('Carrot')
  })
})
