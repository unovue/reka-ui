import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '.'

function mountDialog() {
  const onOutsideClick = vi.fn()
  const Fixture = defineComponent({
    setup() {
      return () => h('div', [
        h('button', { 'data-testid': 'outside', 'onClick': onOutsideClick }, 'Outside'),
        h(DialogRoot, null, () => [
          h(DialogTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
          h(DialogPortal, null, () => [
            h(DialogOverlay, { style: 'position: fixed; inset: 0;' }),
            h(DialogContent, {
              'aria-describedby': undefined,
              'data-testid': 'content',
              'style': 'position: fixed; top: 100px; left: 100px; width: 200px; background: white;',
            }, () => [
              h(DialogTitle, null, () => 'Title'),
              h('input', { 'data-testid': 'first' }),
              h(DialogClose, { 'data-testid': 'close' }, () => 'Close'),
            ]),
          ]),
        ]),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  return { get, onOutsideClick }
}

describe('given a modal Dialog, in a real browser', () => {
  it('traps Tab focus, closes on Escape and returns focus to the trigger', async () => {
    const { get } = mountDialog()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => document.activeElement).toBe(get('first'))

    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('close'))
    // Tab from the last element wraps to the first instead of leaving the dialog.
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('first'))
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(get('close'))

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
    expect(document.activeElement).toBe(get('trigger'))
  })

  it('blocks pointer interaction outside, and restores it after closing', async () => {
    const { get, onOutsideClick } = mountDialog()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    expect(getComputedStyle(document.body).pointerEvents).toBe('none')
    // Hit testing is real here: the point over the outside button resolves to the overlay.
    const rect = get('outside')!.getBoundingClientRect()
    const hit = document.elementFromPoint(rect.left + 2, rect.top + 2)
    expect(get('outside')!.contains(hit)).toBe(false)

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
    expect(getComputedStyle(document.body).pointerEvents).not.toBe('none')

    await userEvent.click(get('outside')!)
    expect(onOutsideClick).toHaveBeenCalledTimes(1)
  })
})
