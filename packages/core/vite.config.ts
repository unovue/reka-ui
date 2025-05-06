import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json'

const projectRootDir = resolve(__dirname)

// A bit of a hack, but lets us use the proper extension in chunk filenames
let currentFormat = ''

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: 'tsconfig.build.json',
      cleanVueFileName: true,
      exclude: ['src/test/**', 'src/**/story/**', 'src/**/*.story.vue'],
      rollupTypes: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRootDir, 'src'),
    },
    dedupe: [
      'vue',
      '@vue/runtime-core',
    ],
  },
  build: {
    minify: false,
    target: 'esnext',
    sourcemap: true,
    lib: {
      name: 'reka-ui',
      fileName: (format, name) => {
        currentFormat = format
        return `${name}.${format === 'es' ? 'js' : 'cjs'}`
      },
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        date: resolve(__dirname, 'src/date/index.ts'),
        constant: resolve(__dirname, 'constant/index.ts'),
      },
    },
    rollupOptions: {
      external: [
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.peerDependencies ?? {}),
      ],
      output: {
        // Don't rely on preserveModules
        // It creates a lot of unwanted files because of the multiple sections of SFC files
        manualChunks: (moduleId, meta) => {
          const info = meta.getModuleInfo(moduleId)
          if (!info?.isIncluded) {
            // Don't create empty chunks
            return null
          }

          const [namespace, file] = moduleId.split('?')[0].split('/').slice(-2)
          return `${namespace}/${file.slice(0, file.lastIndexOf('.'))}`
        },

        exports: 'named',
        chunkFileNames: chunk => `${chunk.name}.${currentFormat === 'es' ? 'js' : 'cjs'}`,
        assetFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'style.css')
            return 'index.css'
          return chunkInfo.name as string
        },
      },
    },
  },
})
