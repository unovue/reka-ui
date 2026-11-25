import type { } from '@nuxt/schema' // workaround for TS bug with "phantom" deps

import type { Components } from 'reka-ui/constant'
import { addComponent, addImports, defineNuxtModule } from '@nuxt/kit'
import { components as allComponents, utilities as allUtilities } from 'reka-ui/constant'

/**
 * Utilities that are not auto-imported because Nuxt already auto-imports a
 * function with the same name. Import these from `reka-ui` explicitly.
 */
const excludedComposables: string[] = [
  // Vue's own `useId` is auto-imported by Nuxt.
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
  },
  setup({ prefix, components, composables }) {
    if (components !== false) {
      let groupName: keyof Components
      for (groupName in allComponents) {
        if (components === true || components[groupName]) {
          for (const component of allComponents[groupName]) {
            addComponent({
              name: `${prefix}${component}`,
              export: component,
              filePath: 'reka-ui',
            })
          }
        }
      }
    }

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
