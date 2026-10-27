// @vitest-environment node
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'
import { DialogContent, DialogDescription, DialogRoot, DialogTitle } from '@/Dialog'
import { Presence } from '.'

// Runs without jsdom: Presence's immediate watcher still runs during a server
// render, but nothing animates there, so no completion may be reported.
describe('given an open Presence rendered on the server', () => {
  it('does not emit complete', async () => {
    const onComplete = vi.fn()
    const html = await renderToString(createSSRApp({
      render: () => h(Presence, { present: true, appear: true, onComplete }, () => h('div', 'Content')),
    }))
    await nextTick()
    await new Promise(resolve => setTimeout(resolve))

    expect(html).toContain('Content')
    expect(html).not.toContain('data-starting-style')
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('does not emit update:openComplete from a root', async () => {
    const onOpenComplete = vi.fn()
    const html = await renderToString(createSSRApp({
      render: () => h(DialogRoot, { 'defaultOpen': true, 'onUpdate:openComplete': onOpenComplete }, () =>
        h(DialogContent, () => [h(DialogTitle, () => 'Title'), h(DialogDescription, () => 'Description')])),
    }))
    await nextTick()
    await new Promise(resolve => setTimeout(resolve))

    expect(html).toContain('Title')
    expect(onOpenComplete).not.toHaveBeenCalled()
  })
})
