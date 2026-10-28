// Regression (#3111 re-review): the closed lean items stay live, in document order.
// Re-review 894b52ef, focus 1: the closed lean items, once mounted, must stay live.
// Each case first gets the lean items mounted (a value, or a trigger focus), then mutates.
// Checks SelectValue, the hidden native <select>, and the closed trigger typeahead.
import { fireEvent } from '@testing-library/vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
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
const valueText = () => document.querySelector('[data-testid=value]')!.textContent
const trigger = () => document.querySelector('[role=combobox]') as HTMLElement
const nativeOpts = () => Array.from(document.querySelector('select')?.options ?? []).filter(o => !o.hasAttribute('data-nullable')).map(o => `${o.value}:${o.textContent?.trim()}${o.disabled ? '(d)' : ''}`)
async function focusTrigger() {
  trigger().focus()
  await fireEvent.focus(trigger())
  await settle()
}
async function key(k: string) {
  trigger().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  await settle()
  // typeahead search buffer resets after 1 s
  await new Promise(r => setTimeout(r, 1050))
}

interface Opt { value: string, text: string, disabled?: boolean, textValue?: string }
function make(opts: { list: () => Opt[], multiple?: boolean, model: any, name?: string, itemText?: (o: Opt) => any }) {
  return mount(defineComponent({
    setup() {
      return () => h('form', [h(SelectRoot, { 'modelValue': opts.model.value, 'onUpdate:modelValue': (v: any) => { opts.model.value = v }, 'multiple': opts.multiple, 'name': opts.name }, () => [
        h(SelectTrigger, { 'aria-label': 'x' }, () => h(SelectValue, { 'data-testid': 'value', 'placeholder': 'pick' })),
        h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => opts.list().map(o =>
          h(SelectItem, { key: o.value, value: o.value, disabled: o.disabled, textValue: o.textValue }, () => h(SelectItemText, () => opts.itemText ? opts.itemText(o) : o.text)))))),
      ])])
    },
  }), { attachTo: document.body })
}

const t = { en: { a: 'Apple', b: 'Banana', c: 'Cherry' }, fr: { a: 'Pomme', b: 'Banane', c: 'Cerise' } } as const

