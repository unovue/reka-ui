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
