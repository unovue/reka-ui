import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
// @ts-expect-error untyped build-script module
import { rekaVaporPlugins } from './vapor/plugins.mjs'

// Runs `vapor/tests/*.vapor.browser.test.ts` against the experimental `reka-ui/vapor` entry, natively:
// a `createVaporApp` per test, no `vaporInteropPlugin`, real input through `userEvent`.
//
// The repo's `vue` stays 3.5 for everything else. Here `vue` resolves to the `vue-vapor` devDependency
// (`npm:vue@3.6.0-rc.16`), and the sources compile through the same plugins as `vapor/vite.config.mjs`,
// so the tests cover what the build ships without needing a build first.
//
// `VAPOR_PARITY=vdom` runs the same tests and fixtures against the regular VDOM entry on the repo's Vue
// 3.5, to tell a Vapor difference from a wrong expectation.
const vdom = process.env.VAPOR_PARITY === 'vdom'
const require = createRequire(import.meta.url)
const vueVapor = dirname(require.resolve('vue-vapor/package.json'))
// axe-core, as `vitest-axe` (jsdom suite) uses it; `vitest-axe` itself is Node-only
const axeCore = createRequire(require.resolve('vitest-axe')).resolve('axe-core/axe.min.js')
const core = import.meta.dirname

export default defineConfig({
  plugins: vdom ? [vue()] : rekaVaporPlugins(),
  define: { __REKA_UI_VERSION__: JSON.stringify('vapor-test'), __VAPOR__: JSON.stringify(!vdom) },
  resolve: {
    alias: [
      { find: '@', replacement: resolve(core, 'src') },
      { find: '#reka', replacement: resolve(core, vdom ? 'src/index.ts' : 'vapor/src/index.ts') },
      { find: /^axe-core$/, replacement: axeCore },
      ...vdom ? [] : [{ find: /^vue$/, replacement: resolve(vueVapor, 'dist/vue.runtime-with-vapor.esm-browser.js') }],
    ],
  },
  optimizeDeps: { exclude: ['vue', 'vue-vapor'] },
  test: {
    globals: true,
    include: ['./vapor/tests/**/*.vapor.browser.test.ts'],
    setupFiles: './vapor/tests/setup.ts',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      screenshotFailures: false,
    },
  },
})
