const { resolve } = require('node:path')

// Import Vue plugin
const vue = require('@vitejs/plugin-vue')

/** @type {import('@storybook/vue3-vite').StorybookConfig} */
const config = {
  stories: [
    '../packages/core/src/**/*.stories.vue',
    '../packages/core/src/**/*.stories.ts',
  ],
  addons: [
    '@storybook/addon-essentials',
    'addon-vue-csf',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  viteFinal: async (config) => {
    // Ensure config.resolve exists
    config.resolve = config.resolve || {}

    // Handle alias configuration
    let alias = config.resolve.alias || {}

    // If alias is an array, convert it to an object
    if (Array.isArray(alias)) {
      const aliasObj = {}
      for (const a of alias) {
        if (a.find && a.replacement) {
          aliasObj[a.find] = a.replacement
        }
      }
      alias = aliasObj
    }

    // Set the @ alias
    alias['@'] = resolve(__dirname, '../packages/core/src')

    // Fix vue alias to use absolute path - must be resolved to actual file
    alias.vue = resolve(__dirname, '../node_modules/vue/dist/vue.esm-bundler.js')

    config.resolve.alias = alias

    // Ensure plugins array exists
    config.plugins = config.plugins || []

    // Add Vue plugin at the beginning to ensure it runs before addon-vue-csf
    // The Vue plugin needs to process .stories.vue files first
    const hasVuePlugin = config.plugins.some(
      p => p && (p.name === 'vite:vue' || p.name === 'vite:vue2'),
    )

    if (!hasVuePlugin) {
      config.plugins.unshift(vue.default())
    }

    return config
  },
}

module.exports = config
