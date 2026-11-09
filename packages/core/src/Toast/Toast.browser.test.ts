import type { ToastOpenChangeReason } from '.'
import type { ChangeEventDetails } from '@/shared'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { DialogContent, DialogPortal, DialogRoot, DialogTitle } from '@/Dialog'
import { hoverForMousePointerId } from '@/test/browser'
import { ToastAction, ToastClose, ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from '.'

function mountToast() {
  const open = ref(true)
  const Fixture = defineComponent({
    setup() {
      return () => h(ToastProvider, { duration: 60_000 }, () => [
        h(ToastRoot, {
          'open': open.value,
          'onUpdate:open': (value: boolean) => { open.value = value },
        }, () => [
          h(ToastTitle, { class: 'title' }, () => 'Saved'),
          h(ToastDescription, { class: 'description' }, () => 'Your changes are saved'),
          h(ToastAction, { altText: 'Undo the change' }, () => 'Undo'),
          h(ToastClose, { 'aria-label': 'Close' }, () => '×'),
        ]),
        h(ToastViewport, { 'data-testid': 'viewport' }),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  return { open }
}

describe('given a Toast, in a real browser', () => {
  it('keeps class on the title and description', async () => {
    mountToast()

    await expect.poll(() => document.querySelector('.title')?.textContent).toBe('Saved')
    expect(document.querySelector('.description')?.textContent).toBe('Your changes are saved')
  })

  it.each(['Undo', '×'])('moves focus to the viewport when "%s" is activated by keyboard', async (label) => {
    const { open } = mountToast()
    await expect.poll(() => document.querySelector('[data-testid="viewport"] button')).toBeTruthy()
    const viewport = document.querySelector<HTMLElement>('[data-testid="viewport"]')!
    const button = [...viewport.querySelectorAll('button')].find(el => el.textContent === label)!

    button.focus()
    await userEvent.keyboard('{Enter}')

    await expect.poll(() => open.value).toBe(false)
    expect(document.activeElement).toBe(viewport)
  })
})

type Details = ChangeEventDetails<ToastOpenChangeReason>

function mountSwipeToast(onBeforeUpdate?: (value: boolean, details: Details) => void) {
  const updates: Details[] = []
  mount(defineComponent({
    setup: () => () => h(ToastProvider, { duration: 60_000, swipeDirection: 'right', swipeThreshold: 50 }, () => [
      h(ToastRoot, {
        'data-testid': 'toast',
        'style': 'width: 200px; height: 60px',
        'onBeforeUpdate:open': (value: boolean, details: Details) => onBeforeUpdate?.(value, details),
        'onUpdate:open': (_: boolean, details: Details) => updates.push(details),
      }, () => h(ToastTitle, () => 'Swipe me')),
      h(ToastViewport),
    ]),
  }), { attachTo: document.body })
  return { updates, toast: () => document.querySelector<HTMLElement>('[data-testid="toast"]') }
}

// Real `PointerEvent`s with pointer capture: jsdom has neither. The swipe captures
// the pointer, so the events carry the real mouse's id.
async function swipe(target: HTMLElement, dx: number) {
  const pointerId = await hoverForMousePointerId(target)
  const rect = target.getBoundingClientRect()
  const x = rect.left + 10
  const y = rect.top + 10
  const init = { bubbles: true, cancelable: true, pointerId, pointerType: 'mouse', isPrimary: true, button: 0 }
  target.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientX: x, clientY: y }))
  target.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: x + 5, clientY: y }))
  target.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: x + dx, clientY: y }))
  const moveX = target.style.getPropertyValue('--reka-toast-swipe-move-x')
  const state = target.getAttribute('data-swipe')
  target.dispatchEvent(new PointerEvent('pointerup', { ...init, clientX: x + dx, clientY: y }))
  return { moveX, state }
}

describe('given a Toast with a short duration, in a real browser', () => {
  it('pauses while the pointer is over the viewport and times out after it leaves', async () => {
    const events: string[] = []
    const updates: Details[] = []
    mount(defineComponent({
      setup: () => () => h('div', [
        h('button', { 'data-testid': 'outside' }, 'Outside'),
        h(ToastProvider, { duration: 1000 }, () => [
          h(ToastRoot, {
            'data-testid': 'toast',
            'onPause': () => events.push('pause'),
            'onResume': () => events.push('resume'),
            'onUpdate:open': (_: boolean, details: Details) => updates.push(details),
          }, () => h(ToastTitle, () => 'Hover me')),
          h(ToastViewport),
        ]),
      ]),
    }), { attachTo: document.body })
    await expect.poll(() => document.querySelector('[data-testid="toast"]')).toBeTruthy()

    await userEvent.hover(document.querySelector<HTMLElement>('[data-testid="toast"]')!)
    await expect.poll(() => events).toEqual(['pause'])
    // Paused well past the duration: still open.
    await new Promise(resolve => setTimeout(resolve, 1300))
    expect(updates).toHaveLength(0)

    await userEvent.hover(document.querySelector<HTMLElement>('[data-testid="outside"]')!)
    await expect.poll(() => updates.map(d => d.reason), { timeout: 3000 }).toEqual(['timeout'])
    expect(events).toEqual(['pause', 'resume'])
  })
})

