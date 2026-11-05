// `null` is the empty value and a `''` item is allowed, as in Base UI's
// Combobox. Unlike Select, a selected `''` is a value like any other: the item
// is selected, the input shows its text and a `Field` reads it as filled
// (`selectedValue != null`). It still submits `''`, so `required` reports it
// missing, as Base UI's native hidden input does.
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '.'

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as any
})
enableAutoUnmount(afterEach)
beforeEach(() => { document.body.innerHTML = '' })

interface Item { value: any, text: string }
const items: Item[] = [{ value: null, text: 'None' }, { value: '', text: 'Empty' }, { value: 'a', text: 'Apple' }]

const input = () => document.querySelector('[data-testid=input]') as HTMLInputElement
const field = () => document.querySelector('[data-testid=field]') as HTMLElement
const form = () => document.querySelector('form') as HTMLFormElement
const option = (text: string) => Array.from(document.querySelectorAll('[role=option]')).find(el => el.textContent === text) as HTMLElement

async function open() {
  ;(document.querySelector('[data-testid=trigger]') as HTMLElement).click()
  await flushPromises()
}

async function pick(text: string) {
  await open()
  option(text).click()
  await flushPromises()
  await new Promise(r => setTimeout(r, 10))
  await flushPromises()
}

function make(options: { model?: ReturnType<typeof ref<any>>, props?: Record<string, unknown>, field?: boolean, form?: boolean, onFormSubmit?: (values: Record<string, unknown>) => void } = {}) {
  const model = options.model ?? ref<any>(undefined)
  const onUpdate = vi.fn((v: any) => { model.value = v })
  const combobox = () => h(ComboboxRoot, { 'modelValue': model.value, 'onUpdate:modelValue': onUpdate, ...(options.field ? {} : { name: 'fruit' }), ...options.props }, () => [
    h(ComboboxAnchor, () => [
      h(ComboboxInput, { 'data-testid': 'input' }),
      h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
    ]),
    h(ComboboxPortal, () => h(ComboboxContent, () => h(ComboboxViewport, () =>
      items.map(o => h(ComboboxItem, { key: String(o.value), value: o.value, textValue: o.text }, () => o.text))))),
  ])
  const control = () => options.field ? h(FieldRoot, { 'data-testid': 'field', 'name': 'fruit', 'required': !!options.props?.required }, combobox) : combobox()
  const wrapper = mount(defineComponent({
    setup: () => () => options.form
      ? h(FormRoot, { onFormSubmit: options.onFormSubmit }, () => [control(), h('button', { type: 'submit' }, 'Submit')])
      : h('form', [control()]),
  }), { attachTo: document.body })
  return { model, onUpdate, wrapper }
}

describe('an empty string item (Base UI parity)', () => {
  it('renders, can be selected, is marked selected, and shows its text in the input', async () => {
    const { onUpdate } = make({ model: ref('a'), props: { displayValue: (v: any) => items.find(o => o.value === v)?.text ?? '' } })
    await nextTick()
    expect(input().value).toBe('Apple')
    await pick('Empty')
    expect(onUpdate).toHaveBeenLastCalledWith('', expect.objectContaining({ reason: 'item-press' }))
    expect(input().value).toBe('Empty')
    await open()
    expect(option('Empty').getAttribute('aria-selected')).toBe('true')
    expect(option('None').getAttribute('aria-selected')).toBe('false')
    expect(option('Apple').getAttribute('aria-selected')).toBe('false')
  })

  it('without a `displayValue`, `\'\'` shows an empty input, like `null`', async () => {
    make({ model: ref('') })
    await nextTick()
    expect(input().value).toBe('')
  })

  it('a falsy primitive goes through the root `displayValue` too', async () => {
    make({ model: ref(0), props: { displayValue: (v: any) => `#${v}` } })
    await nextTick()
    expect(input().value).toBe('#0')
  })

  it('submits `\'\'`', async () => {
    make({ model: ref('') })
    await nextTick()
    expect(new FormData(form()).get('fruit')).toBe('')
  })
})

