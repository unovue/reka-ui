import { render } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, shallowRef } from 'vue'
import { DialogContent, DialogDescription, DialogPortal, DialogRoot, DialogTitle } from '@/Dialog'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'

// A consumer attr changing on an open content must not reach the layer's or the
// trap's effects. The wrappers took `present` and `trapped` as props, so only a
// change of that value re-ran them. Re-running the outside listener's effect
// disarms it for a macrotask and drops a pending touch dismissal; re-running the
// trap's discards its observer's pending records.

const attr = shallowRef('a')
const settle = () => vi.advanceTimersByTimeAsync(20)

const parts = {
  Popover: () => h(PopoverRoot, { defaultOpen: true }, () => [
    h(PopoverTrigger, () => 'open'),
    h(PopoverPortal, () => h(PopoverContent, { 'data-attr': attr.value, 'data-test': 'content' }, () => 'body')),
  ]),
  DropdownMenu: () => h(DropdownMenuRoot, { defaultOpen: true, modal: false }, () => [
    h(DropdownMenuTrigger, () => 'open'),
    h(DropdownMenuPortal, () => h(DropdownMenuContent, { 'data-attr': attr.value, 'data-test': 'content' }, () => h(DropdownMenuItem, () => 'item'))),
  ]),
}

async function mountOpen(part: () => ReturnType<typeof h>) {
  attr.value = 'a'
  render(defineComponent({ setup: () => () => [h('button', { id: 'outside' }, 'outside'), part()] }))
  await settle()
  await settle()
  expect(document.querySelector('[data-test=content]')).not.toBeNull()
}

const outside = () => document.querySelector('#outside') as HTMLElement
const isOpen = () => document.querySelector('[data-test=content]')?.getAttribute('data-state') === 'open'

beforeEach(() => {
  // The outside listeners arm a macrotask after mount: drive it.
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe.each(Object.entries(parts))('%s: a consumer attr changes while open', (_, part) => {
  it('stays armed: an outside press right after it dismisses', async () => {
    await mountOpen(part)
    attr.value = 'b'
    await nextTick()
    expect(document.querySelector('[data-test=content]')?.getAttribute('data-attr')).toBe('b')

    // In the same macrotask as the change: a re-registered listener is not armed yet.
    outside().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await settle()
    expect(isOpen()).toBe(false)
  })

  it('keeps a pending touch dismissal', async () => {
    await mountOpen(part)
    outside().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }))
    expect(isOpen()).toBe(true)

    attr.value = 'b'
    await nextTick()
    outside().dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await settle()
    expect(isOpen()).toBe(false)
  })
})

describe('dialog: a consumer attr changes while open', () => {
  it('keeps the focus trap\'s listeners and observer', async () => {
    attr.value = 'a'
    render(defineComponent({
      setup: () => () => h(DialogRoot, { defaultOpen: true }, () => h(DialogPortal, () => h(DialogContent, { 'data-attr': attr.value, 'data-test': 'content' }, () => [
        h(DialogTitle, () => 'title'),
        h(DialogDescription, () => 'description'),
        h('button', 'inside'),
      ]))),
    }))
    await settle()
    await settle()
    const remove = vi.spyOn(document, 'removeEventListener')
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')

    attr.value = 'b'
    await nextTick()
    expect(document.querySelector('[data-test=content]')?.getAttribute('data-attr')).toBe('b')
    expect(remove.mock.calls.filter(([type]) => type === 'focusout')).toEqual([])
    expect(disconnect).not.toHaveBeenCalled()
  })
})
