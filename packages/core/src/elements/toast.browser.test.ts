import type { RekaElementEvent } from '.'
import type { ToastObject } from '@/Toast'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createToastManager } from '@/Toast'
import { defineRekaElements, toastElements } from '.'
import { cleanup, query, render, settle } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([toastElements])
})
afterEach(cleanup)

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const STYLES = `<style>
  reka-toast-viewport { display: flex; flex-direction: column; position: fixed; bottom: 0; right: 0; width: 320px; margin: 0; padding: 16px; list-style: none }
  reka-toast-root { display: block; padding: 12px; background: white; border: 1px solid; transform: translateX(var(--reka-toast-swipe-move-x, 0)) }
</style>`

function toast(attrs = '') {
  return `
    <reka-toast-root ${attrs}>
      <reka-toast-title>Scheduled: Catch up</reka-toast-title>
      <reka-toast-description>Friday at 5pm</reka-toast-description>
      <reka-toast-action alt-text="Undo the schedule">Undo</reka-toast-action>
      <reka-toast-close aria-label="Close">×</reka-toast-close>
    </reka-toast-root>`
}

function provider(children: string, attrs = '') {
  return `${STYLES}
    <button id="before">Before</button>
    <reka-toast-provider ${attrs}>
      ${children}
      <reka-toast-viewport></reka-toast-viewport>
    </reka-toast-provider>`
}

type Reasons = unknown[]
function trackClose(root: HTMLElement): Reasons {
  const reasons: Reasons = []
  root.addEventListener('update-open', (event) => {
    const { value, details } = (event as RekaElementEvent<boolean, { reason: string }>).detail
    reasons.push([value, details.reason])
  })
  return reasons
}

/** A mouse drag on `el` by `dx` pixels (synthetic events: the gesture reads coordinates only). */
async function drag(el: HTMLElement, dx: number) {
  const box = el.getBoundingClientRect()
  const y = box.top + box.height / 2
  const x = box.left + 10
  const init = { bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, clientY: y }
  el.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientX: x, button: 0, buttons: 1 }))
  for (let step = 1; step <= 5; step++) {
    await new Promise(resolve => requestAnimationFrame(resolve))
    el.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: x + (dx * step) / 5, buttons: 1 }))
  }
  el.dispatchEvent(new PointerEvent('pointerup', { ...init, clientX: x + dx, button: 0, buttons: 0 }))
}

