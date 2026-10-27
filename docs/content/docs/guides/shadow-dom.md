---
title: Shadow DOM
description: Render Reka UI inside a shadow root, for web components, micro-frontends and embedded widgets.
---

# Shadow DOM

<Description>
Render Reka UI inside a shadow root, for web components, micro-frontends and embedded widgets.
</Description>

## Overview

Every Reka UI component works when it is rendered inside an open shadow root: a Vue app mounted on a node inside `element.attachShadow({ mode: 'open' })`, or a component rendered by a custom element. Focus management, keyboard navigation, outside-press and focus-outside dismissal, `aria-*` id references, `aria-hidden` for modal layers and positioning all resolve within the shadow tree. Page scroll lock applies to the document, which the shadow root shares with the page. No configuration is needed.

```ts
import { createApp } from 'vue'
import App from './App.vue'

const host = document.querySelector('#widget')!
const shadowRoot = host.attachShadow({ mode: 'open' })
const mountPoint = document.createElement('div')
shadowRoot.append(mountPoint)

createApp(App).mount(mountPoint)
```

## Portals

Portalled content (`DialogPortal`, `PopoverPortal`, `SelectPortal`, `TooltipPortal`, …) is teleported into the shadow root the portal is rendered in, rather than into `document.body`. It stays in the same tree as its trigger, so:

- the styles you add to the shadow root (a `<style>` element or `adoptedStyleSheets`) apply to the content too;
- `aria-labelledby`, `aria-describedby`, `aria-controls` and `aria-activedescendant` point at elements in the same tree, which is the only place assistive technology resolves them;
- a modal layer hides its siblings from assistive technology both inside the shadow root and in the page around it.

To render portalled content somewhere else, pass `to` to the portal, or set `teleportTo` on [ConfigProvider](../utilities/config-provider) for the whole app. A selector is looked up inside the shadow root first and then in the document, so `teleportTo="#overlays"` finds an `#overlays` element inside the shadow root:

```vue
<script setup lang="ts">
import { ConfigProvider } from 'reka-ui'
</script>

<template>
  <ConfigProvider teleport-to="#overlays">
    <App />
  </ConfigProvider>
  <div id="overlays" />
</template>
```

An explicit `to="body"` still teleports to the document body. Content moved out of the shadow root this way keeps working, but the styles of the shadow root no longer apply to it, and assistive technology cannot follow `aria-*` id references between the two trees.

## Styling

Document stylesheets do not apply inside a shadow root. Add your component styles to the shadow root itself, for example with a `<style>` element appended to it or with `shadowRoot.adoptedStyleSheets`. Reka UI does not inject component styles; the only stylesheet it adds is the global drag cursor of [Splitter](../components/splitter), which goes into the document and reaches shadow content through the inherited `cursor` property.

## Limitations

- **Closed shadow roots.** Events from a closed shadow root are retargeted to its host and its `activeElement` is not exposed, so components cannot tell where focus or a press landed inside it. Use `mode: 'open'`.
- **Shadow roots nested inside a focus trap.** A modal layer's focus trap looks for tabbable elements in the layer's own tree. Tabbable elements inside the shadow root of another element placed within the layer (for example a third-party custom element) are not considered when the trap picks the first and last element to wrap focus between.
- **Content teleported out of the shadow root.** See [Portals](#portals): assistive technology does not resolve `aria-*` id references across the shadow boundary.
