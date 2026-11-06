import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { isMacWebKit } from '@/test/browser'
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
  // Tabs to a button or link: see `isMacWebKit`.
  it.skipIf(isMacWebKit)('traps Tab focus, closes on Escape and returns focus to the trigger', async () => {
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
    // <body> is never made inert (#2822): the overlay and the content's internal
    // backdrop cover the page instead.
    expect(getComputedStyle(document.body).pointerEvents).toBe('auto')
    // Hit testing is real here: the point over the outside button resolves to the overlay.
    const rect = get('outside')!.getBoundingClientRect()
    const hit = document.elementFromPoint(rect.left + 2, rect.top + 2)
    expect(get('outside')!.contains(hit)).toBe(false)

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
    expect(document.querySelector('[data-reka-internal-backdrop]')).toBeNull()

    await userEvent.click(get('outside')!)
    expect(onOutsideClick).toHaveBeenCalledTimes(1)
  })
})

// #2212, Base UI `finalFocus` default: focus returns to the element focused
// before the dialog opened (the trigger when the trigger opened it), and to
// the trigger when that element left the DOM.
describe('given a Dialog opened programmatically, in a real browser', () => {
  function mountProgrammatic(rootProps: Record<string, unknown> = {}) {
    const open = ref(false)
    const showInput = ref(true)
    const Fixture = defineComponent({
      setup() {
        return () => h('div', [
          showInput.value ? h('input', { 'data-testid': 'search' }) : null,
          h(DialogRoot, {
            'open': open.value,
            'onUpdate:open': (value: boolean) => { open.value = value },
            ...rootProps,
          }, () => [
            h(DialogTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
            h(DialogPortal, null, () => h(DialogContent, { 'aria-describedby': undefined, 'data-testid': 'content' }, () => [
              h(DialogTitle, null, () => 'Title'),
              h(DialogClose, { 'data-testid': 'close' }, () => 'Close'),
            ])),
          ]),
        ])
      },
    })
    const wrapper = mount(Fixture, { attachTo: document.body })
    const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
    return { wrapper, get, open, showInput }
  }

  it('returns focus to the element focused before opening', async () => {
    const { wrapper, get, open } = mountProgrammatic()
    get('search')!.focus()
    open.value = true
    await expect.poll(() => document.activeElement?.getAttribute('data-testid')).toBe('close')
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
    await expect.poll(() => document.activeElement).toBe(get('search'))
    wrapper.unmount()
  })

  it('falls back to the trigger when that element left the DOM', async () => {
    const { wrapper, get, open, showInput } = mountProgrammatic()
    get('search')!.focus()
    open.value = true
    await expect.poll(() => document.activeElement?.getAttribute('data-testid')).toBe('close')
    showInput.value = false
    await expect.poll(() => get('search')).toBeNull()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
    await expect.poll(() => document.activeElement).toBe(get('trigger'))
    wrapper.unmount()
  })

  it('records the focus again on each open when the content stays mounted', async () => {
    const { wrapper, get, open } = mountProgrammatic({ unmountOnHide: false })
    get('search')!.focus()
    open.value = true
    await expect.poll(() => document.activeElement?.getAttribute('data-testid')).toBe('close')
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => document.activeElement).toBe(get('search'))

    await userEvent.click(get('trigger')!)
    await expect.poll(() => document.activeElement?.getAttribute('data-testid')).toBe('close')
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => document.activeElement).toBe(get('trigger'))
    wrapper.unmount()
  })
})

describe('given a Dialog whose update:open handler moves focus, in a real browser', () => {
  it('returns focus to the element focused before the open, not the one the handler focused', async () => {
    const Fixture = defineComponent({
      setup() {
        return () => h('div', [
          h('input', { 'data-testid': 'elsewhere' }),
          h(DialogRoot, {
            'onUpdate:open': (value: boolean) => {
              if (value)
                document.querySelector<HTMLElement>('[data-testid="elsewhere"]')?.focus()
            },
          }, () => [
            h(DialogTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
            h(DialogPortal, null, () => h(DialogContent, { 'aria-describedby': undefined, 'data-testid': 'content' }, () => [
              h(DialogTitle, null, () => 'Title'),
              h(DialogClose, { 'data-testid': 'close' }, () => 'Close'),
            ])),
          ]),
        ])
      },
    })
    const wrapper = mount(Fixture, { attachTo: document.body })
    const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)

    get('trigger')!.focus()
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => document.activeElement?.getAttribute('data-testid')).toBe('close')
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
    await expect.poll(() => document.activeElement?.getAttribute('data-testid')).toBe('trigger')
    wrapper.unmount()
  })
})
