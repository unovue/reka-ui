import type { } from '@nuxt/schema' // workaround for TS bug with "phantom" deps

import type { Components } from 'reka-ui/constant'
import { addComponent, addImports, addVitePlugin, defineNuxtModule } from '@nuxt/kit'
import { components as allComponents, utilities as allUtilities } from 'reka-ui/constant'
import { getComponentSource } from '../shared'

/**
 * Utilities that are not auto-imported because their name clashes with a
 * function Nuxt can auto-import itself. Import these from `reka-ui` explicitly.
 */
const excludedComposables: string[] = [
  // Recent Nuxt versions auto-import a `useId` of their own or Vue's.
  'useId',
]

/** Below anything Nuxt assigns to scanned composables, including those of extended layers. */
const COMPOSABLE_PRIORITY = -1000

export interface ModuleOptions {
  /**
   * Auto-import components. Pass an object to enable only some component groups.
   * @defaultValue true
   */
  components: Partial<Record<keyof Components, boolean>> | boolean
  /**
   * Auto-import composables and utilities such as `useFilter` or `useForwardPropsEmits`.
   * @defaultValue true
   */
  composables: boolean
  /**
   * Prefix added to the name of every auto-imported component. Composables are not prefixed.
   * @defaultValue ''
   */
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
    composables: true,
    subpaths: true,
  },
  setup({ prefix, components, composables, subpaths }) {
    const sources: string[] = []
    if (components !== false) {
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
    }

    if (subpaths && sources.length)
      addVitePlugin(optimizeDepsPlugin(sources), { server: false })

    if (composables !== false) {
      addImports(
        allUtilities.utilities
          .filter(name => !excludedComposables.includes(name))
          .map(name => ({
            name,
            from: 'reka-ui',
            // Lowest priority: the app's own composables, those of its layers (which Nuxt
            // registers at -1, -2, ...) and those of other modules win a name clash.
            priority: COMPOSABLE_PRIORITY,
          })),
      )
    }
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
