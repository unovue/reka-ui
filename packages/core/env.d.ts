/// <reference types="vite/client" />
/// <reference types="vitest/globals" />
/// <reference types="vitest/jsdom" />
/// <reference types="@testing-library/jest-dom/vitest" />
/// <reference types="../../.histoire/node_modules/@histoire/plugin-vue/components" />

import type { AxeMatchers } from 'vitest-axe/matchers'
import 'vitest'

declare module 'vitest' {
  export interface Assertion extends AxeMatchers {}
  export interface AsymmetricMatchersContaining extends AxeMatchers {}
}

// Custom browser commands, defined in `vitest.browser.commands.ts`.
declare module 'vitest/browser' {
  interface BrowserCommands {
    wheelAt: (x: number, y: number, deltaY: number) => Promise<void>
    mouseDrag: (fromX: number, fromY: number, toX: number, toY: number, steps?: number, holdMs?: number) => Promise<void>
  }
}
