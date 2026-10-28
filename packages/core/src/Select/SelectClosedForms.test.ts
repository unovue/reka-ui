// Regression (#3111 review): the hidden native select follows the items while closed.
// Focus 3: forms — native <select> options, validity, reset, submit before idle, late name.
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
const nativeSelect = () => document.querySelector('select') as HTMLSelectElement
const nativeOpts = () => Array.from(nativeSelect()?.options ?? []).filter(o => !o.hasAttribute('data-nullable')).map(o => `${o.value}:${o.textContent?.trim()}${o.disabled ? ':disabled' : ''}`)
const trigger = () => document.querySelector('[role=combobox]') as HTMLElement

interface O { value: string, text: string, disabled?: boolean }
function make(props: () => Record<string, unknown>, list: () => O[], model = ref<any>(undefined)) {
  mount(defineComponent({
    setup() {
      return () => h('form', { id: 'f' }, [h(SelectRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => { model.value = v }, ...props() }, () => [
        h(SelectTrigger, { 'aria-label': 'x' }, () => h(SelectValue, { placeholder: 'pick' })),
        h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => list().map(o =>
          h(SelectItem, { key: o.value, value: o.value, disabled: o.disabled }, () => h(SelectItemText, () => o.text)))))),
      ])])
    },
  }), { attachTo: document.body })
  return model
}

const fruits: O[] = [{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }, { value: 'c', text: 'Cherry', disabled: true }]

describe('forms', () => {
  it('named select: native options are complete', async () => {
    make(() => ({ name: 'fruit' }), () => fruits)
    await settle()
    expect(nativeOpts()).toEqual(['a:Apple', 'b:Banana', 'c:Cherry:disabled'])
  })

  it('named select: options fetched after mount (after the idle harvest) reach the native select', async () => {
    const list = ref<O[]>([])
    make(() => ({ name: 'fruit' }), () => list.value)
    await settle()
    list.value = fruits
    await settle()
    expect(nativeOpts()).toEqual(['a:Apple', 'b:Banana', 'c:Cherry:disabled'])
  })

  it('named select: an option disabled after the idle harvest is disabled in the native select', async () => {
    const list = ref<O[]>(fruits.map(f => ({ ...f, disabled: false })))
    make(() => ({ name: 'fruit' }), () => list.value)
    await settle()
    list.value = fruits
    await settle()
    expect(nativeOpts()).toContain('c:Cherry:disabled')
  })

  it('submits the initial value before idle fires', async () => {
    make(() => ({ name: 'fruit' }), () => fruits, ref('b'))
    await flushPromises()
    const fd = new FormData(document.querySelector('form')!)
    expect(fd.get('fruit')).toBe('b')
  })

  it('required with no value is invalid; with a value valid', async () => {
    const model = make(() => ({ name: 'fruit', required: true }), () => fruits)
    await settle()
    expect(nativeSelect().checkValidity()).toBe(false)
    model.value = 'a'
    await settle()
    expect(nativeSelect().checkValidity()).toBe(true)
  })

  it('name added late: native options get filled', async () => {
    const name = ref<string | undefined>(undefined)
    make(() => ({ name: name.value }), () => fruits)
    await settle()
    expect(nativeSelect()).toBeNull()
    name.value = 'fruit'
    await settle()
    expect(nativeOpts()).toEqual(['a:Apple', 'b:Banana', 'c:Cherry:disabled'])
  })

  it('multiple: every selected value submits before idle', async () => {
    make(() => ({ name: 'fruit', multiple: true }), () => fruits, ref(['a', 'b']))
    await flushPromises()
    const fd = new FormData(document.querySelector('form')!)
    expect(fd.getAll('fruit')).toEqual(['a', 'b'])
  })
})
