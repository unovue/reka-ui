import type { RekaElementEvent } from '.'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createAlertDialogHandle } from '@/AlertDialog'
import { alertDialogElements, defineRekaElements, drawerElements } from '.'
import { cleanup, query, render, settle } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([alertDialogElements, drawerElements])
})
afterEach(cleanup)

const ALERT_DIALOG = `
  <button id="outside">Outside</button>
  <reka-alert-dialog-root>
    <reka-alert-dialog-trigger>Delete account</reka-alert-dialog-trigger>
    <reka-alert-dialog-portal>
      <reka-alert-dialog-overlay style="position: fixed; inset: 0; background: rgb(0 0 0 / 0.4)"></reka-alert-dialog-overlay>
      <reka-alert-dialog-content style="position: fixed; top: 100px; left: 100px; width: 300px; background: white">
        <reka-alert-dialog-title>Are you sure?</reka-alert-dialog-title>
        <reka-alert-dialog-description>This cannot be undone.</reka-alert-dialog-description>
        <reka-alert-dialog-cancel>Cancel</reka-alert-dialog-cancel>
        <reka-alert-dialog-action>Delete</reka-alert-dialog-action>
      </reka-alert-dialog-content>
    </reka-alert-dialog-portal>
  </reka-alert-dialog-root>
`

async function openAlertDialog() {
  render(ALERT_DIALOG)
  const trigger = query('reka-alert-dialog-trigger')
  await vi.waitFor(() => expect(trigger.getAttribute('aria-haspopup')).toBe('dialog'))
  await userEvent.click(trigger)
  const content = query('reka-alert-dialog-content')
  await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
  return { trigger, content }
}

describe('alert dialog elements', () => {
  it('is a labelled alert dialog that focuses Cancel, and traps focus', async () => {
    const { content } = await openAlertDialog()
    expect(content.getAttribute('role')).toBe('alertdialog')
    expect(document.getElementById(content.getAttribute('aria-labelledby')!)!.textContent).toBe('Are you sure?')
    expect(document.getElementById(content.getAttribute('aria-describedby')!)!.textContent).toBe('This cannot be undone.')
    expect(query('reka-alert-dialog-title').getAttribute('role')).toBe('heading')
    // The least destructive choice gets the focus.
    await vi.waitFor(() => expect(document.activeElement).toBe(query('reka-alert-dialog-cancel')))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(query('reka-alert-dialog-action'))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(query('reka-alert-dialog-cancel'))
  })

  it('does not close on an outside click, closes from Cancel and Action with the reasons', async () => {
    const { trigger, content } = await openAlertDialog()
    const details: unknown[] = []
    query('reka-alert-dialog-root').addEventListener('update-open', (event) => {
      const { value, details: change } = (event as RekaElementEvent<boolean, { reason: string }>).detail
      details.push([value, change.reason])
    })
    // A click on the page behind (it lands on the dialog's backdrop).
    const outside = query('#outside').getBoundingClientRect()
    const hit = document.elementFromPoint(outside.left + 2, outside.top + 2) as HTMLElement
    expect(query('#outside').contains(hit)).toBe(false)
    await userEvent.click(hit, { position: { x: 5, y: 5 } })
    await settle()
    expect(content.getAttribute('data-state')).toBe('open')

    await userEvent.click(query('reka-alert-dialog-cancel'))
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
    expect(document.activeElement).toBe(trigger)

    await userEvent.click(trigger)
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    await userEvent.click(query('reka-alert-dialog-action'))
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
    expect(details).toEqual([[false, 'close-press'], [true, 'trigger-press'], [false, 'close-press']])
  })

  it('closes on Escape, unless `escape-key-down` is prevented', async () => {
    const { content } = await openAlertDialog()
    const prevent = (event: Event) => event.preventDefault()
    content.addEventListener('escape-key-down', prevent)
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(content.getAttribute('data-state')).toBe('open')
    content.removeEventListener('escape-key-down', prevent)
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
  })

  it('opens from a detached trigger and imperatively through a handle', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(`
      <reka-alert-dialog-trigger id="detached">Delete</reka-alert-dialog-trigger>
      ${ALERT_DIALOG.replace('<reka-alert-dialog-trigger>Delete account</reka-alert-dialog-trigger>', '')}
    `)
    const handle = createAlertDialogHandle()
    const detached = query('#detached')
    ;(query('reka-alert-dialog-root') as HTMLElement & { handle: unknown }).handle = handle
    ;(detached as HTMLElement & { handle: unknown }).handle = handle
    await vi.waitFor(() => expect(detached.getAttribute('aria-haspopup')).toBe('dialog'))
    warn.mockRestore()

    const content = query('reka-alert-dialog-content')
    await userEvent.click(detached)
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    // The trigger's own (consumer) id is the one the handle knows.
    expect(detached.id).toBe('detached')
    expect(detached.getAttribute('aria-expanded')).toBe('true')
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
    expect(document.activeElement).toBe(detached)

    handle.open('detached')
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    expect(handle.isOpen).toBe(true)
    handle.close()
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
  })
})

