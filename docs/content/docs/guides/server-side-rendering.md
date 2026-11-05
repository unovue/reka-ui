---
title: Server side rendering
description: Render Reka UI on the server, with Nuxt or your own SSR setup, and hydrate it without mismatches.
---

# Server side rendering

<Description>
Render Reka UI on the server, with Nuxt or your own SSR setup, and hydrate it without mismatches.
</Description>

## Overview

Server side rendering, or `SSR`, renders components to HTML on the server; the client then hydrates that HTML instead of rendering it again. Static rendering does the same at build time. Reka UI supports both, for example with [Nuxt](https://nuxt.com/).

Three things need attention:

- the **ids** the components generate for `aria-*` references must be the same on the server and the client;
- **portalled popups** (`DialogPortal`, `PopoverPortal`, …) are rendered on the client;
- a few parts need the DOM to **measure or position** themselves, so the server renders a placeholder state for them.

The `reka-ui` package is ES modules only: its entry points have no `require` condition. Server code that loads it must use `import`, which Nuxt and Vite-based SSR setups do.

## Nuxt

Add the [Nuxt module](/docs/overview/installation#nuxt-modules) to auto-import the components:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['reka-ui/nuxt'],
})
```

The module registers components only. Import composables and utilities (`useForwardPropsEmits`, `useDialog`, …) from `reka-ui` yourself.

Then wrap the app in [`ConfigProvider`](/docs/utilities/config-provider), as you would for direction or scroll lock, and pass it Nuxt's `useId` (see [Generated ids](#generated-ids)):

```vue
<!-- app.vue -->
<script setup lang="ts">
import { ConfigProvider } from 'reka-ui'

const useIdFunction = () => useId()
</script>

<template>
  <ConfigProvider :use-id="useIdFunction">
    <NuxtPage />
  </ConfigProvider>
</template>
```

## Generated ids

Parts that reference each other (a trigger's `aria-controls`, a dialog's `aria-labelledby`, a tab's `id`) use generated ids. Each id comes from the first of these that is available:

1. the part's own `id` prop, when you pass one;
2. the `useId` function given to `ConfigProvider`;
3. Vue's [`useId()`](https://vuejs.org/api/composition-api-helpers.html#useid) (Vue 3.5 and later);
4. a module counter (Vue 3.4).

Vue's `useId()` derives the id from the component's position in the tree, so the server and the client produce the same ids as long as they render the same tree. The counter fallback does not: on a server it keeps counting across requests, and its ids won't match the client's. **Use Vue 3.5 or later for SSR.**

If the server and the client produce Vue ids with different prefixes, for example when a framework prerenders a page with another app id prefix than the client hydrates with, pass an id source that is stable across both to `ConfigProvider`. Reka UI then uses it before Vue's own `useId()`. See [Config Provider](/docs/utilities/config-provider#hydration-issue).

### Your own ids

The trigger and content of Collapsible, Accordion, Popover and Tabs, and the trigger, content, title and description of Dialog, AlertDialog and Drawer, take an `id` prop. The part renders it, and the attribute that points at it (`aria-controls`, `aria-labelledby`, `aria-describedby`) follows it. Pass your own ids when you need them to be predictable, in tests or in links:

```vue
<template>
  <DialogRoot>
    <DialogTrigger>Edit profile</DialogTrigger>
    <DialogPortal>
      <DialogContent id="edit-profile">
        <DialogTitle id="edit-profile-title">
          Edit profile
        </DialogTitle>
        <DialogDescription>Make changes to your profile.</DialogDescription>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

The headless composables (`useDialog`, `useTabs`, …) don't call `useId()`: pass them a `baseId`, see [Ids and server rendering](/docs/guides/composables#ids-and-server-rendering).

## Popups and portals

A family portal (`DialogPortal`, `PopoverPortal`, `SelectPortal`, `TooltipPortal`, …) renders nothing on the server, open or closed. The trigger is in the server HTML with its open state (`data-popup-open`, `aria-expanded="true"`). The popup content mounts right after hydration, so a page rendered with `defaultOpen` (or `v-model:open` set to `true`) shows its dialog once the client has hydrated.

