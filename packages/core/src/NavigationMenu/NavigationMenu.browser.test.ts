import type { NavigationMenuChangeReason } from '.'
import type { ChangeEventDetails } from '@/shared'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from '.'

type Details = ChangeEventDetails<NavigationMenuChangeReason>

// Hover intent needs real pointer events: jsdom has no `PointerEvent`, no
// layout and no `pointerenter`/`pointerleave` from pointer movement.
function mountMenu(props: Record<string, unknown> = {}) {
  const updates: Array<[string, Details]> = []
  const wrapper = mount(defineComponent({
    setup: () => () => h('div', { style: 'padding: 40px' }, [
      h('button', { 'data-testid': 'outside', 'style': 'display: block; margin-bottom: 120px' }, 'Outside'),
      h(NavigationMenuRoot, {
        ...props,
        'onUpdate:modelValue': (value: string, details: Details) => updates.push([value, details]),
      }, () => [
        h(NavigationMenuList, { style: 'display: flex; gap: 8px; list-style: none; margin: 0; padding: 0' }, () => [
          h(NavigationMenuItem, { value: 'one' }, () => [
            h(NavigationMenuTrigger, { 'data-testid': 'trigger-one' }, () => 'One'),
            h(NavigationMenuContent, { 'data-testid': 'content-one', 'style': 'width: 200px; height: 80px' }, () => h(NavigationMenuLink, { href: '#a' }, () => 'Link A')),
          ]),
          h(NavigationMenuItem, { value: 'two' }, () => [
            h(NavigationMenuTrigger, { 'data-testid': 'trigger-two' }, () => 'Two'),
            h(NavigationMenuContent, { 'data-testid': 'content-two', 'style': 'width: 200px; height: 80px' }, () => h(NavigationMenuLink, { href: '#b' }, () => 'Link B')),
          ]),
        ]),
        h(NavigationMenuViewport, { 'data-testid': 'viewport' }),
      ]),
    ]),
  }), { attachTo: document.body })
  const byTestId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
  return { wrapper, updates, byTestId }
}

let current: ReturnType<typeof mountMenu> | undefined
afterEach(() => {
  current?.wrapper.unmount()
  current = undefined
})

describe('given a NavigationMenu, in a real browser', () => {
  it('opens on hover after delayDuration with trigger-hover and closes on leave with pointer-leave', async () => {
    current = mountMenu({ delayDuration: 100 })
    const { byTestId, updates } = current

    // The delay itself is asserted with fake timers in `useNavigationMenu.test.ts`.
    await userEvent.hover(byTestId('trigger-one'))
    await expect.poll(() => byTestId('trigger-one').getAttribute('data-state')).toBe('open')
    expect(updates[0][0]).toBe('one')
    expect(updates[0][1].reason).toBe('trigger-hover')
    expect(updates[0][1].event).toBeInstanceOf(PointerEvent)

    await userEvent.hover(byTestId('outside'))
    await expect.poll(() => byTestId('trigger-one').getAttribute('data-state')).toBe('closed')
    expect(updates.map(([value, d]) => [value, d.reason])).toEqual([['one', 'trigger-hover'], ['', 'pointer-leave']])
  })

  it('switches between open triggers on hover without closing', async () => {
    current = mountMenu({ delayDuration: 100 })
    const { byTestId, updates } = current

    await userEvent.hover(byTestId('trigger-one'))
    await expect.poll(() => byTestId('trigger-one').getAttribute('data-state')).toBe('open')
    await userEvent.hover(byTestId('trigger-two'))
    await expect.poll(() => byTestId('trigger-two').getAttribute('data-state')).toBe('open')
    expect(updates.map(([value, d]) => [value, d.reason])).toEqual([['one', 'trigger-hover'], ['two', 'trigger-hover']])
  })

  it('does not open on hover with disableHoverTrigger', async () => {
    current = mountMenu({ delayDuration: 50, disableHoverTrigger: true })
    const { byTestId, updates } = current

    await userEvent.hover(byTestId('trigger-one'))
    await new Promise(resolve => setTimeout(resolve, 200))
    expect(updates).toHaveLength(0)
    await userEvent.click(byTestId('trigger-one'))
    await expect.poll(() => updates.map(([value, d]) => [value, d.reason])).toEqual([['one', 'trigger-press']])
  })

  it('sizes the viewport from the open content', async () => {
    current = mountMenu({ delayDuration: 50 })
    const { byTestId } = current

    await userEvent.click(byTestId('trigger-one'))
    await expect.poll(() => byTestId('viewport').style.getPropertyValue('--reka-navigation-menu-viewport-width')).toBe('200px')
    expect(byTestId('viewport').style.getPropertyValue('--reka-navigation-menu-viewport-height')).toBe('80px')
  })
})

// #2827: the viewport and contents wait for CSS transitions; the root reports
// `update:openComplete` from the viewport.
describe('given a NavigationMenu with CSS transitions', () => {
  it('keeps the viewport until its exit transition ends and reports both directions', async () => {
    const style = document.createElement('style')
    style.textContent = `
      .fade { opacity: 1; transition: opacity 150ms linear; }
      .fade[data-starting-style], .fade[data-ending-style] { opacity: 0; }
    `
    document.head.appendChild(style)
    const value = ref('')
    const onOpenComplete = vi.fn()
    const wrapper = mount(defineComponent({
      setup: () => () => h(NavigationMenuRoot, { 'modelValue': value.value, 'onUpdate:openComplete': onOpenComplete }, () => [
        h(NavigationMenuList, () => ['a', 'b'].map(item => h(NavigationMenuItem, { value: item }, () => [
          h(NavigationMenuTrigger, () => item),
          h(NavigationMenuContent, { 'data-testid': `content-${item}`, 'class': 'fade' }, () => h('div', { style: 'width: 100px; height: 50px' }, item)),
        ]))),
        h(NavigationMenuViewport, { 'data-testid': 'viewport', 'class': 'fade' }),
      ]),
    }), { attachTo: document.body })
    const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
    await new Promise(resolve => requestAnimationFrame(resolve))

    value.value = 'a'
    await vi.waitFor(() => expect(onOpenComplete).toHaveBeenCalledWith(true))
    expect(get('content-a')).not.toBeNull()

    // Switching items keeps the viewport open: the old content fades out.
    value.value = 'b'
    await vi.waitFor(() => expect(get('content-a')?.hasAttribute('data-ending-style')).toBe(true))
    await vi.waitFor(() => expect(get('content-b')).not.toBeNull())
    await vi.waitFor(() => expect(get('content-a')).toBeNull())
    expect(onOpenComplete.mock.calls).toEqual([[true]])

    const closedAt = performance.now()
    value.value = ''
    await vi.waitFor(() => expect(get('viewport')?.hasAttribute('data-ending-style')).toBe(true))
    await vi.waitFor(() => expect(get('viewport')).toBeNull())
    expect(performance.now() - closedAt).toBeGreaterThanOrEqual(130)
    expect(onOpenComplete.mock.calls).toEqual([[true], [false]])

    wrapper.unmount()
    style.remove()
  })
})
