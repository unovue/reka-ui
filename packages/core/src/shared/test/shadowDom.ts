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
  document.body.appendChild(host)
  const shadowRoot = host.attachShadow({ mode: 'open' })
  const mountTarget = document.createElement('div')
  shadowRoot.appendChild(mountTarget)
  return { host, shadowRoot, mountTarget, cleanup: () => host.remove() }
}
