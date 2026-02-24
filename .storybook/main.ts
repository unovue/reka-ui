import type { StorybookConfig } from '@storybook/vue3-vite'
import type { Plugin } from 'vite'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/**
 * Plugin to fix the vue alias to use absolute path
 * This runs in configResolved to override any relative path aliases
 * added by other plugins (like @storybook/vue3-vite's templateCompilation plugin)
 */
function fixVueAliasPlugin(vuePath: string): Plugin {
  return {
    name: 'storybook:fix-vue-alias',
    enforce: 'post',
    configResolved(config) {
      // Find and fix any relative vue aliases
      const alias = config.resolve.alias
      if (Array.isArray(alias)) {
        for (const a of alias) {
          if (a.find === 'vue' || (a.find instanceof RegExp && a.find.test('vue'))) {
            if (!a.replacement.startsWith('/')) {
              console.log('[fix-vue-alias] Fixing relative vue alias:', a.replacement, '->', vuePath)
              a.replacement = vuePath
            }
          }
        }
        // Also add our alias at the beginning if not found
        const hasVueAlias = alias.some((a: any) =>
          a.find === 'vue' || (a.find instanceof RegExp && a.find.test('vue')),
        )
        if (!hasVueAlias) {
          alias.unshift({ find: 'vue', replacement: vuePath })
        }
      }
      else if (typeof alias === 'object') {
        alias.vue = vuePath
      }
    },
  }
}

const config: StorybookConfig = {
  stories: [
    '../packages/core/src/**/*.stories.vue',
    '../packages/core/src/**/*.stories.ts',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-themes',
    'addon-vue-csf',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  staticDirs: ['./public'],
  viteFinal: async (config) => {
    // Ensure config.resolve exists
    config.resolve = config.resolve || {}
    config.resolve.alias = config.resolve.alias || []

    // Get the absolute path to vue
    const vuePath = resolve(__dirname, '../node_modules/vue/dist/vue.esm-bundler.js')
    const srcPath = resolve(__dirname, '../packages/core/src')

    // Ensure plugins array exists
    config.plugins = config.plugins || []

    // Add our fix plugin at the END of the plugins array
    // (enforce: 'post' ensures it runs after other plugins' configResolved)
    config.plugins.push(fixVueAliasPlugin(vuePath))

    // Build the alias array
    let alias: any[] = []

    if (Array.isArray(config.resolve.alias)) {
      // Filter out existing vue and @ aliases to avoid conflicts
      alias = config.resolve.alias.filter((a: any) => {
        if (typeof a === 'object' && a !== null) {
          const find = a.find
          return !(find === 'vue' || find === '@' || (find instanceof RegExp && find.test('vue')))
        }
        return true
      })
    }

    // Add aliases at the beginning to ensure they take precedence
    // @ alias must come before vue alias for proper resolution
    alias.unshift(
      { find: '@', replacement: srcPath },
      { find: 'vue', replacement: vuePath },
    )

    config.resolve.alias = alias

    // Add Vue plugin at the beginning to ensure it runs before addon-vue-csf
    const hasVuePlugin = config.plugins.some(
      (p: any) => p && (p.name === 'vite:vue' || p.name === 'vite:vue2'),
    )

    if (!hasVuePlugin) {
      config.plugins.unshift(vue())
    }

    // Disable vue-docgen-plugin which has issues with @/ alias resolution
    config.plugins = config.plugins.filter((p: any) =>
      p && !p.name?.includes('vue-docgen'),
    )

    // Configure PostCSS with Tailwind
    config.css = config.css || {}
    config.css.postcss = {
      plugins: [
        tailwindcss({
          config: resolve(__dirname, './tailwind.config.js'),
        }),
        autoprefixer(),
      ],
    }

    return config
  },
}

export default config
