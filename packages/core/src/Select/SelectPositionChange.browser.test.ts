import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { DialogContent, DialogRoot, DialogTitle } from '@/Dialog'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectScrollDownButton, SelectScrollUpButton, SelectTrigger, SelectValue, SelectViewport } from '.'

const fruits = ['Apple', 'Banana', 'Cherry', 'Grape', 'Lemon']

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  unmount = undefined
  document.body.innerHTML = ''
})

function mountSelect(defaultValue?: string, inDialog = false) {
  const position = ref<'item-aligned' | 'popper'>('item-aligned')
  const closeAutoFocus: string[] = []
  const wrapper = mount(defineComponent({
    setup: () => () => {
      const select = h(SelectRoot, { defaultValue }, () => [
        h(SelectTrigger, { 'data-testid': 'trigger', 'style': 'width: 160px; height: 32px; margin: 200px 100px' }, () => h(SelectValue, { placeholder: 'Pick' })),
        h(SelectPortal, () => h(SelectContent, {
          position: position.value,
          style: 'background: white',
          onCloseAutoFocus: () => closeAutoFocus.push(position.value),
        }, () => [
          h(SelectScrollUpButton, () => '^'),
          h(SelectViewport, () => fruits.map(value => h(SelectItem, { value, style: 'height: 24px' }, () => h(SelectItemText, () => value)))),
          h(SelectScrollDownButton, () => 'v'),
        ])),
      ])
      return inDialog
        ? h(DialogRoot, { defaultOpen: true }, () => h(DialogContent, { 'aria-describedby': undefined }, () => [h(DialogTitle, () => 'Dialog'), h('button', 'Inside'), select]))
        : select
    },
  }), { attachTo: document.body })
  unmount = () => wrapper.unmount()
  return { position, closeAutoFocus }
}

const listbox = () => document.querySelector<HTMLElement>('[role=listbox]')
const focused = () => document.activeElement?.textContent
const isPopper = () => listbox()?.parentElement?.hasAttribute('data-reka-popper-content-wrapper')

// Changing `position` while open renders the content again in the other mode.
// It stays open and usable: positioned the new way, focus back on the selected
// (or first) item as on an open, keyboard navigation working, and nothing
// handed to the trigger until it really closes.
describe('given a Select whose position changes while open', () => {
  for (const [label, defaultValue, start, next] of [['with a value', 'Cherry', 'Cherry', 'Grape'], ['without a value', undefined, 'Apple', 'Banana']] as const) {
    it(`keeps the content open and usable both ways, ${label}`, async () => {
      const { position, closeAutoFocus } = mountSelect(defaultValue)
      await userEvent.click(document.querySelector<HTMLElement>('[data-testid=trigger]')!)
      await expect.poll(focused).toBe(start)
      expect(isPopper()).toBe(false)

      position.value = 'popper'
      await nextTick()
      await expect.poll(isPopper).toBe(true)
      await expect.poll(() => listbox()?.getAttribute('data-side')).toBe('bottom')
      await expect.poll(focused).toBe(start)
      await userEvent.keyboard('{ArrowDown}')
      await expect.poll(focused).toBe(next)

      position.value = 'item-aligned'
      await nextTick()
      await expect.poll(isPopper).toBe(false)
      await expect.poll(() => listbox()!.parentElement!.style.left).not.toBe('')
      await expect.poll(focused).toBe(start)
      await userEvent.keyboard('{ArrowDown}')
      await expect.poll(focused).toBe(next)
      expect(closeAutoFocus).toEqual([])

      await userEvent.keyboard('{Escape}')
      await expect.poll(listbox).toBeNull()
      await expect.poll(() => document.activeElement?.getAttribute('data-testid')).toBe('trigger')
      expect(closeAutoFocus).toEqual(['item-aligned'])
    })
  }

  // The content's focus scope moves to the new element. Its old element's
  // cleanup must not take it off the scope stack afterwards: the Dialog's trap
  // would resume and pull focus out of the select.
  it('keeps the dialog\'s focus trap paused', async () => {
    const { position } = mountSelect('Cherry', true)
    // Focus moves inside the dialog first, so its trap has an element to pull
    // focus back to. Opened from the keyboard: the dialog's backdrop covers the
    // unstyled page.
    await new Promise(resolve => setTimeout(resolve, 50))
    document.querySelector<HTMLElement>('[data-testid=trigger]')!.focus()
    await userEvent.keyboard('{Enter}')
    await expect.poll(focused).toBe('Cherry')
    position.value = 'popper'
    await nextTick()
    await expect.poll(isPopper).toBe(true)
    await expect.poll(focused).toBe('Cherry')
    await new Promise(resolve => setTimeout(resolve, 50))
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(focused).toBe('Grape')
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(focused()).toBe('Grape')
  })
})
