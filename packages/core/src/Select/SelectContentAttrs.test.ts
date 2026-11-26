import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

beforeAll(() => {
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

describe('selectContent attributes', () => {
  it.each(['popper', 'item-aligned'] as const)('does not render its own props as DOM attributes (position=%s)', async (position) => {
    document.body.innerHTML = ''
    const wrapper = mount(() => h(SelectRoot, { defaultOpen: true }, () => [
      h(SelectTrigger, null, () => h(SelectValue)),
      h(SelectPortal, null, () => h(SelectContent, { position, bodyLock: false, disableOutsidePointerEvents: false, loop: true }, () =>
        h(SelectViewport, null, () => ['a', 'b'].map(value => h(SelectItem, { value }, () => h(SelectItemText, null, () => value)))))),
    ]), { attachTo: document.body })
    await nextTick()
    await nextTick()
    const content = document.querySelector('[role=listbox]')!
    expect(content).toBeTruthy()
    for (const el of [content, content.parentElement!]) {
      for (const name of ['position', 'bodylock', 'body-lock', 'disableoutsidepointerevents', 'disable-outside-pointer-events', 'loop'])
        expect(el.hasAttribute(name), `${name} on ${el.tagName}`).toBe(false)
    }
    wrapper.unmount()
  })
})
