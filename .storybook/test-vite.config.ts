import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Import the Vue plugin using the full path to avoid resolution issues
const vuePluginPath = resolve(__dirname, '../node_modules/.pnpm/@vitejs+plugin-vue@4.6.2_vite@5.4.21_@types+node@24.0.13__vue@3.5.17_typescript@5.8.3_/node_modules/@vitejs/plugin-vue/dist/index.cjs')
const vue = (await import(vuePluginPath)).default

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '../packages/core/src'),
      // Use absolute path for vue to avoid resolution issues
      'vue': resolve(__dirname, '../node_modules/vue/dist/vue.esm-bundler.js'),
    },
  },
})
