import { mount } from '@vue/test-utils'
import { describe, expect, it, onTestFinished } from 'vitest'
import { defineComponent, h } from 'vue'
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from '.'

if (!customElements.get('x-scrollbar-grip')) {
  customElements.define('x-scrollbar-grip', class extends HTMLElement {
    constructor() {
      super()
      const inner = document.createElement('span')
      inner.setAttribute('data-inner', '')
      inner.style.cssText = 'display: block; width: 10px; height: 10px;'
      this.attachShadow({ mode: 'open' }).append(inner)
    }
  })
}

describe('given a ScrollArea in a real browser', () => {
  // The wheel listener sits on the document and reads the composed target,
  // which for a web component in the scrollbar is inside its shadow root.
  it('scrolls on a wheel over a web component inside the scrollbar', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(ScrollAreaRoot, { type: 'always', style: 'width: 200px; height: 100px;' }, () => [
        h(ScrollAreaViewport, { 'data-testid': 'viewport', 'style': 'width: 100%; height: 100%;' }, () => h('div', { style: 'height: 1000px;' })),
        h(ScrollAreaScrollbar, { orientation: 'vertical', style: 'display: flex; width: 10px;' }, () => [
          h(ScrollAreaThumb, { style: 'background: gray;' }),
          h('x-scrollbar-grip'),
        ]),
      ]),
    }), { attachTo: document.body })
    onTestFinished(() => wrapper.unmount())
    const viewport = wrapper.find('[data-testid="viewport"]').element as HTMLElement
    const grip = () => document.querySelector('x-scrollbar-grip')?.shadowRoot?.querySelector('[data-inner]')
    await expect.poll(grip).not.toBeNull()

    grip()!.dispatchEvent(new WheelEvent('wheel', { deltaY: 50, bubbles: true, composed: true, cancelable: true }))
    expect(viewport.scrollTop).toBe(50)
  })
})
