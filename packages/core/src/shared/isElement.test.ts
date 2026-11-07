import { describe, expect, it, onTestFinished } from 'vitest'
import { isElement } from './isElement'

describe('isElement', () => {
  it('accepts HTML and SVG elements', () => {
    expect(isElement(document.createElement('div'))).toBe(true)
    expect(isElement(document.createElementNS('http://www.w3.org/2000/svg', 'path'))).toBe(true)
  })

  it('rejects nodes that are not elements, and non-nodes', () => {
    expect(isElement(document.createTextNode('text'))).toBe(false)
    expect(isElement(document)).toBe(false)
    expect(isElement(null)).toBe(false)
    expect(isElement({ nodeType: 1 })).toBe(false)
  })

  it('accepts an element from another realm', () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    onTestFinished(() => iframe.remove())
    const svg = iframe.contentDocument!.createElementNS('http://www.w3.org/2000/svg', 'svg')

    expect(svg instanceof Element).toBe(false)
    expect(isElement(svg)).toBe(true)
  })
})
