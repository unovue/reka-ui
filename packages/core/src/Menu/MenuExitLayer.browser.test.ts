import type { VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxViewport } from '@/Combobox'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from '@/ContextMenu'
import { DialogContent, DialogPortal, DialogRoot, DialogTitle } from '@/Dialog'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/DropdownMenu'
import { MenubarContent, MenubarItem, MenubarMenu, MenubarPortal, MenubarRoot, MenubarTrigger } from '@/Menubar'

// The exit animation is paused, so that a closing content stays in its exit until the test ends.
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
const exiting = (id: string) => get(id)?.getAnimations().some(animation => animation.playState === 'paused') ?? false
const afterFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

function mountInDialog(child: () => VNode) {
  const dialogOpen = ref(true)
  mount(defineComponent({
    setup: () => () => h(DialogRoot, { 'open': dialogOpen.value, 'onUpdate:open': (value: boolean) => dialogOpen.value = value }, () =>
      h(DialogPortal, null, () => h(DialogContent, { 'data-testid': 'dialog', 'aria-describedby': undefined }, () => [
        h(DialogTitle, null, () => 'Title'),
        child(),
      ]))),
  }), { attachTo: document.body })
  return dialogOpen
}

const content = { 'data-testid': 'child', 'class': 'exit' }

describe('given a menu inside a Dialog, during its exit, in a real browser', () => {
  it.each([true, false])('a DropdownMenu hands Escape back to the dialog (unmountOnHide: %s)', async (unmountOnHide) => {
    const open = ref(false)
    const dialogOpen = mountInDialog(() => h(DropdownMenuRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => open.value = value, unmountOnHide }, () => [
      h(DropdownMenuTrigger, null, () => 'Open'),
      h(DropdownMenuPortal, null, () => h(DropdownMenuContent, content, () => h(DropdownMenuItem, null, () => 'Item'))),
    ]))
    await expect.poll(() => get('dialog')?.contains(document.activeElement)).toBe(true)
    open.value = true
    await expect.poll(() => get('child')?.contains(document.activeElement)).toBe(true)

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('child')).toBe(true)
    await userEvent.keyboard('{Escape}')
    expect(dialogOpen.value).toBe(false)
  })

  it('a DropdownMenu with an open submenu hands Escape back to the dialog', async () => {
    const open = ref(false)
    const subOpen = ref(false)
    const dialogOpen = mountInDialog(() => h(DropdownMenuRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => open.value = value }, () => [
      h(DropdownMenuTrigger, null, () => 'Open'),
      h(DropdownMenuPortal, null, () => h(DropdownMenuContent, content, () => [
        h(DropdownMenuItem, null, () => 'Item'),
        h(DropdownMenuSub, { 'open': subOpen.value, 'onUpdate:open': (value: boolean) => subOpen.value = value }, () => [
          h(DropdownMenuSubTrigger, null, () => 'More'),
          h(DropdownMenuPortal, null, () => h(DropdownMenuSubContent, { 'data-testid': 'sub', 'class': 'exit' }, () => h(DropdownMenuItem, null, () => 'Sub item'))),
        ]),
      ])),
    ]))
    await expect.poll(() => get('dialog')?.contains(document.activeElement)).toBe(true)
    open.value = true
    await expect.poll(() => get('child')?.contains(document.activeElement)).toBe(true)
    subOpen.value = true
    await expect.poll(() => get('sub')).not.toBeNull()
    get('sub')!.focus()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('sub') && exiting('child')).toBe(true)
    await userEvent.keyboard('{Escape}')
    expect(dialogOpen.value).toBe(false)
  })

  it('a ContextMenu hands Escape back to the dialog', async () => {
    const dialogOpen = mountInDialog(() => h(ContextMenuRoot, null, () => [
      h(ContextMenuTrigger, { 'data-testid': 'area', 'style': 'display: block; height: 40px' }, () => 'Area'),
      h(ContextMenuPortal, null, () => h(ContextMenuContent, content, () => h(ContextMenuItem, null, () => 'Item'))),
    ]))
    await expect.poll(() => get('dialog')?.contains(document.activeElement)).toBe(true)
    await userEvent.click(get('area')!, { button: 'right' })
    await expect.poll(() => get('child')?.contains(document.activeElement)).toBe(true)

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('child')).toBe(true)
    await userEvent.keyboard('{Escape}')
    expect(dialogOpen.value).toBe(false)
  })

  it('a Menubar menu hands Escape back to the dialog', async () => {
    const value = ref('')
    const dialogOpen = mountInDialog(() => h(MenubarRoot, { 'modelValue': value.value, 'onUpdate:modelValue': (next: string) => value.value = next }, () =>
      h(MenubarMenu, { value: 'file' }, () => [
        h(MenubarTrigger, null, () => 'File'),
        h(MenubarPortal, null, () => h(MenubarContent, content, () => h(MenubarItem, null, () => 'Item'))),
      ])))
    await expect.poll(() => get('dialog')?.contains(document.activeElement)).toBe(true)
    value.value = 'file'
    await expect.poll(() => get('child')).not.toBeNull()
    get('child')!.focus()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('child')).toBe(true)
    await userEvent.keyboard('{Escape}')
    expect(dialogOpen.value).toBe(false)
  })

  it('a Combobox hands Escape back to the dialog', async () => {
    const open = ref(false)
    const dialogOpen = mountInDialog(() => h(ComboboxRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => open.value = value }, () => [
      h(ComboboxAnchor, null, () => h(ComboboxInput, { 'data-testid': 'input', 'aria-label': 'pick' })),
      h(ComboboxPortal, null, () => h(ComboboxContent, content, () =>
        h(ComboboxViewport, null, () => h(ComboboxItem, { value: 'a' }, () => 'a')))),
    ]))
    await expect.poll(() => get('dialog')?.contains(document.activeElement)).toBe(true)
    get('input')!.focus()
    open.value = true
    await expect.poll(() => get('child')).not.toBeNull()
    await afterFrames()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('child')).toBe(true)
    await userEvent.keyboard('{Escape}')
    expect(dialogOpen.value).toBe(false)
  })

  it('a modal DropdownMenu stops hiding the dialog from assistive technology once it closes', async () => {
    vi.stubEnv('MODE', 'development') // Exercise useHideOthers in the browser.
    onTestFinished(() => vi.unstubAllEnvs())
    const open = ref(false)
    mountInDialog(() => h(DropdownMenuRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => open.value = value }, () => [
      h(DropdownMenuTrigger, null, () => 'Open'),
      h(DropdownMenuPortal, null, () => h(DropdownMenuContent, content, () => h(DropdownMenuItem, null, () => 'Item'))),
    ]))
    await expect.poll(() => get('dialog')?.contains(document.activeElement)).toBe(true)
    open.value = true
    await expect.poll(() => get('dialog')?.closest('[aria-hidden="true"]')).not.toBeNull()

    open.value = false
    await expect.poll(() => exiting('child')).toBe(true)
    expect(get('dialog')!.closest('[aria-hidden="true"]')).toBeNull()
  })
})

