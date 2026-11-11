import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from '.'
import { DialogContent, DialogPortal, DialogRoot, DialogTitle } from '../Dialog'

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)

function menu(id: string, onOpen = vi.fn(), inner = false) {
  return h(ContextMenuRoot, { 'onUpdate:open': onOpen }, () => [
    h(ContextMenuTrigger, {
      'data-testid': `trigger-${id}`,
      'style': 'display: block; width: 200px; height: 60px; margin: 8px; background: #eee;',
    }, () => inner ? h('div', { 'data-testid': `inner-${id}`, 'style': 'height: 100%;' }, id) : id),
    h(ContextMenuPortal, null, () => h(ContextMenuContent, { 'data-testid': `content-${id}` }, () => h(ContextMenuItem, null, () => `item ${id}`))),
  ])
}

function trackNativeMenu() {
  const native = vi.fn()
  // Bubbles last; if no handler called preventDefault the browser would show its own menu.
  window.addEventListener('contextmenu', e => !e.defaultPrevented && native())
  return native
}

describe('contextMenu trigger pointer-events, in a real browser', () => {
  it('right-clicking a second trigger while the first menu is open opens the second menu', async () => {
    mount(defineComponent({ setup: () => () => h('div', [menu('a'), menu('b')]) }), { attachTo: document.body })
    const native = trackNativeMenu()

    await userEvent.click(get('trigger-a')!, { button: 'right' })
    await expect.poll(() => get('content-a')).not.toBeNull()

    await userEvent.click(get('trigger-b')!, { button: 'right', force: true })
    await expect.poll(() => get('content-b'), { timeout: 1000 }).not.toBeNull()
    expect(native).not.toHaveBeenCalled()
  })

  it('right-clicking a descendant of the open trigger does not close the menu', async () => {
    const onOpen = vi.fn()
    mount(defineComponent({ setup: () => () => h('div', [menu('c', onOpen, true)]) }), { attachTo: document.body })

    await userEvent.click(get('inner-c')!, { button: 'right', position: { x: 10, y: 10 } })
    await expect.poll(() => get('content-c')).not.toBeNull()
    onOpen.mockClear()
    await userEvent.click(get('inner-c')!, { button: 'right', position: { x: 150, y: 40 }, force: true })
    await new Promise(r => setTimeout(r, 100))
    expect(onOpen.mock.calls).toEqual([])
  })

  it('a closed trigger behind a modal dialog does not catch right-clicks', async () => {
    const onOpen = vi.fn()
    mount(defineComponent({
      setup: () => () => h('div', [
        menu('d', onOpen),
        h(DialogRoot, { defaultOpen: true }, () => h(DialogPortal, null, () => h(DialogContent, {
          'aria-describedby': undefined,
          'style': 'position: fixed; top: 300px; left: 300px; background: white;',
        }, () => h(DialogTitle, null, () => 'Dialog')))),
      ]),
    }), { attachTo: document.body })
    await expect.poll(() => document.body.style.pointerEvents).toBe('none')

    await userEvent.click(get('trigger-d')!, { button: 'right', force: true })
    await new Promise(r => setTimeout(r, 100))
    expect(onOpen).not.toHaveBeenCalled()
  })
})
