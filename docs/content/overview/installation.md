# Installation

A quick tutorial to walk through installing the packages, as well as the supported plugins.

## Installing the package

<a href="https://www.npmjs.com/package/radix-vue" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/radix-vue?flat&colorA=002438&colorB=41c399"></a>

<InstallationTabs value="radix-vue" />

## Nuxt modules

Radix Vue offers Nuxt modules support.

In `nuxt.config.ts`, simply add `radix-vue/nuxt` into the modules, and it will auto-imports all the components for you.

```ts
export default defineNuxtConfig({
  modules: ['radix-vue/nuxt'],
})
```

## unplugin-vue-components

Radix Vue also has resolver for the popular [unplugin-vue-components](https://github.com/antfu/unplugin-vue-components).

In `vite.config.ts`, import `radix-vue/resolver`, and configure as such and it will auto-imports all the components from Radix Vue.

You can also use it for [Namespaced components](../guides/namespaced-components.md).

```ts{2,10  }
import Components from 'unplugin-vue-components/vite'
import RadixVueResolver from 'radix-vue/resolver'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      dts: true,
      resolvers: [
        RadixVueResolver()

        // RadixVueResolver({
        //   prefix: '', // use the prefix option to add Prefix to the imported components
        //   namespaced: false // set to true if you want to use namespaced components
        // })
      ],
    }),
  ],
})
```
