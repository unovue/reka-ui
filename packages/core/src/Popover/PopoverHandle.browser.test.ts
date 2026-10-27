import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { createDropdownMenuHandle, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { createPopoverHandle, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '.'

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)

function centreX(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return Math.round(rect.left + rect.width / 2)
}

function mountPopover(modal = false) {
  const handle = createPopoverHandle<string>()
  const onUpdate = vi.fn()
  const trigger = (id: string, left: number) => h(PopoverTrigger, {
    'data-testid': id,
    'handle': handle,
    'payload': id,
    'style': `position: absolute; top: 100px; left: ${left}px; width: 80px; height: 30px;`,
  }, () => id)
  const wrapper = mount(defineComponent({
    setup: () => () => h('div', [
      trigger('a', 40),
      trigger('b', 240),
      h('button', { 'data-testid': 'outside', 'style': 'position: absolute; top: 300px; left: 40px;' }, 'Outside'),
      h(PopoverRoot, { handle, modal, 'onUpdate:open': onUpdate }, {
        default: ({ payload }: { payload?: string }) => h(PopoverPortal, null, () => h(PopoverContent, {
          'data-testid': 'content',
          'aria-label': 'Details',
          'style': 'width: 120px; height: 40px;',
        }, () => [
          h('span', { 'data-testid': 'payload' }, payload),
          h('button', null, 'Inside'),
        ])),
      }),
    ]),
  }), { attachTo: document.body })
  return { wrapper, handle, onUpdate }
}

describe('popover detached triggers, in a real browser (#2826)', () => {
  let unmount: (() => void) | undefined
  afterEach(() => {
    unmount?.()
    unmount = undefined
  })

  it('anchors to the trigger that opened it and follows a switch without closing', async () => {
    const { wrapper, onUpdate } = mountPopover()
    unmount = () => wrapper.unmount()

    await userEvent.click(get('a')!)
    await expect.poll(() => get('content') && centreX(get('content')!)).toBe(centreX(get('a')!))
    const content = get('content')

    await userEvent.click(get('b')!)
    await expect.poll(() => get('payload')?.textContent).toBe('b')
    await expect.poll(() => centreX(get('content')!)).toBe(centreX(get('b')!))
    // Same element: moved, never closed in between.
    expect(get('content')).toBe(content)
    expect(onUpdate.mock.calls.map(([open]) => open)).toEqual([true, true])
    expect(get('a')!.getAttribute('aria-expanded')).toBe('false')
    expect(get('b')!.getAttribute('aria-expanded')).toBe('true')
  })

  it('returns focus to the invoking trigger on Escape', async () => {
    const { wrapper } = mountPopover()
    unmount = () => wrapper.unmount()

    await userEvent.click(get('b')!)
    await expect.poll(() => get('content')).not.toBeNull()
    get('content')!.querySelector('button')!.focus()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
    expect(document.activeElement).toBe(get('b'))
  })

  it('a modal popover closes on a press on another trigger (it sits under the backdrop)', async () => {
    const { wrapper } = mountPopover(true)
    unmount = () => wrapper.unmount()

    await userEvent.click(get('a')!)
    await expect.poll(() => get('content')).not.toBeNull()
    await userEvent.click(get('b')!, { force: true })
    await expect.poll(() => get('content')).toBeNull()
  })
})

describe('dropdownMenu detached triggers, in a real browser (#2826)', () => {
  it('anchors to the invoking trigger and returns focus to it', async () => {
    const handle = createDropdownMenuHandle<string>()
    const trigger = (id: string, left: number) => h(DropdownMenuTrigger, {
      'data-testid': id,
      'handle': handle,
      'payload': id,
      'style': `position: absolute; top: 100px; left: ${left}px; width: 80px; height: 30px;`,
    }, () => id)
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', [
        trigger('a', 40),
        trigger('b', 240),
        h(DropdownMenuRoot, { handle }, {
          default: ({ payload }: { payload?: string }) => h(DropdownMenuPortal, null, () => h(DropdownMenuContent, {
            'data-testid': 'menu',
            'align': 'start',
          }, () => h(DropdownMenuItem, null, () => `Item for ${payload}`))),
        }),
      ]),
    }), { attachTo: document.body })

    await userEvent.click(get('b')!)
    await expect.poll(() => get('menu')?.textContent).toBe('Item for b')
    await expect.poll(() => Math.round(get('menu')!.getBoundingClientRect().left)).toBe(Math.round(get('b')!.getBoundingClientRect().left))
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('menu')).toBeNull()
    await expect.poll(() => document.activeElement).toBe(get('b'))
    wrapper.unmount()
  })
})
