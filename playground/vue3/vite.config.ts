import { existsSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import vue from '@vitejs/plugin-vue'
import Component from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Component({
      dts: true,
      resolvers: [
        (name) => {
          const demo = resolve(__dirname, '../../docs/components/demo', name, 'tailwind/index.vue')
          if (existsSync(demo))
            return { name: 'default', from: demo.split(sep).join('/') }
        },
      ],
      exclude: [/\.md$/],
    }),
  ],
})
