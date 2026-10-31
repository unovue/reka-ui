import type { VNodeChild } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { AutocompleteAnchor, AutocompleteContent, AutocompleteInput, AutocompleteItem, AutocompleteRoot } from '@/Autocomplete'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot } from '@/Combobox'

// `ListboxContent` is as-child inside the combobox content, so its tabindex is
// in the render. With the input mounted it does not flip ('-1' while the listbox
// is unfocusable), so a highlight change does not re-render the content either.

async function settle() {
  for (let i = 0; i < 3; i++) {
    await new Promise(resolve => setTimeout(resolve))
    await nextTick()
  }
}
const listbox = () => document.querySelector('[role="listbox"]') as HTMLElement
const tabindex = () => listbox().getAttribute('tabindex')
async function hover() {
  document.querySelectorAll('[role="option"]')[1].dispatchEvent(new PointerEvent('pointermove', { bubbles: true }))
  await settle()
  expect(document.querySelector('[data-highlighted]')).not.toBeNull()
}
async function leave() {
  listbox().dispatchEvent(new PointerEvent('pointerleave'))
  listbox().parentElement!.dispatchEvent(new PointerEvent('pointerleave'))
  await settle()
  expect(document.querySelector('[data-highlighted]')).toBeNull()
}

type Attrs = () => Record<string, unknown>

const families = {
  Combobox: (attrs: Attrs, child?: () => Record<string, unknown>, slotCall?: () => void) => () => h(ComboboxRoot, { defaultOpen: true }, () => [
    h(ComboboxAnchor, () => h(ComboboxInput)),
    h(ComboboxContent, attrs(), () => {
      const options = ['a', 'b', 'c'].map(value => h(ComboboxItem, { value }, () => {
        slotCall?.()
        return value
      }))
      return child ? h('div', child(), options) : options
    }),
  ]),
  Autocomplete: (attrs: Attrs, child?: () => Record<string, unknown>, slotCall?: () => void) => () => h(AutocompleteRoot, { defaultOpen: true }, () => [
    h(AutocompleteAnchor, () => h(AutocompleteInput)),
    h(AutocompleteContent, attrs(), () => {
      const options = ['a', 'b', 'c'].map(value => h(AutocompleteItem, { value }, () => {
        slotCall?.()
        return value
      }))
      return child ? h('div', child(), options) : options
    }),
  ]),
}

async function mountFamily(render: () => VNodeChild) {
  const wrapper = mount(defineComponent({ setup: () => render }), { attachTo: document.body })
  await settle()
  return wrapper
}

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})
afterEach(() => {
  document.body.innerHTML = ''
})

describe.each(Object.entries(families))('%s content tabindex', (_, family) => {
  it.each<[string, Attrs]>([
    ['inline', () => ({})],
    ['popper', () => ({ position: 'popper' })],
    ['past a camel-cased consumer tabIndex', () => ({ tabIndex: 0 })],
  ])('stays -1 with the input mounted: %s', async (_name, attrs) => {
    const wrapper = await mountFamily(family(attrs))
    expect(tabindex()).toBe('-1')
    await hover()
    expect(tabindex()).toBe('-1')
    wrapper.unmount()
  })

  it('stays -1 on a plain as-child element', async () => {
    const wrapper = await mountFamily(family(() => ({ asChild: true }), () => ({})))
    expect(tabindex()).toBe('-1')
    await hover()
    expect(tabindex()).toBe('-1')
    wrapper.unmount()
  })

  it.each<[string, Attrs, (() => Record<string, unknown>)?]>([
    ['consumer tabindex, inline', () => ({ tabindex: '0' })],
    ['consumer tabindex, popper', () => ({ position: 'popper', tabindex: '0' })],
    ['as-child element, inline', () => ({ asChild: true }), () => ({ tabindex: '0' })],
    ['as-child element, popper', () => ({ asChild: true, position: 'popper' }), () => ({ tabindex: '0' })],
  ])('keeps a tabindex: %s', async (_name, attrs, child) => {
    const wrapper = await mountFamily(family(attrs, child))
    expect(tabindex()).toBe('0')
    await hover()
    expect(tabindex()).toBe('0')
    wrapper.unmount()
  })

  it('follows a consumer tabindex as it changes', async () => {
    const bound = ref('0')
    const wrapper = await mountFamily(family(() => ({ tabindex: bound.value })))
    expect(tabindex()).toBe('0')
    bound.value = '5'
    await settle()
    expect(tabindex()).toBe('5')
    await hover()
    expect(tabindex()).toBe('5')
    wrapper.unmount()
  })

  it('keeps a highlight change off every item slot', async () => {
    let calls = 0
    const wrapper = await mountFamily(family(() => ({}), undefined, () => calls++))
    await hover()
    calls = 0
    await leave()
    expect(tabindex()).toBe('-1')
    // The one item whose highlight flipped.
    expect(calls).toBeLessThanOrEqual(1)
    wrapper.unmount()
  })
})
