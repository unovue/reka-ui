import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import VisuallyHidden from './VisuallyHidden.vue'

describe('given default VisuallyHidden', () => {
  it('renders a span by default', () => {
    const wrapper = mount(VisuallyHidden, { attachTo: document.body })
    expect(wrapper.element.tagName).toBe('SPAN')
    wrapper.unmount()
  })

  it('applies visually-hidden styles', () => {
    const wrapper = mount(VisuallyHidden, { attachTo: document.body })
    const el = wrapper.element as HTMLElement
    expect(el.style.position).toBe('absolute')
    expect(el.style.clipPath).toBe('inset(50%)')
    wrapper.unmount()
  })

  it('renders slot content', () => {
    const wrapper = mount(VisuallyHidden, {
      slots: { default: 'Hidden label text' },
      attachTo: document.body,
    })
    expect(wrapper.text()).toBe('Hidden label text')
    wrapper.unmount()
  })
})

describe('given feature="focusable" (default)', () => {
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(VisuallyHidden, {
      props: { feature: 'focusable' },
      attachTo: document.body,
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('sets aria-hidden="true"', () => {
    expect(wrapper.attributes('aria-hidden')).toBe('true')
  })

  it('does not set tabindex', () => {
    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })

  it('does not set data-hidden', () => {
    expect(wrapper.attributes('data-hidden')).toBeUndefined()
  })
})

describe('given feature="fully-hidden"', () => {
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(VisuallyHidden, {
      props: { feature: 'fully-hidden' },
      attachTo: document.body,
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('sets data-hidden attribute', () => {
    expect(wrapper.attributes('data-hidden')).toBe('')
  })

  it('sets tabindex="-1"', () => {
    expect(wrapper.attributes('tabindex')).toBe('-1')
  })

  it('does not set aria-hidden', () => {
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
  })
})
