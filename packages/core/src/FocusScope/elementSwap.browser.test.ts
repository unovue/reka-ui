import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { DialogContent, DialogRoot, DialogTitle } from '@/Dialog'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  unmount = undefined
  document.body.innerHTML = ''
})

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const $ = (id: string) => document.querySelector<HTMLElement>(`[data-testid=${id}]`)
const inDialog = () => !!document.activeElement?.closest('[data-testid=dialog]')

// An as-child content whose child is swapped (here by `key`) while open moves
// the trap to the new element. Swapped while a nested popover paused it, the
// trap did not record the focus moving into the new child and still
// remembered an element of the old, detached one as the last focused inside:
// recalling focus there focused nothing, so focus could leave the dialog. The
// trap falls back to its container.
describe('given a trapped focus scope whose as-child element is swapped while open', () => {
  it('keeps focus trapped in the new element', async () => {
    const which = ref<'a' | 'b'>('a')
    const wrapper = mount(defineComponent({
      setup: () => () => [
        h('button', { 'data-testid': 'outside' }, 'Outside'),
        h(DialogRoot, { defaultOpen: true }, () => h(DialogContent, { 'asChild': true, 'aria-describedby': undefined }, () =>
          h(which.value === 'a' ? 'div' : 'section', { 'key': which.value, 'data-testid': 'dialog', 'style': 'position: fixed; z-index: 10; inset: 40px; background: white' }, [
            h(DialogTitle, () => 'Title'),
            h(PopoverRoot, () => [
              h(PopoverTrigger, { 'data-testid': 'popover-trigger' }, () => 'Popover'),
              h(PopoverPortal, () => h(PopoverContent, { 'data-testid': 'popover', 'trapFocus': true, 'style': 'z-index: 20; background: white' }, () => h('button', 'In popover'))),
            ]),
          ]))),
      ],
    }), { attachTo: document.body })
    unmount = () => wrapper.unmount()
    await expect.poll(inDialog).toBe(true)
    await userEvent.click($('popover-trigger')!)
    await expect.poll(() => !!$('popover')).toBe(true)

    which.value = 'b'
    await nextTick()
    await expect.poll(() => $('dialog')?.tagName).toBe('SECTION')
    // The swap remounts the popover's root with the child: it closes.
    await expect.poll(() => $('popover')).toBeNull()
    await wait(50)
    expect($('dialog')).not.toBeNull()

    $('outside')!.focus()
    await expect.poll(inDialog).toBe(true)
  })
})