const DRAWER = `
  <reka-drawer-root>
    <reka-drawer-trigger>Open drawer</reka-drawer-trigger>
    <reka-drawer-portal>
      <reka-drawer-backdrop style="position: fixed; inset: 0; background: rgb(0 0 0 / 0.4)"></reka-drawer-backdrop>
      <reka-drawer-popup style="position: fixed; left: 0; right: 0; bottom: 0; height: 300px; z-index: 1; background: white; transform: translateY(var(--drawer-swipe-movement-y, 0px))">
        <reka-drawer-grabber style="display: block; height: 24px"></reka-drawer-grabber>
        <reka-drawer-title>Settings</reka-drawer-title>
        <reka-drawer-description>Adjust your preferences.</reka-drawer-description>
        <input id="field" aria-label="Field">
        <reka-drawer-close>Done</reka-drawer-close>
      </reka-drawer-popup>
    </reka-drawer-portal>
  </reka-drawer-root>
`

async function openDrawer() {
  render(DRAWER)
  const trigger = query('reka-drawer-trigger')
  await vi.waitFor(() => expect(trigger.getAttribute('aria-haspopup')).toBe('dialog'))
  await userEvent.click(trigger)
  const popup = query('reka-drawer-popup')
  await vi.waitFor(() => expect(popup.getAttribute('data-state')).toBe('open'))
  return { trigger, popup }
}

/** A mouse drag down `el` by `dy` pixels, in steps (synthetic events: the gesture reads coordinates only). */
async function drag(el: HTMLElement, dy: number) {
  const box = el.getBoundingClientRect()
  const x = box.left + box.width / 2
  const y = box.top + 10
  const init = { bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, clientX: x }
  el.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientY: y, button: 0, buttons: 1 }))
  for (let step = 1; step <= 10; step++) {
    await new Promise(resolve => requestAnimationFrame(resolve))
    el.dispatchEvent(new PointerEvent('pointermove', { ...init, clientY: y + (dy * step) / 10, buttons: 1 }))
  }
  el.dispatchEvent(new PointerEvent('pointerup', { ...init, clientY: y + dy, button: 0, buttons: 0 }))
}

describe('drawer elements', () => {
  it('opens as a labelled modal dialog, and closes from the close button', async () => {
    const { trigger, popup } = await openDrawer()
    expect(popup.getAttribute('role')).toBe('dialog')
    expect(document.getElementById(popup.getAttribute('aria-labelledby')!)!.textContent).toBe('Settings')
    expect(document.getElementById(popup.getAttribute('aria-describedby')!)!.textContent).toBe('Adjust your preferences.')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(query('reka-drawer-backdrop').getAttribute('data-state')).toBe('open')
    // Portaled to the body.
    expect(query('reka-drawer-portal').parentElement).toBe(document.body)

    await userEvent.click(query('reka-drawer-close'))
    await vi.waitFor(() => expect(popup.hasAttribute('data-reka-unmounted')).toBe(true))
    expect(document.activeElement).toBe(trigger)
  })

  it('closes when swiped down past the threshold, with the `swipe` reason', async () => {
    const { popup } = await openDrawer()
    const reasons: unknown[] = []
    query('reka-drawer-root').addEventListener('update-open', (event) => {
      reasons.push((event as RekaElementEvent<boolean, { reason: string }>).detail.details.reason)
    })
    await drag(query('reka-drawer-grabber'), 250)
    await vi.waitFor(() => expect(popup.hasAttribute('data-reka-unmounted')).toBe(true))
    expect(reasons).toEqual(['swipe'])
  })

  it('settles back open after a short swipe, and a cancelled `before-update-open` keeps it open', async () => {
    const { popup } = await openDrawer()
    await drag(query('reka-drawer-grabber'), 20)
    await settle()
    expect(popup.getAttribute('data-state')).toBe('open')
    expect(popup.hasAttribute('data-swiping')).toBe(false)

    query('reka-drawer-root').addEventListener('before-update-open', event => event.preventDefault())
    await drag(query('reka-drawer-grabber'), 250)
    await settle()
    expect(popup.getAttribute('data-state')).toBe('open')
  })
})
