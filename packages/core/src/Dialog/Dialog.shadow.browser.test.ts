import { mount } from '@vue/test-utils'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { mountInShadowRoot } from '@/shared/test/shadowDom'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '.'

function mountDialog() {
  const onOutsideClick = vi.fn()
  const Fixture = defineComponent({
    setup() {
      return () => h('div', [
        h('button', { 'data-testid': 'outside', 'onClick': onOutsideClick }, 'Outside'),
        h(DialogRoot, null, () => [
          h(DialogTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
          h(DialogPortal, null, () => [
            h(DialogOverlay, { 'data-testid': 'overlay', 'style': 'position: fixed; inset: 0;' }),
            h(DialogContent, {
              'data-testid': 'content',
              'style': 'position: fixed; top: 100px; left: 100px; width: 200px; background: white;',
            }, () => [
              h(DialogTitle, { 'data-testid': 'title' }, () => 'Title'),
              h(DialogDescription, { 'data-testid': 'description' }, () => 'Description'),
              h('input', { 'data-testid': 'first' }),
              h(DialogClose, { 'data-testid': 'close' }, () => 'Close'),
            ]),
          ]),
        ]),
      ])
    },
  })
  return { ...mountInShadowRoot(Fixture), onOutsideClick }
}

describe('given a modal Dialog inside a shadow root, in a real browser', () => {
  it('portals the content into the shadow root and wires its aria ids', async () => {
    const warn = vi.spyOn(console, 'warn')
    const { get, shadowRoot } = mountDialog()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    expect(get('content')!.getRootNode()).toBe(shadowRoot)
    expect(document.querySelector('[role="dialog"]')).toBeNull()

    const content = get('content')!
    expect(shadowRoot.getElementById(content.getAttribute('aria-labelledby')!)).toBe(get('title'))
    expect(shadowRoot.getElementById(content.getAttribute('aria-describedby')!)).toBe(get('description'))
    expect(shadowRoot.getElementById(get('trigger')!.getAttribute('aria-controls')!)).toBe(content)
    // The missing-title/description dev checks resolve ids in the shadow root.
    expect(warn.mock.calls.flat().join(' ')).not.toMatch(/DialogTitle|Description/)
    warn.mockRestore()
  })

  it('traps Tab focus, closes on Escape and returns focus to the trigger', async () => {
    const { get, activeElement } = mountDialog()

    await userEvent.click(get('trigger')!)
    await expect.poll(activeElement).toBe(get('first'))

    await userEvent.keyboard('{Tab}')
    expect(activeElement()).toBe(get('close'))
    await userEvent.keyboard('{Tab}')
    expect(activeElement()).toBe(get('first'))
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(activeElement()).toBe(get('close'))

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
    expect(activeElement()).toBe(get('trigger'))
  })

  it('closes on an outside click without activating what is underneath', async () => {
    const { get, onOutsideClick, activeElement, shadowRoot } = mountDialog()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    // A click inside does not dismiss.
    await userEvent.click(get('first')!)
    expect(get('content')).not.toBeNull()

    // The overlay is covered by the content's internal backdrop (also in the shadow root).
    const backdrop = shadowRoot.querySelector<HTMLElement>('[data-reka-internal-backdrop]')
    expect(backdrop).not.toBeNull()
    await userEvent.click(backdrop!, { position: { x: 5, y: 5 } })
    await expect.poll(() => get('content')).toBeNull()
    expect(onOutsideClick).not.toHaveBeenCalled()
    expect(get('content')?.contains(activeElement())).toBeFalsy()
  })

  it('covers the whole page when the shadow host is a containing block for fixed elements', async () => {
    const pageButton = document.createElement('button')
    pageButton.textContent = 'Page'
    pageButton.style.cssText = 'position: fixed; right: 0; bottom: 0;'
    document.body.append(pageButton)
    try {
      const { get, host, shadowRoot } = mountDialog()
      // A transformed host confines a `position: fixed` backdrop inside it to its own box.
      host.style.transform = 'translateZ(0)'

      await userEvent.click(get('trigger')!)
      await expect.poll(() => get('content')).not.toBeNull()
      await expect.poll(() => document.querySelector('[data-reka-internal-backdrop]')).not.toBeNull()
      expect(shadowRoot.querySelector('[data-reka-internal-backdrop]')).toBeNull()

      const rect = pageButton.getBoundingClientRect()
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      expect(hit).not.toBe(pageButton)
      // The content itself stays reachable through the backdrop's cut-out.
      await userEvent.click(get('first')!)
      expect(get('content')).not.toBeNull()

      await userEvent.click(hit as HTMLElement, { position: { x: 1, y: 1 } })
      await expect.poll(() => get('content')).toBeNull()
    }
    finally {
      pageButton.remove()
    }
  })

  it('aria-hides its siblings inside the shadow root and in the document', async () => {
    // `useHideOthers` is disabled in test mode; this test exercises it.
    vi.stubEnv('MODE', 'production')
    const sibling = document.createElement('main')
    document.body.prepend(sibling)
    try {
      const { get, host, shadowRoot } = mountDialog()
      const app = shadowRoot.querySelector('div')!

      await userEvent.click(get('trigger')!)
      await expect.poll(() => get('content')).not.toBeNull()
      await vi.waitFor(() => expect(app.getAttribute('aria-hidden')).toBe('true'))
      expect(sibling.getAttribute('aria-hidden')).toBe('true')
      // The host and the portalled content stay exposed.
      expect(host.hasAttribute('aria-hidden')).toBe(false)
      expect(get('content')!.closest('[aria-hidden]')).toBeNull()

      await userEvent.keyboard('{Escape}')
      await expect.poll(() => get('content')).toBeNull()
      expect(app.hasAttribute('aria-hidden')).toBe(false)
      expect(sibling.hasAttribute('aria-hidden')).toBe(false)
    }
    finally {
      sibling.remove()
      vi.unstubAllEnvs()
    }
  })

  it('locks page scroll while open', async () => {
    const { get } = mountDialog()
    await userEvent.click(get('trigger')!)
    await vi.waitFor(() => expect(getComputedStyle(document.documentElement).overflowY === 'hidden' || getComputedStyle(document.body).overflowY === 'hidden').toBe(true))
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(getComputedStyle(document.documentElement).overflowY !== 'hidden' && getComputedStyle(document.body).overflowY !== 'hidden').toBe(true))
  })
})