describe('given a swipeable Toast, in a real browser', () => {
  it('sets the move variables while swiping and closes past the threshold with reason swipe', async () => {
    const { updates, toast } = mountSwipeToast()
    await expect.poll(() => toast()).toBeTruthy()

    const during = await swipe(toast()!, 80)
    expect(during).toEqual({ moveX: '80px', state: 'move' })
    expect(toast()!.getAttribute('data-swipe')).toBe('end')
    expect(toast()!.style.getPropertyValue('--reka-toast-swipe-end-x')).toBe('80px')
    expect(updates.map(d => d.reason)).toEqual(['swipe'])
    expect(updates[0].event).toBeInstanceOf(PointerEvent)
  })

  it('snaps back below the threshold without closing', async () => {
    const { updates, toast } = mountSwipeToast()
    await expect.poll(() => toast()).toBeTruthy()

    await swipe(toast()!, 30)
    expect(toast()!.getAttribute('data-swipe')).toBe('cancel')
    expect(updates).toHaveLength(0)
  })

  it('snaps back when the swipe close is cancelled', async () => {
    const { updates, toast } = mountSwipeToast((_, details) => details.cancel())
    await expect.poll(() => toast()).toBeTruthy()

    await swipe(toast()!, 80)
    expect(toast()!.getAttribute('data-swipe')).toBe('cancel')
    expect(toast()!.style.getPropertyValue('--reka-toast-swipe-end-x')).toBe('')
    expect(toast()!.getAttribute('data-state')).toBe('open')
    expect(updates).toHaveLength(0)
  })
})

const DURATION = 300

function mountToasts({ inDialog = false } = {}) {
  const open = ref<Record<string, boolean>>({})
  const Fixture = defineComponent({
    setup() {
      const toasts = () => Object.keys(open.value).map(name => h(ToastRoot, {
        'key': name,
        'open': open.value[name],
        'onUpdate:open': (value: boolean) => { open.value[name] = value },
        'style': 'height: 40px',
      }, () => [
        h(ToastDescription, () => name),
        h(ToastAction, { 'altText': 'Undo', 'data-action': name }, () => 'Undo'),
        h(ToastClose, { 'data-close': name }, () => 'x'),
      ]))
      const content = () => [
        h('button', { 'data-testid': 'outside', 'style': 'margin-top: 300px' }, 'outside'),
        h(ToastViewport, { style: 'position: fixed; top: 0; right: 0; width: 300px; list-style: none; margin: 0' }),
      ]
      // A modal layer mounts a backdrop below itself, so the content is positioned to stay
      // above it, as real dialog content is.
      const dialogContentProps = { 'aria-describedby': undefined, 'style': 'position: relative' }
      return () => h(ToastProvider, { duration: DURATION }, () => [
        ...toasts(),
        inDialog
          ? h(DialogRoot, { open: true }, () => h(DialogPortal, () => h(DialogContent, dialogContentProps, () => [h(DialogTitle, () => 'Dialog'), ...content()])))
          : content(),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  return { open }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const el = (selector: string) => document.querySelector<HTMLElement>(selector)

describe('toast close pause, in a real browser', () => {
  it.each(['action', 'close'])('starts the next toast timer after the last toast is closed by its %s button (#3154)', async (kind) => {
    const { open } = mountToasts()
    open.value.a = true
    await expect.poll(() => el(`[data-${kind}="a"]`)).toBeTruthy()
    await userEvent.click(el(`[data-${kind}="a"]`)!)
    await expect.poll(() => el('li')).toBeNull()
    await userEvent.hover(el('[data-testid="outside"]')!)

    open.value.b = true
    await expect.poll(() => open.value.b, { timeout: DURATION * 6 }).toBe(false)
  })

  it('resumes the other toast once the pointer leaves after one of two is closed by its action (#3154 variant)', async () => {
    const { open } = mountToasts()
    open.value.a = true
    open.value.b = true
    await expect.poll(() => el('[data-action="a"]')).toBeTruthy()
    await userEvent.click(el('[data-action="a"]')!)
    await expect.poll(() => el('[data-action="a"]')).toBeNull()
    await userEvent.hover(el('[data-testid="outside"]')!)
    await sleep(50)
    await expect.poll(() => open.value.b, { timeout: DURATION * 6 }).toBe(false)
  })

  it('starts the next toast timer after toasts are closed inside a modal dialog (#1795)', async () => {
    const { open } = mountToasts({ inDialog: true })
    open.value.a = true
    open.value.b = true
    await expect.poll(() => el('[data-close="b"]')).toBeTruthy()
    await userEvent.click(el('[data-close="b"]')!)
    await expect.poll(() => el('[data-close="b"]')).toBeNull()
    await userEvent.click(el('[data-close="a"]')!)
    await expect.poll(() => el('li')).toBeNull()
    await userEvent.hover(el('[data-testid="outside"]')!)

    open.value.c = true
    await expect.poll(() => open.value.c, { timeout: DURATION * 6 }).toBe(false)
  })
})
