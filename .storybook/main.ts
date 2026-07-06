import type { StorybookConfig } from '@storybook/vue3-vite'
import { fileURLToPath } from 'node:url'

const config: StorybookConfig = {
  stories: ['../packages/core/src/**/*.stories.vue'],
  addons: ['sb-addon-vue-csf'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      // Storybook's default docgen (vue-docgen-api) chokes on `<script setup
      // lang="ts" generic="T">` SFCs (e.g. VisuallyHidden.vue,
      // VisuallyHiddenInput.vue) with a hard parse error ("Unexpected token,
      // expected ','"), which breaks the preview for any story that
      // transitively imports one. There's no per-file disable knob at this
      // config layer, so it can't be scoped to just the offending files.
      // Disable docgen entirely here; these stories don't use Controls or
      // auto-generated prop tables, so this is a no-op for them.
      docgen: false,
    },
  },
  core: {
    disableTelemetry: true,
  },
  async viteFinal(viteConfig) {
    const { mergeConfig } = await import('vite')
    const vue = (await import('@vitejs/plugin-vue')).default
    const merged = mergeConfig(viteConfig, {
      // @storybook/builder-vite defaults `root` to the parent of the config
      // directory (i.e. the monorepo root), but this package's own
      // dependencies (storybook, sb-addon-vue-csf, ...) only live in
      // `.storybook/node_modules` since it's its own pnpm workspace package.
      // Point root back at `.storybook` so bare-specifier resolution finds them.
      root: fileURLToPath(new URL('.', import.meta.url)),
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('../packages/core/src', import.meta.url)),
          // Story files live under `packages/core/src/**`, outside the Vite
          // root (`.storybook`). Bare specifiers they import that only exist
          // in `.storybook/node_modules` (this package's own deps) don't
          // resolve from there, so alias them explicitly to their installed
          // location.
          'sb-addon-vue-csf': fileURLToPath(new URL('./node_modules/sb-addon-vue-csf', import.meta.url)),
          '@iconify/vue': fileURLToPath(new URL('./node_modules/@iconify/vue', import.meta.url)),
        },
      },
      server: {
        fs: {
          allow: ['..'],
        },
      },
    })

    // Neither @storybook/vue3-vite nor @storybook/builder-vite register an
    // actual `.vue` -> JS compiler plugin (the framework's own
    // "vue-template-compilation" plugin only aliases the `vue` import), so
    // `.stories.vue` files otherwise reach sb-addon-vue-csf's transform hook
    // as raw, uncompiled SFC source, which it can't parse as JS ("Expression
    // expected"). Register @vitejs/plugin-vue ourselves, and prepend it
    // (rather than merge it in, which would append after the addon's plugin
    // since ours runs last in the preset chain) so `.vue` files are compiled
    // before sb-addon-vue-csf processes them.
    merged.plugins = [vue(), ...(merged.plugins ?? [])]
    return merged
  },
}

export default config