Without a portal, open content is rendered on the server in place. Floating content (Popover, Tooltip, Hover Card, menus, …) is rendered off-screen and positioned once the client measures the trigger:

```vue
<template>
  <PopoverRoot default-open>
    <PopoverTrigger>Filters</PopoverTrigger>
    <!-- No PopoverPortal: the content is in the server HTML, positioned after hydration -->
    <PopoverContent>…</PopoverContent>
  </PopoverRoot>
</template>
```

### Force-mounted portals

A portal with `forceMount` renders its content on the server too. Vue puts teleported content in the render context (`ssrContext.teleports`), keyed by the target, and your server has to write it into the page. Vue hydrates teleported content from the first child of the target, so content teleported to `body` (the default target) must be written at the very start of `<body>`, before the app's own markup.

In Nuxt, server-rendered teleports are supported for the `#teleports` target only ([Nuxt docs](https://nuxt.com/docs/api/components/teleports)). Point force-mounted portals at it:

```vue
<template>
  <DialogRoot>
    <DialogTrigger>Open</DialogTrigger>
    <DialogPortal to="#teleports" force-mount>
      <DialogContent force-mount>
        …
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

`teleport-to="#teleports"` on `ConfigProvider` sets it for every portal at once.

## What renders on the client

Some parts need the DOM, so the server renders them in a neutral state and the client completes them after hydration. None of these causes a hydration mismatch.

| Part | On the server |
|---|---|
| Portalled popup content | Not rendered, see [Popups and portals](#popups-and-portals). |
| `SelectValue` | The placeholder, until the items have mounted. Pass `items` to `SelectRoot` to render the selected item's label on the server. |
| `TabsIndicator` | Not rendered. |
| `SliderThumb` | Rendered with `display: none` until it knows its value. |
| `AvatarImage` | Rendered with `display: none`; `AvatarFallback` shows until the image has loaded. |
| `ScrollAreaScrollbar` | Not rendered with the default `type="hover"`. With `type="always"` it is. |
| `CollapsibleContent`, `AccordionContent` | `--reka-collapsible-content-height` and `--reka-accordion-content-height` are `0px` until measured. Use them in the open and close animations only, not as a static `height`. |

## Hydration mismatches

Vue warns in development when the client renders something other than the server HTML ("Hydration … mismatch"). In production it keeps the server's attributes without correcting them. Common causes with Reka UI:

- **Different ids.** Vue 3.4, or different id prefixes on the server and the client. See [Generated ids](#generated-ids).
- **Today's date.** A Calendar, Range Calendar or Date Picker without a value or placeholder opens on today, in the time zone of the runtime that renders it. When the server and the browser are on different days, the focusable day differs. Pick the date once, on the server, and send it to the client: with Nuxt, `useState` does that. It needs a serialisable value, so keep the ISO string. On a server without native `Temporal`, load the polyfill first (see [Dates: server-side rendering](/docs/guides/dates#server-side-rendering)):

  ```vue
  <script setup lang="ts">
  import { CalendarRoot } from 'reka-ui'
  import { computed } from 'vue'

  const today = useState('today', () => Temporal.Now.plainDateISO().toString())
  const placeholder = computed(() => Temporal.PlainDate.from(today.value))
  </script>

  <template>
    <CalendarRoot :default-placeholder="placeholder">
      …
    </CalendarRoot>
  </template>
  ```

  The `data-today` attribute is still computed by each runtime, and the server's stays in place after hydration.
- **Browser-only state.** A value read from `window`, `localStorage` or `matchMedia` during setup (a persisted `open`, a responsive `orientation`) differs between the server and the client. Read it in `onMounted`, or render the component in Nuxt's `<ClientOnly>`.
- **Direction.** `dir` comes from `ConfigProvider`, not from the `dir` attribute of the page, so set it on the server too. See [Internationalization](/docs/guides/i18n#rtl).
