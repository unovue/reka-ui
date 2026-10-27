# Installation

A quick tutorial to walk through installing the packages, as well as the supported plugins.

## Installing the package

<a href="https://www.npmjs.com/package/reka-ui" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/reka-ui?flat&colorA=002438&colorB=41c399"></a>

<InstallationTabs value="reka-ui" />

## Importing components

Import everything you need from the package root. This is the default, and what every example in this documentation uses.

```vue
<script setup lang="ts">
import { DialogContent, DialogRoot, DialogTrigger } from 'reka-ui'
</script>
```

Each component is also available from its own entry point, named after the component in kebab-case (the same name as its documentation page). Both styles export the very same components, so you can mix them freely, even within one component tree.

```vue
<script setup lang="ts">
import { AlertDialogRoot } from 'reka-ui/alert-dialog'
import { DialogContent, DialogRoot, DialogTrigger } from 'reka-ui/dialog'
import { Primitive, Slot } from 'reka-ui/primitive'
</script>
```

Per-component entry points are optional. The root import is tree-shaken by your bundler, so production bundles are the same either way. An entry point only loads the modules of that component, which can help in setups that do not bundle or tree-shake dependencies, such as a dev server or server-side rendering. The [Nuxt module](#nuxt-modules) and the [resolver](#unplugin-vue-components) use them for the components they auto-import.

Shared utilities and composables such as `useForwardPropsEmits` or `createContext` are exported from the package root only.

Types for the entry points resolve with `moduleResolution` set to `bundler`, `node16`, `nodenext` or `node`.

## Nuxt modules

Reka UI offers Nuxt modules support.

In `nuxt.config.ts`, simply add `reka-ui/nuxt` into the modules, and it will auto-import all the components for you.

```ts
export default defineNuxtConfig({
  modules: ['reka-ui/nuxt'],
})
```

Each component is imported from its own entry point (`reka-ui/dialog`, …), so the dev server and the server renderer only load the components a page uses. The module also adds those entry points to Vite's `optimizeDeps.include`, so they are pre-bundled together when the dev server starts instead of one at a time as pages first use them.

The module accepts these options under the `reka` key:

```ts
export default defineNuxtConfig({
  modules: ['reka-ui/nuxt'],
  reka: {
    // Add a prefix to the auto-imported components: <RekaDialogRoot>
    prefix: 'Reka',
    // Only register some components (default: true, every component)
    components: { dialog: true, select: true },
    // Import every component from the package root ('reka-ui') instead of its entry point
    subpaths: false,
  },
})
```

## unplugin-vue-components

Reka UI also has resolver for the popular [unplugin-vue-components](https://github.com/antfu/unplugin-vue-components).

In `vite.config.ts`, import `reka-ui/resolver` and configure it as follows. The resolver will then auto-import all Reka UI components.

```ts{2,10  }
import Components from 'unplugin-vue-components/vite'
import RekaResolver from 'reka-ui/resolver'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      dts: true,
      resolvers: [
        RekaResolver()

        // RekaResolver({
        //   prefix: '', // use the prefix option to add Prefix to the imported components
        //   subpaths: true, // set to false to import every component from 'reka-ui' instead of its entry point
        // })
      ],
    }),
  ],
})
```

The resolver imports each component from its own entry point (`import { DialogRoot } from 'reka-ui/dialog'`), and the generated `components.d.ts` points at the same entry points. These imports are added while Vite transforms your components, so its dependency scan does not see them: the first time a page uses a component from a family the dev server has not seen yet, Vite pre-bundles that entry point and reloads the page. To avoid the reloads, list the entry points your app uses in `optimizeDeps.include`:

```ts
export default defineConfig({
  optimizeDeps: {
    include: ['reka-ui/dialog', 'reka-ui/select', 'reka-ui/tooltip'],
  },
})
```
