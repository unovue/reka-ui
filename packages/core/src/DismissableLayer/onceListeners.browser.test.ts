import type { Component, Ref, VNodeChild } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createApp, defineComponent, h, ref, watch } from 'vue'
import { DialogContent, DialogRoot, DialogTitle } from '@/Dialog'
import { HoverCardContent, HoverCardRoot, HoverCardTrigger } from '@/HoverCard'
import { PopoverContent, PopoverRoot, PopoverTrigger } from '@/Popover'
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'

// `.once` on the layers' events across a real outside press, including parts
// that don't declare them (Tooltip's `@interact-outside.once`). The expected
// logs, how often each listener runs included, are what the `<FocusScope
// as-child>` / `<DismissableLayer as-child>` chain gave, except Popover's
// `interactOutside`: its content part forwarded the event and emitted it again,
// so the consumer listener ran twice.

const wait = (ms = 60) => new Promise(resolve => setTimeout(resolve, ms))

const cases: [string, (attrs: Record<string, unknown>) => VNodeChild, string[]][] = [
  ['Tooltip', attrs => h(TooltipProvider, () => h(TooltipRoot, { defaultOpen: true }, () => [h(TooltipTrigger, () => 'T'), h(TooltipContent, attrs, () => 'tip')])), ['pointer', 'pointerOnce', 'interact', 'interactOnce', 'dismiss', 'dismissOnce']],
  ['HoverCard', attrs => h(HoverCardRoot, { defaultOpen: true }, () => [h(HoverCardTrigger, () => 'T'), h(HoverCardContent, attrs, () => 'card')]), ['pointer', 'pointerOnce', 'dismiss', 'dismissOnce']],
  ['Popover', attrs => h(PopoverRoot, { defaultOpen: true }, () => [h(PopoverTrigger, () => 'T'), h(PopoverContent, attrs, () => h('input'))]), ['mount', 'mountOnce', 'pointer', 'pointerOnce', 'interact', 'interactOnce', 'dismiss', 'dismissOnce', 'unmount', 'unmountOnce']],
  ['Dialog', attrs => h(DialogRoot, { defaultOpen: true, modal: false }, () => h(DialogContent, { ...attrs, 'aria-describedby': undefined }, () => [h(DialogTitle, () => 'T'), h('input')])), ['mount', 'mountOnce', 'pointer', 'pointerOnce', 'interact', 'interactOnce', 'dismiss', 'dismiss', 'dismissOnce', 'unmount', 'unmountOnce']],
]

let cleanup: (() => void) | undefined

// The real mouse stays where the last test left it. Resting on a trigger, moving
// to the outside button is a pointer leave, which closes a tooltip before the press.
beforeEach(async () => {
  const spot = document.createElement('div')
  spot.setAttribute('style', 'position:fixed;left:300px;top:700px;width:30px;height:30px')
  document.body.append(spot)
  await userEvent.hover(spot, { force: true })
  spot.remove()
})

afterEach(() => {
  cleanup?.()
  cleanup = undefined
})

function mountOverlay(render: () => VNodeChild, errors: string[] = []) {
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(defineComponent({
    setup: () => () => h('div', [
      h('button', { 'data-t': 'out', 'style': 'position:fixed;top:400px;left:400px' }, 'o'),
      render(),
    ]),
  }))
  app.config.errorHandler = error => errors.push((error as Error).message)
  app.mount(host)
  cleanup = () => {
    app.unmount()
    host.remove()
  }
}

const layer = () => document.querySelector('[data-t="layer"]')

describe('content parts: `.once` across an outside press', () => {
  it.each(cases)('%s', async (_, part, expected) => {
    const log: string[] = []
    const listener = (name: string) => () => log.push(name)
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp(defineComponent({
      setup: () => () => h('div', [
        h('button', { 'data-t': 'out', 'style': 'position:fixed;top:400px;left:400px' }, 'o'),
        part({
          'data-t': 'layer',
          'onInteractOutside': listener('interact'),
          'onInteractOutsideOnce': listener('interactOnce'),
          'onFocusOutside': listener('focus'),
          'onFocusOutsideOnce': listener('focusOnce'),
          'onPointerDownOutside': listener('pointer'),
          'onPointerDownOutsideOnce': listener('pointerOnce'),
          'onDismiss': listener('dismiss'),
          'onDismissOnce': listener('dismissOnce'),
          'onMountAutoFocus': listener('mount'),
          'onMountAutoFocusOnce': listener('mountOnce'),
          'onUnmountAutoFocus': listener('unmount'),
          'onUnmountAutoFocusOnce': listener('unmountOnce'),
        }),
      ]),
    }))
    app.mount(host)
    cleanup = () => {
      app.unmount()
      host.remove()
    }
    await expect.poll(() => document.querySelector('[data-t="layer"]')).not.toBeNull()
    await wait()
    expect(document.querySelector('[data-t="layer"]'), 'the layer is still open before the press').not.toBeNull()
    await userEvent.click(document.querySelector('[data-t="out"]')!, { force: true })
    await expect.poll(() => log.length).toBeGreaterThanOrEqual(expected.length)
    // Late enough for a listener that runs too often to show up.
    await wait()
    expect(log).toEqual(expected)
  })

  it('runs once per instance on a part that stays mounted between openings', async () => {
    const counts = { escape: 0, escapeOnce: 0, dismiss: 0, dismissOnce: 0, mountOnce: 0 }
    const open = ref(false)
    mountOverlay(() => h(DialogRoot, { 'open': open.value, 'unmountOnHide': false, 'onUpdate:open': (value: boolean) => (open.value = value) }, () => h(DialogContent, {
      'data-t': 'layer',
      'aria-describedby': undefined,
      'onEscapeKeyDown': () => counts.escape++,
      'onEscapeKeyDownOnce': () => counts.escapeOnce++,
      'onDismiss': () => counts.dismiss++,
      'onDismissOnce': () => counts.dismissOnce++,
      'onMountAutoFocusOnce': () => counts.mountOnce++,
    }, () => [h(DialogTitle, () => 'T'), h('input')])))
    await wait()
    const element = layer()
    expect(element, 'kept mounted while closed').not.toBeNull()

    for (let opening = 1; opening <= 3; opening++) {
      open.value = true
      await wait()
      await userEvent.keyboard('{Escape}')
      await expect.poll(() => open.value).toBe(false)
      await wait()
      expect(counts.escape).toBe(opening)
      // A dialog's `@dismiss` runs twice per close, on the content and on the layer under it.
      expect(counts.dismiss).toBe(opening * 2)
    }
    expect(layer(), 'the same element throughout').toBe(element)
    expect(counts).toMatchObject({ escapeOnce: 1, dismissOnce: 1, mountOnce: 1 })
  })
})

