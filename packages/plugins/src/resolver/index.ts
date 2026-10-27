import type { Components } from 'reka-ui/constant'
import type { ComponentResolver } from 'unplugin-vue-components'
import { components } from 'reka-ui/constant'
import { getComponentSource } from '../shared'

export interface ResolverOptions {
  /**
   * prefix for components used in templates
   *
   * @defaultValue ""
   */
  prefix?: string
  /**
   * Import each component from its own entry point (`reka-ui/dialog`) instead of the
   * package root (`reka-ui`). Both export the very same components, so this only changes
   * how much of the library an unbundled dev server or SSR runtime loads.
   *
   * @defaultValue true
   */
  subpaths?: boolean
}

export default function (options: ResolverOptions = {}): ComponentResolver {
  const { prefix = '', subpaths = true } = options

  return {
    type: 'component',
    resolve: (name: string) => {
      if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
        const componentName = name.substring(prefix.length)
        let groupName: keyof Components
        for (groupName in components) {
          const groupComponents: readonly string[] = components[groupName]
          if (groupComponents.includes(componentName)) {
            return {
              name: componentName,
              from: getComponentSource(groupName, subpaths),
            }
          }
        }
      }
    },
  }
}
