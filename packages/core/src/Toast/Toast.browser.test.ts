import type { ToastOpenChangeReason } from '.'
import type { ChangeEventDetails } from '@/shared'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
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
      }, () => h(ToastTitle, { 'data-testid': 'title' }, () => 'Swipe me')),
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
  const userSelect = target.style.getPropertyValue('user-select')
  target.dispatchEvent(new PointerEvent('pointerup', { ...init, clientX: x + dx, clientY: y }))
  return { moveX, state, userSelect }
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
    expect(during).toEqual({ moveX: '80px', state: 'move', userSelect: 'none' })
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
    expect(toast()!.style.getPropertyValue('user-select')).toBe('')
    expect(updates).toHaveLength(0)
  })

  it('snaps back when the swipe close is cancelled', async () => {
    const { updates, toast } = mountSwipeToast((_, details) => details.cancel())
    await expect.poll(() => toast()).toBeTruthy()

    await swipe(toast()!, 80)
    expect(toast()!.getAttribute('data-swipe')).toBe('cancel')
    expect(toast()!.style.getPropertyValue('--reka-toast-swipe-end-x')).toBe('')
    expect(toast()!.getAttribute('data-state')).toBe('open')
    expect(toast()!.style.getPropertyValue('user-select')).toBe('')
    expect(updates).toHaveLength(0)
  })
})

