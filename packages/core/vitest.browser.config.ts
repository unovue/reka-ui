import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { configDefaults, defineConfig } from 'vitest/config'

// Runs `*.browser.test.ts` in a real browser, for behaviour jsdom cannot
// represent: trusted key events, native focus order, form submission and layout.
// Kept apart from `vite.config.ts` so the jsdom suite needs no browser installed.

/** Custom elements used from React: once with React 19, once with React 18. */
const REACT_TESTS = './src/**/*.react.browser.test.ts'
const REACT_DEPS = ['react', 'react-dom', 'react-dom/client', 'react-dom/server.browser']

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  test: {
    globals: true,
    setupFiles: './vitest.browser.setup.ts',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      screenshotFailures: false,
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['./**/*.browser.test.{ts,js}'],
          exclude: [...configDefaults.exclude, REACT_TESTS],
        },
      },
      {
        extends: true,
        optimizeDeps: { include: REACT_DEPS },
        test: { name: 'react19', include: [REACT_TESTS] },
      },
      {
        extends: true,
        resolve: {
          alias: [
            { find: /^react$/, replacement: 'react18' },
            { find: /^react-dom(\/.*)?$/, replacement: 'react-dom18$1' },
          ],
        },
        optimizeDeps: { include: REACT_DEPS },
        test: { name: 'react18', include: [REACT_TESTS] },
      },
    ],
  },
})