/** A trigger and a modal Dialog, for mounting into a shadow root of the test's choosing. */
const MinimalDialog = defineComponent({
  props: { defaultOpen: Boolean },
  setup: props => () => h(DialogRoot, { defaultOpen: props.defaultOpen }, () => [
    h(DialogTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
    h(DialogPortal, null, () => h(DialogContent, { 'data-testid': 'content' }, () => [
      h(DialogTitle, null, () => 'Title'),
      h(DialogDescription, null, () => 'Description'),
    ])),
  ]),
})

/** The nearest composed ancestor-or-self with `aria-hidden="true"`. */
function hiddenAncestor(el: Element) {
  for (let node: Element | null = el; node; node = node.parentElement ?? ((node.parentNode as ShadowRoot | null)?.host ?? null)) {
    if (node.getAttribute('aria-hidden') === 'true')
      return node
  }
  return null
}

describe('given modal Dialogs in several shadow roots, in a real browser', () => {
  it('keeps the most recently opened one exposed to assistive technology', async () => {
    vi.stubEnv('MODE', 'production')
    onTestFinished(() => {
      vi.unstubAllEnvs()
    })
    const a = mountInShadowRoot(MinimalDialog)
    const b = mountInShadowRoot(MinimalDialog)

    await userEvent.click(a.get('trigger')!)
    await expect.poll(() => a.get('content')).not.toBeNull()
    await vi.waitFor(() => expect(b.host.getAttribute('aria-hidden')).toBe('true'))

    // The first modal blocks pointer input to the page: open the second one
    // the way an app would, from code.
    b.get('trigger')!.click()
    await expect.poll(() => b.get('content')).not.toBeNull()
    await vi.waitFor(() => expect(a.host.getAttribute('aria-hidden')).toBe('true'))
    expect(hiddenAncestor(b.get('content')!)).toBeNull()

    // Closing the newer one hands the page back to the older one.
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => b.get('content')).toBeNull()
    await vi.waitFor(() => expect(a.host.hasAttribute('aria-hidden')).toBe(false))
    expect(b.host.getAttribute('aria-hidden')).toBe('true')
    expect(hiddenAncestor(a.get('content')!)).toBeNull()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => a.get('content')).toBeNull()
    await vi.waitFor(() => expect(document.querySelectorAll('[data-aria-hidden]')).toHaveLength(0))
    expect(b.host.hasAttribute('aria-hidden')).toBe(false)
  })

  it('portals into the inner of nested shadow roots and hides siblings at every level', async () => {
    vi.stubEnv('MODE', 'production')
    const outerHost = document.createElement('div')
    const pageSibling = document.createElement('main')
    document.body.append(pageSibling, outerHost)
    const outer = outerHost.attachShadow({ mode: 'open' })
    const outerSibling = document.createElement('div')
    const innerHost = document.createElement('div')
    outer.append(outerSibling, innerHost)
    const inner = innerHost.attachShadow({ mode: 'open' })
    const mountPoint = document.createElement('div')
    inner.append(mountPoint)
    const wrapper = mount(MinimalDialog, { attachTo: mountPoint })
    onTestFinished(() => {
      wrapper.unmount()
      outerHost.remove()
      pageSibling.remove()
      vi.unstubAllEnvs()
    })
    const get = (testId: string) => inner.querySelector<HTMLElement>(`[data-testid="${testId}"]`)

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    expect(get('content')!.parentNode).toBe(inner)
    await vi.waitFor(() => expect(pageSibling.getAttribute('aria-hidden')).toBe('true'))
    expect(outerSibling.getAttribute('aria-hidden')).toBe('true')
    expect(mountPoint.getAttribute('aria-hidden')).toBe('true')
    expect(hiddenAncestor(get('content')!)).toBeNull()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
    expect(inner.activeElement).toBe(get('trigger'))
    expect([pageSibling, outerSibling, mountPoint].map(el => el.hasAttribute('aria-hidden'))).toEqual([false, false, false])
  })

  it('leaves nothing hidden when the shadow host is removed while a modal is open', async () => {
    vi.stubEnv('MODE', 'production')
    const pageSibling = document.createElement('main')
    document.body.prepend(pageSibling)
    onTestFinished(() => {
      pageSibling.remove()
      vi.unstubAllEnvs()
    })
    const { get, host, wrapper } = mountInShadowRoot(MinimalDialog, { props: { defaultOpen: true } })
    await expect.poll(() => get('content')).not.toBeNull()
    await vi.waitFor(() => expect(pageSibling.getAttribute('aria-hidden')).toBe('true'))

    host.remove()
    wrapper.unmount()
    expect(pageSibling.hasAttribute('aria-hidden')).toBe(false)
    expect(document.querySelectorAll('[data-aria-hidden]')).toHaveLength(0)
  })
})

