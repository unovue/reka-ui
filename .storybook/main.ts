import type { StorybookConfig } from '@storybook/vue3-vite'
import { fileURLToPath } from 'node:url'

const config: StorybookConfig = {
  stories: ['../packages/core/src/**/*.stories.vue'],
  addons: ['sb-addon-vue-csf'],
  // Reuse the docs' public assets (logo.svg, Geist fonts) for the manager
  // theme instead of duplicating them here.
  staticDirs: ['../docs/content/public'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      // Storybook's default docgen engine (vue-docgen-api) hard-crashes on
      // `<script setup lang="ts" generic="T">` SFCs (e.g. VisuallyHidden
      // family), breaking the preview for any story that transitively imports
      // one. The TS-based vue-component-meta engine handles them (verified:
      // full build passes with docgen info emitted) — don't switch back
      // without re-testing against the generic SFCs.
      docgen: 'vue-component-meta',
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

    // The vue-component-meta docgen plugin also transforms plain .ts modules,
    // and its re-export guard (`export {.*name.*}` without a multiline flag)
    // misses multiline `export { x } from '...'` blocks. On barrel files like
    // `shared/date/index.ts` it then appends `x.__docgenInfo = ...` for names
    // that have no local binding (re-exports don't create one), which throws
    // "ReferenceError: x is not defined" at module evaluation in dev and
    // breaks every story importing through the barrel. Constrain it to .vue
    // files — Controls only reads docgen info from components anyway.
    const metaPlugin = merged.plugins
      .flat(Infinity)
      .find((p: { name?: string }) => p?.name === 'storybook:vue-component-meta-plugin')
    if (metaPlugin?.transform?.handler) {
      const original = metaPlugin.transform.handler
      metaPlugin.transform.handler = function (src: string, id: string) {
        if (!id.split('?')[0].endsWith('.vue'))
          return
        return original.call(this, src, id)
      }
    }

    return merged
  },
}

export default config
