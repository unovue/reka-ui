import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { mountInShadowRoot } from '@/shared/test/shadowDom'
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from '.'

function mountMenu() {
  const Fixture = defineComponent({
    setup: () => () => h('div', { style: 'padding: 40px' }, [
      h('button', { 'data-testid': 'outside', 'style': 'display: block; margin-bottom: 120px' }, 'Outside'),
      h(NavigationMenuRoot, { delayDuration: 0 }, () => [
        h(NavigationMenuList, { style: 'display: flex; gap: 8px; list-style: none; margin: 0; padding: 0' }, () => [
          h(NavigationMenuItem, { value: 'one' }, () => [
            h(NavigationMenuTrigger, { 'data-testid': 'trigger-one' }, () => 'One'),
            h(NavigationMenuContent, { 'data-testid': 'content-one', 'style': 'width: 200px; height: 80px' }, () => h(NavigationMenuLink, { 'href': '#a', 'data-testid': 'link-a' }, () => 'Link A')),
          ]),
          h(NavigationMenuItem, { value: 'two' }, () => [
            h(NavigationMenuTrigger, { 'data-testid': 'trigger-two' }, () => 'Two'),
            h(NavigationMenuContent, { 'data-testid': 'content-two', 'style': 'width: 200px; height: 80px' }, () => h(NavigationMenuLink, { 'href': '#b', 'data-testid': 'link-b' }, () => 'Link B')),
          ]),
        ]),
        h(NavigationMenuViewport, { 'data-testid': 'viewport' }),
      ]),
    ]),
  })
  return mountInShadowRoot(Fixture)
}

describe('given a NavigationMenu inside a shadow root, in a real browser', () => {
  it('opens on hover, switches between items and closes on an outside click', async () => {
    const { get } = mountMenu()

    await userEvent.hover(get('trigger-one')!)
    await expect.poll(() => get('content-one')).not.toBeNull()
    await userEvent.hover(get('trigger-two')!)
    await expect.poll(() => get('content-two')).not.toBeNull()
    await expect.poll(() => get('content-one')).toBeNull()

    await userEvent.click(get('outside')!)
    await expect.poll(() => get('content-two')).toBeNull()
  })

  it('moves focus into the content with the keyboard, and back to the trigger on Escape', async () => {
    const { get, activeElement, shadowRoot } = mountMenu()

    get('trigger-one')!.focus()
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => get('content-one')).not.toBeNull()
    expect(shadowRoot.getElementById(get('trigger-one')!.getAttribute('aria-controls')!)).toBe(get('content-one'))

    // The trigger's focus proxy hands Tab into the open content.
    await userEvent.keyboard('{Tab}')
    await expect.poll(activeElement).toBe(get('link-a'))
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content-one')).toBeNull()
    expect(activeElement()).toBe(get('trigger-one'))
  })

  it('roves between triggers with the arrow keys', async () => {
    const { get, activeElement } = mountMenu()

    get('trigger-one')!.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(activeElement()).toBe(get('trigger-two'))
    await userEvent.keyboard('{ArrowLeft}')
    expect(activeElement()).toBe(get('trigger-one'))
  })
})
