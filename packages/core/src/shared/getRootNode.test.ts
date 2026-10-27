import { describe, expect, it } from 'vitest'
import { closestComposed, containsComposed, getComposedParentElement, getElementByIdFrom, getEventTarget, getFlatTreeParentElement, getOwnerDocument, getRootNode, resolveTeleportTarget } from './getRootNode'

function makeShadow() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const shadowRoot = host.attachShadow({ mode: 'open' })
  const inner = document.createElement('div')
  shadowRoot.appendChild(inner)
  return { host, shadowRoot, inner }
}

describe('getRootNode', () => {
  it('returns the document for a regular child', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    expect(getRootNode(el)).toBe(document)
  })
  it('returns the shadow root for a shadow child', () => {
    const { shadowRoot, inner } = makeShadow()
    expect(getRootNode(inner)).toBe(shadowRoot)
  })
  it('falls back to the global document for null', () => {
    expect(getRootNode(null)).toBe(document)
  })
})

describe('getElementByIdFrom (dual-root)', () => {
  it('resolves an id inside the same shadow root that document.getElementById cannot see', () => {
    const { shadowRoot, inner } = makeShadow()
    const p = document.createElement('p')
    p.id = 'desc'
    inner.appendChild(p)
    expect(document.getElementById('desc')).toBeNull() // proves the old code broken
    expect(getElementByIdFrom(inner, 'desc')).toBe(shadowRoot.getElementById('desc'))
  })

  it('falls back to the owner document (content Teleported out of the shadow root)', () => {
    const { inner } = makeShadow()
    // id lives in document.body (portalled), NOT in the anchor's shadow root
    const portalled = document.createElement('p')
    portalled.id = 'portalled'
    document.body.appendChild(portalled)
    expect(getRootNode(inner).getElementById('portalled')).toBeNull()
    expect(getElementByIdFrom(inner, 'portalled')).toBe(portalled)
  })
})

describe('getOwnerDocument', () => {
  it('returns the document for a shadow child', () => {
    const { inner } = makeShadow()
    expect(getOwnerDocument(inner)).toBe(document)
  })
})

describe('getEventTarget', () => {
  it('returns the deep target for an event crossing a shadow boundary', () => {
    const { host, inner } = makeShadow()
    let captured: EventTarget | null = null
    document.addEventListener('pointerdown', e => (captured = getEventTarget(e)), { once: true })
    inner.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }))
    expect(captured).toBe(inner)
    expect(captured).not.toBe(host)
  })
})

describe('resolveTeleportTarget', () => {
  it('keeps Vue semantics in the light DOM', () => {
    expect(resolveTeleportTarget(undefined, document)).toBe('body')
    expect(resolveTeleportTarget('#x', document)).toBe('#x')
    const el = document.createElement('div')
    expect(resolveTeleportTarget(el, document)).toBe(el)
  })

  it('targets the shadow root by default and resolves selectors inside it first', () => {
    const { shadowRoot, inner } = makeShadow()
    inner.className = 'portal'
    expect(resolveTeleportTarget(undefined, shadowRoot)).toBe(shadowRoot)
    expect(resolveTeleportTarget('.portal', shadowRoot)).toBe(inner)
    expect(resolveTeleportTarget('body', shadowRoot)).toBe('body')
  })
})

/** A host with a light-DOM child slotted into a wrapper inside its shadow root. */
function makeSlotted() {
  const host = document.createElement('div')
  host.className = 'host'
  document.body.appendChild(host)
  const wrapper = document.createElement('div')
  wrapper.className = 'wrapper'
  const slot = document.createElement('slot')
  wrapper.appendChild(slot)
  host.attachShadow({ mode: 'open' }).appendChild(wrapper)
  const child = document.createElement('span')
  host.appendChild(child)
  return { host, wrapper, slot, child }
}

describe('composed and flat-tree walks', () => {
  it('steps from a shadow root\'s top level to its host', () => {
    const { host, inner } = makeShadow()
    expect(getComposedParentElement(inner)).toBe(host)
    host.remove()
  })

  it('follows the slot a light-DOM child is assigned to', () => {
    const { host, wrapper, slot, child } = makeSlotted()
    expect(getComposedParentElement(child)).toBe(host)
    expect(getFlatTreeParentElement(child)).toBe(slot)
    expect(getFlatTreeParentElement(slot)).toBe(wrapper)
    expect(getFlatTreeParentElement(wrapper)).toBe(host)
    host.remove()
  })

  it('contains slotted content through its slot, and everything a tree root holds', () => {
    const { host, wrapper, child } = makeSlotted()
    expect(containsComposed(wrapper, child)).toBe(true)
    expect(containsComposed(host, child)).toBe(true)
    expect(containsComposed(document, child)).toBe(true)
    expect(containsComposed(child, wrapper)).toBe(false)
    expect(containsComposed(child, null)).toBe(false)
    expect(containsComposed(host, host.shadowRoot)).toBe(true)
    host.remove()
  })

  it('matches `closest` across shadow boundaries', () => {
    const { host, inner } = makeShadow()
    host.setAttribute('data-match', '')
    expect(inner.closest('[data-match]')).toBeNull()
    expect(closestComposed(inner, '[data-match]')).toBe(host)
    expect(closestComposed(inner, '[data-none]')).toBeNull()
    host.remove()

    const slotted = makeSlotted()
    expect(closestComposed(slotted.child, '.wrapper')).toBe(slotted.wrapper)
    slotted.host.remove()
  })
})
