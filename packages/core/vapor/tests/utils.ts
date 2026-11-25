import type { App } from 'vue'
import axe from 'axe-core'
import { expect } from 'vitest'
import * as vue from 'vue'
import { nextTick } from 'vue'

declare const __VAPOR__: boolean

const mounted: { app: App, host: HTMLElement }[] = []

/** Vue warnings logged since the last `unmountAll()`. */
export const warnings: string[] = []

/** Mounts `component` in a fresh pure Vapor app (no `vaporInteropPlugin`); a VDOM app for the parity run. */
export async function mount(component: any, props?: Record<string, any>) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = ((vue as any)[__VAPOR__ ? 'createVaporApp' : 'createApp'])(component, props) as App
  app.config.warnHandler = (msg: string) => {
    warnings.push(msg)
  }
  app.mount(host)
  mounted.push({ app, host })
  await nextTick()
  return host
}

export function unmountAll() {
  for (const { app, host } of mounted.splice(0)) {
    app.unmount()
    host.remove()
  }
  warnings.length = 0
  document.body.innerHTML = ''
}

export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el)
    throw new Error(`#${id} not found`)
  return el as T
}

/**
 * Polls `fn` every `interval` ms until it stops throwing (expect.poll for plain assertions). The
 * timeout is generous so a slow CI runner doesn't flake; a passing check returns on the first poll.
 */
export async function until(fn: () => void, timeout = 3000, interval = 16) {
  const start = performance.now()
  for (;;) {
    try {
      fn()
      return
    }
    catch (e) {
      if (performance.now() - start > timeout)
        throw e
      await new Promise(r => setTimeout(r, interval))
    }
  }
}

/** No axe violations on the document. */
export async function expectNoAxeViolations(root: Element = document.body) {
  // `region`: a test mounts a fragment, not a page with landmarks
  const results = await axe.run(root, { rules: { region: { enabled: false } } })
  expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([])
}

/** The element exists, carries `expected` attributes, and kept its own `data-state="mine"` (child wins). */
export function expectAdopted(id: string, expected: Record<string, string | null>) {
  const el = byId(id)
  expect(el.dataset.state).toBe('mine')
  for (const [name, value] of Object.entries(expected))
    expect(el.getAttribute(name), `${id} ${name}`).toBe(value)
  return el
}

/** The element exists and carries `expected` attributes, bound by the consumer from `props`. */
export function expectSlotted(id: string, expected: Record<string, string | null>) {
  const el = byId(id)
  for (const [name, value] of Object.entries(expected))
    expect(el.getAttribute(name), `${id} ${name}`).toBe(value)
  return el
}

export const text = (id: string) => byId(id).textContent?.trim()
