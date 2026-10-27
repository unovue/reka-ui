import type { } from '@nuxt/schema' // workaround for TS bug with "phantom" deps

import type { Components } from 'reka-ui/constant'
import { addComponent, addVitePlugin, defineNuxtModule } from '@nuxt/kit'
import { components as allComponents } from 'reka-ui/constant'
import { getComponentSource } from '../shared'

export interface ModuleOptions {
  components: Partial<Record<keyof Components, boolean>> | boolean
  prefix: string
  /**
   * Import each component from its own entry point (`reka-ui/dialog`) instead of the
   * package root (`reka-ui`). Both export the very same components, so this only changes
   * how much of the library the dev server and the server renderer load. The module adds
   * `reka-ui` and the entry points to Vite's `optimizeDeps.include`, see `optimizeDepsPlugin`.
   *
   * @defaultValue true
   */
  subpaths: boolean
}

/** The part of Vite's `UserConfig` the module touches (`vite` is not a dependency of the module). */
interface ViteConfig {
  optimizeDeps?: { include?: string[], exclude?: string[] }
  environments?: Record<string, { optimizeDeps?: { exclude?: string[] } }>
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@reka-ui/nuxt',
    configKey: 'reka',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    prefix: '',
    components: true,
    subpaths: true,
  },
  setup({ prefix, components, subpaths }) {
    if (components === false) {
      return
    }

    const sources: string[] = []
    let groupName: keyof Components
    for (groupName in allComponents) {
      if (components === true || components[groupName]) {
        const filePath = getComponentSource(groupName, subpaths)
        if (!sources.includes(filePath))
          sources.push(filePath)
        for (const component of allComponents[groupName]) {
          addComponent({
            name: `${prefix}${component}`,
            export: component,
            filePath,
          })
        }
      }
    }

    if (subpaths)
      addVitePlugin(optimizeDepsPlugin(sources), { server: false })
  },
})

/**
 * Pre-bundles `reka-ui` and the registered entry points for the client.
 *
 * - The entry points: component imports are injected while modules are transformed, so
 *   Vite's dependency scan never sees them and would discover each entry point the first
 *   time a page uses it, re-optimizing and reloading the page.
 * - `reka-ui` itself: Vite only pre-bundles a package imported from `node_modules` (a Nuxt
 *   layer, a component kit) once it already pre-bundles it for the app. Without it such a
 *   dependency gets a raw `reka-ui`, a second copy next to the pre-bundled entry points
 *   whose contexts the auto-imported parts cannot inject.
 *
 * Top-level `optimizeDeps` only configures the client, with or without Vite's environment
 * API. Anything the app excludes stays excluded, and nothing is added when `reka-ui` is.
 */
function optimizeDepsPlugin(sources: string[]) {
  return {
    name: 'reka-ui:optimize-deps',
    config(config: ViteConfig) {
      const optimizeDeps = (config.optimizeDeps ??= {})
      const excluded = [...(optimizeDeps.exclude ?? []), ...(config.environments?.client?.optimizeDeps?.exclude ?? [])]
      if (excluded.includes('reka-ui'))
        return
      const include = (optimizeDeps.include ??= [])
      for (const source of ['reka-ui', ...sources]) {
        if (!excluded.includes(source) && !include.includes(source))
          include.push(source)
      }
    },
  }
}
