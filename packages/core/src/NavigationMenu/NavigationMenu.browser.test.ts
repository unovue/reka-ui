import type { NavigationMenuChangeReason } from '.'
import type { ChangeEventDetails } from '@/shared'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import {
  NavigationMenuContent,
  NavigationMenuIndicator,
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
    await expect.poll(() => byTestId('trigger-one').hasAttribute('data-popup-open')).toBe(true)
    expect(updates[0][0]).toBe('one')
    expect(updates[0][1].reason).toBe('trigger-hover')
    expect(updates[0][1].event).toBeInstanceOf(PointerEvent)

    await userEvent.hover(byTestId('outside'))
    await expect.poll(() => byTestId('trigger-one').hasAttribute('data-popup-open')).toBe(false)
    expect(updates.map(([value, d]) => [value, d.reason])).toEqual([['one', 'trigger-hover'], ['', 'pointer-leave']])
  })

  it('switches between open triggers on hover without closing', async () => {
    current = mountMenu({ delayDuration: 100 })
    const { byTestId, updates } = current

    await userEvent.hover(byTestId('trigger-one'))
    await expect.poll(() => byTestId('trigger-one').hasAttribute('data-popup-open')).toBe(true)
    await userEvent.hover(byTestId('trigger-two'))
    await expect.poll(() => byTestId('trigger-two').hasAttribute('data-popup-open')).toBe(true)
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

// #1522: a list that wraps onto several rows (or columns). The existing
// variables keep today's values; the cross-offset variables follow the active
// trigger's row (or column).
describe('given a NavigationMenu whose list wraps', () => {
  const VIEWPORT_VARS = ['left', 'top', 'width', 'height', 'cross-offset'] as const
  const INDICATOR_VARS = ['size', 'position', 'cross-offset'] as const
  const pick = (from: Record<string, string>, keys: Record<string, string> = {}) =>
    Object.fromEntries(Object.keys(keys).map(key => [key, from[key]]))

  function mountWrapped(options: { rootTop?: number, contentHeight?: number, rootWidth?: number, orientation?: 'horizontal' | 'vertical', dir?: 'ltr' | 'rtl', itemStyle?: string } = {}) {
    const { rootTop = 300, contentHeight = 200, rootWidth = 300, orientation = 'horizontal', dir = 'ltr', itemStyle = '' } = options
    const vertical = orientation === 'vertical'
    const value = ref('')
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', { style: `position: absolute; left: 100px; top: ${rootTop}px` }, [
        h(NavigationMenuRoot, {
          'style': `position: relative; width: ${rootWidth}px`,
          orientation,
          dir,
          'modelValue': value.value,
          'onUpdate:modelValue': (next: string) => { value.value = next },
        }, () => [
          h(NavigationMenuList, {
            style: `display: flex; flex-wrap: wrap; ${vertical ? 'flex-direction: column; height: 80px;' : ''} margin: 0; padding: 0; list-style: none`,
          }, () => [
            ...['a', 'b', 'c', 'd', 'e'].map(item => h(NavigationMenuItem, { value: item, style: itemStyle }, () => [
              h(NavigationMenuTrigger, { 'data-testid': item, 'style': 'box-sizing: border-box; width: 100px; height: 40px' }, () => item),
              h(NavigationMenuContent, { style: `width: 150px; height: ${contentHeight}px` }, () => item),
            ])),
            h(NavigationMenuIndicator, { 'data-testid': 'indicator', 'style': 'position: absolute' }),
          ]),
          h(NavigationMenuViewport, { 'data-testid': 'viewport', 'style': 'position: absolute' }),
        ]),
      ]),
    }), { attachTo: document.body })

    const read = (id: string, prefix: string, names: readonly string[]): Record<string, string> => {
      const style = document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!.style
      return Object.fromEntries(names.map(name => [name, style.getPropertyValue(`--reka-navigation-menu-${prefix}-${name}`)]))
    }
    const snapshot = () => ({ viewport: read('viewport', 'viewport', VIEWPORT_VARS), indicator: read('indicator', 'indicator', INDICATOR_VARS) })
    // Opened through the model: the center-aligned viewport covers the triggers.
    // The values settle over a few frames (content swap, resize observers), so
    // poll until they match.
    async function expectOpen(item: string, expected: Record<string, Record<string, string>>) {
      value.value = item
      await nextTick()
      await expect.poll(() => {
        const current = snapshot()
        return { viewport: pick(current.viewport, expected.viewport), indicator: pick(current.indicator, expected.indicator) }
      }).toEqual({ viewport: expected.viewport ?? {}, indicator: expected.indicator ?? {} })
    }
    return { wrapper, expectOpen }
  }

  let wrapped: ReturnType<typeof mountWrapped> | undefined
  afterEach(() => {
    wrapped?.wrapper.unmount()
    wrapped = undefined
  })

  it('places the cross offsets on the active trigger\'s row and keeps the existing values', async () => {
    await page.viewport(1280, 800)
    wrapped = mountWrapped()

    // `a` is on the first row, `d` starts the second one.
    await wrapped.expectOpen('a', {
      viewport: { 'left': '-25px', 'top': '-80px', 'width': '150px', 'height': '200px', 'cross-offset': '40px' },
      indicator: { 'size': '100px', 'position': '0px', 'cross-offset': '40px' },
    })
    await wrapped.expectOpen('d', {
      viewport: { 'left': '-25px', 'top': '-40px', 'width': '150px', 'height': '200px', 'cross-offset': '80px' },
      indicator: { 'size': '100px', 'position': '0px', 'cross-offset': '80px' },
    })
  })

  it('measures the indicator cross offset from the list when the items are positioned', async () => {
    await page.viewport(1280, 800)
    wrapped = mountWrapped({ itemStyle: 'position: relative' })

    await wrapped.expectOpen('a', { indicator: { 'size': '100px', 'position': '0px', 'cross-offset': '40px' } })
    await wrapped.expectOpen('d', { indicator: { 'size': '100px', 'position': '0px', 'cross-offset': '80px' } })
  })

  it('keeps the clamped top while the cross offset follows the row', async () => {
    await page.viewport(1280, 800)
    wrapped = mountWrapped({ rootTop: 10 })

    await wrapped.expectOpen('a', { viewport: { 'top': '0px', 'cross-offset': '40px' } })
    await wrapped.expectOpen('d', { viewport: { 'top': '0px', 'cross-offset': '80px' } })
  })

  it('gives a single row the same values as before', async () => {
    await page.viewport(1280, 800)
    wrapped = mountWrapped({ rootWidth: 600, contentHeight: 30 })

    await wrapped.expectOpen('d', {
      viewport: { 'left': '275px', 'top': '5px', 'width': '150px', 'height': '30px', 'cross-offset': '40px' },
      indicator: { 'size': '100px', 'position': '300px', 'cross-offset': '40px' },
    })
  })

  it('places the cross offsets on the active trigger\'s column when vertical', async () => {
    await page.viewport(1280, 800)
    wrapped = mountWrapped({ orientation: 'vertical', contentHeight: 30 })

    // Two triggers per column: `d` is in the second one.
    await wrapped.expectOpen('a', {
      viewport: { 'left': '-25px', 'top': '5px', 'width': '150px', 'height': '30px', 'cross-offset': '100px' },
      indicator: { 'size': '40px', 'position': '0px', 'cross-offset': '100px' },
    })
    await wrapped.expectOpen('d', {
      viewport: { 'left': '75px', 'top': '45px', 'width': '150px', 'height': '30px', 'cross-offset': '200px' },
      indicator: { 'size': '40px', 'position': '40px', 'cross-offset': '200px' },
    })
  })

  it('measures the vertical cross offsets from the right in RTL', async () => {
    await page.viewport(1280, 800)
    wrapped = mountWrapped({ orientation: 'vertical', dir: 'rtl', contentHeight: 30 })

    await wrapped.expectOpen('a', { viewport: { 'cross-offset': '100px' }, indicator: { 'cross-offset': '100px' } })
    await wrapped.expectOpen('d', { viewport: { 'cross-offset': '200px' }, indicator: { 'cross-offset': '200px' } })
  })
})
