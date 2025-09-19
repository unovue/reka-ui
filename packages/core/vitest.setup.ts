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
})
