import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { useFocusGuards } from './useFocusGuards'

function makeConsumer(element?: () => HTMLElement | null | undefined) {
  return defineComponent({
    setup() {
      useFocusGuards(element)
      return () => null
    },
  })
}

describe('useFocusGuards', () => {
  it('inserts a guard pair at the document body edges when no element is given (back-compat)', () => {
    const wrapper = render(makeConsumer())
    const guards = document.body.querySelectorAll('[data-reka-focus-guard]')
    expect(guards.length).toBe(2)
    expect((document.body.firstElementChild as HTMLElement).hasAttribute('data-reka-focus-guard')).toBe(true)
    expect((document.body.lastElementChild as HTMLElement).hasAttribute('data-reka-focus-guard')).toBe(true)
    wrapper.unmount()
    expect(document.body.querySelectorAll('[data-reka-focus-guard]').length).toBe(0)
  })

  it('scopes guards to the shadow root, refcounted per root', () => {
    const host = document.body.appendChild(document.createElement('div'))
    const shadowRoot = host.attachShadow({ mode: 'open' })
    const anchor = shadowRoot.appendChild(document.createElement('div'))

    const Consumer = makeConsumer(() => anchor)
    const first = render(Consumer, { container: shadowRoot.appendChild(document.createElement('div')) })
    const second = render(Consumer, { container: shadowRoot.appendChild(document.createElement('div')) })

    const guards = () => shadowRoot.querySelectorAll('[data-reka-focus-guard]')
    expect(guards().length).toBe(2)
    expect((shadowRoot.firstChild as HTMLElement).hasAttribute('data-reka-focus-guard')).toBe(true)
    expect((shadowRoot.lastChild as HTMLElement).hasAttribute('data-reka-focus-guard')).toBe(true)
    // The document body must NOT get guards for the shadow-scoped consumers.
    expect(document.body.querySelectorAll('[data-reka-focus-guard]').length).toBe(0)

    first.unmount()
    expect(guards().length).toBe(2) // one consumer still active — refcount holds
    second.unmount()
    expect(guards().length).toBe(0)
    host.remove()
  })
})
