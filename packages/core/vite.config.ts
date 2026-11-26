import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const { version } = JSON.parse(readFileSync(resolve(__dirname, './package.json'), 'utf8')) as { version: string }

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    __REKA_UI_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    alias: {
      // The plugins package imports the registry through the built entry; tests run against source.
      'reka-ui/constant': resolve(__dirname, 'constant/index.ts'),
    },
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