describe('given a swipeable Toast, with the real mouse', () => {
  const selected = () => document.getSelection()?.toString() ?? ''

  it('selects its text with a triple-click', async () => {
    const { updates, toast } = mountSwipeToast()
    await expect.poll(() => toast()).toBeTruthy()
    document.getSelection()?.removeAllRanges()

    await userEvent.tripleClick(document.querySelector<HTMLElement>('[data-testid="title"]')!)

    expect(selected()).toContain('Swipe me')
    expect(updates).toHaveLength(0)
  })

  it('selects its text with a drag that does not become a swipe', async () => {
    const { updates, toast } = mountSwipeToast()
    await expect.poll(() => toast()).toBeTruthy()
    document.getSelection()?.removeAllRanges()
    const title = document.querySelector<HTMLElement>('[data-testid="title"]')!
    const range = document.createRange()
    range.selectNodeContents(title)
    const text = range.getBoundingClientRect()
    const y = text.top + text.height / 2

    // Leftwards, against the right swipe: a text selection, not a swipe.
    await commands.mouseDrag(text.right - 1, y, text.left + 1, y, 10)

    expect(selected().length).toBeGreaterThan(0)
    expect(toast()!.hasAttribute('data-swipe')).toBe(false)
    expect(updates).toHaveLength(0)
  })

  // The text the drag had selected when the button was released, before the toast closes.
  async function dragAcrossTitle(dx: number) {
    const title = document.querySelector<HTMLElement>('[data-testid="title"]')!
    const range = document.createRange()
    range.selectNodeContents(title)
    const text = range.getBoundingClientRect()
    const y = text.top + text.height / 2
    let selectedOnRelease: string | undefined
    const read = () => { selectedOnRelease = selected() }
    window.addEventListener('pointerup', read, { capture: true, once: true })
    // 2px steps: the swipe starts once the pointer has moved past its 2px buffer.
    await commands.mouseDrag(text.left + 1, y, text.left + 1 + dx, y, dx / 2)
    return selectedOnRelease
  }

  it('closes on a swipe without selecting its text', async () => {
    const { updates, toast } = mountSwipeToast()
    await expect.poll(() => toast()).toBeTruthy()
    document.getSelection()?.removeAllRanges()

    expect(await dragAcrossTitle(80)).toBe('')

    await expect.poll(() => updates.map(d => d.reason)).toEqual(['swipe'])
  })

  it('snaps back on a short swipe without selecting its text, and stays selectable', async () => {
    const { updates, toast } = mountSwipeToast()
    await expect.poll(() => toast()).toBeTruthy()
    document.getSelection()?.removeAllRanges()

    expect(await dragAcrossTitle(30)).toBe('')

    expect(toast()!.getAttribute('data-swipe')).toBe('cancel')
    expect(toast()!.style.getPropertyValue('user-select')).toBe('')
    expect(updates).toHaveLength(0)
    await userEvent.tripleClick(document.querySelector<HTMLElement>('[data-testid="title"]')!)
    expect(selected()).toContain('Swipe me')
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

describe('given a Toast with a native radio group, in a real browser', () => {
  // A native radio group is one tab stop, so Tab leaves it for the next element.
  it.each([null, 'b'])('tabs out of a radio group in a toast (checked: %s)', async (checked) => {
    const Fixture = defineComponent({
      setup() {
        return () => h(ToastProvider, { duration: 60_000 }, () => [
          h(ToastRoot, { open: true }, () => [
            h(ToastTitle, () => 'Pick one'),
            ...['a', 'b', 'c'].map(value => h('input', {
              'type': 'radio',
              'name': 'size',
              value,
              'checked': value === checked,
              'aria-label': value,
              'data-testid': value,
            })),
            h(ToastAction, { 'altText': 'Apply', 'data-testid': 'apply' }, () => 'Apply'),
          ]),
          h(ToastViewport),
        ])
      },
    })
    mount(Fixture, { attachTo: document.body })
    await expect.poll(() => document.querySelector('[data-testid="a"]')).toBeTruthy()

    // Start from the group's tab stop: Tab from an unchecked radio stops at the checked one first.
    document.querySelector<HTMLElement>(`[data-testid="${checked ?? 'a'}"]`)!.focus()
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(document.querySelector('[data-testid="apply"]'))
  })

  // A hidden radio can't take focus, so it is not the tab stop of its group.
  it('tabs to the first visible radio of a group whose first radio is hidden', async () => {
    const Fixture = defineComponent({
      setup() {
        return () => h(ToastProvider, { duration: 60_000 }, () => [
          h(ToastRoot, { open: true }, () => [
            h(ToastTitle, () => 'Pick one'),
            h(ToastAction, { 'altText': 'Undo', 'data-testid': 'undo' }, () => 'Undo'),
            ...['a', 'b', 'c'].map(value => h('input', {
              'type': 'radio',
              'name': 'size',
              value,
              'style': value === 'a' ? 'display: none' : undefined,
              'aria-label': value,
              'data-testid': value,
            })),
            h(ToastAction, { 'altText': 'Apply', 'data-testid': 'apply' }, () => 'Apply'),
          ]),
          h(ToastViewport),
        ])
      },
    })
    mount(Fixture, { attachTo: document.body })
    await expect.poll(() => document.querySelector('[data-testid="b"]')).toBeTruthy()

    document.querySelector<HTMLElement>('[data-testid="undo"]')!.focus()
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(document.querySelector('[data-testid="b"]'))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(document.querySelector('[data-testid="apply"]'))
  })
})

function mountPausableToast(providerProps: { disableHoverPause?: boolean, disableWindowBlurPause?: boolean } = {}) {
  const open = ref(true)
  const Fixture = defineComponent({
    setup() {
      return () => h(ToastProvider, { duration: DURATION, ...providerProps }, () => [
        h(ToastRoot, {
          'open': open.value,
          'onUpdate:open': (value: boolean) => { open.value = value },
          'style': 'height: 40px',
          'data-testid': 'toast',
        }, () => [
          h(ToastDescription, () => 'Saved'),
          h(ToastAction, { 'altText': 'Undo', 'data-action': '' }, () => 'Undo'),
        ]),
        h('button', { 'data-testid': 'outside', 'style': 'margin-top: 300px' }, 'outside'),
        h(ToastViewport, { style: 'position: fixed; top: 0; right: 0; width: 300px; list-style: none; margin: 0; padding: 0' }),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  return { open }
}

describe('toast pause options, in a real browser', () => {
  afterEach(async () => {
    window.dispatchEvent(new Event('focus'))
    await userEvent.unhover(document.body)
  })

  it('pauses while hovered by default', async () => {
    const { open } = mountPausableToast()
    await expect.poll(() => el('[data-testid="toast"]')).toBeTruthy()
    await userEvent.hover(el('[data-testid="toast"]')!)
    await sleep(DURATION * 3)
    expect(open.value).toBe(true)
  })

  it('closes on time while hovered when the hover pause is off', async () => {
    const { open } = mountPausableToast({ disableHoverPause: true })
    await expect.poll(() => el('[data-testid="toast"]')).toBeTruthy()
    await userEvent.hover(el('[data-testid="toast"]')!)
    await expect.poll(() => open.value, { timeout: DURATION * 4 }).toBe(false)
  })

  it('stays open while its action is focused with both pauses off, and closes once focus leaves', async () => {
    const { open } = mountPausableToast({ disableHoverPause: true, disableWindowBlurPause: true })
    await expect.poll(() => el('[data-action]')).toBeTruthy()
    el('[data-action]')!.focus()
    await userEvent.hover(el('[data-testid="toast"]')!)
    await sleep(DURATION * 3)
    expect(open.value).toBe(true)
    expect(document.activeElement).toBe(el('[data-action]'))

    el('[data-testid="outside"]')!.focus()
    await expect.poll(() => open.value, { timeout: DURATION * 4 }).toBe(false)
  })

  it('stays open during a swipe when the hover pause is off, and closes after the swipe is let go', async () => {
    const { open } = mountPausableToast({ disableHoverPause: true })
    await expect.poll(() => el('[data-testid="toast"]')).toBeTruthy()
    const toast = el('[data-testid="toast"]')!
    const { left, top } = toast.getBoundingClientRect()
    const init = { bubbles: true, pointerId: 1, pointerType: 'touch', button: 0, isPrimary: true, clientY: top + 20 }
    toast.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientX: left + 20 }))
    toast.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: left + 40 }))
    await sleep(DURATION * 3)
    expect(open.value).toBe(true)

    // Let go before the swipe threshold, so only the timer can close the toast.
    toast.dispatchEvent(new PointerEvent('pointerup', { ...init, clientX: left + 40 }))
    await expect.poll(() => open.value, { timeout: DURATION * 4 }).toBe(false)
  })

  it('pauses while the window is blurred by default', async () => {
    const { open } = mountPausableToast()
    await expect.poll(() => el('[data-testid="toast"]')).toBeTruthy()
    window.dispatchEvent(new Event('blur'))
    await sleep(DURATION * 3)
    expect(open.value).toBe(true)
  })

  it('closes on time while the window is blurred when the blur pause is off', async () => {
    const { open } = mountPausableToast({ disableWindowBlurPause: true })
    await expect.poll(() => el('[data-testid="toast"]')).toBeTruthy()
    window.dispatchEvent(new Event('blur'))
    await expect.poll(() => open.value, { timeout: DURATION * 4 }).toBe(false)
  })
})
