// Custom elements driven by React, the way the "Custom elements" guide documents
// it. Runs twice: the `react19` and `react18` browser projects (React 18 through
// the `react18` / `react-dom18` aliases).
import type { RekaElementEvent } from '.'
import { createElement as h, useEffect, useRef, useState, version } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server.browser'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineRekaElements, dialogElements, rekaElementFamilies } from '.'
import { cleanup, render, settle } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements(rekaElementFamilies)
})
afterEach(cleanup)

const STYLE = { display: 'inline-block', width: 40, height: 20 }
const major = Number(version.split('.')[0])
type SwitchElement = HTMLElement & { modelValue?: boolean | null }

function mount(element: ReturnType<typeof h>) {
  const host = render('')
  const root = createRoot(host)
  flushSync(() => root.render(element))
  return { host, root }
}

describe.runIf(major >= 19)(`React ${version}`, () => {
  it('controlled switch: property in, `onupdate-model-value` out', async () => {
    const seen: unknown[] = []
    function App() {
      const [checked, setChecked] = useState(false)
      return h('reka-switch-root', {
        'aria-label': 'Wi-Fi',
        'style': STYLE,
        'modelValue': checked,
        'disabled': false,
        'onupdate-model-value': (event: RekaElementEvent<boolean>) => {
          seen.push(event.detail.value)
          setChecked(event.detail.value)
        },
      })
    }
    const { host, root } = mount(h(App))
    const el = host.querySelector<SwitchElement>('reka-switch-root')!
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    // React 19 sets props the element defines as properties.
    expect(el.modelValue).toBe(false)
    expect(el.hasAttribute('disabled')).toBe(false)

    await userEvent.click(el)
    await vi.waitFor(() => expect(el.getAttribute('aria-checked')).toBe('true'))
    expect(seen).toEqual([true])
    root.unmount()
  })

  it('controlled listbox of objects: `value` and `modelValue` as properties, compared with `by`', async () => {
    const users = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }]
    const seen: unknown[] = []
    function App() {
      const [selected, setSelected] = useState<unknown>({ id: 2 })
      return h('reka-listbox-root', {
        'by': 'id',
        'modelValue': selected,
        'onupdate-model-value': (event: RekaElementEvent) => {
          seen.push(event.detail.value)
          setSelected(event.detail.value)
        },
      }, h('reka-listbox-content', { 'aria-label': 'Users' }, users.map(user => h('reka-listbox-item', { key: user.id, value: user }, user.name))))
    }
    const { host, root } = mount(h(App))
    const items = [...host.querySelectorAll('reka-listbox-item')]
    await vi.waitFor(() => expect(items[1].getAttribute('aria-selected')).toBe('true'))
    await userEvent.click(items[0])
    await vi.waitFor(() => expect(items[0].getAttribute('aria-selected')).toBe('true'))
    expect(items[1].getAttribute('aria-selected')).toBe('false')
    expect(seen).toEqual([users[0]])
    root.unmount()
  })

  it('does not call a camelCase `onUpdateModelValue` (the typings reject it)', async () => {
    const spy = vi.fn()
    const { host, root } = mount(h('reka-switch-root', { 'aria-label': 'x', 'style': STYLE, 'onUpdateModelValue': spy }))
    const el = host.querySelector('reka-switch-root')!
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    await userEvent.click(el)
    expect(el.getAttribute('aria-checked')).toBe('true')
    expect(spy).not.toHaveBeenCalled()
    root.unmount()
  })
})

