import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

const fruits = ['Apple', 'Banana', 'Cherry', 'Grape', 'Lemon']

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  unmount = undefined
  document.body.innerHTML = ''
})

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const focused = () => document.activeElement?.textContent

function mountSelect(position: 'item-aligned' | 'popper', defaultValue?: string, withInput = false) {
  const items = ref<string[]>([])
  const wrapper = mount(defineComponent({
    setup: () => () => h(SelectRoot, { defaultValue }, () => [
      h(SelectTrigger, { 'data-testid': 'trigger', 'style': 'width: 160px; height: 32px; margin: 200px 100px' }, () => h(SelectValue, { placeholder: 'Pick' })),
      h(SelectPortal, () => h(SelectContent, { position, style: 'background: white' }, () => [
        withInput ? h('input', { 'data-testid': 'search', 'aria-label': 'Search' }) : null,
        h(SelectViewport, () => items.value.map(value => h(SelectItem, { value, style: 'height: 24px' }, () => h(SelectItemText, () => value)))),
      ])),
    ]),
  }), { attachTo: document.body })
  unmount = () => wrapper.unmount()
  return items
}

// Items that register only after the content opened (loaded on open) are
// focused as on an open once they arrive and the content is positioned.
describe('given a Select whose items arrive after it opened', () => {
  for (const position of ['item-aligned', 'popper'] as const) {
    for (const [label, defaultValue, start, next] of [['with a value', 'Cherry', 'Cherry', 'Grape'], ['without a value', undefined, 'Apple', 'Banana']] as const) {
      it(`focuses the ${label === 'with a value' ? 'selected' : 'first'} item, ${position}`, async () => {
        const items = mountSelect(position, defaultValue)
        await userEvent.click(document.querySelector<HTMLElement>('[data-testid=trigger]')!)
        await expect.poll(() => !!document.querySelector('[role=listbox]')).toBe(true)
        await wait(100)
        items.value = fruits
        await nextTick()
        await expect.poll(focused).toBe(start)
        await userEvent.keyboard('{ArrowDown}')
        await expect.poll(focused).toBe(next)
      })
    }

    it(`leaves a focus the user moved inside the content, ${position}`, async () => {
      const items = mountSelect(position, 'Cherry', true)
      await userEvent.click(document.querySelector<HTMLElement>('[data-testid=trigger]')!)
      await expect.poll(() => !!document.querySelector('[role=listbox]')).toBe(true)
      await wait(100)
      document.querySelector<HTMLElement>('[data-testid=search]')!.focus()
      items.value = fruits
      await nextTick()
      await expect.poll(() => document.querySelectorAll('[role=option]').length).toBe(5)
      await wait(100)
      expect(document.activeElement?.getAttribute('data-testid')).toBe('search')
    })
  }
})
