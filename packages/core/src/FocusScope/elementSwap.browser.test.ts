import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { DialogContent, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
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

// The content's element is replaced while the scope stays mounted (its `as`
// changed). That is neither an open nor a close: no auto-focus event fires (so
// a consumer that prevents the open auto-focus cannot leave focus on the body
// inside the open trap), focus does not go back to the trigger, and the focus
// the swap lost lands on the first tabbable in the new element. A later real
// close fires `closeAutoFocus` once.
describe('given a trapped focus scope whose element changes while open', () => {
  for (const kind of ['dialog', 'popover'] as const) {
    for (const prevent of [false, true]) {
      it(`moves the lost focus to the first tabbable without auto-focus events, ${kind}${prevent ? ', open auto-focus prevented' : ''}`, async () => {
        const as = ref('div')
        const open = ref(true)
        const events: string[] = []
        const listeners = {
          'onOpenAutoFocus': (event: Event) => {
            events.push('open')
            if (prevent)
              event.preventDefault()
          },
          'onCloseAutoFocus': () => events.push('close'),
          'onUpdate:open': (value: boolean) => (open.value = value),
        }
        const focusTrace: string[] = []
        const onFocusIn = (event: FocusEvent) => focusTrace.push((event.target as HTMLElement).dataset.testid ?? '')
        const content = () => [h('button', { 'data-testid': 'first' }, 'First'), h('button', { 'data-testid': 'second' }, 'Second')]
        const wrapper = mount(defineComponent({
          setup: () => () => kind === 'dialog'
            ? h(DialogRoot, { 'open': open.value, 'onUpdate:open': listeners['onUpdate:open'] }, () => [
                h(DialogTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
                h(DialogPortal, () => h(DialogContent, { 'data-testid': 'content', 'as': as.value, 'aria-describedby': undefined, 'onOpenAutoFocus': listeners.onOpenAutoFocus, 'onCloseAutoFocus': listeners.onCloseAutoFocus }, () => [h(DialogTitle, () => 'Title'), ...content()])),
              ])
            : h(PopoverRoot, { 'open': open.value, 'onUpdate:open': listeners['onUpdate:open'] }, () => [
                h(PopoverTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
                h(PopoverPortal, () => h(PopoverContent, { 'data-testid': 'content', 'as': as.value, 'trapFocus': true, 'onOpenAutoFocus': listeners.onOpenAutoFocus, 'onCloseAutoFocus': listeners.onCloseAutoFocus }, content)),
              ]),
        }), { attachTo: document.body })
        unmount = () => wrapper.unmount()
        await expect.poll(() => !!$('content')).toBe(true)
        await wait(50)
        expect(events).toEqual(['open'])
        $('second')!.focus()
        await wait(50)

        document.addEventListener('focusin', onFocusIn, true)
        as.value = 'section'
        await expect.poll(() => $('content')?.tagName).toBe('SECTION')
        await expect.poll(() => document.activeElement?.getAttribute('data-testid')).toBe('first')
        await wait(50)
        document.removeEventListener('focusin', onFocusIn, true)
        expect(document.activeElement?.getAttribute('data-testid')).toBe('first')
        expect(focusTrace).not.toContain('trigger')
        expect(events).toEqual(['open'])

        await userEvent.keyboard('{Escape}')
        await expect.poll(() => $('content')).toBeNull()
        await wait(50)
        expect(events).toEqual(['open', 'close'])
        expect(document.activeElement?.getAttribute('data-testid')).toBe('trigger')
      })
    }
  }
})
