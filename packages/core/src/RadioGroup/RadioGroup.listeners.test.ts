import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { RadioGroupItem, RadioGroupRoot } from '..'

function mountGroups(groups: number, items: number) {
  return mount(defineComponent({
    setup: () => () => Array.from({ length: groups }, (_, g) =>
      h(RadioGroupRoot, { key: g }, () => Array.from({ length: items }, (_, i) =>
        h(RadioGroupItem, { 'value': `${g}-${i}`, 'data-testid': `radio-${g}-${i}` })))),
  }), { attachTo: document.body })
}

describe('radioGroup window listeners', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('adds one pair of window key listeners for the page, not one per item', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const wrapper = mountGroups(2, 10)
    const keyListeners = (spy: typeof add) => spy.mock.calls.filter(([type]) => type === 'keydown' || type === 'keyup').length
    expect(keyListeners(add)).toBe(2)

    wrapper.unmount()
    expect(keyListeners(remove)).toBe(2)
  })

  it('still checks the radio an arrow key moves focus to', async () => {
    const wrapper = mountGroups(1, 3)
    const first = wrapper.get<HTMLElement>('[data-testid=radio-0-0]').element
    const second = wrapper.get<HTMLElement>('[data-testid=radio-0-1]').element
    first.focus()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    second.focus()
    await new Promise(resolve => setTimeout(resolve))
    await nextTick()
    expect(second.getAttribute('aria-checked')).toBe('true')

    // A focus without an arrow key held does not check.
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }))
    const third = wrapper.get<HTMLElement>('[data-testid=radio-0-2]').element
    third.focus()
    await new Promise(resolve => setTimeout(resolve))
    await nextTick()
    expect(third.getAttribute('aria-checked')).toBe('false')
    wrapper.unmount()
  })
})
