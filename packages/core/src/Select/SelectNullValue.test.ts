// #2484: `null` is the empty value and a `''` item is allowed. As in Base UI,
// `''` is a selectable value that still reads as empty (`hasSelectedValue`):
// placeholder, not filled, missing for `required`, submitted as `''`.
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { FieldRoot } from '@/Field'
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
const form = () => document.querySelector('form') as HTMLFormElement
const nativeSelect = () => document.querySelector('select') as HTMLSelectElement
const option = (text: string) => Array.from(document.querySelectorAll('[role=option]')).find(el => el.textContent === text) as HTMLElement

async function keydown(el: Element, key: string) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await nextTick()
  await flushPromises()
}

async function pick(text: string) {
  await keydown(trigger(), 'Enter')
  const el = option(text)
  el.focus()
  await keydown(el, 'Enter')
  await settle()
}

interface Item { value: any, text: string }
const withNone: Item[] = [{ value: null, text: 'None' }, { value: '', text: 'Empty' }, { value: 'a', text: 'Apple' }]

function make(options: { props?: () => Record<string, unknown>, list?: Item[], model?: ReturnType<typeof ref<any>>, field?: boolean } = {}) {
  const model = options.model ?? ref<any>(undefined)
  const onUpdate = vi.fn((v: any) => { model.value = v })
  const list = options.list ?? withNone
  const select = () => h(SelectRoot, { 'modelValue': model.value, 'onUpdate:modelValue': onUpdate, 'name': 'fruit', ...options.props?.() }, () => [
    h(SelectTrigger, { 'aria-label': 'x' }, () => h(SelectValue, { 'data-testid': 'value', 'placeholder': 'pick' })),
    h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => list.map(o =>
      h(SelectItem, { key: String(o.value), value: o.value }, () => h(SelectItemText, () => o.text)))))),
  ])
  mount(defineComponent({
    setup() {
      return () => h('form', [options.field ? h(FieldRoot, { 'data-testid': 'field', 'name': 'fruit', 'required': true }, select) : select()])
    },
  }), { attachTo: document.body })
  return { model, onUpdate }
}

const value = () => document.querySelector('[data-testid=value]')!

describe('an empty string item (Base UI parity)', () => {
  it('a `SelectItem` with `value=""` renders and can be selected; it submits `\'\'` and shows the placeholder', async () => {
    const { onUpdate } = make({ model: ref('a') })
    await settle()
    await pick('Empty')
    expect(onUpdate).toHaveBeenLastCalledWith('', expect.objectContaining({ reason: 'item-keydown' }))
    expect(valueText()).toBe('pick')
    expect(trigger().hasAttribute('data-placeholder')).toBe(true)
    expect(value().hasAttribute('data-placeholder')).toBe(true)
    expect(new FormData(form()).get('fruit')).toBe('')
  })

  it('a model of `\'\'` marks the `\'\'` item selected and checked, not the `null` one', async () => {
    make({ model: ref('') })
    await settle()
    expect(valueText()).toBe('pick')
    await keydown(trigger(), 'Enter')
    expect(option('Empty').getAttribute('aria-selected')).toBe('true')
    expect(option('Empty').getAttribute('data-state')).toBe('checked')
    expect(option('None').getAttribute('aria-selected')).toBe('false')
  })

  it('with a `null` entry in `items`, `\'\'` shows its own `items` label (Base UI `resolveSelectedLabel`)', async () => {
    const items = withNone.map(o => ({ value: o.value, label: o.text }))
    make({ model: ref(''), props: () => ({ items }) })
    await settle()
    expect(valueText()).toBe('Empty')
    expect(trigger().hasAttribute('data-placeholder')).toBe(true)
  })
})

