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

  // As in Base UI, the press lands on the menu's backdrop and dismisses it; the
  // `contextmenu` that follows reaches the trigger and re-opens at the new point.
  it('right-clicking a descendant of the open trigger re-opens the menu at the new point', async () => {
    const onOpen = vi.fn()
    mount(defineComponent({ setup: () => () => h('div', [menu('c', onOpen, true)]) }), { attachTo: document.body })
    const native = trackNativeMenu()

    await userEvent.click(get('inner-c')!, { button: 'right', position: { x: 10, y: 10 } })
    await expect.poll(() => get('content-c')).not.toBeNull()
    const firstLeft = get('content-c')!.getBoundingClientRect().left
    onOpen.mockClear()
    await userEvent.click(get('inner-c')!, { button: 'right', position: { x: 150, y: 40 }, force: true })
    await new Promise(r => setTimeout(r, 100))
    expect(onOpen.mock.calls.map(([open]) => open)).toEqual([false, true])
    expect(get('content-c')).not.toBeNull()
    expect(get('content-c')!.getBoundingClientRect().left - firstLeft).toBeCloseTo(140, -1)
    expect(native).not.toHaveBeenCalled()
  })

  // #1923: like Base UI, the trigger area is not cut out of a modal menu's
  // backdrop, so a left click there only dismisses the menu.
  it('left-clicking the open trigger only dismisses the menu, without clicking what is under it', async () => {
    const onOpen = vi.fn()
    const onTriggerClick = vi.fn()
    const onLinkClick = vi.fn()
    mount(defineComponent({
      setup: () => () => h(ContextMenuRoot, { 'onUpdate:open': onOpen }, () => [
        h(ContextMenuTrigger, {
          'data-testid': 'trigger-e',
          'style': 'display: block; width: 200px; height: 60px; margin: 8px; background: #eee;',
          'onClick': onTriggerClick,
        }, () => h('button', { 'data-testid': 'action-e', 'style': 'width: 100%; height: 100%;', 'onClick': onLinkClick }, 'action')),
        h(ContextMenuPortal, null, () => h(ContextMenuContent, { 'data-testid': 'content-e' }, () => h(ContextMenuItem, null, () => 'item e'))),
      ]),
    }), { attachTo: document.body })

    await userEvent.click(get('action-e')!, { button: 'right', position: { x: 10, y: 10 } })
    await expect.poll(() => get('content-e')).not.toBeNull()
    onOpen.mockClear()

    await userEvent.click(get('action-e')!, { position: { x: 150, y: 40 }, force: true })
    await expect.poll(() => get('content-e')).toBeNull()
    await new Promise(r => setTimeout(r, 100))
    expect(onOpen.mock.calls.map(([open]) => open)).toEqual([false])
    expect(onLinkClick).not.toHaveBeenCalled()
    expect(onTriggerClick).not.toHaveBeenCalled()

    // Once closed, the trigger area is interactive again.
    await userEvent.click(get('action-e')!)
    expect(onLinkClick).toHaveBeenCalledTimes(1)
  })

  // Base UI `ContextMenuTrigger` blocks the native menu on the internal backdrop.
  it('a right click on the backdrop of a menu that stays open shows no native menu', async () => {
    mount(defineComponent({
      setup: () => () => h(ContextMenuRoot, null, () => [
        h(ContextMenuTrigger, {
          'data-testid': 'trigger-f',
          'style': 'display: block; width: 200px; height: 60px; margin: 8px; background: #eee;',
        }, () => 'f'),
        h(ContextMenuPortal, null, () => h(ContextMenuContent, {
          'data-testid': 'content-f',
          'onPointerDownOutside': (event: Event) => event.preventDefault(),
        }, () => h(ContextMenuItem, null, () => 'item f'))),
      ]),
    }), { attachTo: document.body })
    const native = trackNativeMenu()

    await userEvent.click(get('trigger-f')!, { button: 'right', position: { x: 10, y: 10 } })
    await expect.poll(() => get('content-f')).not.toBeNull()
    await userEvent.click(get('trigger-f')!, { button: 'right', position: { x: 150, y: 40 }, force: true })
    await new Promise(r => setTimeout(r, 100))
    expect(get('content-f')).not.toBeNull()
    expect(native).not.toHaveBeenCalled()
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
    // v3 keeps the body interactive; the modal dialog blocks the page outside it instead.
    await expect.poll(() => document.querySelector('[role="dialog"]')).not.toBeNull()

    await userEvent.click(get('trigger-d')!, { button: 'right', force: true })
    await new Promise(r => setTimeout(r, 100))
    expect(onOpen).not.toHaveBeenCalled()
  })
})
