import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // @ts-expect-error types mismatch due to having both Vite 5 and 7 in the repo
    Components({
      globs: '../../packages/core/src/*/*.vue',
    }),
  ],
  optimizeDeps: {
    include: [
      '@iconify/vue',
      '@vueuse/core',
      '@vueuse/shared',
      'defu',
      'ohash',
      '@internationalized/date',
      'aria-hidden',
      '@floating-ui/vue',
      '@tanstack/vue-virtual',
      '@internationalized/number',
    ],
  },
})
