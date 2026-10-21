import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { SelectContent, SelectItem, SelectPortal, SelectRoot, SelectTrigger, SelectViewport } from '@/Select'

function mountLayers(first: 'select' | 'menu') {
  const onClosedSelectOpenChange = vi.fn()
  function select(id: string, index: number, extra: Record<string, unknown> = {}) {
    return h(SelectRoot, extra, () => [
      h(SelectTrigger, { 'data-testid': `${id}-trigger`, 'aria-label': id, 'style': `position: fixed; top: 10px; left: ${index * 300}px; pointer-events: auto` }, () => id),
      h(SelectPortal, () => h(SelectContent, { 'data-testid': `${id}-content`, 'position': 'popper' }, () => h(SelectViewport, () => h(SelectItem, { value: id }, () => id)))),
    ])
  }
  mount(defineComponent({
    setup: () => () => h('div', [
      first === 'select'
        ? select('first', 0)
        : h(DropdownMenuRoot, () => [
            h(DropdownMenuTrigger, { 'data-testid': 'first-trigger', 'style': 'position: fixed; top: 10px; left: 0; pointer-events: auto' }, () => 'Menu'),
            h(DropdownMenuPortal, () => h(DropdownMenuContent, { 'data-testid': 'first-content' }, () => h(DropdownMenuItem, () => 'Item'))),
          ]),
      select('second', 1),
      select('closed', 2, { 'open': false, 'onUpdate:open': onClosedSelectOpenChange }),
    ]),
  }), { attachTo: document.body })
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  return { get, onClosedSelectOpenChange }
}

describe('opening a layer during a native pointerdown', () => {
  it.each(['select', 'menu'] as const)('dismisses an existing %s when another Select opens', async (first) => {
    const { get, onClosedSelectOpenChange } = mountLayers(first)
    await userEvent.click(get('first-trigger')!)
    await expect.poll(() => get('first-content')).not.toBeNull()
    // Outside listeners are deliberately registered in a later macrotask.
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(onClosedSelectOpenChange).not.toHaveBeenCalled()

    await userEvent.click(get('second-trigger')!)
    await expect.poll(() => get('second-content')).not.toBeNull()
    await expect.poll(() => get('first-content')).toBeNull()
    expect(get('second-trigger')?.getAttribute('aria-expanded')).toBe('true')
    expect(onClosedSelectOpenChange).not.toHaveBeenCalled()
  })
})
