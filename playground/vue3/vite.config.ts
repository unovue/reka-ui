import vue from '@vitejs/plugin-vue'
import Component from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Component({
      dirs: ['../../docs/components/demo', './src/components'],
      dts: true,
      deep: true,
      directoryAsNamespace: true,
      exclude: [/\.md$/],
    }),
  ],
})
