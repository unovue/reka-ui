import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { DialogContent, DialogPortal, DialogRoot, DialogTitle } from '@/Dialog'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '.'

// The exit animation is paused, so that the content stays in its exit until the test ends.
const STYLES = `
  @keyframes out { from { opacity: 1 } to { opacity: 0 } }
  .exit[data-state="closed"] { animation: out 1s linear paused; }
`
let sheet: HTMLStyleElement
beforeEach(() => {
  sheet = document.createElement('style')
  sheet.textContent = STYLES
  document.head.append(sheet)
})
afterEach(() => sheet.remove())

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const exiting = (id: string) => get(id)?.getAnimations().some(a => a.playState === 'paused') ?? false

describe('given a Popover inside a Dialog, during its exit, in a real browser', () => {
  it.each([true, false])('hands Escape back to the dialog (unmountOnHide: %s)', async (unmountOnHide) => {
    const dialogOpen = ref(true)
    const childOpen = ref(false)
    const onChildOpen = (value: boolean) => childOpen.value = value
    const child = () => h(PopoverRoot, { 'open': childOpen.value, 'onUpdate:open': onChildOpen, unmountOnHide }, () => [
      h(PopoverTrigger, null, () => 'Open'),
      h(PopoverPortal, null, () => h(PopoverContent, { 'data-testid': 'child', 'class': 'exit' }, () => h('button', 'In'))),
    ])
    mount(defineComponent({
      setup: () => () => h(DialogRoot, { 'open': dialogOpen.value, 'onUpdate:open': (value: boolean) => dialogOpen.value = value }, () =>
        h(DialogPortal, null, () => h(DialogContent, { 'data-testid': 'dialog', 'aria-describedby': undefined }, () => [h(DialogTitle, null, () => 'Title'), child()]))),
    }), { attachTo: document.body })
    await expect.poll(() => get('dialog')?.contains(document.activeElement)).toBe(true)
    childOpen.value = true
    await expect.poll(() => get('child')?.contains(document.activeElement)).toBe(true)

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('child')).toBe(true)
    await userEvent.keyboard('{Escape}')
    expect(dialogOpen.value).toBe(false)
  })

  it('stops hiding the dialog from assistive technology once a modal popover closes', async () => {
    vi.stubEnv('MODE', 'development') // Exercise useHideOthers in the browser.
    onTestFinished(() => vi.unstubAllEnvs())
    const childOpen = ref(true)
    mount(defineComponent({
      setup: () => () => h(DialogRoot, { open: true }, () =>
        h(DialogPortal, null, () => h(DialogContent, { 'data-testid': 'dialog', 'aria-describedby': undefined }, () => [
          h(DialogTitle, null, () => 'Title'),
          h(PopoverRoot, { 'open': childOpen.value, 'onUpdate:open': (value: boolean) => childOpen.value = value, 'modal': true }, () => [
            h(PopoverTrigger, null, () => 'Open'),
            h(PopoverPortal, null, () => h(PopoverContent, { 'data-testid': 'child', 'class': 'exit' }, () => h('button', 'In'))),
          ]),
        ]))),
    }), { attachTo: document.body })
    await expect.poll(() => get('child')?.contains(document.activeElement)).toBe(true)
    await expect.poll(() => get('dialog')?.closest('[aria-hidden="true"]')).not.toBeNull()

    childOpen.value = false
    await expect.poll(() => exiting('child')).toBe(true)
    expect(get('dialog')!.closest('[aria-hidden="true"]')).toBeNull()
  })
})
