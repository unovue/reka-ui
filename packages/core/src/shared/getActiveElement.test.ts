import { describe, expect, it } from 'vitest'
import { getActiveElement } from './getActiveElement'

describe('getActiveElement', () => {
  it('should return the active element when it is a regular element', () => {
    const element = createFocusableElement()
    document.body.appendChild(element)
    element.focus()

    expect(getActiveElement()).toBe(element)

    document.body.removeChild(element)
  })

  it('should return the deepest active element in shadow DOM', () => {
    const host = createShadowDom()
    const hostElement = createFocusableElement()
    host.shadowRoot?.appendChild(hostElement)

    const nested = createShadowDom()
    const nestedElement = createFocusableElement()
    nested.shadowRoot?.appendChild(nestedElement)

    host.shadowRoot?.appendChild(nested)

    document.body.appendChild(host)

    nestedElement.focus()

    expect(getActiveElement()).toBe(nestedElement)

    document.body.removeChild(host)
  })
})

function createFocusableElement() {
  const button = document.createElement('button')
  button.innerText = 'Test Button'

  return button
}

function createShadowDom() {
  const host = document.createElement('div')
  host.attachShadow({ mode: 'open' })

  return host
}
