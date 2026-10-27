import type { DialogHandle } from '.'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogRoot, AlertDialogTitle, AlertDialogTrigger, createAlertDialogHandle } from '@/AlertDialog'
import { createDialogHandle, DialogClose, DialogContent, DialogDescription, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '.'

interface Item { name: string }

function mountDetached(options: { modal?: boolean } = {}) {
  const handle: DialogHandle<Item> = createDialogHandle<Item>()
  const showSecond = ref(true)
  const onBeforeUpdate = vi.fn()
  const onUpdate = vi.fn()
  const wrapper = mount(defineComponent({
    setup: () => () => h('div', [
      h('nav', [
        h(DialogTrigger, { id: 'trigger-a', handle, payload: { name: 'Ada' } }, () => 'Edit Ada'),
        showSecond.value ? h(DialogTrigger, { id: 'trigger-b', handle, payload: { name: 'Bob' } }, () => 'Edit Bob') : null,
      ]),
      h(DialogRoot, {
        handle,
        'modal': options.modal ?? true,
        'onBeforeUpdate:open': onBeforeUpdate,
        'onUpdate:open': onUpdate,
      }, {
        default: ({ payload }: { payload?: Item }) => h(DialogPortal, null, () => h(DialogContent, null, () => [
          h(DialogTitle, null, () => `Edit ${payload?.name ?? 'nobody'}`),
          h(DialogDescription, null, () => 'Change the details.'),
          h(DialogClose, null, () => 'Close'),
        ])),
      }),
    ]),
  }), { attachTo: document.body })
  return {
    wrapper,
    handle,
    showSecond,
    onBeforeUpdate,
    onUpdate,
    byId: (id: string) => document.getElementById(id) as HTMLElement,
    content: () => document.querySelector<HTMLElement>('[role="dialog"]'),
    title: () => document.querySelector('[role="dialog"] h2')?.textContent,
  }
}

describe('dialog detached triggers (#2826)', () => {
  let cleanup: (() => void) | undefined
  afterEach(() => {
    cleanup?.()
    cleanup = undefined
    document.body.innerHTML = ''
  })

  it('renders the payload of the trigger that opened it', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()

    t.byId('trigger-b').click()
    await nextTick()
    expect(t.title()).toBe('Edit Bob')
    expect(t.byId('trigger-b').getAttribute('aria-expanded')).toBe('true')
    expect(t.byId('trigger-b').getAttribute('aria-controls')).toBe(t.content()!.id)
    expect(t.byId('trigger-a').getAttribute('aria-expanded')).toBe('false')
    expect(t.byId('trigger-a').getAttribute('aria-controls')).toBeNull()
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('returns focus to the invoking trigger on close', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()

    t.byId('trigger-b').focus()
    t.byId('trigger-b').click()
    await nextTick()
    await vi.waitFor(() => expect(t.content()).not.toBeNull())
    document.querySelector<HTMLElement>('[role="dialog"] button')!.click()
    await vi.waitFor(() => expect(t.content()).toBeNull())
    await vi.waitFor(() => expect(document.activeElement).toBe(t.byId('trigger-b')))
  })

  it('opens imperatively for a trigger, with a payload, and closes; all cancellable', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()

    t.onBeforeUpdate.mockImplementationOnce((_value, details) => details.cancel())
    t.handle.open('trigger-a')
    await nextTick()
    expect(t.handle.isOpen).toBe(false)
    expect(t.onUpdate).not.toHaveBeenCalled()

    t.handle.open('trigger-a')
    await nextTick()
    expect(t.title()).toBe('Edit Ada')
    expect(t.onUpdate).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'imperative-action', trigger: t.byId('trigger-a') }))

    // Re-targeting while open reports another `update:open(true)`.
    t.handle.openWithPayload({ name: 'Cy' })
    await nextTick()
    expect(t.title()).toBe('Edit Cy')
    expect(t.byId('trigger-a').getAttribute('aria-expanded')).toBe('false')

    t.handle.close()
    await vi.waitFor(() => expect(t.content()).toBeNull())
    expect(t.onUpdate).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'imperative-action' }))
  })

  it('opens without a trigger for an unknown id, with a dev warning', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    t.handle.open('missing')
    await nextTick()
    expect(t.handle.isOpen).toBe(true)
    expect(t.title()).toBe('Edit nobody')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no trigger with id "missing"'))
    warn.mockRestore()
  })

  it('keeps the payload when the active trigger unmounts while open', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()

    t.byId('trigger-b').click()
    await nextTick()
    t.showSecond.value = false
    await nextTick()
    expect(t.content()).not.toBeNull()
    expect(t.title()).toBe('Edit Bob')
    t.handle.close()
    await vi.waitFor(() => expect(t.content()).toBeNull())
  })

  it('a non-modal dialog moves to another trigger without closing', async () => {
    const t = mountDetached({ modal: false })
    cleanup = () => t.wrapper.unmount()

    t.byId('trigger-a').click()
    await nextTick()
    const content = t.content()
    t.onUpdate.mockClear()

    t.byId('trigger-b').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    t.byId('trigger-b').click()
    await nextTick()
    expect(t.content()).toBe(content)
    expect(t.title()).toBe('Edit Bob')
    expect(t.onUpdate).toHaveBeenCalledTimes(1)
    expect(t.onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press' }))
  })
})

describe('alertDialog detached triggers (#2826)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('opens from a detached trigger with its payload, and passes axe', async () => {
    const handle = createAlertDialogHandle<Item>()
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', [
        h(AlertDialogTrigger, { id: 'delete-ada', handle, payload: { name: 'Ada' } }, () => 'Delete Ada'),
        h(AlertDialogRoot, { handle }, {
          default: ({ payload }: { payload?: Item }) => h(AlertDialogContent, null, () => [
            h(AlertDialogTitle, null, () => `Delete ${payload?.name}?`),
            h(AlertDialogDescription, null, () => 'This cannot be undone.'),
            h(AlertDialogCancel, null, () => 'Cancel'),
            h(AlertDialogAction, null, () => 'Delete'),
          ]),
        }),
      ]),
    }), { attachTo: document.body })

    const trigger = document.getElementById('delete-ada')!
    trigger.click()
    await nextTick()
    expect(document.querySelector('[role="alertdialog"] h2')?.textContent).toBe('Delete Ada?')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(await axe(document.body)).toHaveNoViolations()

    handle.close()
    await vi.waitFor(() => expect(document.querySelector('[role="alertdialog"]')).toBeNull())
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    wrapper.unmount()
  })
})
