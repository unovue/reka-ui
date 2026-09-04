import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig([
  {
    name: 'Nuxt module',
    entries: ['./src/nuxt/index'],
    outDir: '../core/dist',
    clean: false,
    declaration: 'node16',
    externals: [
      '@nuxt/schema',
    ],
  },
  {
    name: 'Unplugin-vue-component Resolver',
    entries: ['./src/resolver/index'],
    outDir: '../core/dist',
    clean: false,
    declaration: 'node16',
    externals: [
      'unplugin-vue-components',
    ],
  },
  {
    name: 'Namespaced',
    entries: ['./src/namespaced/index'],
    outDir: '../core/dist',
    clean: false,
    declaration: 'node16',
    externals: [
      'reka-ui',
    ],
  },
])
