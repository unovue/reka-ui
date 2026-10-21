import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

// Runs `*.browser.test.ts` in a real browser, for behaviour jsdom cannot
// represent: trusted key events, native focus order, form submission and layout.
// Kept apart from `vite.config.ts` so the jsdom suite needs no browser installed.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  test: {
    globals: true,
    include: ['./**/*.browser.test.{ts,js}'],
    setupFiles: './vitest.browser.setup.ts',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      screenshotFailures: false,
    },
  },
})
