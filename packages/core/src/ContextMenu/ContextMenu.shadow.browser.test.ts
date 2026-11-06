import { mount } from '@vue/test-utils'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from '.'

// A menu that stays open on an outside press, so the backdrop stays under the pointer.
const Fixture = defineComponent({
  setup: () => () => h(ContextMenuRoot, null, () => [
    h(ContextMenuTrigger, {
      'data-testid': 'trigger',
      'style': 'display: block; width: 200px; height: 60px; margin: 8px; background: #eee;',
    }, () => 'trigger'),
    h(ContextMenuPortal, null, () => h(ContextMenuContent, {
      'data-testid': 'content',
      'style': 'background: white;',
      'onPointerDownOutside': (event: Event) => event.preventDefault(),
    }, () => h(ContextMenuItem, null, () => 'item'))),
  ]),
})

// `mountInShadowRoot` only attaches open roots; a closed one hides its nodes
// from `composedPath()` at the document, so both modes are mounted here.
function mountInShadow(mode: ShadowRootMode) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const shadowRoot = host.attachShadow({ mode })
  const target = document.createElement('div')
  shadowRoot.appendChild(target)
  const wrapper = mount(Fixture, { attachTo: target })
  onTestFinished(() => {
    wrapper.unmount()
    host.remove()
  })
  return {
    host,
    shadowRoot,
    get: (id: string) => shadowRoot.querySelector<HTMLElement>(`[data-testid="${id}"]`),
  }
}

function trackNativeMenu() {
  const native = vi.fn()
  // Bubbles last; if no handler called preventDefault the browser would show its own menu.
  const listener = (e: Event) => !e.defaultPrevented && native()
  window.addEventListener('contextmenu', listener)
  onTestFinished(() => window.removeEventListener('contextmenu', listener))
  return native
}

describe.each(['open', 'closed'] as const)('given a ContextMenu inside a %s shadow root, in a real browser', (mode) => {
  it('a right click on the backdrop of a menu that stays open shows no native menu', async () => {
    const { host, get, shadowRoot } = mountInShadow(mode)
    const native = trackNativeMenu()

    // Locators cannot reach into a closed root: press the host over the trigger (8px margin).
    await userEvent.click(host, { button: 'right', position: { x: 18, y: 18 } })
    await expect.poll(() => get('content')).not.toBeNull()
    expect(shadowRoot.querySelector('[data-reka-internal-backdrop]')).not.toBeNull()

    await userEvent.click(host, { button: 'right', position: { x: 158, y: 48 }, force: true })
    await new Promise(r => setTimeout(r, 100))
    expect(get('content')).not.toBeNull()
    expect(native).not.toHaveBeenCalled()
  })
})
