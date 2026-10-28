// Regression (#3111 review): `items` must not write reactive state from a computed getter (Vue 3.4 recursion).
// Focus 7 (Vue 3.4): `items` on SelectRoot -> `itemLabels` computed calls registry.register() -> triggerRef() inside a
// computed getter; Vue 3.4 flags the computed dirty again (computed side effect) and SelectValue re-renders until
// "Maximum recursive updates exceeded".
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref, version } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as any
})
enableAutoUnmount(afterEach)

describe(`items on Vue ${version}`, () => {
  it('renders the selected label from `items` without recursive updates', async () => {
    const errors: unknown[] = []
    const warn = vi.spyOn(console, 'warn').mockImplementation((...a) => { errors.push(String(a[0]).slice(0, 160)) })
    const items = ref<Record<string, string>>({ a: 'Apple', b: 'Banana' })
    const onUnhandled = (e: any) => { errors.push(String(e?.reason ?? e).slice(0, 160)) }
    process.on('unhandledRejection', onUnhandled)
    mount(defineComponent({
      setup: () => () => h(SelectRoot, { defaultValue: 'a', items: items.value }, () => [
        h(SelectTrigger, { 'aria-label': 'x' }, () => h(SelectValue, { 'data-testid': 'v', 'placeholder': 'pick' })),
        h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () => [
          h(SelectItem, { value: 'a' }, () => h(SelectItemText, () => 'Apple')),
          h(SelectItem, { value: 'b' }, () => h(SelectItemText, () => 'Banana')),
        ]))),
      ]),
    }), { attachTo: document.body })
    await flushPromises()
    items.value = { a: 'Pomme', b: 'Banane' }
    await flushPromises()
    await new Promise(r => setTimeout(r, 50))
    process.off('unhandledRejection', onUnhandled)
    warn.mockRestore()
    expect(errors).toEqual([])
    expect(document.querySelector('[data-testid=v]')!.textContent).toBe('Pomme')
  })
})
