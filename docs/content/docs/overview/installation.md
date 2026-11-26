# Installation

A quick tutorial to walk through installing the packages, as well as the supported plugins.

## Installing the package

<a href="https://www.npmjs.com/package/reka-ui" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/reka-ui?flat&colorA=002438&colorB=41c399"></a>

<InstallationTabs value="reka-ui" />

Reka UI requires Vue 3.5 or later.

## Nuxt modules

Reka UI offers Nuxt modules support.

In `nuxt.config.ts`, simply add `reka-ui/nuxt` into the modules, and it will auto-import all the components and composables (such as `useFilter` or `useForwardPropsEmits`) for you.

```ts
export default defineNuxtConfig({
  modules: ['reka-ui/nuxt'],
})
```

The module can be configured through the `reka` key.

```ts
export default defineNuxtConfig({
  modules: ['reka-ui/nuxt'],
  reka: {
    // Prefix added to every auto-imported component, e.g. `RekaAccordionRoot`. Composables are not prefixed.
    prefix: '',
    // Set to `false` to disable component auto-import, or pass an object to enable only some component groups.
    components: true,
    // Set to `false` to disable composable auto-import.
    composables: true,
  },
})
```

<Callout type="tip">

`useId` is not auto-imported, so it never clashes with the `useId` that Nuxt or Vue provides. Import it from `reka-ui` explicitly when you need Reka UI's version. If your app or another module provides a composable with the same name as one from Reka UI, that one is used.

</Callout>

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
