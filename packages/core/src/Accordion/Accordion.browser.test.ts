import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '.'

// The open animation reads the size variable, as in the docs. It lasts a minute, so it is still
// running whenever the test looks at it.
const css = `
@keyframes reka-test-slide-down { from { height: 0 } to { height: var(--reka-accordion-content-height) } }
.content { overflow: hidden; padding: 6px 0 }
.content[data-state="open"] { animation: reka-test-slide-down 60s linear }
.content-body { height: 75px }
`

let style: HTMLStyleElement | undefined

afterEach(() => {
  style?.remove()
})

describe('given an Accordion with items mounted closed, in a real browser', () => {
  it.each(['single', 'multiple'] as const)('sets the size variable to the content height on the first open (%s)', async (type) => {
    document.body.innerHTML = ''
    style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)

    const wrapper = mount(defineComponent({
      setup() {
        return () => h(AccordionRoot, { type, collapsible: true }, () =>
          ['a', 'b', 'c'].map(item =>
            h(AccordionItem, { key: item, value: item }, () => [
              h(AccordionHeader, () => h(AccordionTrigger, { 'data-testid': `trigger-${item}` }, () => item)),
              h(AccordionContent, { 'class': 'content', 'data-testid': `content-${item}` }, () => h('div', { class: 'content-body' })),
            ])))
      },
    }), { attachTo: document.body })
    const content = () => document.querySelector<HTMLElement>('[data-testid="content-b"]')!
    const height = () => getComputedStyle(content()).getPropertyValue('--reka-accordion-content-height')

    expect(content().hasAttribute('hidden')).toBe(true)

    await userEvent.click(document.querySelector<HTMLElement>('[data-testid="trigger-b"]')!)
    // 75px body + 2 * 6px padding
    await expect.poll(height).toBe('87px')
    expect(content().getAnimations().map(a => (a as CSSAnimation).animationName)).toEqual(['reka-test-slide-down'])

    // Once the animation is done, the content sits at the measured height.
    content().getAnimations().forEach(a => a.finish())
    await expect.poll(() => content().getBoundingClientRect().height).toBe(87)
    wrapper.unmount()
  })
})
