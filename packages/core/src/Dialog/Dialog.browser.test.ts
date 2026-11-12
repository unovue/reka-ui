import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { AlertDialogCancel, AlertDialogContent, AlertDialogOverlay, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle } from '@/AlertDialog'
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '.'

function mountDialog() {
  const onOutsideClick = vi.fn()
  const Fixture = defineComponent({
    setup() {
      return () => h('div', [
        h('button', { 'data-testid': 'outside', 'onClick': onOutsideClick }, 'Outside'),
        h(DialogRoot, null, () => [
          h(DialogTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
          h(DialogPortal, null, () => [
            h(DialogOverlay, { style: 'position: fixed; inset: 0;' }),
            h(DialogContent, {
              'aria-describedby': undefined,
              'data-testid': 'content',
              'style': 'position: fixed; top: 100px; left: 100px; width: 200px; background: white;',
            }, () => [
              h(DialogTitle, null, () => 'Title'),
              h('input', { 'data-testid': 'first' }),
              h(DialogClose, { 'data-testid': 'close' }, () => 'Close'),
            ]),
          ]),
        ]),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  return { get, onOutsideClick }
}

describe('given a modal Dialog, in a real browser', () => {
  it('traps Tab focus, closes on Escape and returns focus to the trigger', async () => {
    const { get } = mountDialog()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => document.activeElement).toBe(get('first'))

    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('close'))
    // Tab from the last element wraps to the first instead of leaving the dialog.
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('first'))
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(get('close'))

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
    expect(document.activeElement).toBe(get('trigger'))
  })

  it('blocks pointer interaction outside, and restores it after closing', async () => {
    const { get, onOutsideClick } = mountDialog()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    expect(getComputedStyle(document.body).pointerEvents).toBe('none')
    // Hit testing is real here: the point over the outside button resolves to the overlay.
    const rect = get('outside')!.getBoundingClientRect()
    const hit = document.elementFromPoint(rect.left + 2, rect.top + 2)
    expect(get('outside')!.contains(hit)).toBe(false)

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
    expect(getComputedStyle(document.body).pointerEvents).not.toBe('none')

    await userEvent.click(get('outside')!)
    expect(onOutsideClick).toHaveBeenCalledTimes(1)
  })
})

describe('given a modal Dialog with an exit animation, in a real browser', () => {
  // Headless Chromium draws no scrollbar, so the lock sees no gap to make up for. Reporting a
  // window wider than the document gives it one.
  const GAP = 15
  // The exit animations are paused, so that a dialog stays in its exit until the test ends it.
  const STYLES = `
    body { margin: 0 }
    @keyframes dialog-out { from { opacity: 1 } to { opacity: 0 } }
    .exit[data-state="closed"] { animation: dialog-out 1s linear paused; }
  `
  const Dialog = { Root: DialogRoot, Portal: DialogPortal, Overlay: DialogOverlay, Content: DialogContent, Title: DialogTitle, Close: DialogClose }
  const AlertDialog = { Root: AlertDialogRoot, Portal: AlertDialogPortal, Overlay: AlertDialogOverlay, Content: AlertDialogContent, Title: AlertDialogTitle, Close: AlertDialogCancel }

  interface Options {
    parts?: typeof Dialog | typeof AlertDialog
    modal?: boolean
    overlay?: boolean
    overlayExit?: boolean
    contentExit?: boolean
    forceMountOverlay?: boolean
    forceMountContent?: boolean
  }

  let sheet: HTMLStyleElement
  let page: HTMLElement
  let observer: MutationObserver | undefined

  beforeEach(() => {
    vi.spyOn(window, 'innerWidth', 'get').mockImplementation(() => document.documentElement.clientWidth + GAP)
    sheet = document.createElement('style')
    sheet.textContent = STYLES
    document.head.append(sheet)
    page = document.createElement('div')
    page.style.height = '3000px'
    document.body.append(page)
  })

  afterEach(() => {
    observer?.disconnect()
    observer = undefined
    vi.restoreAllMocks()
    sheet.remove()
    page.remove()
    document.body.removeAttribute('style')
  })

  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  const lock = () => ({
    overflow: document.body.style.overflow,
    paddingRight: document.body.style.paddingRight,
    scrollbarWidth: document.documentElement.style.getPropertyValue('--scrollbar-width'),
  })
  const LOCKED = { overflow: 'hidden', paddingRight: `${GAP}px`, scrollbarWidth: `${GAP}px` }
  const UNLOCKED = { overflow: '', paddingRight: '', scrollbarWidth: '' }

  /** Every value the body `overflow` goes through from here on, so that a brief unlock cannot be missed. */
  function recordOverflow() {
    const values = [document.body.style.overflow]
    observer = new MutationObserver(() => {
      if (document.body.style.overflow !== values.at(-1))
        values.push(document.body.style.overflow)
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })
    return values
  }

  const exiting = (id: string) => get(id)?.getAnimations().some(animation => animation.playState === 'paused') ?? false
  const finishExit = (id: string) => get(id)!.getAnimations().forEach(animation => animation.finish())

  function dialog(id: string, open: { value: boolean }, options: Options = {}, children?: () => unknown) {
    const { parts = Dialog, modal, overlay = true, overlayExit, contentExit, forceMountOverlay, forceMountContent } = options
    return h(parts.Root as typeof DialogRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => open.value = value, modal }, () => [
      h(parts.Portal, null, () => [
        overlay
          ? h(parts.Overlay, { 'data-testid': `${id}-overlay`, 'class': overlayExit ? 'exit' : undefined, 'forceMount': forceMountOverlay, 'style': 'position: fixed; inset: 0;' })
          : null,
        h(parts.Content, {
          'aria-describedby': undefined,
          'data-testid': id,
          'class': contentExit ? 'exit' : undefined,
          'forceMount': forceMountContent,
          'style': 'position: fixed; top: 100px; left: 100px; width: 200px; background: white;',
        }, () => [
          h(parts.Title, null, () => 'Title'),
          h(parts.Close, null, () => 'Close'),
          children?.(),
        ]),
      ]),
    ])
  }

  async function mountOpenDialog(options?: Options) {
    const open = ref(true)
    const overlay = ref(options?.overlay ?? true)
    mount(defineComponent({
      setup: () => () => dialog('content', open, { ...options, overlay: overlay.value }),
    }), { attachTo: document.body })
    await expect.poll(() => get('content')?.contains(document.activeElement)).toBe(true)
    await nextTick()
    return { open, overlay }
  }

  it.each<{ name: string, options: Options }>([
    { name: 'the content and the overlay both animate out', options: { contentExit: true, overlayExit: true } },
    { name: 'only the content animates out', options: { contentExit: true } },
    { name: 'only the content animates out, in an AlertDialog', options: { parts: AlertDialog, contentExit: true } },
    { name: 'only the content animates out, under a force-mounted overlay', options: { contentExit: true, forceMountOverlay: true } },
    { name: 'only the content animates out, both force-mounted', options: { contentExit: true, forceMountOverlay: true, forceMountContent: true } },
  ])('keeps body scroll locked until the exit has finished when $name', async ({ options }) => {
    await mountOpenDialog(options)
    expect(lock()).toEqual(LOCKED)
    const overflow = recordOverflow()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('content')).toBe(true)
    if (options.overlayExit) {
      // The overlay finishes first, as it would with the shorter of two animations.
      await expect.poll(() => exiting('content-overlay')).toBe(true)
      finishExit('content-overlay')
    }
    if (!options.forceMountOverlay)
      await expect.poll(() => get('content-overlay')).toBeNull()
    expect(lock()).toEqual(LOCKED)
    expect(overflow).toEqual(['hidden'])

    finishExit('content')
    await expect.poll(lock).toEqual(UNLOCKED)
    if (!options.forceMountContent)
      expect(get('content')).toBeNull()
    expect(overflow).toEqual(['hidden', ''])
  })

  it('keeps body scroll locked until the overlay has finished when only the overlay animates out', async () => {
    await mountOpenDialog({ overlayExit: true })
    const overflow = recordOverflow()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('content-overlay')).toBe(true)
    expect(get('content')).toBeNull()
    expect(lock()).toEqual(LOCKED)

    finishExit('content-overlay')
    await expect.poll(() => get('content-overlay')).toBeNull()
    expect(lock()).toEqual(UNLOCKED)
    expect(overflow).toEqual(['hidden', ''])
  })

  it.each<{ name: string, options: Options }>([
    { name: 'a dialog', options: { contentExit: true } },
    { name: 'a dialog with a force-mounted overlay and content', options: { contentExit: true, forceMountOverlay: true, forceMountContent: true } },
  ])('keeps the lock without a gap when $name is reopened during its exit', async ({ options }) => {
    const { open } = await mountOpenDialog(options)
    const overflow = recordOverflow()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('content')).toBe(true)
    expect(lock()).toEqual(LOCKED)

    open.value = true
    await expect.poll(() => get('content')?.dataset.state).toBe('open')
    await expect.poll(() => get('content-overlay')?.dataset.state).toBe('open')
    await expect.poll(() => exiting('content')).toBe(false)
    expect(lock()).toEqual(LOCKED)
    expect(overflow).toEqual(['hidden'])

    open.value = false
    await expect.poll(() => exiting('content')).toBe(true)
    finishExit('content')
    await expect.poll(lock).toEqual(UNLOCKED)
    expect(overflow).toEqual(['hidden', ''])
  })

  it('keeps the outer lock when a nested dialog has finished its exit', async () => {
    const outerOpen = ref(true)
    const innerOpen = ref(true)
    mount(defineComponent({
      setup: () => () => dialog('outer', outerOpen, {}, () => dialog('inner', innerOpen, { contentExit: true })),
    }), { attachTo: document.body })
    await expect.poll(() => get('inner')?.contains(document.activeElement)).toBe(true)
    await nextTick()
    const overflow = recordOverflow()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('inner')).toBe(true)
    expect(outerOpen.value).toBe(true)
    finishExit('inner')
    await expect.poll(() => get('inner')).toBeNull()
    expect(lock()).toEqual(LOCKED)

    outerOpen.value = false
    await expect.poll(() => get('outer')).toBeNull()
    expect(lock()).toEqual(UNLOCKED)
    expect(overflow).toEqual(['hidden', ''])
  })

  it('unlocks body scroll as it closes when nothing animates out', async () => {
    await mountOpenDialog()
    expect(lock()).toEqual(LOCKED)
    const overflow = recordOverflow()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
    expect(get('content-overlay')).toBeNull()
    expect(lock()).toEqual(UNLOCKED)
    expect(overflow).toEqual(['hidden', ''])
  })

  it.each<{ name: string, options: Options }>([
    { name: 'a modal dialog without an overlay', options: { overlay: false, contentExit: true } },
    { name: 'a non-modal dialog', options: { modal: false, contentExit: true } },
  ])('never locks body scroll for $name', async ({ options }) => {
    await mountOpenDialog(options)
    expect(lock()).toEqual(UNLOCKED)
    const overflow = recordOverflow()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('content')).toBe(true)
    expect(lock()).toEqual(UNLOCKED)

    finishExit('content')
    await expect.poll(() => get('content')).toBeNull()
    expect(overflow).toEqual([''])
  })

  it('unlocks body scroll when the overlay is taken away from an open dialog', async () => {
    const { overlay } = await mountOpenDialog({ contentExit: true })
    expect(lock()).toEqual(LOCKED)

    overlay.value = false
    await expect.poll(() => get('content-overlay')).toBeNull()
    expect(get('content')?.dataset.state).toBe('open')
    expect(lock()).toEqual(UNLOCKED)
  })
})
