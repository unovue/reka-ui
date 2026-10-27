import type { } from '@nuxt/schema' // workaround for TS bug with "phantom" deps

import type { Components } from 'reka-ui/constant'
import { addComponent, defineNuxtModule, extendViteConfig } from '@nuxt/kit'
import { components as allComponents } from 'reka-ui/constant'
import { getComponentSource } from '../shared'

export interface ModuleOptions {
  components: Partial<Record<keyof Components, boolean>> | boolean
  prefix: string
  /**
   * Import each component from its own entry point (`reka-ui/dialog`) instead of the
   * package root (`reka-ui`). Both export the very same components, so this only changes
   * how much of the library the dev server and the server renderer load.
   *
   * @defaultValue true
   */
  subpaths: boolean
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

    if (!subpaths)
      return

    // Component imports are injected while modules are transformed, so Vite's dependency
    // scan never sees them and discovers each entry point the first time a page uses it,
    // re-optimizing and reloading the page. Pre-bundle the registered entry points together
    // up front instead; the browser still only loads the ones a page imports.
    extendViteConfig((config) => {
      const optimizeDeps = (config.optimizeDeps ??= {})
      if (optimizeDeps.exclude?.includes('reka-ui'))
        return
      const include = (optimizeDeps.include ??= [])
      for (const source of sources) {
        if (!include.includes(source))
          include.push(source)
      }
    }, { server: false })
  },
})
