# 安装

一个快速教程，用于演示安装软件包以及支持的插件。

## 安装包

<a href="https://www.npmjs.com/package/reka-ui" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/reka-ui?flat&colorA=002438&colorB=41c399"></a>

<InstallationTabs value="reka-ui" />

## Nuxt modules

Reka UI 提供 Nuxt 模块支持。

在 `nuxt.config.ts` 中，只需将 `reka-ui/nuxt` 添加到模块中，它就会自动为你导入所有组件。

```ts
export default defineNuxtConfig({
  modules: ['reka-ui/nuxt'],
})
```

## unplugin-vue-components

Reka UI 也有流行的 [unplugin-vue-components](https://github.com/antfu/unplugin-vue-components) 的解析器。

在 `vite.config.ts` 中，导入 `reka-ui/resolver`，并按此进行配置，它将自动从 Reka UI 导入所有组件。

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
