// Nodes in different trees must sort as whole trees: WebKit orders disconnected
// nodes one by one, which made a re-sorted Select keep its old order there.
import { describe, expect, it } from 'vitest'
import { compareDocumentOrder } from './documentOrder'

function trees() {
  const fragment = document.createDocumentFragment()
  const list = document.createElement('div')
  fragment.appendChild(list)
  const x = document.createElement('div')
  const y = document.createElement('div')
  list.append(y, x)
  // A KeepAlive's storage: a detached element of its own.
  const storage = document.createElement('div')
  const a = document.createElement('div')
  storage.appendChild(a)
  const page = document.createElement('div')
  document.body.appendChild(page)
  const host = document.createElement('div')
  page.appendChild(host)
  const shadow = host.attachShadow({ mode: 'open' })
  const s = document.createElement('div')
  shadow.appendChild(s)
  return { x, y, a, s, page }
}

describe('compareDocumentOrder', () => {
  it('places every node of one tree on the same side of every node of another', () => {
    const P = Node.DOCUMENT_POSITION_PRECEDING
    for (let i = 0; i < 200; i++) {
      const { x, y, a, s, page } = trees()
      for (const other of [a, s]) {
        expect(Math.sign(compareDocumentOrder(other, x))).toBe(Math.sign(compareDocumentOrder(other, y)))
        expect(Math.sign(compareDocumentOrder(x, other))).toBe(-Math.sign(compareDocumentOrder(other, x)))
      }
      // Within one tree, document order.
      expect(compareDocumentOrder(y, x)).toBeLessThan(0)
      expect(compareDocumentOrder(x, y)).toBeGreaterThan(0)
      expect(compareDocumentOrder(x, x)).toBe(0)
      // Connected nodes are unaffected.
      expect(!!(page.compareDocumentPosition(document.body) & P)).toBe(compareDocumentOrder(page, document.body) > 0)
      page.remove()
    }
  })

  it('sorts a list split across trees into document order within each tree', () => {
    for (let i = 0; i < 200; i++) {
      const { x, y, a, page } = trees()
      const sorted = [a, x, y].sort(compareDocumentOrder).filter(node => node !== a)
      expect(sorted).toEqual([y, x])
      page.remove()
    }
  })
})
