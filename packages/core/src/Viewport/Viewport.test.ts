import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import Viewport from './Viewport.vue'

describe('given default Viewport', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders an element with data-reka-viewport attribute', () => {
    const wrapper = mount(Viewport, { attachTo: document.body })
    // First element is the viewport primitive
    const viewport = wrapper.find('[data-reka-viewport]')
    expect(viewport.exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders with role="presentation"', () => {
    const wrapper = mount(Viewport, { attachTo: document.body })
    const viewport = wrapper.find('[data-reka-viewport]')
    expect(viewport.attributes('role')).toBe('presentation')
    wrapper.unmount()
  })

  it('applies overflow:auto style', () => {
    const wrapper = mount(Viewport, { attachTo: document.body })
    const viewport = wrapper.find('[data-reka-viewport]')
    const el = viewport.element as HTMLElement
    expect(el.style.overflow).toBe('auto')
    wrapper.unmount()
  })

  it('renders a <style> sibling whose text mentions [data-reka-viewport]', () => {
    const wrapper = mount(Viewport, { attachTo: document.body })
    const styleEl = wrapper.find('style')
    expect(styleEl.exists()).toBe(true)
    expect(styleEl.element.textContent).toContain('[data-reka-viewport]')
    wrapper.unmount()
  })

  it('puts nonce attribute on the style tag when nonce prop is provided', () => {
    const wrapper = mount(Viewport, {
      props: { nonce: 'abc123' },
      attachTo: document.body,
    })
    const styleEl = wrapper.find('style')
    // jsdom exposes the attribute reliably (el.nonce may be empty in jsdom)
    expect(styleEl.attributes('nonce')).toBe('abc123')
    wrapper.unmount()
  })
})
