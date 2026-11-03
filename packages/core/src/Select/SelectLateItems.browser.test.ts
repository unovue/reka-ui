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

function mountSelect(position: 'item-aligned' | 'popper', defaultValue?: string, withInput = false, initial: string[] = [], disabled = ref(false)) {
  const items = ref<string[]>(initial)
  const wrapper = mount(defineComponent({
    setup: () => () => h(SelectRoot, { defaultValue }, () => [
      h(SelectTrigger, { 'data-testid': 'trigger', 'style': 'width: 160px; height: 32px; margin: 200px 100px' }, () => h(SelectValue, { placeholder: 'Pick' })),
      h(SelectPortal, () => h(SelectContent, { position, style: 'background: white' }, () => [
        withInput ? h('input', { 'data-testid': 'search', 'aria-label': 'Search' }) : null,
        h(SelectViewport, () => items.value.map(value => h(SelectItem, { key: value, value, disabled: disabled.value, style: 'height: 24px' }, () => h(SelectItemText, () => value)))),
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

async function open() {
  await userEvent.click(document.querySelector<HTMLElement>('[data-testid=trigger]')!)
  await expect.poll(() => !!document.querySelector('[role=listbox]')).toBe(true)
  await wait(100)
}

// While open, focus that was lost (on the body or the content itself) goes to
// the selected item, else the first enabled one, as soon as one is available;
// a focus the content itself put on a fallback item moves to the selected item
// once it arrives.
describe('given an open Select whose items change', () => {
  for (const position of ['item-aligned', 'popper'] as const) {
    it(`moves focus to the selected item when it arrives in a later batch, ${position}`, async () => {
      const items = mountSelect(position, 'Lemon')
      await open()
      items.value = ['Apple', 'Banana']
      await expect.poll(focused).toBe('Apple')
      items.value = fruits
      await expect.poll(focused).toBe('Lemon')
      if (position === 'item-aligned') {
        // Placed against the selected item: it sits over the trigger.
        const trigger = document.querySelector<HTMLElement>('[data-testid=trigger]')!.getBoundingClientRect()
        const item = document.activeElement!.getBoundingClientRect()
        expect(Math.abs(item.top + item.height / 2 - (trigger.top + trigger.height / 2))).toBeLessThan(16)
      }
    })

    it(`leaves the fallback item when the user navigated back to it, ${position}`, async () => {
      const items = mountSelect(position, 'Lemon')
      await open()
      items.value = ['Apple', 'Banana']
      await expect.poll(focused).toBe('Apple')
      await userEvent.keyboard('{ArrowDown}')
      await expect.poll(focused).toBe('Banana')
      await userEvent.keyboard('{ArrowUp}')
      await expect.poll(focused).toBe('Apple')
      items.value = fruits
      await expect.poll(() => document.querySelectorAll('[role=option]').length).toBe(5)
      await wait(100)
      expect(focused()).toBe('Apple')
    })

    it(`focuses an item again when the list is replaced, or emptied and refilled, ${position}`, async () => {
      const items = mountSelect(position, 'Cherry', false, fruits)
      await open()
      await expect.poll(focused).toBe('Cherry')
      items.value = ['Kiwi', 'Mango']
      await expect.poll(focused).toBe('Kiwi')
      items.value = []
      await nextTick()
      items.value = fruits
      await expect.poll(focused).toBe('Cherry')
    })

    it(`focuses the first item once the disabled items are enabled, ${position}`, async () => {
      const disabled = ref(true)
      const items = mountSelect(position, undefined, false, fruits, disabled)
      await open()
      expect(items.value).toHaveLength(5)
      disabled.value = false
      await expect.poll(focused).toBe('Apple')
    })
  }
})

// The wrapper is placed again on the same element (a trigger resize here): a
// placement anchored at the bottom after one anchored at the top drops the
// earlier `top`, which would otherwise win over `bottom`.
describe('given an item-aligned Select placed again from the other edge', () => {
  it('keeps the selected item over the trigger', async () => {
    const top = ref(10)
    const width = ref(160)
    const wrapper = mount(defineComponent({
      setup: () => () => h(SelectRoot, { defaultValue: 'Lemon' }, () => [
        h(SelectTrigger, { 'data-testid': 'trigger', 'style': `position: fixed; left: 100px; top: ${top.value}px; width: ${width.value}px; height: 32px` }, () => h(SelectValue)),
        h(SelectPortal, () => h(SelectContent, { position: 'item-aligned', style: 'background: white' }, () =>
          h(SelectViewport, () => fruits.map(value => h(SelectItem, { value, style: 'height: 24px' }, () => h(SelectItemText, () => value)))))),
      ]),
    }), { attachTo: document.body })
    unmount = () => wrapper.unmount()
    const offset = () => {
      const trigger = document.querySelector<HTMLElement>('[data-testid=trigger]')!.getBoundingClientRect()
      const item = [...document.querySelectorAll<HTMLElement>('[role=option]')].find(option => option.textContent === 'Lemon')!.getBoundingClientRect()
      return Math.abs(item.top + item.height / 2 - (trigger.top + trigger.height / 2))
    }
    await userEvent.click(document.querySelector<HTMLElement>('[data-testid=trigger]')!)
    await expect.poll(focused).toBe('Lemon')
    await wait(100)
    // Near the top of the viewport, Lemon (last) cannot sit over the trigger
    // with the content anchored at the bottom: it is anchored at the top.
    // Moved down and resized, it is placed again, anchored at the bottom.
    top.value = 400
    width.value = 180
    await wait(200)
    expect(offset()).toBeLessThan(4)
  })
})
