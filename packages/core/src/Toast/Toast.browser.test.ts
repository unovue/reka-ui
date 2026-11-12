import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { DialogContent, DialogPortal, DialogRoot, DialogTitle } from '@/Dialog'
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

// The toasts below count down in real time, and one `userEvent` action can take longer
// than a short toast lives when the machine is busy. So a toast that a test still has to
// act on gets `HOLD`, and only a toast that is left to close on its own gets `DURATION`.
const DURATION = 300
const HOLD = 60_000
// An upper bound for a toast to close on its own, not a margin a test has to fit in.
const CLOSES = { timeout: 5000 }

function mountToasts({ inDialog = false } = {}) {
  const open = ref<Record<string, boolean>>({})
  const durations = ref<Record<string, number>>({})
  const events = ref<Record<string, string[]>>({})
  const Fixture = defineComponent({
    setup() {
      const toasts = () => Object.keys(open.value).map(name => h(ToastRoot, {
        'key': name,
        'open': open.value[name],
        'duration': durations.value[name],
        'onUpdate:open': (value: boolean) => { open.value[name] = value },
        'onPause': () => events.value[name].push('pause'),
        'onResume': () => events.value[name].push('resume'),
        'style': 'height: 40px',
        'data-toast': name,
      }, () => [
        h(ToastDescription, () => name),
        h(ToastAction, { 'altText': 'Undo', 'data-action': name }, () => 'Undo'),
        h(ToastClose, { 'data-close': name }, () => 'x'),
      ]))
      const content = () => [
        h('button', { 'data-testid': 'outside', 'style': 'margin-top: 300px' }, 'outside'),
        h(ToastViewport, { style: 'position: fixed; top: 0; right: 0; width: 300px; list-style: none; margin: 0' }),
      ]
      return () => h(ToastProvider, () => [
        ...toasts(),
        inDialog
          ? h(DialogRoot, { open: true }, () => h(DialogPortal, () => h(DialogContent, { 'aria-describedby': undefined }, () => [h(DialogTitle, () => 'Dialog'), ...content()])))
          : content(),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })

  function show(name: string, duration: number) {
    durations.value[name] = duration
    events.value[name] = []
    open.value[name] = true
  }
  return { open, durations, events, show }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const el = (selector: string) => document.querySelector<HTMLElement>(selector)

describe('toast close pause, in a real browser', () => {
  it.each(['action', 'close'])('starts the next toast timer after the last toast is closed by its %s button (#3154)', async (kind) => {
    const { open, show } = mountToasts()
    show('a', HOLD)
    await expect.poll(() => el(`[data-${kind}="a"]`)).toBeTruthy()
    await userEvent.click(el(`[data-${kind}="a"]`)!)
    await expect.poll(() => el('li')).toBeNull()
    await userEvent.hover(el('[data-testid="outside"]')!)

    show('b', DURATION)
    await expect.poll(() => open.value.b, CLOSES).toBe(false)
  })

  // No event tells the viewport that a toast went away under the pointer: it stops
  // listening with its last toast, and the hover pause has to be released right there.
  it('starts the next toast timer after the last toast is closed from code while hovered', async () => {
    const { open, events, show } = mountToasts()
    // The pause is only released while the document has focus, as it does for someone using the page.
    el('[data-testid="outside"]')!.focus()
    show('a', HOLD)
    await expect.poll(() => el('[data-toast="a"]')).toBeTruthy()
    await userEvent.hover(el('[data-toast="a"]')!)
    await expect.poll(() => events.value.a).toEqual(['pause'])

    open.value.a = false
    await expect.poll(() => el('li')).toBeNull()
    // Off the viewport, so the next toast is not paused by the pointer resting where it shows up.
    await userEvent.hover(el('[data-testid="outside"]')!)

    show('b', DURATION)
    await expect.poll(() => open.value.b, CLOSES).toBe(false)
  })

  it('resumes the other toast once the pointer leaves after one of two is closed by its action (#3154 variant)', async () => {
    const { open, durations, events, show } = mountToasts()
    show('a', HOLD)
    show('b', HOLD)
    await expect.poll(() => el('[data-action="a"]')).toBeTruthy()
    await userEvent.click(el('[data-action="a"]')!)
    await expect.poll(() => el('[data-action="a"]')).toBeNull()
    expect(events.value.b).toContain('pause')
    await userEvent.hover(el('[data-testid="outside"]')!)
    await expect.poll(() => events.value.b.at(-1)).toBe('resume')

    // A timer starts only while the toasts are not paused, so a pause that was never released keeps this one open.
    durations.value.b = DURATION
    await expect.poll(() => open.value.b, CLOSES).toBe(false)
  })

  it('starts the next toast timer after toasts are closed inside a modal dialog (#1795)', async () => {
    const { open, show } = mountToasts({ inDialog: true })
    show('a', HOLD)
    show('b', HOLD)
    await expect.poll(() => el('[data-close="b"]')).toBeTruthy()
    await userEvent.click(el('[data-close="b"]')!)
    await expect.poll(() => el('[data-close="b"]')).toBeNull()
    await userEvent.click(el('[data-close="a"]')!)
    await expect.poll(() => el('li')).toBeNull()
    await userEvent.hover(el('[data-testid="outside"]')!)

    show('c', DURATION)
    await expect.poll(() => open.value.c, CLOSES).toBe(false)
  })
})

function mountPausableToast(providerProps: { disableHoverPause?: boolean, disableWindowBlurPause?: boolean } = {}) {
  const open = ref(true)
  const duration = ref(HOLD)
  const Fixture = defineComponent({
    setup() {
      return () => h(ToastProvider, { duration: duration.value, ...providerProps }, () => [
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

  // Called once the pointer, focus or window is where the test wants it. The toast holds
  // until then, and from here it closes after `DURATION` unless the toasts are paused.
  async function startCountdown() {
    duration.value = DURATION
    await nextTick()
  }
  return { open, startCountdown }
}

describe('toast pause options, in a real browser', () => {
  afterEach(async () => {
    window.dispatchEvent(new Event('focus'))
    await userEvent.unhover(document.body)
  })

  it('pauses while hovered by default, and closes once the pointer leaves', async () => {
    const { open, startCountdown } = mountPausableToast()
    await expect.poll(() => el('[data-testid="toast"]')).toBeTruthy()
    await userEvent.hover(el('[data-testid="toast"]')!)
    await startCountdown()
    await sleep(DURATION * 3)
    expect(open.value).toBe(true)

    await userEvent.hover(el('[data-testid="outside"]')!)
    await expect.poll(() => open.value, CLOSES).toBe(false)
  })

  it('closes on time while hovered when the hover pause is off', async () => {
    const { open, startCountdown } = mountPausableToast({ disableHoverPause: true })
    await expect.poll(() => el('[data-testid="toast"]')).toBeTruthy()
    await userEvent.hover(el('[data-testid="toast"]')!)
    await startCountdown()
    await expect.poll(() => open.value, CLOSES).toBe(false)
  })

  it('stays open while its action is focused with both pauses off, and closes once focus leaves', async () => {
    const { open, startCountdown } = mountPausableToast({ disableHoverPause: true, disableWindowBlurPause: true })
    await expect.poll(() => el('[data-action]')).toBeTruthy()
    el('[data-action]')!.focus()
    await userEvent.hover(el('[data-testid="toast"]')!)
    await startCountdown()
    await sleep(DURATION * 3)
    expect(open.value).toBe(true)
    expect(document.activeElement).toBe(el('[data-action]'))

    el('[data-testid="outside"]')!.focus()
    await expect.poll(() => open.value, CLOSES).toBe(false)
  })

  it('stays open during a swipe when the hover pause is off, and closes after the swipe is let go', async () => {
    const { open, startCountdown } = mountPausableToast({ disableHoverPause: true })
    await expect.poll(() => el('[data-testid="toast"]')).toBeTruthy()
    const toast = el('[data-testid="toast"]')!
    const { left, top } = toast.getBoundingClientRect()
    const init = { bubbles: true, pointerId: 1, pointerType: 'touch', button: 0, isPrimary: true, clientY: top + 20 }
    toast.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientX: left + 20 }))
    toast.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: left + 40 }))
    await startCountdown()
    await sleep(DURATION * 3)
    expect(open.value).toBe(true)

    // Let go before the swipe threshold, so only the timer can close the toast.
    toast.dispatchEvent(new PointerEvent('pointerup', { ...init, clientX: left + 40 }))
    await expect.poll(() => open.value, CLOSES).toBe(false)
  })

  it('pauses while the window is blurred by default, and closes once it is focused again', async () => {
    const { open, startCountdown } = mountPausableToast()
    await expect.poll(() => el('[data-testid="toast"]')).toBeTruthy()
    window.dispatchEvent(new Event('blur'))
    await startCountdown()
    await sleep(DURATION * 3)
    expect(open.value).toBe(true)

    window.dispatchEvent(new Event('focus'))
    await expect.poll(() => open.value, CLOSES).toBe(false)
  })

  it('closes on time while the window is blurred when the blur pause is off', async () => {
    const { open, startCountdown } = mountPausableToast({ disableWindowBlurPause: true })
    await expect.poll(() => el('[data-testid="toast"]')).toBeTruthy()
    window.dispatchEvent(new Event('blur'))
    await startCountdown()
    await expect.poll(() => open.value, CLOSES).toBe(false)
  })
})
