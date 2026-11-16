import { resolve } from 'node:path'
import process from 'node:process'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import { mouseDrag, setReducedMotion, wheelAt } from './vitest.browser.commands'

// Runs `*.browser.test.ts` in a real browser, for behaviour jsdom cannot
// represent: trusted key events, native focus order, form submission and layout.
// Kept apart from `vite.config.ts` so the jsdom suite needs no browser installed.
/**
 * Engines to run in, from `BROWSER_ENGINES` (comma-separated). Chromium alone by
 * default, so the everyday local run stays fast; CI runs Firefox and WebKit too,
 * which differ in ways Chromium cannot show (native scroll snapping, smooth
 * scrolling, `scrollend`, focus and key defaults).
 */
const ENGINES = ['chromium', 'firefox', 'webkit'] as const
type Engine = typeof ENGINES[number]
const engines = (process.env.BROWSER_ENGINES || 'chromium')
  .split(',')
  .map(name => name.trim())
  .filter(Boolean)
for (const name of engines) {
  if (!ENGINES.includes(name as Engine))
    throw new Error(`BROWSER_ENGINES: unknown engine "${name}", expected one of ${ENGINES.join(', ')}`)
}

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
      // Firefox focuses one frame at a time, so test files running side by side take
      // focus from each other: its files run one after another.
      instances: (engines as Engine[]).map(browser => browser === 'firefox' ? { browser, fileParallelism: false } : { browser }),
      screenshotFailures: false,
      commands: { mouseDrag, setReducedMotion, wheelAt },
    },
  },
})
