import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '.'

function mountPopover(contentProps: Record<string, unknown> = {}) {
  const Fixture = defineComponent({
    setup() {
      return () => h('div', { style: 'padding: 200px;' }, [
        h(PopoverRoot, null, () => [
          h(PopoverTrigger, { 'data-testid': 'trigger', 'style': 'width: 100px; height: 30px;' }, () => 'Open'),
          h(PopoverPortal, null, () => h(PopoverContent, {
            'data-testid': 'content',
            'style': 'width: 150px; height: 50px;',
            ...contentProps,
          }, () => 'Content')),
        ]),
        h('button', { 'data-testid': 'outside', 'style': 'position: fixed; top: 0; left: 0;' }, 'Outside'),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  return { get }
}

describe('given a Popover, in a real browser', () => {
  // jsdom has no layout, so positioning can only be asserted here.
  it.each([
    ['bottom', 8],
    ['top', 0],
  ] as const)('positions the content on the %s side with sideOffset %s', async (side, sideOffset) => {
    const { get } = mountPopover({ side, sideOffset })

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')?.getAttribute('data-side')).toBe(side)

    await expect.poll(() => {
      const trigger = get('trigger')!.getBoundingClientRect()
      const content = get('content')!.getBoundingClientRect()
      return Math.round(side === 'bottom' ? content.top - trigger.bottom : trigger.top - content.bottom)
    }).toBe(sideOffset)

    const trigger = get('trigger')!.getBoundingClientRect()
    const content = get('content')!.getBoundingClientRect()
    // Centre-aligned by default.
    expect(Math.round(content.left + content.width / 2)).toBe(Math.round(trigger.left + trigger.width / 2))
  })

  it('closes on an outside click and on Escape', async () => {
    const { get } = mountPopover()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    await userEvent.click(get('outside')!)
    await expect.poll(() => get('content')).toBeNull()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
    expect(document.activeElement).toBe(get('trigger'))
  })
})
