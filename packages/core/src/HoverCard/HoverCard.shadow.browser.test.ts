import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { mountInShadowRoot } from '@/shared/test/shadowDom'
import { HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from '.'

function mountHoverCard() {
  return mountInShadowRoot(defineComponent({
    setup: () => () => h('div', { 'data-testid': 'scroller', 'style': 'height: 100px; overflow: auto;' }, h('div', { style: 'padding: 20px 20px 400px;' }, [
      h('button', { 'data-testid': 'outside', 'style': 'display: block; margin-bottom: 40px;' }, 'Outside'),
      h(HoverCardRoot, { openDelay: 0, closeDelay: 0 }, () => [
        h(HoverCardTrigger, { 'data-testid': 'trigger', 'href': '#' }, () => 'Profile'),
        h(HoverCardPortal, null, () => h(HoverCardContent, { 'data-testid': 'content', 'side': 'right', 'style': 'background: white; padding: 4px;' }, () => 'Card')),
      ]),
    ])),
  }))
}

describe('given a HoverCard inside a shadow root, in a real browser', () => {
  it('opens on hover into the shadow root and closes on Escape', async () => {
    const { get, shadowRoot } = mountHoverCard()

    await userEvent.hover(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    expect(get('content')!.getRootNode()).toBe(shadowRoot)

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
  })

  it('closes when a scroll container inside the shadow root scrolls the trigger', async () => {
    const { get } = mountHoverCard()

    await userEvent.hover(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    get('scroller')!.scrollTop = 30
    await expect.poll(() => get('content')).toBeNull()
  })
})
