import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  configProviderElements,
  defineRekaElements,
  dialogElements,
  scrollAreaElements,
  toggleGroupElements,
} from '.'
import { cleanup, query, render } from './elements.test.helpers'

beforeAll(() => {
  // `configProviderElements` is defined by the "defined later" test below.
  defineRekaElements([toggleGroupElements, dialogElements, scrollAreaElements])
})
afterEach(cleanup)

const TOGGLES = `
  <reka-toggle-group-root type="single" aria-label="Alignment">
    <reka-toggle-group-item value="left">Left</reka-toggle-group-item>
    <reka-toggle-group-item value="center">Center</reka-toggle-group-item>
    <reka-toggle-group-item value="right">Right</reka-toggle-group-item>
  </reka-toggle-group-root>
`

/** An element with an open shadow root holding `html`. */
function shadowHost(container: HTMLElement, html: string) {
  const host = document.createElement('div')
  host.attachShadow({ mode: 'open' }).innerHTML = html
  container.append(host)
  return host.shadowRoot!
}

describe('config provider element', () => {
  it('reaches elements that were defined before it, through the light DOM in between', async () => {
    render(`<reka-config-provider dir="rtl"><section>${TOGGLES}</section></reka-config-provider>`)
    const root = query('reka-toggle-group-root')
    await vi.waitFor(() => expect(root.getAttribute('dir')).toBe('ltr'))

    // Defined now: the elements below move under it.
    defineRekaElements([configProviderElements])
    await vi.waitFor(() => expect(root.getAttribute('dir')).toBe('rtl'))
    const [left, center] = document.querySelectorAll<HTMLElement>('reka-toggle-group-item')
    left.focus()
    // Right to left: ArrowLeft moves forward.
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(center)
  })

  it('updates the elements below when its attributes change', async () => {
    defineRekaElements([configProviderElements])
    render(`<reka-config-provider>${TOGGLES}</reka-config-provider>`)
    const provider = query('reka-config-provider')
    const root = query('reka-toggle-group-root')
    await vi.waitFor(() => expect(root.getAttribute('dir')).toBe('ltr'))
    // `dir` stays the native attribute and property.
    provider.dir = 'rtl'
    await vi.waitFor(() => expect(root.getAttribute('dir')).toBe('rtl'))
    // A part's own `dir` wins.
    root.setAttribute('dir', 'ltr')
    await vi.waitFor(() => expect(root.getAttribute('dir')).toBe('ltr'))
    provider.removeAttribute('dir')
    expect(provider.hasAttribute('data-reka-unmounted')).toBe(false)
  })

  it('sets the default portal target and the `nonce` of the parts below', async () => {
    defineRekaElements([configProviderElements])
    render(`
      <div id="layer"></div>
      <reka-config-provider teleport-to="#layer" nonce="test-nonce">
        <reka-dialog-root default-open>
          <reka-dialog-portal>
            <reka-dialog-content aria-describedby="">
              <reka-dialog-title>Title</reka-dialog-title>
            </reka-dialog-content>
          </reka-dialog-portal>
        </reka-dialog-root>
        <reka-dialog-root default-open>
          <reka-dialog-portal to="body">
            <reka-dialog-content aria-describedby="" id="own">
              <reka-dialog-title>Own target</reka-dialog-title>
            </reka-dialog-content>
          </reka-dialog-portal>
        </reka-dialog-root>
        <reka-scroll-area-root><reka-scroll-area-viewport>Content</reka-scroll-area-viewport></reka-scroll-area-root>
      </reka-config-provider>
    `)
    const layer = query('#layer')
    await vi.waitFor(() => expect(layer.querySelector('reka-dialog-portal')).not.toBeNull())
    expect(layer.querySelector('reka-dialog-content')!.getAttribute('role')).toBe('dialog')
    // A portal's own `to` wins.
    expect(query('#own').closest('reka-dialog-portal')!.parentElement).toBe(document.body)
    const style = () => [...document.head.querySelectorAll('style')].find(style => style.textContent!.includes('[data-reka-scroll-area-viewport]'))
    await vi.waitFor(() => expect(style()).toBeDefined())
    expect(style()!.nonce).toBe('test-nonce')
  })

  describe('in shadow roots', () => {
    it('provides to elements inside a shadow root below it', async () => {
      defineRekaElements([configProviderElements])
      const container = render(`<reka-config-provider dir="rtl"></reka-config-provider>`)
      const shadow = shadowHost(container.querySelector('reka-config-provider')!, TOGGLES)
      const root = shadow.querySelector<HTMLElement>('reka-toggle-group-root')!
      await vi.waitFor(() => expect(root.getAttribute('dir')).toBe('rtl'))
      const [left, center] = shadow.querySelectorAll<HTMLElement>('reka-toggle-group-item')
      left.focus()
      await userEvent.keyboard('{ArrowLeft}')
      expect(shadow.activeElement).toBe(center)
    })

    it('works inside a shadow root, where `teleport-to` is looked up first', async () => {
      defineRekaElements([configProviderElements])
      const container = render('')
      const shadow = shadowHost(container, `
        <div id="layer"></div>
        <reka-config-provider dir="rtl" teleport-to="#layer">
          ${TOGGLES}
          <reka-dialog-root default-open>
            <reka-dialog-portal>
              <reka-dialog-content aria-describedby="">
                <reka-dialog-title>Title</reka-dialog-title>
              </reka-dialog-content>
            </reka-dialog-portal>
          </reka-dialog-root>
        </reka-config-provider>
      `)
      // A `#layer` in the document too: the shadow root's own wins.
      render('<div id="layer"></div>')
      const root = shadow.querySelector<HTMLElement>('reka-toggle-group-root')!
      await vi.waitFor(() => expect(root.getAttribute('dir')).toBe('rtl'))
      const layer = shadow.querySelector('#layer')!
      await vi.waitFor(() => expect(layer.querySelector('reka-dialog-content')).not.toBeNull())
      expect(document.querySelector('#layer')!.children).toHaveLength(0)
    })
  })
})