// A shadow-root wrapper whose box is the containing block for fixed elements
// around its slot.
if (!customElements.get('x-transformed-frame')) {
  customElements.define('x-transformed-frame', class extends HTMLElement {
    constructor() {
      super()
      const frame = document.createElement('div')
      frame.style.cssText = 'transform: translateZ(0); width: 300px; height: 200px;'
      frame.append(document.createElement('slot'))
      this.attachShadow({ mode: 'open' }).append(frame)
    }
  })
}

describe('given an inline modal Dialog slotted into a transformed shadow container, in a real browser', () => {
  it('covers the whole page, not just the container', async () => {
    const pageButton = document.createElement('button')
    pageButton.textContent = 'Page'
    pageButton.style.cssText = 'position: fixed; right: 0; bottom: 0;'
    document.body.append(pageButton)
    const wrapper = mount(defineComponent({
      setup: () => () => h('x-transformed-frame', null, h(DialogRoot, { defaultOpen: true }, () =>
        h(DialogPortal, { disabled: true }, () => h(DialogContent, { 'data-testid': 'content', 'style': 'position: fixed; top: 10px; left: 10px; background: white;' }, () => [
          h(DialogTitle, null, () => 'Title'),
          h(DialogDescription, null, () => 'Description'),
        ])))),
    }), { attachTo: document.body })
    onTestFinished(() => {
      wrapper.unmount()
      pageButton.remove()
    })

    await expect.poll(() => document.querySelector('[data-testid="content"]')).not.toBeNull()
    await expect.poll(() => document.querySelector('[data-reka-internal-backdrop]')?.parentElement).toBe(document.body)
    const rect = pageButton.getBoundingClientRect()
    expect(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)).not.toBe(pageButton)
  })
})
