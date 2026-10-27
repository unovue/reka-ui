import { renderToString } from '@vue/server-renderer'
import { afterEach, describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { resetBodyScrollLock } from '@/shared/useBodyScrollLock'
import { sleep } from '@/test'
import { DialogContent, DialogOverlay, DialogRoot, DialogTitle } from '.'

/** A modal Dialog (overlay + content) whose `open` state the test controls. */
function createDialogFixture(open = ref(true)) {
  return defineComponent({
    setup() {
      return () => h(DialogRoot, {
        'open': open.value,
        'onUpdate:open': (value: boolean) => { open.value = value },
      }, () => [
        h(DialogOverlay),
        h(DialogContent, { 'aria-describedby': undefined }, () => h(DialogTitle, () => 'Title')),
      ])
    },
  })
}

const backdrop = () => document.querySelector('[data-reka-internal-backdrop]')
const isScrollLocked = () => getComputedStyle(document.body).overflowY === 'hidden'

afterEach(() => {
  resetBodyScrollLock()
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  document.documentElement.removeAttribute('style')
})

// #2867 / #2987: hydration runs outside a scheduler flush, and the old body
// `pointer-events: none` lock got stuck on <body> after the hydrated dialog
// closed. Nothing global is written any more (#2822): the scroll lock and the
// internal backdrop only engage once mounted on the client, and both go away
// with the dialog.
describe('given a modal Dialog that is open in the SSR render', () => {
  it('should leave nothing on <body> while rendering on the server', async () => {
    const html = await renderToString(createSSRApp(createDialogFixture()))
    await sleep(10)

    expect(html).toContain('role="dialog"')
    expect(html).not.toContain('data-reka-internal-backdrop')
    expect(document.body.getAttribute('style')).toBeNull()
    expect(document.documentElement.getAttribute('style')).toBeNull()
  })

  it('should leave no style on <body> after the hydrated dialog closes', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(createDialogFixture()))
    document.body.append(container)

    const open = ref(true)
    const app = createSSRApp(createDialogFixture(open))
    app.mount(container)
    await sleep(10)
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
    expect(backdrop()).not.toBeNull()
    expect(isScrollLocked()).toBe(true)
    expect(document.body.style.pointerEvents).toBe('')

    open.value = false
    await sleep(10)
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(backdrop()).toBeNull()
    expect(isScrollLocked()).toBe(false)
    expect(document.body.style.pointerEvents).toBe('')

    app.unmount()
  })

  it('should leave no style on <body> when the hydrated app unmounts while the dialog is open', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(createDialogFixture()))
    document.body.append(container)

    const app = createSSRApp(createDialogFixture())
    app.mount(container)
    await sleep(10)
    expect(isScrollLocked()).toBe(true)

    app.unmount()
    await sleep(10)
    expect(backdrop()).toBeNull()
    expect(isScrollLocked()).toBe(false)
    expect(document.body.style.pointerEvents).toBe('')
  })
})
