import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { mountInShadowRoot } from '@/shared/test/shadowDom'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from '.'

function mountTooltip() {
  const Fixture = defineComponent({
    setup() {
      return () => h(TooltipProvider, { delayDuration: 0 }, () => h('div', { style: 'padding: 100px;' }, [
        h('button', { 'data-testid': 'outside', 'style': 'display: block; margin-bottom: 80px;' }, 'Outside'),
        h(TooltipRoot, null, () => [
          h(TooltipTrigger, { 'data-testid': 'trigger' }, () => 'Hover me'),
          h(TooltipPortal, null, () => h(TooltipContent, { 'data-testid': 'content', 'side': 'right', 'sideOffset': 4, 'style': 'background: white; padding: 4px;' }, () => [
            h('span', null, 'Tip'),
            h('a', { 'href': '#', 'data-testid': 'link' }, 'link'),
          ])),
        ]),
      ]))
    },
  })
  return mountInShadowRoot(Fixture)
}

describe('given a Tooltip inside a shadow root, in a real browser', () => {
  it('opens on hover, stays open while the pointer moves onto the content, and closes on leave', async () => {
    const { get, shadowRoot } = mountTooltip()

    await userEvent.hover(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    expect(get('content')!.getRootNode()).toBe(shadowRoot)
    const describedBy = get('trigger')!.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(shadowRoot.getElementById(describedBy!)?.textContent).toContain('Tip')

    // Hoverable content: the grace area keeps it open on the way to the content.
    await userEvent.hover(get('link')!)
    expect(get('content')).not.toBeNull()

    await userEvent.hover(get('outside')!)
    await expect.poll(() => get('content')).toBeNull()
  })

  // `scroll` is not composed: a scroll inside the shadow root never reaches a
  // window listener, and `document.contains()` does not see into the root.
  it.each(['shadow', 'page'] as const)('closes when a %s scroll container of the trigger scrolls', async (where) => {
    const { get } = mountTooltip()
    const shadowScroller = get('outside')!.parentElement!.parentElement!
    shadowScroller.style.cssText = 'height: 100px; overflow: auto;'
    const spacer = document.createElement('div')
    spacer.style.height = '3000px'
    document.body.append(spacer)
    try {
      await userEvent.hover(get('trigger')!)
      await expect.poll(() => get('content')).not.toBeNull()

      if (where === 'shadow')
        shadowScroller.scrollTop = 40
      else
        window.scrollTo(0, 40)
      await expect.poll(() => get('content')).toBeNull()
    }
    finally {
      // Scroll events are dispatched asynchronously: wait for the restoring one
      // so it cannot close a tooltip opened by the next test.
      if (window.scrollY !== 0) {
        const restored = new Promise(resolve => window.addEventListener('scroll', resolve, { once: true }))
        window.scrollTo(0, 0)
        await restored
      }
      spacer.remove()
    }
  })

  it('opens on keyboard focus and closes on Escape', async () => {
    const { get } = mountTooltip()

    get('outside')!.focus()
    await userEvent.keyboard('{Tab}')
    await expect.poll(() => get('content')).not.toBeNull()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
  })
})
