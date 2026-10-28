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
  it('controlled toggle group: an array property in, `onupdate-model-value` out', async () => {
    const seen: unknown[] = []
    function App() {
      const [value, setValue] = useState<string[]>(['bold'])
      return h('reka-toggle-group-root', {
        'type': 'multiple',
        'aria-label': 'Formatting',
        'modelValue': value,
        'onupdate-model-value': (event: RekaElementEvent<string[]>) => {
          seen.push(event.detail.value)
          setValue(event.detail.value)
        },
      }, h('reka-toggle-group-item', { value: 'bold' }, 'B'), h('reka-toggle-group-item', { value: 'italic' }, 'I'))
    }
    const { host, root } = mount(h(App))
    const [bold, italic] = host.querySelectorAll('reka-toggle-group-item')
    await vi.waitFor(() => expect(bold.getAttribute('aria-pressed')).toBe('true'))
    await userEvent.click(italic)
    await vi.waitFor(() => expect(italic.getAttribute('aria-pressed')).toBe('true'))
    expect(seen).toEqual([['bold', 'italic']])
    root.unmount()
  })

  it('an `onform-submit` prop is a listener the form root sees, and prevents the native submission', async () => {
    const values: unknown[] = []
    const native: boolean[] = []
    const onNative = (event: Event) => {
      native.push(!event.defaultPrevented)
      event.preventDefault()
    }
    document.addEventListener('submit', onNative)
    const { host, root } = mount(h('reka-form-root', {
      'onform-submit': (event: RekaElementEvent) => values.push(event.detail.value),
    }, h('form', { noValidate: true }, h('button', { type: 'submit' }, 'Submit'))))
    try {
      await vi.waitFor(() => expect(host.querySelector('reka-form-root')!.hasAttribute('data-reka-unmounted')).toBe(false))
      await userEvent.click(host.querySelector('button')!)
      await vi.waitFor(() => expect(values).toEqual([{}]))
      expect(native).toEqual([false])
    }
    finally {
      document.removeEventListener('submit', onNative)
      root.unmount()
    }
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