describe('null is the empty value', () => {
  it('pressing a `null` item clears the selection and shows the placeholder', async () => {
    const { onUpdate, model } = make({ model: ref('a') })
    await settle()
    expect(valueText()).toBe('Apple')
    await pick('None')
    expect(onUpdate).toHaveBeenLastCalledWith(null, expect.objectContaining({ reason: 'item-keydown' }))
    expect(model.value).toBe(null)
    expect(valueText()).toBe('pick')
    expect(trigger().hasAttribute('data-placeholder')).toBe(true)
    expect(document.querySelector('[data-testid=value]')!.hasAttribute('data-placeholder')).toBe(true)
  })

  it('clearing the v-model with `null` shows the placeholder', async () => {
    const model = ref<string | null>('a')
    make({ model })
    await settle()
    expect(valueText()).toBe('Apple')
    model.value = null
    await settle()
    expect(valueText()).toBe('pick')
    expect(trigger().hasAttribute('data-placeholder')).toBe(true)
    expect(nativeSelect().selectedOptions[0].hasAttribute('data-nullable')).toBe(true)
  })

  it('a `null` entry in `items` labels the empty selection instead of the placeholder (Base UI)', async () => {
    const items = withNone.map(o => ({ value: o.value, label: o.text }))
    make({ model: ref(null), props: () => ({ items }) })
    await settle()
    expect(valueText()).toBe('None')
    expect(trigger().hasAttribute('data-placeholder')).toBe(true)
    expect(document.querySelector('[data-testid=value]')!.hasAttribute('data-placeholder')).toBe(true)
  })

  it('a `null` item is not a native option of its own: `null` submits the nullable value', async () => {
    make({ model: ref(null), props: () => ({ nullableValue: 'none' }) })
    await settle()
    const options = Array.from(nativeSelect().options)
    expect(options.filter(o => o.textContent?.trim() === 'None')).toHaveLength(0)
    expect(new FormData(form()).get('fruit')).toBe('none')
  })

  it('autofill picking the nullable option writes its `nullableValue` (`\'\'`, read as empty), not `null`', async () => {
    // An unset (`undefined`) model renders the nullable option, selected.
    const { onUpdate } = make()
    await settle()
    const select = nativeSelect()
    expect(select.selectedOptions[0].hasAttribute('data-nullable')).toBe(true)
    select.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    // `null` is emitted only by an item whose value is `null`, so a single
    // select's payload stays within its item type.
    expect(onUpdate).toHaveBeenLastCalledWith('', expect.objectContaining({ reason: 'autofill' }))
  })

  it('autofill picking the `\'\'` option writes `\'\'`', async () => {
    const { onUpdate } = make({ model: ref('a') })
    await settle()
    const select = nativeSelect()
    select.selectedIndex = Array.from(select.options).findIndex(o => o.value === '' && !o.hasAttribute('data-nullable'))
    select.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    expect(onUpdate).toHaveBeenLastCalledWith('', expect.objectContaining({ reason: 'autofill' }))
  })
})

describe('required', () => {
  it('`null` is missing a value; a non-empty value is valid', async () => {
    const model = ref<any>(null)
    make({ model, props: () => ({ required: true }) })
    await settle()
    expect(nativeSelect().checkValidity()).toBe(false)
    model.value = 'a'
    await settle()
    expect(nativeSelect().checkValidity()).toBe(true)
  })

  it('`\'\'` is missing a value too, as in Base UI, also when its item is not the first option', async () => {
    const model = ref<any>('a')
    make({ model, props: () => ({ required: true }), list: [{ value: 'a', text: 'Apple' }, { value: '', text: 'Empty' }] })
    await settle()
    expect(nativeSelect().checkValidity()).toBe(true)
    model.value = ''
    await settle()
    expect(nativeSelect().validity.valueMissing).toBe(true)
    expect(new FormData(form()).get('fruit')).toBe('')
  })

  it('inside a required `Field`, `\'\'` is not filled and `null` neither', async () => {
    const model = ref<any>('a')
    make({ model, field: true })
    await settle()
    const field = () => document.querySelector('[data-testid=field]')!
    expect(field().hasAttribute('data-filled')).toBe(true)
    model.value = ''
    await settle()
    expect(field().hasAttribute('data-filled')).toBe(false)
    model.value = 'a'
    await settle()
    model.value = null
    await settle()
    expect(field().hasAttribute('data-filled')).toBe(false)
  })
})

describe('multiple', () => {
  it('`[]` shows the placeholder; `[\'\']` is a selection and shows the text of the `\'\'` item (Base UI)', async () => {
    const model = ref<any>([])
    make({ model, props: () => ({ multiple: true }) })
    await settle()
    expect(valueText()).toBe('pick')
    expect(trigger().hasAttribute('data-placeholder')).toBe(true)
    model.value = ['']
    await settle()
    expect(valueText()).toBe('Empty')
    expect(trigger().hasAttribute('data-placeholder')).toBe(false)
    expect(nativeSelect().checkValidity()).toBe(true)
  })

  it('a `null` item toggles as an ordinary entry (Base UI)', async () => {
    const { onUpdate } = make({ model: ref<any>(['a']), props: () => ({ multiple: true }) })
    await settle()
    await keydown(trigger(), 'Enter')
    const el = option('None')
    el.focus()
    await keydown(el, 'Enter')
    expect(onUpdate).toHaveBeenLastCalledWith(['a', null], expect.anything())
  })

  it('a selected `null` entry keeps its native option: `[null]` satisfies `required` and is submitted', async () => {
    make({ model: ref<any>([null]), props: () => ({ multiple: true, required: true }) })
    await settle()
    expect(nativeSelect().selectedOptions).toHaveLength(1)
    expect(nativeSelect().checkValidity()).toBe(true)
    // Not the option text: `null` submits `''`, as Base UI serializes it.
    expect(new FormData(form()).getAll('fruit')).toEqual([''])
  })
})
