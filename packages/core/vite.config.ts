import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    // `*.browser.test.ts` runs in a real browser, see `vitest.browser.config.ts`
    exclude: ['**/node_modules/**', './**/*.browser.test.{ts,js}'],
    include: ['./**/*.test.{ts,js}'],
    coverage: {
      provider: 'istanbul', // or 'v8'
    },
    globalSetup: './vitest.global.ts',
    setupFiles: './vitest.setup.ts',
    server: {
      deps: {
        inline: ['vitest-canvas-mock'],
      },
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
  },
})
