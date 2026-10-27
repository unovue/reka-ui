import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { mountInShadowRoot } from '@/shared/test/shadowDom'
import { PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '.'

function mountPopover(rootProps: Record<string, unknown> = {}, portalProps: Record<string, unknown> = {}) {
  const Fixture = defineComponent({
    setup() {
      return () => h('div', { style: 'padding: 200px;' }, [
        h('button', { 'data-testid': 'outside', 'style': 'position: fixed; top: 0; left: 0;' }, 'Outside'),
        h(PopoverRoot, rootProps, () => [
          h(PopoverTrigger, { 'data-testid': 'trigger', 'style': 'width: 100px; height: 30px;' }, () => 'Open'),
          h(PopoverPortal, portalProps, () => h(PopoverContent, {
            'data-testid': 'content',
            'side': 'bottom',
            'sideOffset': 8,
            'style': 'width: 150px; height: 50px; background: white;',
          }, () => [
            h('input', { 'data-testid': 'input' }),
            h(PopoverClose, { 'data-testid': 'close' }, () => 'Close'),
          ])),
        ]),
      ])
    },
  })
  return mountInShadowRoot(Fixture)
}

describe.each([false, true])('given a Popover (modal: %s) inside a shadow root, in a real browser', (modal) => {
  it('portals into the shadow root and positions the content against the trigger', async () => {
    const { get, shadowRoot } = mountPopover({ modal })

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')?.getAttribute('data-side')).toBe('bottom')
    expect(get('content')!.getRootNode()).toBe(shadowRoot)
    expect(shadowRoot.getElementById(get('trigger')!.getAttribute('aria-controls')!)).toBe(get('content'))

    await expect.poll(() => Math.round(get('content')!.getBoundingClientRect().top - get('trigger')!.getBoundingClientRect().bottom)).toBe(8)
  })

  it('moves focus in, and returns it to the trigger on close and on Escape', async () => {
    const { get, activeElement } = mountPopover({ modal })

    await userEvent.click(get('trigger')!)
    await expect.poll(activeElement).toBe(get('input'))
    await userEvent.click(get('close')!)
    await expect.poll(() => get('content')).toBeNull()
    expect(activeElement()).toBe(get('trigger'))

    await userEvent.click(get('trigger')!)
    await expect.poll(activeElement).toBe(get('input'))
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
    expect(activeElement()).toBe(get('trigger'))
  })

  it('closes on an outside press and toggles from the trigger', async () => {
    const { get, query } = mountPopover({ modal })

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    // A modal popover covers the page with its internal backdrop.
    await userEvent.click(query('[data-reka-internal-backdrop]') ?? get('outside')!, { position: { x: 5, y: 5 } })
    await expect.poll(() => get('content')).toBeNull()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).toBeNull()
  })

  // A force-mounted portal renders before its own mount, when its DOM anchor is
  // not known yet; the content must still mount straight into the shadow root,
  // so root-scoped setup (focus guards) lands there and never in the document.
  it('mounts force-mounted content that starts open directly into the shadow root', async () => {
    const { get, shadowRoot, activeElement } = mountPopover({ modal, defaultOpen: true }, { forceMount: true })

    await expect.poll(() => get('content')).not.toBeNull()
    expect(get('content')!.getRootNode()).toBe(shadowRoot)
    // The guards sit at the edges of the shadow root.
    await expect.poll(() => [shadowRoot.firstElementChild, shadowRoot.lastElementChild].map(el => el?.hasAttribute('data-reka-focus-guard'))).toEqual([true, true])
    expect(document.querySelector('[data-reka-focus-guard]')).toBeNull()
    expect(document.querySelector('[data-reka-internal-backdrop]')).toBeNull()
    await expect.poll(activeElement).toBe(get('input'))
  })
})