describe('toast elements', () => {
  it('renders a toast into the labelled viewport, and announces it', async () => {
    render(provider(toast('duration="100000"')))
    const viewport = query('reka-toast-viewport')
    const root = query('reka-toast-root')
    await vi.waitFor(() => expect(root.getAttribute('data-state')).toBe('open'))
    // The toast moved into the viewport, a list in a labelled region.
    expect(viewport.contains(root)).toBe(true)
    expect(viewport.getAttribute('role')).toBe('list')
    expect(root.getAttribute('role')).toBe('listitem')
    const region = viewport.closest('[role=region]')!
    expect(region.getAttribute('aria-label')).toBe('Notifications (F8)')
    // The announcement is a live region in the document, where the toast was declared.
    await vi.waitFor(() => expect(document.querySelector('[role=alert]')?.textContent).toContain('Scheduled: Catch up'))
    const alert = document.querySelector('[role=alert]')!
    expect(alert.getAttribute('aria-live')).toBe('assertive')
    expect(query('reka-toast-provider').contains(alert)).toBe(true)
    expect(query('reka-toast-action').getAttribute('role')).toBe('button')
  })

  it('closes after its duration with the `timeout` reason, and pauses while hovered', async () => {
    render(provider(toast('duration="1000"')))
    const root = query('reka-toast-root')
    const reasons = trackClose(root)
    const paused = vi.fn()
    root.addEventListener('pause', paused)
    await vi.waitFor(() => expect(root.getAttribute('data-state')).toBe('open'))

    await userEvent.hover(root)
    await vi.waitFor(() => expect(paused).toHaveBeenCalled())
    // Longer than the duration: still open while paused.
    await wait(1200)
    expect(root.getAttribute('data-state')).toBe('open')

    const resumed = vi.fn()
    root.addEventListener('resume', resumed)
    await userEvent.hover(query('#before'))
    await vi.waitFor(() => expect(resumed).toHaveBeenCalled())
    await vi.waitFor(() => expect(reasons).toEqual([[false, 'timeout']]), { timeout: 3000 })
    await vi.waitFor(() => expect(root.hasAttribute('data-reka-unmounted')).toBe(true))
  })

  it('closes from the close button and the action, with their reasons', async () => {
    render(provider(`${toast('duration="100000" data-test="a"')}${toast('duration="100000" data-test="b"')}`))
    const [a, b] = [query('[data-test=a]'), query('[data-test=b]')]
    await vi.waitFor(() => expect(b.getAttribute('data-state')).toBe('open'))
    const reasonsA = trackClose(a)
    const reasonsB = trackClose(b)
    await userEvent.click(a.querySelector('reka-toast-close')!)
    await vi.waitFor(() => expect(reasonsA).toEqual([[false, 'close-press']]))
    await userEvent.click(b.querySelector('reka-toast-action')!)
    await vi.waitFor(() => expect(reasonsB).toEqual([[false, 'action-press']]))
  })

  it('closes on a swipe past the threshold, with the swipe events', async () => {
    render(provider(toast('duration="100000"'), 'swipe-threshold="40"'))
    const root = query('reka-toast-root')
    await vi.waitFor(() => expect(root.getAttribute('data-state')).toBe('open'))
    const reasons = trackClose(root)
    const events: string[] = []
    for (const type of ['swipe-start', 'swipe-move', 'swipe-cancel', 'swipe-end'])
      root.addEventListener(type, () => events.push(type))

    // Too short: snaps back.
    await drag(root, 20)
    await settle()
    expect(events).toContain('swipe-cancel')
    expect(root.getAttribute('data-state')).toBe('open')

    events.length = 0
    await drag(root, 120)
    await vi.waitFor(() => expect(reasons).toEqual([[false, 'swipe']]))
    expect(events[0]).toBe('swipe-start')
    expect(events).toContain('swipe-move')
    expect(events.at(-1)).toBe('swipe-end')
  })

  it('moves focus to the viewport with the F8 hotkey and closes the focused toast on Escape', async () => {
    render(provider(toast('duration="100000"')))
    const root = query('reka-toast-root')
    await vi.waitFor(() => expect(root.getAttribute('data-state')).toBe('open'))
    const reasons = trackClose(root)
    query('#before').focus()
    await userEvent.keyboard('{F8}')
    await vi.waitFor(() => expect(document.activeElement).toBe(query('reka-toast-viewport')))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(root)
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(reasons).toEqual([[false, 'escape-key']]))
  })

  it('renders the toasts of an imperative manager from `update-toasts`', async () => {
    render(provider(''))
    const providerEl = query<HTMLElement & { toastManager: unknown }>('reka-toast-provider')
    const manager = createToastManager()
    // Added before the provider subscribes: kept until it does.
    manager.add({ title: 'Saved', description: 'Your file was saved.', duration: 100000 })
    const lists: ToastObject[][] = []
    const roots = new Map<string, HTMLElement & { toast: ToastObject }>()
    providerEl.addEventListener('update-toasts', (event) => {
      const toasts = (event as RekaElementEvent<ToastObject[]>).detail.value
      lists.push(toasts)
      // Render one toast root per toast, keyed by id.
      for (const item of toasts) {
        let el = roots.get(item.id)
        if (!el) {
          el = document.createElement('reka-toast-root') as HTMLElement & { toast: ToastObject }
          el.innerHTML = `<reka-toast-title>${item.title}</reka-toast-title><reka-toast-description>${item.description}</reka-toast-description>`
          roots.set(item.id, el)
          providerEl.prepend(el)
        }
        el.toast = item
      }
      for (const [id, el] of roots) {
        if (!toasts.some(item => item.id === id)) {
          el.remove()
          roots.delete(id)
        }
      }
    })
    providerEl.toastManager = manager
    await vi.waitFor(() => expect(lists.at(-1)?.map(item => item.title)).toEqual(['Saved']))
    const [first] = roots.values()
    await vi.waitFor(() => expect(first.getAttribute('data-state')).toBe('open'))
    expect(query('reka-toast-viewport').contains(first)).toBe(true)

    const id = manager.add({ title: 'Deleted', description: 'One item.', status: 'success', duration: 100000 })
    await vi.waitFor(() => expect(lists.at(-1)?.map(item => item.title)).toEqual(['Deleted', 'Saved']))
    const second = roots.get(id)!
    await vi.waitFor(() => expect(second.getAttribute('data-status')).toBe('success'))

    // Closing through the manager closes the toast, which then leaves the list.
    const closed = vi.fn()
    second.addEventListener('update-open', closed)
    manager.close(id)
    await vi.waitFor(() => expect(closed).toHaveBeenCalled())
    await vi.waitFor(() => expect(lists.at(-1)?.map(item => item.title)).toEqual(['Saved']))
    expect(second.isConnected).toBe(false)
  })
})
