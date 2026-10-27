import type { ComponentMountingOptions, VueWrapper } from '@vue/test-utils'
import type { Component } from 'vue'
import { mount } from '@vue/test-utils'
import { onTestFinished } from 'vitest'
import { getActiveElement } from '../getActiveElement'

/**
 * Test harness: mount a component inside a shadow root.
 * Usage: `render(Component, { container: mountTarget })` (@testing-library/vue)
 * or `mount(Component, { attachTo: mountTarget })` (@vue/test-utils).
 * Query results via `shadowRoot.querySelector` — testing-library queries do NOT
 * pierce shadow roots.
 */
export function createShadowHost(): {
  host: HTMLElement
  shadowRoot: ShadowRoot
  mountTarget: HTMLElement
  cleanup: () => void
} {
  const host = document.createElement('div')
  host.setAttribute('data-testid', 'shadow-host')
  document.body.appendChild(host)
  const shadowRoot = host.attachShadow({ mode: 'open' })
  const mountTarget = document.createElement('div')
  shadowRoot.appendChild(mountTarget)
  return { host, shadowRoot, mountTarget, cleanup: () => host.remove() }
}

export interface ShadowMount<T extends Component = Component> {
  wrapper: VueWrapper<any>
  host: HTMLElement
  shadowRoot: ShadowRoot
  /** `[data-testid="<id>"]` inside the shadow root (where portalled content lands by default). */
  get: (testId: string) => HTMLElement | null
  /** `shadowRoot.querySelector` shorthand. */
  query: <E extends Element = HTMLElement>(selector: string) => E | null
  /** The deep (shadow-piercing) active element. */
  activeElement: () => Element | null
  /** Unmount and remove the host. Also runs automatically after the test. */
  cleanup: () => void
  component: T
}

/**
 * Mount `component` into an open shadow root, the way a custom element (or a
 * micro-frontend) would render it: the app is mounted on a node inside
 * `host.attachShadow({ mode: 'open' })`, and nothing is configured to keep
 * portalled content in the root — the components must do that themselves.
 *
 * `css` is adopted into the shadow root (document styles do not apply inside it).
 * The host is removed when the test finishes.
 */
export function mountInShadowRoot<T extends Component>(
  component: T,
  options: ComponentMountingOptions<T> & { css?: string } = {} as any,
): ShadowMount<T> {
  const { css, ...mountOptions } = options
  const { host, shadowRoot, mountTarget, cleanup: removeHost } = createShadowHost()
  if (css) {
    const style = document.createElement('style')
    style.textContent = css
    shadowRoot.prepend(style)
  }
  const wrapper = mount(component as any, { ...mountOptions, attachTo: mountTarget } as any)
  let cleaned = false
  const cleanup = () => {
    if (cleaned)
      return
    cleaned = true
    try {
      wrapper.unmount()
    }
    catch {} // already unmounted (e.g. by `enableAutoUnmount`)
    removeHost()
  }
  try {
    onTestFinished(cleanup)
  }
  catch {} // called outside a running test (e.g. a hook): the caller cleans up
  return {
    wrapper,
    host,
    shadowRoot,
    get: testId => shadowRoot.querySelector<HTMLElement>(`[data-testid="${testId}"]`),
    query: selector => shadowRoot.querySelector(selector),
    activeElement: () => getActiveElement(),
    cleanup,
    component,
  }
}
