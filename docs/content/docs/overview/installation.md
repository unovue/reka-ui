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

Per-component entry points are optional. The root import is tree-shaken by your bundler, so production bundles are the same either way. An entry point only loads the modules of that component, which can help in setups that do not bundle or tree-shake dependencies, such as a dev server or server-side rendering. The [Nuxt module](#nuxt-modules) uses them for the components it auto-imports, and the [resolver](#unplugin-vue-components) can.

Shared utilities and composables such as `useForwardPropsEmits` or `createContext` are exported from the package root only.

Types for every entry point (`reka-ui/dialog`, `reka-ui/date`, `reka-ui/resolver`, …) resolve with `moduleResolution` set to `bundler`, `node16`, `nodenext` or `node`.

## Nuxt modules

Reka UI offers Nuxt modules support.

In `nuxt.config.ts`, simply add `reka-ui/nuxt` into the modules, and it will auto-import all the components for you.

```ts
export default defineNuxtConfig({
  modules: ['reka-ui/nuxt'],
})
```

Each component is imported from its own entry point (`reka-ui/dialog`, …), so the dev server and the server renderer only load the components a page uses. The module also adds `reka-ui` and those entry points to Vite's `optimizeDeps.include` for the client:

- The entry points are pre-bundled together when the dev server starts, instead of one at a time, with a page reload, as pages first use them.
- `reka-ui` itself is pre-bundled too, so a layer or a component library that imports from `reka-ui` shares the same components and contexts as your auto-imported ones.

Entry points you list in `optimizeDeps.exclude` are left out, and nothing is added when `reka-ui` is excluded.

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
        //   subpaths: true, // import each component from its entry point, see below
        // })
      ],
    }),
  ],
})
```

By default the resolver imports components from the package root (`import { DialogRoot } from 'reka-ui'`).

### Per-component entry points

With `subpaths: true`, the resolver imports each component from its own entry point instead (`import { DialogRoot } from 'reka-ui/dialog'`), and the generated `components.d.ts` points at the same entry points. The dev server then only loads the components a page uses. This option needs `reka-ui` and the entry points your app uses in Vite's `optimizeDeps.include`:

```ts
export default defineConfig({
  optimizeDeps: {
    include: ['reka-ui', 'reka-ui/dialog', 'reka-ui/select', 'reka-ui/tooltip'],
  },
})
```

- **`reka-ui`** is required whenever a dependency imports from it, such as a component library shipped as `.vue` files. Vite only pre-bundles a package imported from `node_modules` when it already pre-bundles it for your own code. Without the entry, that dependency is served a separate, unbundled copy of `reka-ui`, and its parts cannot find the contexts of your auto-imported ones (``Injection `Symbol(DialogRootContext)` not found``).
- **The entry points** avoid reloads. The resolver adds its imports while Vite transforms your components, so Vite's dependency scan does not see them. The first time a page uses a family the dev server has not seen yet, Vite pre-bundles that entry point and reloads the page.

The [Nuxt module](#nuxt-modules) adds both for you.
