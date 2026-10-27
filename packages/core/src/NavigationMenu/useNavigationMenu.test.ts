import type { NavigationMenuChangeReason } from './useNavigationMenu'
import type { ChangeEventDetails } from '@/shared'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuSub,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  useNavigationMenu,
  useNavigationMenuItem,
  useNavigationMenuLink,
  useNavigationMenuTrigger,
} from '.'

type Details = ChangeEventDetails<NavigationMenuChangeReason>

// jsdom has no `PointerEvent`; a `MouseEvent` with `pointerType` is all the handlers read.
function pointer(type: string, pointerType = 'mouse') {
  return Object.assign(new MouseEvent(type, { bubbles: true, cancelable: true }), { pointerType })
}

interface FixtureOptions {
  /** Controlled model; omitted → uncontrolled. */
  model?: ReturnType<typeof ref<string>>
  /** Write the emitted value back into `model`. @default true */
  writeBack?: boolean
  defaultValue?: string
  onBeforeUpdate?: (value: string, details: Details) => void
  viewport?: boolean
}

function mountMenu(options: FixtureOptions = {}) {
  const updates: Array<[string, Details]> = []
  const befores: Array<[string, Details]> = []
  const Fixture = defineComponent({
    setup() {
      return () => h('div', [
        h('button', { 'data-testid': 'outside' }, 'Outside'),
        h(NavigationMenuRoot, {
          'defaultValue': options.defaultValue,
          ...(options.model ? { modelValue: options.model.value } : {}),
          'onBeforeUpdate:modelValue': (value: string, details: Details) => {
            befores.push([value, details])
            options.onBeforeUpdate?.(value, details)
          },
          'onUpdate:modelValue': (value: string, details: Details) => {
            updates.push([value, details])
            if (options.model && options.writeBack !== false)
              options.model.value = value
          },
        }, () => [
          h(NavigationMenuList, () => [
            h(NavigationMenuItem, { value: 'one' }, () => [
              h(NavigationMenuTrigger, { 'data-testid': 'trigger-one' }, () => 'One'),
              h(NavigationMenuContent, { 'data-testid': 'content-one' }, () => [
                h(NavigationMenuLink, { 'href': '#a', 'data-testid': 'link-one' }, () => 'Link A'),
                h(NavigationMenuLink, { href: '#b' }, () => 'Link B'),
              ]),
            ]),
            h(NavigationMenuItem, { value: 'two' }, () => [
              h(NavigationMenuTrigger, { 'data-testid': 'trigger-two' }, () => 'Two'),
              h(NavigationMenuContent, { 'data-testid': 'content-two' }, () => [
                h(NavigationMenuLink, { href: '#c' }, () => 'Link C'),
              ]),
            ]),
            h(NavigationMenuItem, { value: 'top' }, () => [
              h(NavigationMenuLink, { 'href': '#top', 'data-testid': 'link-top' }, () => 'Top'),
            ]),
          ]),
          options.viewport ? h(NavigationMenuViewport, { 'data-testid': 'viewport' }) : null,
        ]),
      ])
    },
  })
  const wrapper = mount(Fixture, { attachTo: document.body })
  const byTestId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  return { wrapper, updates, befores, byTestId, reasons: () => updates.map(([, d]) => d.reason) }
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useNavigationMenu — standalone', () => {
  // A consumer wiring the composables onto plain elements, with no Reka part.
  const Standalone = defineComponent({
    setup() {
      const { root, list, context, modelValue } = useNavigationMenu({ baseId: 'nav', defaultValue: '' })
      const { item, itemContext } = useNavigationMenuItem({ context, value: 'docs' })
      const { trigger, open } = useNavigationMenuTrigger({ context, itemContext })
      const { link } = useNavigationMenuLink({ active: true })
      return () => h('nav', { ...root.attrs.value, 'aria-label': 'Main' }, [
        h('ul', list.attrs.value, [
          h('li', item.attrs.value, [
            h('button', { ...trigger.attrs.value, 'data-testid': 'trigger' }, 'Docs'),
            open.value
              ? h('div', { 'id': itemContext.contentId, 'data-testid': 'content' }, [h('a', { ...link.attrs.value, href: '#' }, 'Home')])
              : null,
          ]),
        ]),
        h('output', { 'data-testid': 'model' }, modelValue.value),
      ])
    },
  })

  it('renders the surfaces, opens on press and passes axe', async () => {
    const wrapper = mount(Standalone, { attachTo: document.body })
    const trigger = wrapper.get('[data-testid="trigger"]')
    expect(wrapper.get('nav').attributes()).toMatchObject({ 'dir': 'ltr', 'data-orientation': 'horizontal', 'data-reka-navigation-menu': '' })
    expect(trigger.attributes()).toMatchObject({
      'id': 'nav-trigger-docs',
      'aria-controls': 'nav-content-docs',
      'aria-expanded': 'false',
      'data-state': 'closed',
    })

    await trigger.trigger('click')
    expect(trigger.attributes()).toMatchObject({ 'aria-expanded': 'true', 'data-state': 'open' })
    expect(wrapper.get('[data-testid="model"]').text()).toBe('docs')
    expect(wrapper.get('a').attributes()).toMatchObject({ 'aria-current': 'page', 'data-active': '' })
    expect(await axe(wrapper.element)).toHaveNoViolations()
    wrapper.unmount()
  })

  it('reports trigger-press and imperative-action, and does not emit for an unchanged value', () => {
    const onUpdate = vi.fn()
    const menu = useNavigationMenu({ onUpdate })
    expect(menu.onItemSelect('a', 'trigger-press')).toBe(true)
    expect(menu.onItemSelect('a', 'trigger-press')).toBe(false)
    expect(menu.onItemDismiss()).toBe(true)
    expect(onUpdate.mock.calls.map(([value, d]) => [value, d.reason])).toEqual([['a', 'trigger-press'], ['', 'imperative-action']])
    expect(menu.previousValue.value).toBe('a')
  })

  it('keeps the value and the previous value when beforeUpdate cancels', () => {
    const onUpdate = vi.fn()
    const menu = useNavigationMenu({ defaultValue: 'a', onBeforeUpdate: (_, d) => d.cancel(), onUpdate })
    expect(menu.onItemSelect('b', 'trigger-press')).toBe(false)
    expect(menu.modelValue.value).toBe('a')
    expect(menu.previousValue.value).toBe('')
    expect(menu.lastChangeDetails.value).toMatchObject({ reason: 'trigger-press', isCanceled: true })
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('writes back a ref-owned model', () => {
    const model = ref<string>()
    const menu = useNavigationMenu({ modelValue: model })
    menu.onItemSelect('a')
    expect(model.value).toBe('a')
    expect(menu.isControlled.value).toBe(true)
  })
})

describe('navigationMenuRoot — reasons', () => {
  it('reports trigger-press for a click and for Space on the open trigger', async () => {
    const { byTestId, reasons, updates } = mountMenu()
    byTestId('trigger-one')!.click()
    await nextTick()
    byTestId('trigger-one')!.focus()
    await fireEvent.keyDown(byTestId('trigger-one')!, { key: ' ', keyCode: 32 })
    expect(updates.map(([value]) => value)).toEqual(['one', ''])
    expect(reasons()).toEqual(['trigger-press', 'trigger-press'])
    expect(updates[0][1].event).toBeInstanceOf(MouseEvent)
  })

  it('reports trigger-hover after the delay, then pointer-leave', async () => {
    vi.useFakeTimers()
    const { byTestId, reasons, updates } = mountMenu()
    const move = pointer('pointermove')
    byTestId('trigger-one')!.dispatchEvent(move)
    expect(updates).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(200)
    expect(updates[0][0]).toBe('one')
    expect(updates[0][1]).toMatchObject({ reason: 'trigger-hover', event: move })

    byTestId('trigger-one')!.dispatchEvent(pointer('pointerleave'))
    await vi.advanceTimersByTimeAsync(150)
    expect(reasons()).toEqual(['trigger-hover', 'pointer-leave'])
  })

  it('opens another trigger at once while open, without a stale close (trigger-hover)', async () => {
    vi.useFakeTimers()
    const { byTestId, updates } = mountMenu()
    byTestId('trigger-one')!.click()
    await nextTick()
    byTestId('trigger-one')!.dispatchEvent(pointer('pointerleave'))
    byTestId('trigger-two')!.dispatchEvent(pointer('pointermove'))
    await vi.advanceTimersByTimeAsync(300)
    expect(updates.map(([value, d]) => [value, d.reason])).toEqual([['one', 'trigger-press'], ['two', 'trigger-hover']])
  })

  it('reports pointer-leave when the pointer leaves the content', async () => {
    vi.useFakeTimers()
    const { byTestId, reasons } = mountMenu()
    byTestId('trigger-one')!.click()
    await nextTick()
    byTestId('content-one')!.dispatchEvent(pointer('pointerleave'))
    await vi.advanceTimersByTimeAsync(150)
    expect(reasons()).toEqual(['trigger-press', 'pointer-leave'])
  })

  it('reports escape-key and returns focus to the trigger', async () => {
    const { byTestId, reasons, befores } = mountMenu()
    byTestId('trigger-one')!.click()
    await nextTick()
    byTestId('link-one')!.focus()
    await fireEvent.keyDown(byTestId('content-one')!, { key: 'Escape' })
    expect(reasons()).toEqual(['trigger-press', 'escape-key'])
    expect(befores).toHaveLength(2)
    expect(document.activeElement).toBe(byTestId('trigger-one'))
  })

  it('reports link-press for a link in the content and for a top-level link', async () => {
    const { byTestId, reasons, befores } = mountMenu()
    byTestId('trigger-one')!.click()
    await nextTick()
    byTestId('link-one')!.click()
    await nextTick()
    expect(reasons()).toEqual(['trigger-press', 'link-press'])
    // The content and the root both hear the dismiss event; only one close is asked.
    expect(befores).toHaveLength(2)

    byTestId('trigger-two')!.click()
    await nextTick()
    byTestId('link-top')!.click()
    expect(reasons()).toEqual(['trigger-press', 'link-press', 'trigger-press', 'link-press'])
  })

  it('reports outside-press for a press outside the menu', async () => {
    const { byTestId, reasons } = mountMenu()
    byTestId('trigger-one')!.click()
    await nextTick()
    // The outside-press listener arms on a macrotask after the content mounts.
    await vi.waitFor(async () => {
      await fireEvent.pointerDown(byTestId('outside')!)
      expect(reasons()).toEqual(['trigger-press', 'outside-press'])
    })
  })

  it('reports focus-outside when focus leaves the menu', async () => {
    const { byTestId, reasons, updates } = mountMenu()
    byTestId('trigger-one')!.click()
    await nextTick()
    byTestId('link-one')!.focus()
    await vi.waitFor(async () => {
      byTestId('outside')!.focus()
      await nextTick()
      expect(reasons()).toEqual(['trigger-press', 'focus-outside'])
    })
    expect(updates[1][1].event).toBeDefined()
  })
})

describe('navigationMenuRoot — cancellation', () => {
  it('keeps the menu closed when an open is cancelled', async () => {
    const { byTestId, updates, befores } = mountMenu({ onBeforeUpdate: (_, d) => d.cancel() })
    byTestId('trigger-one')!.click()
    await nextTick()
    expect(befores).toHaveLength(1)
    expect(updates).toHaveLength(0)
    expect(byTestId('trigger-one')!.getAttribute('data-state')).toBe('closed')
    expect(byTestId('content-one')).toBeNull()
  })

  it('keeps the menu open and focus in place when an Escape close is cancelled, asking once', async () => {
    const { byTestId, updates, befores } = mountMenu({
      onBeforeUpdate: (value, d) => {
        if (value === '')
          d.cancel()
      },
    })
    byTestId('trigger-one')!.click()
    await nextTick()
    byTestId('link-one')!.focus()
    await fireEvent.keyDown(byTestId('content-one')!, { key: 'Escape' })
    expect(befores.map(([, d]) => d.reason)).toEqual(['trigger-press', 'escape-key'])
    expect(updates).toHaveLength(1)
    expect(document.activeElement).toBe(byTestId('link-one'))
    expect(byTestId('content-one')!.getAttribute('data-state')).toBe('open')
  })

  it('asks once when a link close is cancelled', async () => {
    const { byTestId, befores } = mountMenu({
      onBeforeUpdate: (value, d) => {
        if (value === '')
          d.cancel()
      },
    })
    byTestId('trigger-one')!.click()
    await nextTick()
    byTestId('link-one')!.click()
    await nextTick()
    expect(befores.map(([, d]) => d.reason)).toEqual(['trigger-press', 'link-press'])
    expect(byTestId('content-one')).not.toBeNull()
  })

  it('keeps the menu open when a pointer-leave close is cancelled', async () => {
    vi.useFakeTimers()
    const { byTestId, updates } = mountMenu({
      onBeforeUpdate: (value, d) => {
        if (value === '')
          d.cancel()
      },
    })
    byTestId('trigger-one')!.click()
    await nextTick()
    byTestId('content-one')!.dispatchEvent(pointer('pointerleave'))
    await vi.advanceTimersByTimeAsync(500)
    expect(updates).toHaveLength(1)
    expect(byTestId('trigger-one')!.getAttribute('data-state')).toBe('open')
  })
})

describe('navigationMenuRoot — controlled and uncontrolled', () => {
  it('opens defaultValue when uncontrolled', () => {
    const { byTestId } = mountMenu({ defaultValue: 'two' })
    expect(byTestId('trigger-two')!.getAttribute('data-state')).toBe('open')
  })

  it('follows a controlled model and its external changes', async () => {
    const model = ref('one')
    const { byTestId, updates } = mountMenu({ model })
    expect(byTestId('trigger-one')!.getAttribute('data-state')).toBe('open')
    model.value = 'two'
    await nextTick()
    expect(byTestId('trigger-two')!.getAttribute('data-state')).toBe('open')
    expect(updates).toHaveLength(0)
  })

  it('emits but does not open a controlled menu whose parent ignores the update', async () => {
    const model = ref('')
    const { byTestId, updates } = mountMenu({ model, writeBack: false })
    byTestId('trigger-one')!.click()
    await nextTick()
    expect(updates.map(([value]) => value)).toEqual(['one'])
    expect(byTestId('trigger-one')!.getAttribute('data-state')).toBe('closed')
  })

  it('does not emit when hovering the trigger of the item already open', async () => {
    vi.useFakeTimers()
    const { byTestId, updates } = mountMenu({ defaultValue: 'one' })
    byTestId('trigger-one')!.dispatchEvent(pointer('pointermove'))
    await vi.advanceTimersByTimeAsync(300)
    expect(updates).toHaveLength(0)
  })
})

describe('navigationMenuSub — reasons and model', () => {
  function mountSub(subOptions: { onBeforeUpdate?: (v: string, d: Details) => void } = {}) {
    const updates: Array<[string, Details]> = []
    const wrapper = mount(defineComponent({
      setup: () => () => h(NavigationMenuRoot, { defaultValue: 'products' }, () => h(NavigationMenuList, () => h(NavigationMenuItem, { value: 'products' }, () => [
        h(NavigationMenuTrigger, () => 'Products'),
        h(NavigationMenuContent, () => h(NavigationMenuSub, {
          'defaultValue': 'a',
          'onBeforeUpdate:modelValue': (v: string, d: Details) => subOptions.onBeforeUpdate?.(v, d),
          'onUpdate:modelValue': (v: string, d: Details) => updates.push([v, d]),
        }, () => h(NavigationMenuList, () => [
          h(NavigationMenuItem, { value: 'a' }, () => [
            h(NavigationMenuTrigger, { 'data-testid': 'sub-a' }, () => 'A'),
            h(NavigationMenuContent, () => 'Sub A'),
          ]),
          h(NavigationMenuItem, { value: 'b' }, () => [
            h(NavigationMenuTrigger, { 'data-testid': 'sub-b' }, () => 'B'),
            h(NavigationMenuContent, () => 'Sub B'),
          ]),
        ]))),
      ]))),
    }), { attachTo: document.body })
    return { wrapper, updates, byTestId: (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`) }
  }

  it('opens a sub item on hover at once (trigger-hover) and on press (trigger-press)', async () => {
    const { byTestId, updates } = mountSub()
    byTestId('sub-b')!.dispatchEvent(pointer('pointermove'))
    await nextTick()
    expect(byTestId('sub-b')!.getAttribute('data-state')).toBe('open')
    byTestId('sub-b')!.dispatchEvent(pointer('pointerleave'))
    byTestId('sub-a')!.click()
    await nextTick()
    expect(updates.map(([value, d]) => [value, d.reason])).toEqual([['b', 'trigger-hover'], ['a', 'trigger-press']])
  })

  it('cancels a sub change without touching the root', async () => {
    const { byTestId, updates } = mountSub({ onBeforeUpdate: (_, d) => d.cancel() })
    byTestId('sub-b')!.click()
    await nextTick()
    expect(updates).toHaveLength(0)
    expect(byTestId('sub-a')!.getAttribute('data-state')).toBe('open')
  })
})

describe('navigationMenuContent — outside events', () => {
  it('emits pointerDownOutside and interactOutside once per press', async () => {
    const onPointerDownOutside = vi.fn()
    const onInteractOutside = vi.fn()
    mount(defineComponent({
      setup: () => () => h('div', [
        h('button', { 'data-testid': 'outside' }, 'Outside'),
        h(NavigationMenuRoot, { defaultValue: 'one' }, () => h(NavigationMenuList, () => h(NavigationMenuItem, { value: 'one' }, () => [
          h(NavigationMenuTrigger, () => 'One'),
          h(NavigationMenuContent, { onPointerDownOutside, onInteractOutside }, () => 'Content'),
        ]))),
      ]),
    }), { attachTo: document.body })
    await vi.waitFor(async () => {
      await fireEvent.pointerDown(document.querySelector('[data-testid="outside"]')!)
      expect(onPointerDownOutside).toHaveBeenCalled()
    })
    expect(onPointerDownOutside).toHaveBeenCalledTimes(1)
    // `interactOutside` follows the focus move, not the press, as in v2.
    expect(onInteractOutside).not.toHaveBeenCalled()
  })
})

describe('navigationMenuViewport', () => {
  it('passes axe with the viewport and keeps the motion attribute unset on first open', async () => {
    const { wrapper, byTestId } = mountMenu({ viewport: true })
    byTestId('trigger-one')!.click()
    await nextTick()
    await nextTick()
    expect(byTestId('viewport')!.getAttribute('data-state')).toBe('open')
    expect(byTestId('content-one')!.hasAttribute('data-motion')).toBe(false)
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('sets data-motion when moving from one item to the next', async () => {
    const { byTestId } = mountMenu({ viewport: true })
    byTestId('trigger-one')!.click()
    await nextTick()
    byTestId('trigger-two')!.click()
    await nextTick()
    await nextTick()
    expect(byTestId('content-two')!.getAttribute('data-motion')).toBe('from-end')
    expect(byTestId('content-one')!.getAttribute('data-motion')).toBe('to-start')
  })
})
