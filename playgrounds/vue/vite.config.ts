import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // @ts-expect-error types mismatch due to having both Vite 5 and 7 in the repo
    Components({
      dirs: '../../docs/components/demo',
      dts: 'types/docs_components.d.ts',
      directoryAsNamespace: true,
    }),
    // @ts-expect-error types mismatch due to having both Vite 5 and 7 in the repo
    Components({
      globs: '../../packages/core/src/*/*.vue',
      dts: 'types/reka-ui_components.d.ts',
    }),
    // @ts-expect-error types mismatch due to having both Vite 5 and 7 in the repo
    Components({
      dirs: [
        './src/components',
      ],
      dts: 'types/components.d.ts',
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
