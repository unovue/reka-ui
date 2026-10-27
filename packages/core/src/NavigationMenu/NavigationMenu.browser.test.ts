import type { NavigationMenuChangeReason } from '.'
import type { ChangeEventDetails } from '@/shared'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
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
