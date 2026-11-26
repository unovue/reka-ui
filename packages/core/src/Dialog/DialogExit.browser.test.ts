import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { AlertDialogCancel, AlertDialogContent, AlertDialogOverlay, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle } from '@/AlertDialog'
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from '.'

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
    unmountOnHide?: boolean
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

  /**
   * Every value the body `overflow` goes through from here on. The observer is only told after
   * the script that wrote the style has finished, so an unlock that is undone in the same turn
   * never shows in the live style. Each record carries the style it replaced, and those are read too.
   */
  function recordOverflow() {
    const values = [document.body.style.overflow]
    const previous = document.createElement('div')
    const push = (value: string) => {
      if (value !== values.at(-1))
        values.push(value)
    }
    observer = new MutationObserver((records) => {
      for (const record of records) {
        previous.setAttribute('style', record.oldValue ?? '')
        push(previous.style.overflow)
      }
      push(document.body.style.overflow)
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'], attributeOldValue: true })
    return values
  }

  const exiting = (id: string) => get(id)?.getAnimations().some(animation => animation.playState === 'paused') ?? false
  const finishExit = (id: string) => get(id)!.getAnimations().forEach(animation => animation.finish())

  function dialog(id: string, open: { value: boolean }, options: Options = {}, children?: () => unknown) {
    const { parts = Dialog, modal, overlay = true, overlayExit, contentExit, forceMountOverlay, forceMountContent, unmountOnHide } = options
    return h(parts.Root as typeof DialogRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => open.value = value, modal, unmountOnHide }, () => [
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

  it('hands Escape and accessibility back to the parent during the child exit', async () => {
    vi.stubEnv('MODE', 'development') // Exercise useHideOthers in the browser.
    onTestFinished(() => {
      vi.unstubAllEnvs()
    })
    const outerOpen = ref(false)
    const innerOpen = ref(false)
    const options = { overlay: false, contentExit: true }
    mount(defineComponent({
      setup: () => () => dialog('outer', outerOpen, options, () => dialog('inner', innerOpen, options)),
    }), { attachTo: document.body })
    page.tabIndex = -1
    page.focus()
    outerOpen.value = true
    await expect.poll(() => get('outer')?.contains(document.activeElement)).toBe(true)
    innerOpen.value = true
    await expect.poll(() => get('outer')?.getAttribute('aria-hidden')).toBe('true')

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('inner')).toBe(true)
    expect(get('outer')!.closest('[aria-hidden="true"]')).toBeNull()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('outer')).toBe(true)
    expect(exiting('inner')).toBe(true)
  })

  it('hands Escape back to the parent during the child exit when both are kept mounted', async () => {
    const outerOpen = ref(false)
    const innerOpen = ref(false)
    const options = { overlay: false, contentExit: true, unmountOnHide: false }
    mount(defineComponent({
      setup: () => () => dialog('outer', outerOpen, options, () => dialog('inner', innerOpen, options)),
    }), { attachTo: document.body })
    outerOpen.value = true
    await expect.poll(() => get('outer')?.contains(document.activeElement)).toBe(true)
    innerOpen.value = true
    await expect.poll(() => get('inner')?.contains(document.activeElement)).toBe(true)

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('inner')).toBe(true)
    await userEvent.keyboard('{Escape}')
    expect(outerOpen.value).toBe(false)
    finishExit('inner')
    finishExit('outer')
    await expect.poll(() => get('outer')?.style.display).toBe('none')
    expect(get('inner')?.style.display).toBe('none')

    // Reopened, the kept-mounted child registers its layer again and takes Escape first.
    outerOpen.value = true
    await expect.poll(() => get('outer')?.contains(document.activeElement)).toBe(true)
    innerOpen.value = true
    await expect.poll(() => get('inner')?.contains(document.activeElement)).toBe(true)
    await userEvent.keyboard('{Escape}')
    expect(innerOpen.value).toBe(false)
    expect(outerOpen.value).toBe(true)
  })
})
