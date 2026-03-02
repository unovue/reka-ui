import { beforeAll, expect, vi } from 'vitest'

import { configureAxe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'
import '@testing-library/jest-dom/vitest'
import 'vitest-canvas-mock'

expect.extend(matchers)

configureAxe({
  globalOptions: {
    rules: [{
      id: 'region',
      enabled: false,
    }],
  },
})

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()

  // jsdom throws "Not implemented" when getComputedStyle receives a
  // non-empty pseudo-element string. axe-core calls it this way during
  // accessibility audits. Strip the pseudo-element arg so jsdom returns
  // the element's computed styles instead of throwing.
  const originalGetComputedStyle = window.getComputedStyle
  window.getComputedStyle = (elt: Element, pseudoElt?: string | null) =>
    originalGetComputedStyle(elt)
})
