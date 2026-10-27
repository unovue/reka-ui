import type { PopoverHandle } from '.'
import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createPopoverHandle, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '.'

interface Item { name: string }

beforeAll(() => {
  globalThis.ResizeObserver ??= class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

function mountDetached(options: {
  handle?: PopoverHandle<Item>
  rootProps?: Record<string, unknown>
  showSecond?: ReturnType<typeof ref<boolean>>
} = {}) {
  const handle = options.handle ?? createPopoverHandle<Item>()
  const showSecond = options.showSecond ?? ref(true)
  const onBeforeUpdate = vi.fn()
  const onUpdate = vi.fn()
  const Fixture = defineComponent({
    setup() {
      return () => h('div', [
        // Triggers live in an unrelated subtree, outside the Root.
        h('nav', [
          h(PopoverTrigger, { id: 'trigger-a', handle, payload: { name: 'Ada' } }, () => 'Ada'),
          showSecond.value
            ? h(PopoverTrigger, { id: 'trigger-b', handle, payload: { name: 'Bob' } }, () => 'Bob')
            : null,
        ]),
        h('main', [
          h(PopoverRoot, {
            'handle': handle,
            'onBeforeUpdate:open': onBeforeUpdate,
            'onUpdate:open': onUpdate,
            ...options.rootProps,
          }, {
            default: ({ payload, activeTriggerId }: { payload?: Item, activeTriggerId: string | null }) =>
              h(PopoverPortal, null, () => h(PopoverContent, { 'aria-label': 'Details' }, () => [
                h('p', { 'data-testid': 'payload' }, payload?.name ?? 'none'),
                h('p', { 'data-testid': 'active' }, activeTriggerId ?? 'none'),
                h(PopoverClose, null, () => 'Close'),
              ])),
          }),
        ]),
      ])
    },
  })
  const wrapper = mount(Fixture, { attachTo: document.body })
  const byId = (id: string) => document.getElementById(id) as HTMLElement
  const content = () => document.querySelector<HTMLElement>('[role="dialog"]')
  const text = (testId: string) => document.querySelector(`[data-testid="${testId}"]`)?.textContent
  return { wrapper, handle, byId, content, text, onBeforeUpdate, onUpdate, showSecond }
}

describe('popover detached triggers (#2826)', () => {
  let cleanup: (() => void) | undefined
  afterEach(() => {
    cleanup?.()
    cleanup = undefined
    document.body.innerHTML = ''
  })

  it('opens from a trigger outside the Root and renders its payload', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()

    expect(t.content()).toBeNull()
    t.byId('trigger-b').click()
    await nextTick()

    expect(t.content()).not.toBeNull()
    expect(t.text('payload')).toBe('Bob')
    expect(t.text('active')).toBe('trigger-b')
    expect(t.onUpdate).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'trigger-press', trigger: t.byId('trigger-b') }))
    // The content is labelled by the trigger that opened it.
    expect(t.content()!.getAttribute('aria-labelledby')).toBe('trigger-b')
  })

  it('sets aria-expanded / aria-controls on the active trigger only', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()

    t.byId('trigger-a').click()
    await nextTick()

    const a = t.byId('trigger-a')
    const b = t.byId('trigger-b')
    expect(a.getAttribute('aria-expanded')).toBe('true')
    expect(a.getAttribute('aria-controls')).toBe(t.content()!.id)
    expect(a.getAttribute('data-state')).toBe('open')
    expect(b.getAttribute('aria-expanded')).toBe('false')
    expect(b.getAttribute('aria-controls')).toBeNull()
    expect(b.getAttribute('data-state')).toBe('closed')
  })

  it('moves to another trigger without closing, and the switch is cancellable', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()

    t.byId('trigger-a').click()
    await nextTick()
    const contentEl = t.content()
    t.onUpdate.mockClear()

    t.byId('trigger-b').click()
    await nextTick()

    // Same content element: no close / re-open in between.
    expect(t.content()).toBe(contentEl)
    expect(t.text('payload')).toBe('Bob')
    expect(t.byId('trigger-a').getAttribute('aria-expanded')).toBe('false')
    expect(t.byId('trigger-b').getAttribute('aria-expanded')).toBe('true')
    expect(t.onUpdate).toHaveBeenCalledTimes(1)
    expect(t.onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press', trigger: t.byId('trigger-b') }))

    // Cancelling the switch keeps the popover on its current trigger.
    t.onBeforeUpdate.mockImplementationOnce((_value, details) => details.cancel())
    t.byId('trigger-a').click()
    await nextTick()
    expect(t.text('payload')).toBe('Bob')
    expect(t.byId('trigger-b').getAttribute('aria-expanded')).toBe('true')
  })

  it('a second press on the active trigger closes it', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()

    t.byId('trigger-a').click()
    await nextTick()
    t.byId('trigger-a').click()
    await vi.waitFor(() => expect(t.content()).toBeNull())
    expect(t.onUpdate).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'trigger-press' }))
  })

  it('opens and closes imperatively with reason imperative-action, cancellable', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()

    expect(t.handle.isOpen).toBe(false)
    t.handle.open('trigger-a')
    await nextTick()
    expect(t.handle.isOpen).toBe(true)
    expect(t.text('payload')).toBe('Ada')
    expect(t.onBeforeUpdate).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'imperative-action' }))
    expect(t.onUpdate).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'imperative-action', trigger: t.byId('trigger-a') }))

    t.onBeforeUpdate.mockImplementationOnce((_value, details) => details.cancel())
    t.handle.close()
    await nextTick()
    expect(t.handle.isOpen).toBe(true)

    t.handle.close()
    await vi.waitFor(() => expect(t.content()).toBeNull())
    expect(t.handle.isOpen).toBe(false)
    expect(t.onUpdate).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'imperative-action' }))
  })

  it('throws for an unknown trigger id and ignores calls while no Root is mounted', () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()
    expect(() => t.handle.open('missing')).toThrow(/no trigger with that id/)

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const lonely = createPopoverHandle()
    lonely.close()
    expect(lonely.isOpen).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('PopoverHandle.close() was called while no PopoverRoot'))
    warn.mockRestore()
  })

  it('stays open with its payload when the active trigger unmounts', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()

    t.byId('trigger-b').click()
    await nextTick()
    t.showSecond.value = false
    await nextTick()

    expect(document.getElementById('trigger-b')).toBeNull()
    expect(t.content()).not.toBeNull()
    expect(t.text('payload')).toBe('Bob')
    expect(t.byId('trigger-a').getAttribute('aria-expanded')).toBe('false')

    t.handle.close()
    await vi.waitFor(() => expect(t.content()).toBeNull())
  })

  it('returns focus to the trigger that opened it', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()

    t.byId('trigger-b').focus()
    t.byId('trigger-b').click()
    await nextTick()
    document.querySelector<HTMLElement>('[role="dialog"] button')!.click()
    await vi.waitFor(() => expect(t.content()).toBeNull())
    expect(document.activeElement).toBe(t.byId('trigger-b'))
  })

  it('a trigger inside the Root joins the Root\'s handle', async () => {
    const handle = createPopoverHandle<Item>()
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', [
        h(PopoverTrigger, { id: 'outer', handle, payload: { name: 'Outer' } }, () => 'Outer'),
        h(PopoverRoot, { handle }, {
          default: ({ payload }: { payload?: Item }) => [
            h(PopoverTrigger, { id: 'inner', payload: { name: 'Inner' } }, () => 'Inner'),
            h(PopoverContent, { 'aria-label': 'Details' }, () => h('p', { 'data-testid': 'payload' }, payload?.name)),
          ],
        }),
      ]),
    }), { attachTo: document.body })
    cleanup = () => wrapper.unmount()

    document.getElementById('inner')!.click()
    await nextTick()
    expect(document.querySelector('[data-testid="payload"]')?.textContent).toBe('Inner')
    document.getElementById('outer')!.click()
    await nextTick()
    expect(document.querySelector('[data-testid="payload"]')?.textContent).toBe('Outer')
    expect(document.getElementById('inner')!.getAttribute('aria-expanded')).toBe('false')
  })

  it('claims the only trigger when it starts open, and honours defaultTriggerId', async () => {
    const t = mountDetached({ rootProps: { defaultOpen: true, defaultTriggerId: 'trigger-b' } })
    cleanup = () => t.wrapper.unmount()
    await nextTick()
    expect(t.text('payload')).toBe('Bob')
    expect(t.byId('trigger-b').getAttribute('aria-expanded')).toBe('true')
  })

  it('passes axe accessibility tests while open', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()
    t.byId('trigger-a').click()
    await nextTick()
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('does not leak state across SSR renders of a module-scope handle', async () => {
    const handle = createPopoverHandle<Item>()
    const App = defineComponent({
      setup: () => () => h('div', [
        h(PopoverTrigger, { id: 'ssr-trigger', handle, payload: { name: 'Ada' } }, () => 'Ada'),
        h(PopoverRoot, { handle, defaultOpen: true }, {
          default: ({ payload }: { payload?: Item }) => h('span', payload?.name ?? 'none'),
        }),
      ]),
    })
    const first = await renderToString(h(App))
    const second = await renderToString(h(App))
    expect(second).toBe(first)
    expect(first).toContain('aria-expanded="false"')
    expect(handle.isOpen).toBe(false)
    expect(handle.triggers.size).toBe(0)
  })
})
