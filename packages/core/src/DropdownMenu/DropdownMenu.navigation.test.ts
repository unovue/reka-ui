import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '.'

// Arrow keys walk the menu's collection (its cached order) instead of a
// selector query over the content: disabled items are still skipped, and the
// order follows the DOM.
describe('dropdownMenu arrow navigation', () => {
  it('skips disabled items and follows the rendered order', async () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    const wrapper = mount(defineComponent({
      setup: () => () => h(DropdownMenuRoot, { open: true, modal: false }, () => [
        h(DropdownMenuTrigger, null, () => 'Open'),
        h(DropdownMenuPortal, null, () => h(DropdownMenuContent, null, () => [
          h(DropdownMenuItem, { 'data-testid': 'a' }, () => 'A'),
          h(DropdownMenuItem, { 'data-testid': 'b', 'disabled': true }, () => 'B'),
          h(DropdownMenuItem, { 'data-testid': 'c' }, () => 'C'),
        ])),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    await nextTick()

    const a = document.querySelector<HTMLElement>('[data-testid=a]')!
    const c = document.querySelector<HTMLElement>('[data-testid=c]')!
    a.focus()
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
    await nextTick()
    expect(document.activeElement).toBe(c)

    c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }))
    await nextTick()
    expect(document.activeElement).toBe(a)
    wrapper.unmount()
  })

  // Base walked `:not([data-disabled])`: an item the consumer marks
  // `data-disabled="true"` is skipped too, not only `data-disabled=""`.
  it('skips an item the consumer marks data-disabled="true"', async () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    const wrapper = mount(defineComponent({
      setup: () => () => h(DropdownMenuRoot, { open: true, modal: false }, () => [
        h(DropdownMenuTrigger, null, () => 'Open'),
        h(DropdownMenuPortal, null, () => h(DropdownMenuContent, null, () => [
          h(DropdownMenuItem, { 'data-testid': 'a' }, () => 'A'),
          h(DropdownMenuItem, { 'data-testid': 'b', 'data-disabled': 'true' }, () => 'B'),
          h(DropdownMenuItem, { 'data-testid': 'c' }, () => 'C'),
        ])),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    await nextTick()
    const a = document.querySelector<HTMLElement>('[data-testid=a]')!
    const c = document.querySelector<HTMLElement>('[data-testid=c]')!
    a.focus()
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
    await nextTick()
    expect(document.activeElement).toBe(c)
    wrapper.unmount()
  })
})
