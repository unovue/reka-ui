// @vitest-environment node
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { ToastClose, ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from '.'

// Runs without jsdom: on a real server there is no `window`, and the toast
// timer's immediate watcher runs during the render.
describe('given an open Toast rendered on the server', () => {
  it('has no DOM globals', () => {
    expect(typeof document).toBe('undefined')
    expect(typeof window).toBe('undefined')
  })

  it('renders without touching window', async () => {
    const html = await renderToString(createSSRApp({
      render: () => h(ToastProvider, { duration: 1000 }, () => [
        h(ToastRoot, { defaultOpen: true }, () => [
          h(ToastTitle, () => 'Saved'),
          h(ToastDescription, () => 'Your changes are saved'),
          h(ToastClose, { 'aria-label': 'Close' }, () => '×'),
        ]),
        h(ToastViewport),
      ]),
    }))

    expect(html).toContain('Notifications (F8)')
  })
})
