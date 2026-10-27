import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { DrawerClose, DrawerContent, DrawerPortal, DrawerRoot, DrawerTitle, DrawerTrigger } from '.'

const STYLE_ID = 'drawer-browser-test-style'
const mounted: { unmount: () => void }[] = []

function addStyle(css: string) {
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = css
  document.head.append(style)
}

function mountDrawer(contentProps: Record<string, unknown> = {}) {
  const onOpenComplete = vi.fn()
  const Fixture = defineComponent({
    setup() {
      return () => h(DrawerRoot, { 'onUpdate:openComplete': onOpenComplete }, () => [
        h(DrawerTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
        h(DrawerPortal, null, () => h(DrawerContent, {
          'class': 'popup',
          'data-testid': 'content',
          // Above the internal backdrop, as a styled drawer is.
          'style': 'position: fixed; left: 0; right: 0; bottom: 0; z-index: 1; background: white;',
          'aria-describedby': undefined,
          ...contentProps,
        }, () => [
          h(DrawerTitle, null, () => 'Title'),
          h(DrawerClose, { 'data-testid': 'close' }, () => 'Close'),
        ])),
      ])
    },
  })
  const wrapper = mount(Fixture, { attachTo: document.body })
  mounted.push(wrapper)
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  return { wrapper, get, onOpenComplete }
}

describe('given a Drawer, in a real browser', () => {
  afterEach(() => {
    document.getElementById(STYLE_ID)?.remove()
    mounted.splice(0).forEach(wrapper => wrapper.unmount())
  })

  it('reports openComplete after the enter and exit animations finish', async () => {
    addStyle(`
      @keyframes drawer-in { from { opacity: 0 } }
      @keyframes drawer-out { to { opacity: 0 } }
      .popup[data-state="open"] { animation: drawer-in 300ms }
      .popup[data-state="closed"] { animation: drawer-out 300ms }
    `)
    const { get, onOpenComplete } = mountDrawer()

    await userEvent.click(get('trigger')!)
    const openedAt = performance.now()
    await expect.poll(() => onOpenComplete.mock.calls, { timeout: 2000 }).toEqual([[true]])
    expect(performance.now() - openedAt).toBeGreaterThan(200)

    await userEvent.click(get('close')!)
    const closedAt = performance.now()
    await expect.poll(() => onOpenComplete.mock.calls, { timeout: 2000 }).toEqual([[true], [false]])
    expect(performance.now() - closedAt).toBeGreaterThan(200)
    await expect.poll(() => get('content')).toBeNull()
  })

  it('reports openComplete right away when the popup has no animation', async () => {
    const { get, onOpenComplete } = mountDrawer()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => onOpenComplete.mock.calls).toEqual([[true]])
    await userEvent.click(get('close')!)
    await expect.poll(() => onOpenComplete.mock.calls).toEqual([[true], [false]])
  })

  it('returns focus to the trigger when a forceMount drawer closes', async () => {
    const { get } = mountDrawer({ forceMount: true })

    await userEvent.click(get('trigger')!)
    // The content is mounted before it opens, so its FocusScope does not move focus on open.
    get('close')!.focus()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => document.activeElement).toBe(get('trigger'))
  })
})