describe('null is the empty value', () => {
  it('pressing a `null` item clears the selection, and that item is the selected one', async () => {
    const { onUpdate, model } = make({ model: ref('a') })
    await nextTick()
    await pick('None')
    expect(onUpdate).toHaveBeenLastCalledWith(null, expect.objectContaining({ reason: 'item-press' }))
    expect(model.value).toBe(null)
    expect(input().value).toBe('')
    await open()
    expect(option('None').getAttribute('aria-selected')).toBe('true')
    expect(option('Empty').getAttribute('aria-selected')).toBe('false')
  })

  it('clearing the v-model with `null` empties the input and submits `\'\'`', async () => {
    const model = ref<string | null>('a')
    make({ model })
    await nextTick()
    expect(input().value).toBe('a')
    model.value = null
    await flushPromises()
    expect(input().value).toBe('')
    expect(new FormData(form()).get('fruit')).toBe('')
  })
})

describe('required', () => {
  it('a native `required` is missing for `null` and `\'\'`, and satisfied by a value', async () => {
    const model = ref<string | null>(null)
    make({ model, props: { required: true } })
    await nextTick()
    const hidden = () => form().querySelector('input[name=fruit]') as HTMLInputElement
    expect(hidden().required).toBe(true)
    expect(hidden().validity.valueMissing).toBe(true)
    model.value = ''
    await flushPromises()
    expect(hidden().validity.valueMissing).toBe(true)
    model.value = 'a'
    await flushPromises()
    expect(hidden().validity.valueMissing).toBe(false)
  })

  it('a required `Field` blocks the submission of `\'\'` and `null`, and submits a value', async () => {
    const onFormSubmit = vi.fn()
    const model = ref<string | null>('')
    make({ model, field: true, form: true, onFormSubmit, props: { required: true } })
    await nextTick()
    const submit = async () => {
      form().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await flushPromises()
    }
    await submit()
    expect(onFormSubmit).not.toHaveBeenCalled()
    expect(field().hasAttribute('data-invalid')).toBe(true)
    model.value = null
    await flushPromises()
    await submit()
    expect(onFormSubmit).not.toHaveBeenCalled()
    model.value = 'a'
    await flushPromises()
    await submit()
    expect(onFormSubmit).toHaveBeenLastCalledWith({ fruit: 'a' }, expect.anything())
  })
})

describe('field `filled` (Base UI: `selectedValue != null`)', () => {
  it('a selected `\'\'` is filled; `null` is not', async () => {
    const model = ref<string | null>(null)
    make({ model, field: true })
    await nextTick()
    expect(field().hasAttribute('data-filled')).toBe(false)
    await pick('Empty')
    expect(model.value).toBe('')
    expect(field().hasAttribute('data-filled')).toBe(true)
    await pick('None')
    expect(model.value).toBe(null)
    expect(field().hasAttribute('data-filled')).toBe(false)
    model.value = ''
    await flushPromises()
    expect(field().hasAttribute('data-filled')).toBe(true)
  })
})

describe('multiple', () => {
  it('`\'\'` and `null` are ordinary entries that toggle in the array and submit as `\'\'`', async () => {
    const model = ref<any[]>([])
    const { onUpdate } = make({ model, props: { multiple: true } })
    await nextTick()
    await open()
    option('Empty').click()
    await flushPromises()
    expect(onUpdate).toHaveBeenLastCalledWith([''], expect.anything())
    option('None').click()
    await flushPromises()
    expect(onUpdate).toHaveBeenLastCalledWith(['', null], expect.anything())
    expect(option('Empty').getAttribute('aria-selected')).toBe('true')
    expect(option('None').getAttribute('aria-selected')).toBe('true')
    expect(new FormData(form()).getAll('fruit[0]')).toEqual([''])
    expect(new FormData(form()).getAll('fruit[1]')).toEqual([''])
    option('Empty').click()
    await flushPromises()
    expect(onUpdate).toHaveBeenLastCalledWith([null], expect.anything())
  })

  it('`required` is satisfied by any entry, `[\'\']` included; `[]` is missing', async () => {
    const model = ref<any[]>([])
    make({ model, props: { multiple: true, required: true } })
    await nextTick()
    const missing = () => Array.from(form().querySelectorAll('input')).some(el => el.name.startsWith('fruit') && el.validity.valueMissing)
    expect(missing()).toBe(true)
    model.value = ['']
    await flushPromises()
    expect(missing()).toBe(false)
    expect(form().checkValidity()).toBe(true)
  })

  it('in a `Field`, `[\'\']` is filled and `[]` is not', async () => {
    const model = ref<any[]>([])
    make({ model, field: true, props: { multiple: true } })
    await nextTick()
    expect(field().hasAttribute('data-filled')).toBe(false)
    await open()
    option('Empty').click()
    await flushPromises()
    expect(field().hasAttribute('data-filled')).toBe(true)
  })
})
