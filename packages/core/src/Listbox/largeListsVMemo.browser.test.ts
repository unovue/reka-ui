import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createApp, defineComponent, h, nextTick, renderList, shallowRef, withMemo } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxRoot, ComboboxViewport } from '@/Combobox'
import { ListboxContent, ListboxItem, ListboxItemIndicator, ListboxRoot } from '@/Listbox'
import { SelectContent, SelectItem, SelectItemIndicator, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '@/Select'

// The docs' "Large lists" snippets: `v-memo="[item.value, item.label]"`, without
// `selected` or the model in the memo. What `v-memo` compiles to is `withMemo`,
// written out here because the browser runner has no template compiler. A
// selection lives in the item's own state, so it must show through the memo,
// including a scoped slot's `selected`, an indicator and the root's value.

type Item = { value: string, label: string }
const items = shallowRef<Item[]>([])

async function settle() {
  for (let i = 0; i < 3; i++) {
    await new Promise(resolve => setTimeout(resolve, 20))
    await nextTick()
  }
}
const option = (label: string) => [...document.querySelectorAll<HTMLElement>('[role=option]')].find(el => el.textContent?.includes(label))!

/** `<Item v-for="item in items" :key="item.value" v-memo="[item.value, item.label]" ...>` */
let cache: any[] = []
function memoized(render: (item: Item) => ReturnType<typeof h>, calls?: { n: number }) {
  return renderList(items.value, (item, index) => withMemo([item.value, item.label], () => {
    if (calls)
      calls.n++
    return render(item)
  }, cache, index))
}

let unmount: (() => void) | undefined
async function mountApp(render: () => ReturnType<typeof h>) {
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(defineComponent({ setup: () => render }))
  app.mount(host)
  unmount = () => {
    app.unmount()
    host.remove()
  }
  await settle()
}

describe('large lists: v-memo on the consumer\'s v-for', () => {
  afterEach(() => {
    unmount?.()
    unmount = undefined
    cache = []
  })

  it('combobox: a click selects through the memo', async () => {
    items.value = [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }]
    const model = shallowRef<string>()
    await mountApp(() => h(ComboboxRoot, { 'open': true, 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => { model.value = v } }, () => [
      h(ComboboxAnchor, () => h(ComboboxInput, { 'aria-label': 'Fruit' })),
      h(ComboboxContent, () => h(ComboboxViewport, () => memoized(item =>
        h(ComboboxItem, { key: item.value, value: item.value }, {
          default: (slot: { selected: boolean }) => [`${item.label} ${slot.selected ? 'on' : 'off'}`, h(ComboboxItemIndicator, { class: 'tick' }, () => 'x')],
        })))),
    ]))
    expect(option('Banana').getAttribute('aria-selected')).toBe('false')

    await userEvent.click(option('Banana'))
    await settle()
    expect(model.value).toBe('b')
    expect(option('Banana').getAttribute('aria-selected')).toBe('true')
    expect(option('Banana').hasAttribute('data-state') && option('Banana').getAttribute('data-state')).toBe('checked')
    expect(option('Banana').textContent).toContain('Banana on')
    expect(option('Banana').querySelector('.tick')).not.toBeNull()
    expect(option('Apple').getAttribute('aria-selected')).toBe('false')

    await userEvent.click(option('Apple'))
    await settle()
    expect(model.value).toBe('a')
    expect(option('Apple').getAttribute('aria-selected')).toBe('true')
    expect(option('Banana').getAttribute('aria-selected')).toBe('false')
    expect(option('Banana').textContent).toContain('Banana off')
    expect(option('Banana').querySelector('.tick')).toBeNull()
  })

  it('combobox: the built-in filter works through the memo', async () => {
    items.value = [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }]
    await mountApp(() => h(ComboboxRoot, { open: true }, () => [
      h(ComboboxAnchor, () => h(ComboboxInput, { 'aria-label': 'Fruit' })),
      h(ComboboxContent, () => h(ComboboxViewport, () => memoized(item =>
        h(ComboboxItem, { key: item.value, value: item.value }, () => item.label)))),
    ]))
    await userEvent.type(document.querySelector('input')!, 'Ban')
    await settle()
    const visible = [...document.querySelectorAll<HTMLElement>('[role=option]')].filter(el => getComputedStyle(el).display !== 'none')
    expect(visible.map(el => el.textContent)).toEqual(['Banana'])
  })

  it('listbox: a click selects through the memo', async () => {
    items.value = [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }]
    await mountApp(() => h(ListboxRoot, () => h(ListboxContent, () => memoized(item =>
      h(ListboxItem, { key: item.value, value: item.value }, () => [item.label, h(ListboxItemIndicator, { class: 'tick' }, () => 'x')])))))
    await userEvent.click(option('Banana'))
    await settle()
    expect(option('Banana').getAttribute('aria-selected')).toBe('true')
    expect(option('Banana').querySelector('.tick')).not.toBeNull()
    await userEvent.click(option('Apple'))
    await settle()
    expect(option('Banana').getAttribute('aria-selected')).toBe('false')
    expect(option('Banana').querySelector('.tick')).toBeNull()
  })

  it('select: a click selects through the memo and the trigger shows it', async () => {
    items.value = [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }]
    await mountApp(() => h(SelectRoot, () => [
      h(SelectTrigger, { class: 'trg' }, () => h(SelectValue, { placeholder: 'Pick' })),
      h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => memoized(item =>
        h(SelectItem, { key: item.value, value: item.value }, () => [h(SelectItemText, () => item.label), h(SelectItemIndicator, { class: 'tick' }, () => 'x')]))))),
    ]))
    await userEvent.click(document.querySelector('.trg')!)
    await settle()
    await userEvent.click(option('Banana'))
    await settle()
    expect(document.querySelector('.trg')!.textContent).toContain('Banana')
    await userEvent.click(document.querySelector('.trg')!)
    await settle()
    expect(option('Banana').getAttribute('aria-selected')).toBe('true')
    expect(option('Banana').querySelector('.tick')).not.toBeNull()
    expect(option('Apple').getAttribute('aria-selected')).toBe('false')
  })

  it('re-renders one item on a one-label change, and only a listed value updates', async () => {
    items.value = [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }, { value: 'c', label: 'Cherry' }]
    const calls = { n: 0 }
    const disabled = shallowRef(false)
    await mountApp(() => h(ListboxRoot, () => h(ListboxContent, () => memoized(item =>
      h(ListboxItem, { key: item.value, value: item.value, disabled: disabled.value }, () => item.label), calls))))
    calls.n = 0
    items.value = items.value.map(item => item.value === 'b' ? { ...item, label: 'Blueberry' } : { ...item })
    await settle()
    expect(calls.n).toBe(1)
    expect(option('Blueberry')).toBeTruthy()

    // A prop left out of the memo goes stale, which is why the docs say to list
    // every value the item's props read as well as its slot.
    disabled.value = true
    await settle()
    expect(option('Apple').hasAttribute('data-disabled')).toBe(false)
  })
})
