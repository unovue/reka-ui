// Regression (#3111 review): the closed typeahead matches the current items.
// Focus 2: the closed trigger's typeahead must match the current items (disabled, added, removed).
import { fireEvent } from '@testing-library/vue'
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
  await new Promise(r => setTimeout(r, 80))
  await flushPromises()
}
const trigger = () => document.querySelector('[role=combobox]') as HTMLElement
async function type(key: string) {
  trigger().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await settle()
  // let the typeahead buffer reset (1s)
  await new Promise(r => setTimeout(r, 1100))
}

interface O { value: string, text: string, disabled?: boolean }
function make(list: () => O[], model = ref<string | undefined>(undefined)) {
  mount(defineComponent({
    setup() {
      return () => h(SelectRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => { model.value = v } }, () => [
        h(SelectTrigger, { 'aria-label': 'x' }, () => h(SelectValue, { placeholder: 'pick' })),
        h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => list().map(o =>
          h(SelectItem, { key: o.value, value: o.value, disabled: o.disabled }, () => h(SelectItemText, () => o.text)))))),
      ])
    },
  }), { attachTo: document.body })
  return model
}

async function warm() {
  // A key that matches nothing mounts the closed items; a focus alone does not.
  trigger().focus()
  await fireEvent.focus(trigger())
  trigger().dispatchEvent(new KeyboardEvent('keydown', { key: '~', bubbles: true, cancelable: true }))
  await settle()
  // The typeahead search resets after 1 s.
  await new Promise(resolve => setTimeout(resolve, 1050))
}

async function openClose() {
  await fireEvent.pointerDown(trigger(), { button: 0, ctrlKey: false })
  await settle()
  document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  await settle()
  trigger().focus()
}

describe('stale closed typeahead', { timeout: 15000 }, () => {
  it('an item disabled while closed is not selected by typeahead', async () => {
    const list = ref<O[]>([{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }])
    const model = make(() => list.value)
    await warm()
    list.value = [{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana', disabled: true }]
    await settle()
    await type('b')
    expect(model.value).toBeUndefined()
  })

  it('an item enabled while closed can be selected by typeahead', async () => {
    const list = ref<O[]>([{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana', disabled: true }])
    const model = make(() => list.value)
    await warm()
    list.value = [{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }]
    await settle()
    await type('b')
    expect(model.value).toBe('b')
  })

  it('an item added while closed can be selected by typeahead', async () => {
    const list = ref<O[]>([{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }])
    const model = make(() => list.value)
    await warm()
    list.value = [...list.value, { value: 'c', text: 'Cherry' }]
    await settle()
    await type('c')
    expect(model.value).toBe('c')
  })

  it('an item removed while closed is not selected by typeahead', async () => {
    const list = ref<O[]>([{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }])
    const model = make(() => list.value)
    await warm()
    list.value = [{ value: 'a', text: 'Apple' }]
    await settle()
    await type('b')
    expect(model.value).toBeUndefined()
  })

  it('open -> close -> remove item: typeahead does not select the removed value', async () => {
    const list = ref<O[]>([{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }])
    const model = make(() => list.value)
    await openClose()
    list.value = [{ value: 'a', text: 'Apple' }]
    await settle()
    await type('b')
    expect(model.value).toBeUndefined()
  })

  it('open -> close -> rename item: typeahead matches the new text', async () => {
    const list = ref<O[]>([{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }])
    const model = make(() => list.value)
    await openClose()
    list.value = [{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Kiwi' }]
    await settle()
    await type('k')
    expect(model.value).toBe('b')
  })

  it('items loaded after a first harvest of an empty list are typeable', async () => {
    const list = ref<O[]>([])
    const model = make(() => list.value)
    await warm()
    list.value = [{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }]
    await settle()
    await type('b')
    expect(model.value).toBe('b')
  })
})
