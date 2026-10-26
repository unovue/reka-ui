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

Per-component entry points are optional. The root import is tree-shaken by your bundler, so production bundles are the same either way. An entry point only loads the modules of that component, which can help in setups that do not bundle or tree-shake dependencies.

Shared utilities and composables such as `useForwardPropsEmits` or `createContext` are exported from the package root only.

## Nuxt modules

Reka UI offers Nuxt modules support.

In `nuxt.config.ts`, simply add `reka-ui/nuxt` into the modules, and it will auto-import all the components for you.

```ts
export default defineNuxtConfig({
  modules: ['reka-ui/nuxt'],
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
        //   prefix: '' // use the prefix option to add Prefix to the imported components
        // })
      ],
    }),
  ],
})
```
