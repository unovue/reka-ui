// Regression (#3111 review): the labels of a closed Select stay live, as in v2 and before the lean closed items.
// Focus 1: SelectValue / native <select> must follow the selected item's text while the Select is closed.
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
const valueText = () => document.querySelector('[data-testid=value]')!.textContent
const trigger = () => document.querySelector('[role=combobox]') as HTMLElement
const nativeLabels = () => Array.from(document.querySelector('select')?.options ?? []).filter(o => o.value !== '').map(o => `${o.value}:${o.textContent}`)

function make(opts: { list: () => { value: string, text: string }[], multiple?: boolean, model: any, name?: string }) {
  return mount(defineComponent({
    setup() {
      return () => h('form', [h(SelectRoot, { 'modelValue': opts.model.value, 'onUpdate:modelValue': (v: any) => { opts.model.value = v }, 'multiple': opts.multiple, 'name': opts.name }, () => [
        h(SelectTrigger, { 'aria-label': 'x' }, () => h(SelectValue, { 'data-testid': 'value', 'placeholder': 'pick' })),
        h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => opts.list().map(o =>
          h(SelectItem, { key: o.value, value: o.value }, () => h(SelectItemText, () => o.text)))))),
      ])])
    },
  }), { attachTo: document.body })
}

describe('stale labels while closed', () => {
  it('i18n switch: the selected label follows a locale change', async () => {
    const locale = ref<'en' | 'fr'>('en')
    const t = { en: { a: 'Apple', b: 'Banana' }, fr: { a: 'Pomme', b: 'Banane' } }
    make({ list: () => (['a', 'b'] as const).map(v => ({ value: v, text: t[locale.value][v] })), model: ref('a') })
    await settle()
    expect(valueText()).toBe('Apple')
    locale.value = 'fr'
    await settle()
    expect(valueText()).toBe('Pomme')
  })

  it('i18n switch, multiple: every selected label follows', async () => {
    const locale = ref<'en' | 'fr'>('en')
    const t = { en: { a: 'Apple', b: 'Banana' }, fr: { a: 'Pomme', b: 'Banane' } }
    make({ list: () => (['a', 'b'] as const).map(v => ({ value: v, text: t[locale.value][v] })), model: ref(['a', 'b']), multiple: true })
    await settle()
    expect(valueText()).toBe('Apple, Banana')
    locale.value = 'fr'
    await settle()
    expect(valueText()).toBe('Pomme, Banane')
  })

  it('v-for list replaced (same values, new texts)', async () => {
    const list = ref([{ value: 'a', text: 'Old A' }, { value: 'b', text: 'Old B' }])
    make({ list: () => list.value, model: ref('a') })
    await settle()
    expect(valueText()).toBe('Old A')
    list.value = [{ value: 'a', text: 'New A' }, { value: 'b', text: 'New B' }]
    await settle()
    expect(valueText()).toBe('New A')
  })

  it('async items: selected value whose item appears later', async () => {
    const list = ref<{ value: string, text: string }[]>([])
    make({ list: () => list.value, model: ref('b') })
    await settle()
    list.value = [{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }]
    await settle()
    expect(valueText()).toBe('Banana')
  })

  it('async items replaced after first load (refetch with new labels)', async () => {
    const list = ref<{ value: string, text: string }[]>([])
    make({ list: () => list.value, model: ref('b') })
    await settle()
    list.value = [{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }]
    await settle()
    list.value = [{ value: 'a', text: 'Apple v2' }, { value: 'b', text: 'Banana v2' }]
    await settle()
    expect(valueText()).toBe('Banana v2')
  })

  it('label change after open -> close', async () => {
    const list = ref([{ value: 'a', text: 'Apple' }, { value: 'b', text: 'Banana' }])
    make({ list: () => list.value, model: ref('a') })
    await settle()
    await fireEvent.pointerDown(trigger(), { button: 0, ctrlKey: false })
    await settle()
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await settle()
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    list.value = [{ value: 'a', text: 'Apricot' }, { value: 'b', text: 'Banana' }]
    await settle()
    expect(valueText()).toBe('Apricot')
  })

  it('native <select> option text follows a label change while closed (named, in a form)', async () => {
    const locale = ref<'en' | 'fr'>('en')
    const t = { en: { a: 'Apple', b: 'Banana' }, fr: { a: 'Pomme', b: 'Banane' } }
    make({ list: () => (['a', 'b'] as const).map(v => ({ value: v, text: t[locale.value][v] })), model: ref('a'), name: 'fruit' })
    await settle()
    expect(nativeLabels()).toEqual(['a:Apple', 'b:Banana'])
    locale.value = 'fr'
    await settle()
    expect(nativeLabels()).toEqual(['a:Pomme', 'b:Banane'])
  })
})