describe.runIf(major === 18)(`React ${version}`, () => {
  it('controlled switch through a ref: property in, `addEventListener` out', async () => {
    const seen: unknown[] = []
    function App() {
      const [checked, setChecked] = useState(false)
      const ref = useRef<SwitchElement>(null)
      useEffect(() => {
        const el = ref.current!
        el.modelValue = checked
        const onUpdate = (event: Event) => {
          seen.push((event as RekaElementEvent<boolean>).detail.value)
          setChecked((event as RekaElementEvent<boolean>).detail.value)
        }
        el.addEventListener('update-model-value', onUpdate)
        return () => el.removeEventListener('update-model-value', onUpdate)
      }, [checked])
      return h('reka-switch-root', { 'ref': ref, 'aria-label': 'Wi-Fi', 'style': STYLE })
    }
    const { host, root } = mount(h(App))
    const el = host.querySelector<SwitchElement>('reka-switch-root')!
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    await userEvent.click(el)
    await vi.waitFor(() => expect(el.getAttribute('aria-checked')).toBe('true'))
    expect(seen).toEqual([true])
    root.unmount()
  })

  it('stringifies `disabled={false}` to `disabled="false"`, which is disabled like any HTML boolean attribute', async () => {
    const { host, root } = mount(h('reka-switch-root', { 'aria-label': 'x', 'style': STYLE, 'disabled': false }))
    const el = host.querySelector('reka-switch-root')!
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    expect(el.hasAttribute('data-disabled')).toBe(true)
    expect(el.getAttribute('aria-disabled')).toBe('true')
    // Leave the prop out instead (`disabled={cond || undefined}`).
    root.render(h('reka-switch-root', { 'aria-label': 'x', 'style': STYLE }))
    await vi.waitFor(() => expect(el.hasAttribute('data-disabled')).toBe(false))
    await userEvent.click(el)
    expect(el.getAttribute('aria-checked')).toBe('true')
    root.unmount()
  })
})

describe(`React ${version} hydration`, () => {
  it('hydrates server-rendered elements without a mismatch', async () => {
    const errors: unknown[] = []
    const App = () => h('form', null, h('reka-switch-root', { 'aria-label': 'x', 'name': 'wifi', 'style': STYLE }), h('span', null, 'after'))
    const host = render(renderToString(h(App)))
    const el = host.querySelector('reka-switch-root')!
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    // Nothing next to the element: the DOM React rendered is the DOM it hydrates.
    expect(host.querySelector('form')!.children.length).toBe(2)

    const root = hydrateRoot(host, h(App), { onRecoverableError: error => errors.push(String(error)) })
    await settle()
    await settle()
    expect(errors).toEqual([])
    expect(host.querySelector('reka-switch-root')).toBe(el)
    root.unmount()
  })

  // A portal moves its element out of the server-rendered tree as soon as it is
  // defined, so the guide says to define overlay families after hydration.
  function DialogApp({ prefix }: { prefix: string }) {
    return h('div', null, h(`${prefix}-dialog-root`, null, h(`${prefix}-dialog-portal`, null, h(`${prefix}-dialog-content`, { 'aria-describedby': '' }, h(`${prefix}-dialog-title`, null, 'Title')))), h('span', null, 'after'))
  }

  it('hydrates a dialog with a portal when its elements are defined after hydration', async () => {
    const errors: unknown[] = []
    const host = render(renderToString(h(DialogApp, { prefix: 'hyd' })))
    const root = hydrateRoot(host, h(DialogApp, { prefix: 'hyd' }), { onRecoverableError: error => errors.push(String(error)) })
    await settle()
    await settle()
    defineRekaElements([dialogElements], { prefix: 'hyd' })
    await vi.waitFor(() => expect(document.querySelector('hyd-dialog-portal')!.parentElement).toBe(document.body))
    expect(errors).toEqual([])
    root.unmount()
  })

  it('reports a mismatch when the portal moved before hydration (what the guide warns about)', async () => {
    const errors: unknown[] = []
    const host = render(renderToString(h(DialogApp, { prefix: 'reka' })))
    await vi.waitFor(() => expect(document.querySelector('reka-dialog-portal')!.parentElement).toBe(document.body))
    const root = hydrateRoot(host, h(DialogApp, { prefix: 'reka' }), { onRecoverableError: error => errors.push(String(error)) })
    await settle()
    await settle()
    expect(errors.length).toBeGreaterThan(0)
    root.unmount()
  })
})
