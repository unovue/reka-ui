import { describe, expect, it } from 'vitest'
import { getElementByIdFrom, getEventTarget, getOwnerDocument, getRootNode } from './getRootNode'

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
