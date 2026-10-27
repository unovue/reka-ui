import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { mountInShadowRoot } from '@/shared/test/shadowDom'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '.'

function mountAccordion() {
  return mountInShadowRoot(defineComponent({
    setup: () => () => h(AccordionRoot, { type: 'single', collapsible: true }, () => ['one', 'two', 'three'].map(value =>
      h(AccordionItem, { value }, () => [
        h(AccordionHeader, () => h(AccordionTrigger, { 'data-testid': `trigger-${value}` }, () => value)),
        h(AccordionContent, { 'data-testid': `content-${value}` }, () => `Content ${value}`),
      ]))),
  }))
}

describe('given an Accordion inside a shadow root, in a real browser', () => {
  it('moves between triggers with the arrow keys and toggles with Enter', async () => {
    const { get, activeElement, shadowRoot } = mountAccordion()

    get('trigger-one')!.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(activeElement()).toBe(get('trigger-two'))
    await userEvent.keyboard('{End}')
    expect(activeElement()).toBe(get('trigger-three'))
    await userEvent.keyboard('{ArrowDown}')
    expect(activeElement()).toBe(get('trigger-one'))
    await userEvent.keyboard('{ArrowUp}')
    expect(activeElement()).toBe(get('trigger-three'))

    await userEvent.keyboard('{Enter}')
    await expect.poll(() => get('content-three')).not.toBeNull()
    const trigger = get('trigger-three')!
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(shadowRoot.getElementById(trigger.getAttribute('aria-controls')!)).toBe(get('content-three'))
    expect(shadowRoot.getElementById(get('content-three')!.getAttribute('aria-labelledby')!)).toBe(trigger)

    await userEvent.click(get('trigger-one')!)
    await expect.poll(() => get('trigger-one')!.getAttribute('aria-expanded')).toBe('true')
    expect(get('trigger-three')!.getAttribute('aria-expanded')).toBe('false')
  })
})
