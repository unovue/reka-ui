import { getByRole } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
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

  it('labels its parent with the hidden text', () => {
    // The documented use case: `<button><Icon /><VisuallyHidden>Settings</VisuallyHidden></button>`.
    // Hidden text must contribute to the accessible name, which it cannot do
    // if it is aria-hidden.
    document.body.innerHTML = ''
    const wrapper = mount(defineComponent({
      render: () => h('button', [h('svg'), h(VisuallyHidden, () => 'Settings')]),
    }), { attachTo: document.body })
    expect(getByRole(document.body, 'button', { name: 'Settings' })).toBeTruthy()
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

  it('does not set aria-hidden', () => {
    // `focusable` content must stay in the accessibility tree: it is used for
    // screen-reader-only text (which must be announced) and for tabbable focus
    // sentinels (a tabbable element must not be aria-hidden, per axe
    // `aria-hidden-focus`).
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
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

  it('sets aria-hidden="true"', () => {
    // `fully-hidden` is `tabindex="-1"` (non-focusable), so removing it from the
    // accessibility tree is safe and prevents axe `label`/`nested-interactive`
    // violations for the hidden form inputs that rely on it.
    expect(wrapper.attributes('aria-hidden')).toBe('true')
  })
})
