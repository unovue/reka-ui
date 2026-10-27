import { describe, expect, it, vi } from 'vitest'
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
