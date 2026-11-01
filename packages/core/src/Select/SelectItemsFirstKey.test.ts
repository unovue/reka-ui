// Regression (#3111 re-review): `items` first keys and record values.
// Re-review 894b52ef: `items` prop (PR-only API, base has no `items`; run on PR).
// (a) A first key that matches nothing in `items` renders the items and retries. The control below passes through
//     the idle native-options render of a named Select in a <form>; the others have no form, so only the retry can pass.
// (b) record `items` with number values: the typeahead / native select must keep the number type.
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
const trigger = () => document.querySelector('[role=combobox]') as HTMLElement
const valueText = () => document.querySelector('[data-testid=value]')!.textContent
const keydown = (k: string) => trigger().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))

function make(rootProps: Record<string, unknown>, children: { value: any, text: string }[], model = ref<any>(undefined), form = false) {
  const select = () => h(SelectRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => { model.value = v }, ...rootProps }, () => [
    h(SelectTrigger, { 'aria-label': 'x' }, () => h(SelectValue, { 'data-testid': 'value', 'placeholder': 'pick' })),
    h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => children.map(o =>
      h(SelectItem, { value: o.value }, () => h(SelectItemText, () => o.text)))))),
  ])
  mount(defineComponent({ setup: () => () => form ? h('form', [select()]) : h('div', [select()]) }), { attachTo: document.body })
  return model
}

describe('items: first key that misses', { timeout: 15000 }, () => {
  it('control (PR test harness): named + form -> passes via the idle render, not the key', async () => {
    const model = make({ items: { a: 'Apple' }, name: 'f' }, [{ value: 'a', text: 'Apple' }, { value: 'c', text: 'Cherry' }], ref(), true)
    await settle()
    keydown('c')
    await settle()
    expect(model.value).toBe('c')
  })

  it('no form: first key (no focus) on an option only a SelectItem has', async () => {
    const model = make({ items: { a: 'Apple' } }, [{ value: 'a', text: 'Apple' }, { value: 'c', text: 'Cherry' }])
    await settle()
    keydown('c')
    await settle()
    expect(model.value).toBe('c')
  })

  it('no form: focus, then a key', async () => {
    const model = make({ items: { a: 'Apple' } }, [{ value: 'a', text: 'Apple' }, { value: 'c', text: 'Cherry' }])
    await settle()
    trigger().focus()
    keydown('c')
    await flushPromises()
    expect(model.value).toBe('c')
  })
})

describe('items: record keys and number values', { timeout: 15000 }, () => {
  it('typeahead with record items selects the number value (SelectItem values are numbers)', async () => {
    const model = make({ items: { 1: 'One', 2: 'Two' } }, [{ value: 1, text: 'One' }, { value: 2, text: 'Two' }])
    await settle()
    keydown('t') // no focus: items not rendered, typeahead reads `items` only
    await settle()
    expect(model.value).toBe(2)
  })

  it('a number value typed from a record shows as selected in the open list', async () => {
    const model = make({ items: { 1: 'One', 2: 'Two' } }, [{ value: 1, text: 'One' }, { value: 2, text: 'Two' }])
    await settle()
    keydown('t')
    await settle()
    expect(model.value).toBe(2)
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
    await settle()
    const two = Array.from(document.querySelectorAll('[role=option]')).find(option => option.textContent === 'Two')!
    expect(two.getAttribute('aria-selected')).toBe('true')
  })

  it('selected number value resolves its label from a record', async () => {
    make({ items: { 1: 'One', 2: 'Two' } }, [], ref(2))
    await settle()
    expect(valueText()).toBe('Two')
  })
})
