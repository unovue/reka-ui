import type { StorybookConfig } from '@storybook/vue3-vite'
import { fileURLToPath } from 'node:url'

const config: StorybookConfig = {
  stories: ['../packages/core/src/**/*.stories.vue'],
  addons: ['sb-addon-vue-csf'],
  framework: '@storybook/vue3-vite',
  core: {
    disableTelemetry: true,
  },
  async viteFinal(viteConfig) {
    const { mergeConfig } = await import('vite')
    return mergeConfig(viteConfig, {
      // @storybook/builder-vite defaults `root` to the parent of the config
      // directory (i.e. the monorepo root), but this package's own
      // dependencies (storybook, sb-addon-vue-csf, ...) only live in
      // `.storybook/node_modules` since it's its own pnpm workspace package.
      // Point root back at `.storybook` so bare-specifier resolution finds them.
      root: fileURLToPath(new URL('.', import.meta.url)),
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('../packages/core/src', import.meta.url)),
        },
      },
      server: {
        fs: {
          allow: ['..'],
        },
      },
    })
  },
}

export default config
