---
title: Vapor Mode
description: Use Reka UI in a Vue Vapor app through the experimental `reka-ui/vapor` entry.
---

# Vapor Mode

<Description>

Use Reka UI in a Vue Vapor app through the experimental `reka-ui/vapor` entry.

</Description>

<Callout type="warning" title="Experimental">

`reka-ui/vapor` is tested against **Vue 3.6.0-rc.16** and needs `vue >= 3.6.0-rc.16`. Vapor mode is not stable in Vue yet, and this entry relies on Vue internals that may change before Vue 3.6 ships. Pin your Vue version, and expect breaking changes in minor releases of Reka UI until Vue 3.6 is stable.

</Callout>

`reka-ui/vapor` ships the same components as `reka-ui`, compiled for [Vue Vapor mode](https://github.com/vuejs/core/tree/minor/packages/runtime-vapor). A Vapor app can use it without the Virtual DOM runtime, so the bundle does not carry the VDOM renderer. Props, events, slots and context are the same as in `reka-ui`.

## Setup

Install Vue 3.6 (release candidate):

```bash
npm install vue@3.6.0-rc.16
```

Enable Vapor mode in `@vitejs/plugin-vue` and create the app with `createVaporApp`:

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue({ features: { vapor: true } })],
})
```

```ts
// main.ts
import { createVaporApp } from 'vue'
import App from './App.vue'

createVaporApp(App).mount('#app')
```

Import the components from `reka-ui/vapor` in your `<script setup vapor>` components:

```vue
<script setup vapor lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui/vapor'
import { ref } from 'vue'

const enabled = ref(false)
</script>

<template>
  <SwitchRoot v-model="enabled">
    <SwitchThumb />
  </SwitchRoot>
</template>
```

The entry is ESM-only. In Node, both `import` and `require` resolve to a stub that throws the server-side rendering error (see [Limitations](#limitations)). Its types are the same as `reka-ui`.

<Callout type="info" title="Do not mix the two entries">

`reka-ui` and `reka-ui/vapor` keep separate contexts. A `DialogRoot` from one does not provide context to a `DialogContent` from the other, so import every part of a component from the same entry.

</Callout>

## Supported components

These families are exported and covered by a browser test suite. It runs on every pull request that changes the library, against both the sources and the built package, and covers rendering, `v-model`, keyboard interaction, ARIA attributes, focus management, both `asChild` forms, and an axe check.

| Family | Notes |
|---|---|
| Accordion, Collapsible, Tabs | |
| AlertDialog, Dialog, Popover | Focus trap, scroll lock, outside click |
| AspectRatio, Avatar, Label, Progress, Separator | |
| Checkbox, Switch, Toggle, ToggleGroup, RadioGroup | Form values through the hidden input |
| Combobox, Listbox, Select | `ListboxVirtualizer` included |
| ContextMenu, DropdownMenu, Menubar, NavigationMenu | |
| HoverCard, Tooltip | |
| Editable, NumberField, PinInput, Slider, TagsInput | |
| Pagination, Stepper | |
| ScrollArea, Splitter | `ScrollAreaVirtualizer` included |
| Toast | |
| Tree | `TreeVirtualizer` included |

`ConfigProvider` (`dir`, `useId`, `teleportTo` and the other options), `Primitive`, `useForwardExpose`, `useForwardProps`, `useEmitAsProps` and `useForwardPropsEmits` are exported too.

Not supported yet: Autocomplete, Calendar and the other date and time families, Carousel, the Color families, `ComboboxVirtualizer`, Drawer, Field, Form, Rating, SliderArea, TagGroup and Toolbar. Use them from `reka-ui` through the interop plugin (see below) until they are added.

## `asChild`

`asChild` works with the usual template form. Reka UI applies its attributes and listeners to your element after it renders. Your element's own attributes win over Reka UI's, and event listeners from both run:

```vue
<template>
  <DialogTrigger as-child>
    <button class="my-button">
      Open
    </button>
  </DialogTrigger>
</template>
```

To control precedence yourself, take the attributes from the `props` slot prop and bind them. Bindings placed after `v-bind="props"` win, and bindings placed before it lose:

```vue
<template>
  <DialogTrigger v-slot="{ props }" as-child>
    <button v-bind="props" class="my-button">
      Open
    </button>
  </DialogTrigger>
</template>
```

The same template also renders with `reka-ui`. There `props` is empty and the child is merged as usual, so a component written this way can move between the two entries.

## Limitations

- **No server-side rendering.** The entry needs a DOM. Importing it on the server throws `reka-ui/vapor does not support server-side rendering`. Render Reka UI components client-only (for example inside `<ClientOnly>` in Nuxt), or use `reka-ui` for SSR.
- **Browser-only tests.** Node resolves `reka-ui/vapor` to the same server-side error, so a test runner that executes in Node with jsdom or happy-dom cannot load it. Test components in a real browser, for example with Vitest browser mode.
- **Vue 3.6 only.** On Vue 3.5 or older, the components cannot load, because Vue does not have the Vapor runtime they are compiled against. A production build fails with an error like `"defineVaporComponent" is not exported by "node_modules/vue/dist/vue.runtime.esm-bundler.js"`, and in development the browser reports the same missing export. The `reka-ui/vapor needs Vue 3.6.0-rc.16+` check below never gets to run. Install `vue@3.6.0-rc.16` or newer.
- **Vue internals.** Vapor mode has no public API yet for a few things Reka UI needs, such as forwarding a template ref or finding a component's root element. The entry reads them from Vue internals and checks at import that they are there. If a later Vue 3.6 release removes one, the import throws `reka-ui/vapor needs Vue 3.6.0-rc.16+ (…); vue@<version> has no "<name>" export` instead of failing later.
- **Release candidate.** Vue 3.6 is a release candidate. A new RC may change Vapor behavior. Each Reka UI release names the Vue version it was tested against.
- **TypeScript and `v-slot="{ props }"`.** The slot types come from `reka-ui` and do not list `props` yet, so `vue-tsc` reports `Property 'props' does not exist` on that form. The template still works. Until the types include it, silence the error with `<!-- @vue-expect-error -->` on the line before the component, or bind `v-slot="slot"` and read `(slot as any).props`.
- **No agent bridge yet.** The agent bridge in `reka-ui/agent` doesn't see components from `reka-ui/vapor`. A bridge on the page does no harm: the components render and work as usual, and the bridge lists only the native fields and buttons they render.
- **`asChild` attributes set after mount.** With the template form, an attribute that your element does not have when it mounts and gains later loses to Reka UI's value. Use the `v-slot="{ props }"` form if you need that.

## Alternative: the interop plugin

Without `reka-ui/vapor`, a Vapor app can still use `reka-ui` through Vue's `vaporInteropPlugin`, which runs VDOM components inside a Vapor app:

```ts
import { createVaporApp, vaporInteropPlugin } from 'vue'
import App from './App.vue'

createVaporApp(App).use(vaporInteropPlugin).mount('#app')
```

This covers every component, but it ships the VDOM runtime alongside Vapor. `asChild` also behaves differently when the child is a Vapor element: Reka UI's attributes overwrite your element's own, so an `id` or `data-state` you set on the child is lost.
