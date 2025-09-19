import { resolve } from 'node:path'
import { HstVue } from '@histoire/plugin-vue'
import alias from '@rollup/plugin-alias'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const projectRootDir = resolve(__dirname)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    alias({
      entries: [
        {
          find: '@',
          replacement: resolve(projectRootDir, '../packages/core/src'),
        },
      ],
    }),
  ],
  histoire: {
    viteNodeInlineDeps: [/@tanstack/],
    plugins: [{ name: 'builtin:tailwind-tokens' }, HstVue()],
    setupFile: './setup.ts',
    storyMatch: [resolve(projectRootDir, '../packages/core/src/**/*.story.vue')],
    outDir: './dist',
    tree: {
      groups: [
        { title: 'Components', include: _file => true },
        { id: 'utilities', title: 'Utilities' },
      ],
    },
    theme: {
      title: 'Reka UI',
      logo: {
        square: '../docs/content/public/logo.svg',
        light: '../docs/content/public/logo.svg',
        dark: '../docs/content/public/logo.svg',
      },
    },
  },

  server: {
    fs: {
      // Allow serving files from two level up to the project root
      allow: ['..'],
    },
    host: true,
  },
})