describe('given a closed menu inside a Dialog, in a real browser', () => {
  // A force-mounted content keeps its layer while closed, as before.
  it('a force-mounted DropdownMenu still takes Escape', async () => {
    const dialogOpen = mountInDialog(() => h(DropdownMenuRoot, null, () => [
      h(DropdownMenuTrigger, null, () => 'Open'),
      h(DropdownMenuPortal, null, () => h(DropdownMenuContent, { 'data-testid': 'child', 'forceMount': true }, () => h(DropdownMenuItem, null, () => 'Item'))),
    ]))
    await nextTick()
    await afterFrames()
    expect(get('child')).not.toBeNull()

    await userEvent.keyboard('{Escape}')
    expect(dialogOpen.value).toBe(true)
  })

  it('a kept-mounted DropdownMenu leaves Escape to the dialog', async () => {
    const dialogOpen = mountInDialog(() => h(DropdownMenuRoot, { unmountOnHide: false }, () => [
      h(DropdownMenuTrigger, null, () => 'Open'),
      h(DropdownMenuPortal, null, () => h(DropdownMenuContent, { 'data-testid': 'child' }, () => h(DropdownMenuItem, null, () => 'Item'))),
    ]))
    await expect.poll(() => get('dialog')?.contains(document.activeElement)).toBe(true)
    await afterFrames()

    await userEvent.keyboard('{Escape}')
    expect(dialogOpen.value).toBe(false)
  })
})
