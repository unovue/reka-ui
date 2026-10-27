import type { Component } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { DialogContent, DialogPortal, DialogRoot, DialogTitle } from '@/Dialog'
import { DrawerContent, DrawerPortal, DrawerRoot, DrawerTitle } from '@/Drawer'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'

// A `forceMount`ed modal content that is closed (#3070 consumers) must keep no
// internal backdrop and no scroll lock. `useHideOthers` is a no-op under
// vitest (`MODE === 'test'`) and is gated on the same open state.

beforeAll(() => {
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

enableAutoUnmount(afterEach)

beforeEach(() => {
  document.body.innerHTML = ''
})

function hasBackdrop() {
  return document.querySelector('[data-reka-internal-backdrop]') !== null
}

function isScrollLocked() {
  return getComputedStyle(document.body).overflowY === 'hidden' || getComputedStyle(document.documentElement).overflowY === 'hidden'
}

async function settle() {
  await flushPromises()
  await new Promise(resolve => setTimeout(resolve, 20))
  await flushPromises()
}

const cases: Array<{ name: string, locks: boolean, render: (open: boolean, onUpdate: (value: boolean) => void) => ReturnType<typeof h> }> = [
  {
    name: 'Popover (modal)',
    locks: true,
    render: (open, onUpdate) => h(PopoverRoot as Component, { 'open': open, 'modal': true, 'onUpdate:open': onUpdate }, () => [
      h(PopoverTrigger, () => 'Open'),
      h(PopoverPortal, () => h(PopoverContent, { forceMount: true }, () => 'Content')),
    ]),
  },
  {
    name: 'DropdownMenu (modal)',
    locks: false,
    render: (open, onUpdate) => h(DropdownMenuRoot as Component, { 'open': open, 'onUpdate:open': onUpdate }, () => [
      h(DropdownMenuTrigger, () => 'Open'),
      h(DropdownMenuPortal, () => h(DropdownMenuContent, { forceMount: true }, () => h(DropdownMenuItem, () => 'Item'))),
    ]),
  },
  {
    name: 'Drawer (modal)',
    locks: true,
    render: (open, onUpdate) => h(DrawerRoot as Component, { 'open': open, 'onUpdate:open': onUpdate }, () => [
      h(DrawerPortal, () => h(DrawerContent, { forceMount: true }, () => h(DrawerTitle, () => 'Title'))),
    ]),
  },
]

describe('forceMount modal content', () => {
  for (const { name, locks, render } of cases) {
    it(`${name}: backdrop and scroll lock follow the open state, not the mount`, async () => {
      const open = ref(false)
      mount(defineComponent({
        setup: () => () => render(open.value, value => open.value = value),
      }), { attachTo: document.body })
      await settle()
      expect(hasBackdrop()).toBe(false)
      expect(isScrollLocked()).toBe(false)

      open.value = true
      await settle()
      expect(hasBackdrop()).toBe(true)
      if (locks)
        expect(isScrollLocked()).toBe(true)

      open.value = false
      await settle()
      expect(hasBackdrop()).toBe(false)
      expect(isScrollLocked()).toBe(false)
    })
  }
})

describe('force-mounted portal of a modal that starts open', () => {
  // The portal mounts its content right after it mounts itself on the app's
  // first render; the content still takes focus.
  it('moves focus to the first tabbable element', async () => {
    mount(defineComponent({
      setup: () => () => h('div', [
        h('button', 'Before'),
        h(DialogRoot, { defaultOpen: true }, () => h(DialogPortal, { forceMount: true }, () =>
          h(DialogContent, { 'aria-describedby': undefined }, () => [h(DialogTitle, () => 'Title'), h('input', { id: 'first' })]))),
      ]),
    }), { attachTo: document.body })
    await vi.waitFor(() => expect(document.activeElement?.id).toBe('first'))
  })
})
