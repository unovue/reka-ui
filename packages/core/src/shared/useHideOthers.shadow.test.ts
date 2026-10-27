import { hideOthers } from 'aria-hidden'
import { afterEach, describe, expect, it } from 'vitest'
import { hideOthersAcrossShadowRoots } from './useHideOthers'

// The real `aria-hidden` (the sibling suite mocks it): these cases depend on
// how two locks interact through its reference counts and markers.

afterEach(() => {
  document.body.innerHTML = ''
})

/** A web component with its app and a portalled modal in one shadow root. */
function widget(parent: Element = document.body) {
  const host = document.createElement('div')
  parent.appendChild(host)
  const root = host.attachShadow({ mode: 'open' })
  const app = document.createElement('div')
  const content = document.createElement('div')
  root.append(app, content)
  return { host, root, app, content }
}

/** The nearest composed ancestor-or-self with `aria-hidden="true"`. */
function hiddenAncestor(el: Element) {
  for (let node: Element | null = el; node; node = node.parentElement ?? ((node.parentNode as ShadowRoot | null)?.host ?? null)) {
    if (node.getAttribute('aria-hidden') === 'true')
      return node
  }
  return null
}

describe('hideOthersAcrossShadowRoots with modals in two shadow roots (#2725)', () => {
  it('keeps the newer modal exposed and hides the older one, as in the light DOM', () => {
    const a = widget()
    const b = widget()
    const undoA = hideOthersAcrossShadowRoots(a.content)
    expect(hiddenAncestor(b.content)).toBe(b.host)

    const undoB = hideOthersAcrossShadowRoots(b.content)
    expect(hiddenAncestor(b.content)).toBeNull()
    expect(hiddenAncestor(a.content)).toBe(a.host)

    undoB()
    undoA()
  })

  it('reference: in the light DOM the modal portalled later stays exposed', () => {
    const a = document.createElement('div')
    document.body.appendChild(a)
    const undoA = hideOthers(a)
    const b = document.createElement('div')
    document.body.appendChild(b)
    const undoB = hideOthers(b)
    expect(b.closest('[aria-hidden="true"]')).toBeNull()
    expect(a.getAttribute('aria-hidden')).toBe('true')
    undoB()
    undoA()
  })

  it('lifts a hold on a wrapper around the newer modal\'s host too', () => {
    const a = widget()
    const wrapper = document.createElement('section')
    document.body.appendChild(wrapper)
    const b = widget(wrapper)
    const undoA = hideOthersAcrossShadowRoots(a.content)
    expect(hiddenAncestor(b.content)).toBe(wrapper)

    const undoB = hideOthersAcrossShadowRoots(b.content)
    expect(hiddenAncestor(b.content)).toBeNull()
    undoB()
    undoA()
  })

  it('hands the hold back when the newer modal closes first', () => {
    const a = widget()
    const b = widget()
    const undoA = hideOthersAcrossShadowRoots(a.content)
    const undoB = hideOthersAcrossShadowRoots(b.content)

    undoB()
    expect(b.host.getAttribute('aria-hidden')).toBe('true')
    expect(hiddenAncestor(a.content)).toBeNull()

    undoA()
    expect(b.host.hasAttribute('aria-hidden')).toBe(false)
    expect(document.querySelectorAll('[data-aria-hidden]')).toHaveLength(0)
  })

  it('leaves nothing hidden when the older modal closes first', () => {
    const a = widget()
    const b = widget()
    const undoA = hideOthersAcrossShadowRoots(a.content)
    const undoB = hideOthersAcrossShadowRoots(b.content)

    undoA()
    expect(hiddenAncestor(b.content)).toBeNull()
    expect(hiddenAncestor(a.content)).toBe(a.host)

    undoB()
    expect([a.host, b.host, a.app, b.app].map(el => el.hasAttribute('aria-hidden'))).toEqual([false, false, false, false])
    expect(document.querySelectorAll('[data-aria-hidden]')).toHaveLength(0)
  })

  it('keeps an author\'s own `aria-hidden` on an ancestor', () => {
    const b = widget()
    b.host.setAttribute('aria-hidden', 'true')
    const undoB = hideOthersAcrossShadowRoots(b.content)
    expect(b.host.getAttribute('aria-hidden')).toBe('true')
    undoB()
    expect(b.host.getAttribute('aria-hidden')).toBe('true')
  })
})
