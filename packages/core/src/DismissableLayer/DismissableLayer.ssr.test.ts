// @vitest-environment node
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { DialogContent, DialogRoot, DialogTitle } from '@/Dialog'
import { PopoverContent, PopoverRoot, PopoverTrigger } from '@/Popover'

// Runs without jsdom: on a real server there is no `document` or `window`, which
// the jsdom-based SSR tests cannot show.
describe('given a DismissableLayer rendered on the server', () => {
  it('has no DOM globals', () => {
    expect(typeof document).toBe('undefined')
    expect(typeof window).toBe('undefined')
  })

  it('renders an open Dialog outside a portal', async () => {
    const html = await renderToString(createSSRApp({
      render: () => h(DialogRoot, { defaultOpen: true }, () =>
        h(DialogContent, { 'aria-describedby': undefined }, () => h(DialogTitle, () => 'Title'))),
    }))

    expect(html).toContain('role="dialog"')
  })

  it('renders a closed Dialog with force-mounted content', async () => {
    const html = await renderToString(createSSRApp({
      render: () => h(DialogRoot, () =>
        h(DialogContent, { 'forceMount': true, 'aria-describedby': undefined }, () => h(DialogTitle, () => 'Title'))),
    }))

    expect(html).toContain('role="dialog"')
  })

  it('renders an open Popover', async () => {
    const html = await renderToString(createSSRApp({
      render: () => h(PopoverRoot, { defaultOpen: true }, () => [
        h(PopoverTrigger, () => 'Open'),
        h(PopoverContent, () => 'Content'),
      ]),
    }))

    expect(html).toContain('Content')
  })
})