describe('lean items stay live', { timeout: 20000 }, () => {
  it('i18n single, value set: SelectValue + native + typeahead follow the locale', async () => {
    const locale = ref<'en' | 'fr'>('en')
    const model = ref('a')
    make({ list: () => (['a', 'b', 'c'] as const).map(v => ({ value: v, text: t[locale.value][v] })), model, name: 'f' })
    await settle()
    expect(valueText()).toBe('Apple')
    locale.value = 'fr'
    await settle()
    expect(valueText()).toBe('Pomme')
    expect(nativeOpts()).toEqual(['a:Pomme', 'b:Banane', 'c:Cerise'])
    await key('c') // Cerise (fr); 'Cherry' would also start with c, so use a letter only fr has
    expect(model.value).toBe('c')
    await key('p') // Pomme only in fr
    expect(model.value).toBe('a')
  })

  it('i18n single, no value: focus harvest, then locale switch, typeahead uses new text', async () => {
    const locale = ref<'en' | 'fr'>('en')
    const model = ref<string | undefined>(undefined)
    make({ list: () => (['a', 'b', 'c'] as const).map(v => ({ value: v, text: t[locale.value][v] })), model })
    await settle()
    await focusTrigger()
    locale.value = 'fr'
    await settle()
    await key('p')
    expect(model.value).toBe('a')
    expect(valueText()).toBe('Pomme')
  })

  it('i18n multiple, value set: every selected label follows; native follows', async () => {
    const locale = ref<'en' | 'fr'>('en')
    const model = ref(['a', 'c'])
    make({ list: () => (['a', 'b', 'c'] as const).map(v => ({ value: v, text: t[locale.value][v] })), model, multiple: true, name: 'f' })
    await settle()
    expect(valueText()).toBe('Apple, Cherry')
    locale.value = 'fr'
    await settle()
    expect(valueText()).toBe('Pomme, Cerise')
    expect(nativeOpts()).toEqual(['a:Pomme', 'b:Banane', 'c:Cerise'])
  })

  it('i18n multiple, empty value, named: native options follow the locale after the idle render', async () => {
    const locale = ref<'en' | 'fr'>('en')
    const model = ref<string[]>([])
    make({ list: () => (['a', 'b'] as const).map(v => ({ value: v, text: t[locale.value][v] })), model, multiple: true, name: 'f' })
    await settle()
    await new Promise(r => setTimeout(r, 1100))
    locale.value = 'fr'
    await settle()
    expect(nativeOpts()).toEqual(['a:Pomme', 'b:Banane'])
  })

  it('async options arriving after the first focus harvest: typeahead reaches them', async () => {
    const list = ref<Opt[]>([])
    const model = ref<string | undefined>(undefined)
    make({ list: () => list.value, model })
    await settle()
    await focusTrigger() // harvests an empty list
    list.value = [{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }]
    await settle()
    await key('b')
    expect(model.value).toBe('b')
    expect(valueText()).toBe('Banana')
  })

  it('async options inserted BEFORE existing ones: typeahead follows document order', async () => {
    const list = ref<Opt[]>([{ value: 'bob', text: 'Bob' }])
    const model = ref<string | undefined>(undefined)
    make({ list: () => list.value, model })
    await settle()
    await focusTrigger()
    // a refetch adds "Bill" at the top
    list.value = [{ value: 'bill', text: 'Bill' }, { value: 'bob', text: 'Bob' }]
    await settle()
    await key('b')
    expect(model.value).toBe('bill') // first 'b' item in document order
  })

  it('native options follow the document order of a prepended item', async () => {
    const list = ref<Opt[]>([{ value: 'bob', text: 'Bob' }])
    const model = ref<string | undefined>('bob')
    make({ list: () => list.value, model, name: 'f' })
    await settle()
    list.value = [{ value: 'bill', text: 'Bill' }, { value: 'bob', text: 'Bob' }]
    await settle()
    expect(nativeOpts()).toEqual(['bill:Bill', 'bob:Bob'])
  })

  it('list re-sorted while lean items are mounted: typeahead follows document order', async () => {
    const list = ref<Opt[]>([{ value: 'bob', text: 'Bob' }, { value: 'bill', text: 'Bill' }])
    const model = ref<string | undefined>(undefined)
    make({ list: () => list.value, model })
    await settle()
    await focusTrigger()
    list.value = [{ value: 'bill', text: 'Bill' }, { value: 'bob', text: 'Bob' }]
    await settle()
    await key('b')
    expect(model.value).toBe('bill')
  })

  it('disabled toggling: typeahead skips, then reaches; native option disabled follows', async () => {
    const dis = ref(true)
    const model = ref<string | undefined>('a')
    make({ list: () => [{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana', disabled: dis.value }], model, name: 'f' })
    await settle()
    await focusTrigger()
    expect(nativeOpts()).toEqual(['a:Apple', 'b:Banana(d)'])
    await key('b')
    expect(model.value).toBe('a')
    dis.value = false
    await settle()
    expect(nativeOpts()).toEqual(['a:Apple', 'b:Banana'])
    await key('b')
    expect(model.value).toBe('b')
    dis.value = true
    await settle()
    expect(nativeOpts()).toEqual(['a:Apple', 'b:Banana(d)'])
  })

  it('removing the selected item while closed', async () => {
    const list = ref<Opt[]>([{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }])
    const model = ref<string | undefined>('b')
    make({ list: () => list.value, model, name: 'f' })
    await settle()
    expect(valueText()).toBe('Banana')
    list.value = [{ value: 'a', text: 'Apple' }]
    await settle()
    await key('b') // Banana must no longer be reachable by typeahead
    await key('a')
    expect(model.value).toBe('a')
  })

  it('open -> close -> mutate label of selected', async () => {
    const list = ref<Opt[]>([{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }])
    const model = ref<string | undefined>('a')
    make({ list: () => list.value, model, name: 'f' })
    await settle()
    await fireEvent.pointerDown(trigger(), { button: 0, ctrlKey: false })
    await settle()
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await settle()
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    list.value = [{ value: 'a', text: 'Apricot' }, { value: 'b', text: 'Blueberry' }]
    await settle()
    expect(valueText()).toBe('Apricot')
    expect(nativeOpts()).toEqual(['a:Apricot', 'b:Blueberry'])
    await key('b')
    expect(valueText()).toBe('Blueberry')
  })

  it('nested component in SelectItemText changes its own text (no parent re-render)', async () => {
    const setters: Record<string, (s: string) => void> = {}
    const Inner = defineComponent({
      props: { id: String, initial: String },
      setup(p) {
        const s = ref(p.initial!)
        setters[p.id!] = (v: string) => { s.value = v }
        return () => h('em', s.value)
      },
    })
    const model = ref<string | undefined>('a')
    make({ list: () => [{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }], model, name: 'f', itemText: o => h(Inner, { id: o.value, initial: o.text }) })
    await settle()
    expect(valueText()).toBe('Apple')
    setters.a('Avocado')
    setters.b('Kiwi')
    await settle()
    expect(valueText()).toBe('Avocado')
    expect(nativeOpts()).toEqual(['a:Avocado', 'b:Kiwi'])
    await key('k')
    expect(model.value).toBe('b')
  })

  it('textValue props drive the closed typeahead, and follow updates', async () => {
    const tv = ref('Zebra')
    const model = ref<string | undefined>(undefined)
    make({ list: () => [{ value: 'a', text: 'Apple', textValue: 'Aardvark' }, { value: 'b', text: 'Banana', textValue: tv.value }], model })
    await settle()
    await focusTrigger()
    await key('z')
    expect(model.value).toBe('b')
    tv.value = 'Yak'
    await settle()
    await key('a')
    expect(model.value).toBe('a')
    await key('y')
    expect(model.value).toBe('b')
  })
})

describe('two Selects: one MutationObserver per instance, no cross attribution', { timeout: 20000 }, () => {
  it('mutating A does not touch B, and both stay live', async () => {
    const la = ref('Apple')
    const lb = ref('Apple')
    const ma = ref('a')
    const mb = ref('a')
    const one = (label: typeof la, model: typeof ma, id: string) => h(SelectRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => { model.value = v } }, () => [
      h(SelectTrigger, { 'aria-label': id }, () => h(SelectValue, { 'data-testid': id })),
      h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => [
        h(SelectItem, { value: 'a' }, () => h(SelectItemText, () => label.value)),
      ]))),
    ])
    mount(defineComponent({ setup: () => () => h('div', [one(la, ma, 'A'), one(lb, mb, 'B')]) }), { attachTo: document.body })
    await settle()
    const txt = (id: string) => document.querySelector(`[data-testid=${id}]`)!.textContent
    expect([txt('A'), txt('B')]).toEqual(['Apple', 'Apple'])
    la.value = 'Avocado'
    await settle()
    expect([txt('A'), txt('B')]).toEqual(['Avocado', 'Apple'])
    lb.value = 'Apricot'
    await settle()
    expect([txt('A'), txt('B')]).toEqual(['Avocado', 'Apricot'])
    await nextTick()
  })
})