// The layer emits `dismiss` a tick after the outside events, by when their
// listener may have removed it. A removed part emits nothing, so it can't close the root.
describe('content parts: removed by a listener during an outside press', () => {
  const parts: [string, (open: Ref<boolean>, content: () => VNodeChild) => VNodeChild, Component][] = [
    ['Dialog', (open, content) => h(DialogRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => (open.value = value) }, content), DialogContent],
    ['Popover', (open, content) => h(PopoverRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => (open.value = value) }, () => [h(PopoverTrigger, () => 'T'), content()]), PopoverContent],
  ]
  // DialogTitle needs a dialog; a Popover content doesn't look for one.
  const children = () => h('input')

  describe.each(['onPointerDownOutside', 'onInteractOutside'])('%s', (listener) => {
    it.each(parts)('%s with `v-if`: stays open, without the content', async (_, root, Content) => {
      const open = ref(true)
      const shown = ref(true)
      const updates: boolean[] = []
      watch(open, value => updates.push(value), { flush: 'sync' })
      mountOverlay(() => root(open, () => shown.value
        ? h(Content as any, { 'data-t': 'layer', 'aria-describedby': undefined, [listener]: () => (shown.value = false) }, children)
        : null))
      await expect.poll(layer).not.toBeNull()
      await wait()
      await userEvent.click(document.querySelector('[data-t="out"]')!, { force: true })
      await expect.poll(layer).toBeNull()
      await wait()
      expect(open.value).toBe(true)
      expect(updates).toEqual([])
    })

    // The removed content stays silent. A dialog stays open, with the new content;
    // a popover's new content takes the moved focus as outside and closes itself.
    it.each(parts)('%s with `:key`: the removed content doesn\'t dismiss', async (name, root, Content) => {
      const open = ref(true)
      const key = ref(0)
      const dismissed: number[] = []
      mountOverlay(() => {
        const current = key.value
        return root(open, () => h(Content as any, {
          'key': current,
          'data-t': 'layer',
          'aria-describedby': undefined,
          [listener]: () => key.value++,
          'onDismiss': () => dismissed.push(current),
        }, children))
      })
      await expect.poll(layer).not.toBeNull()
      await wait()
      const before = layer()
      await userEvent.click(document.querySelector('[data-t="out"]')!, { force: true })
      await expect.poll(() => key.value).toBeGreaterThan(0)
      await wait(200)
      expect(dismissed).not.toContain(0)
      expect(layer()).not.toBe(before)
      expect(open.value).toBe(name === 'Dialog')
      expect(layer() !== null).toBe(name === 'Dialog')
    })
  })
})

describe('content parts: a listener that fails', () => {
  const fail = {
    throw: () => {
      throw new Error('boom')
    },
    reject: () => Promise.reject(new Error('boom')),
  }
  // Last: how many times `@dismiss` runs per close (a dialog's runs twice).
  const parts: [string, (open: Ref<boolean>, attrs: Record<string, unknown>) => VNodeChild, number][] = [
    ['Dialog', (open, attrs) => h(DialogRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => (open.value = value) }, () => h(DialogContent, { ...attrs, 'aria-describedby': undefined }, () => [h(DialogTitle, () => 'T'), h('input')])), 2],
    ['Popover', (open, attrs) => h(PopoverRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => (open.value = value) }, () => [h(PopoverTrigger, () => 'T'), h(PopoverContent, attrs, () => h('input'))]), 1],
  ]

  describe.each(Object.keys(fail) as (keyof typeof fail)[])('that %ss', (mode) => {
    it.each(parts)('%s still closes, and the app\'s errorHandler hears about it', async (_, part, dismissCalls) => {
      const rejections: unknown[] = []
      const onRejection = (event: PromiseRejectionEvent) => {
        rejections.push(event.reason)
        event.preventDefault()
      }
      window.addEventListener('unhandledrejection', onRejection)
      const errors: string[] = []
      const log: string[] = []
      const open = ref(true)
      mountOverlay(() => part(open, {
        'data-t': 'layer',
        'onDismiss': fail[mode],
        'onDismissOnce': () => log.push('dismissOnce'),
      }), errors)
      try {
        await expect.poll(layer).not.toBeNull()
        await wait()
        await userEvent.click(document.querySelector('[data-t="out"]')!, { force: true })
        await expect.poll(() => open.value).toBe(false)
        await expect.poll(layer).toBeNull()
        await expect.poll(() => errors).toEqual(Array.from({ length: dismissCalls }).fill('boom'))
        expect(log, 'the rest of the listeners ran').toEqual(['dismissOnce'])
        await wait()
        expect(rejections).toEqual([])
      }
      finally {
        window.removeEventListener('unhandledrejection', onRejection)
      }
    })
  })
})
