import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { mountInShadowRoot } from '@/shared/test/shadowDom'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '.'

const itemStyle = 'display: block; height: 24px; padding: 0 8px;'

function mountMenu() {
  const onSelect = vi.fn()
  const Fixture = defineComponent({
    setup() {
      return () => h('div', { style: 'padding: 40px;' }, [
        h('button', { 'data-testid': 'outside' }, 'Outside'),
        h(DropdownMenuRoot, { modal: false }, () => [
          h(DropdownMenuTrigger, { 'data-testid': 'trigger', 'style': 'margin-left: 100px;' }, () => 'Menu'),
          h(DropdownMenuPortal, null, () => h(DropdownMenuContent, { 'data-testid': 'content', 'align': 'start', 'style': 'width: 160px; background: white;' }, () => [
            h(DropdownMenuItem, { 'data-testid': 'item-new', 'style': itemStyle, onSelect }, () => 'New'),
            h(DropdownMenuItem, { 'data-testid': 'item-saturn', 'style': itemStyle }, () => 'Saturn'),
            h(DropdownMenuSub, null, () => [
              h(DropdownMenuSubTrigger, { 'data-testid': 'sub-trigger', 'style': itemStyle }, () => 'More'),
              h(DropdownMenuPortal, null, () => h(DropdownMenuSubContent, { 'data-testid': 'sub-content', 'style': 'width: 160px; background: white;' }, () => [
                h(DropdownMenuItem, { 'data-testid': 'sub-item', 'style': itemStyle, onSelect }, () => 'Nested'),
                h(DropdownMenuItem, { 'data-testid': 'sub-item-2', 'style': itemStyle }, () => 'Nested 2'),
              ])),
            ]),
          ])),
        ]),
      ])
    },
  })
  return { ...mountInShadowRoot(Fixture), onSelect }
}

describe('given a DropdownMenu inside a shadow root, in a real browser', () => {
  it('opens from the keyboard, roves with arrows and typeahead, and selects', async () => {
    const { get, activeElement, shadowRoot, onSelect } = mountMenu()

    get('trigger')!.focus()
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => get('content')).not.toBeNull()
    expect(get('content')!.getRootNode()).toBe(shadowRoot)
    await expect.poll(activeElement).toBe(get('item-new'))

    await userEvent.keyboard('{ArrowDown}')
    expect(activeElement()).toBe(get('item-saturn'))
    // Typeahead matches item text inside the shadow root.
    await userEvent.keyboard('m')
    expect(activeElement()).toBe(get('sub-trigger'))
    await userEvent.keyboard('{Home}')
    expect(activeElement()).toBe(get('item-new'))

    await userEvent.keyboard('{Enter}')
    await expect.poll(() => get('content')).toBeNull()
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(activeElement()).toBe(get('trigger'))
  })

  it('opens a submenu with the keyboard and closes it with ArrowLeft', async () => {
    const { get, activeElement } = mountMenu()

    get('trigger')!.focus()
    await userEvent.keyboard('{Enter}')
    await expect.poll(activeElement).toBe(get('item-new'))
    await userEvent.keyboard('{End}')
    expect(activeElement()).toBe(get('sub-trigger'))
    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(() => get('sub-content')).not.toBeNull()
    await expect.poll(activeElement).toBe(get('sub-item'))

    await userEvent.keyboard('{ArrowLeft}')
    await expect.poll(() => get('sub-content')).toBeNull()
    expect(activeElement()).toBe(get('sub-trigger'))
  })

  it('keeps the submenu open while the pointer moves into it, and selects inside it', async () => {
    const { get, onSelect } = mountMenu()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    await userEvent.hover(get('sub-trigger')!)
    await expect.poll(() => get('sub-content')).not.toBeNull()
    // The pointer crosses the parent content on its way: the grace area keeps the submenu open.
    await userEvent.hover(get('sub-item-2')!)
    await userEvent.hover(get('sub-item')!)
    expect(get('sub-content')).not.toBeNull()

    await userEvent.click(get('sub-item')!)
    await expect.poll(() => get('content')).toBeNull()
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('closes on an outside click', async () => {
    const { get } = mountMenu()
    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    await userEvent.click(get('outside')!)
    await expect.poll(() => get('content')).toBeNull()
  })
})
