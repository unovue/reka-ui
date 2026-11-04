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

The same checks follow the tree the page renders, so web components inside Reka UI parts work in the light DOM too: a press on an icon element inside a trigger or a [Splitter](../components/splitter) handle counts as a press on that part, and light-DOM content that a custom element slots into a popup counts as inside the popup.

```ts
import { createApp } from 'vue'
import App from './App.vue'

const host = document.querySelector('#widget')!
const shadowRoot = host.attachShadow({ mode: 'open' })
const mountPoint = document.createElement('div')
shadowRoot.append(mountPoint)

createApp(App).mount(mountPoint)
```

## In a Vue custom element

Vue's [`defineCustomElement`](https://vuejs.org/guide/extras/web-components.html#building-custom-elements-with-vue) renders a component into the shadow root of a custom element, and a `.ce.vue` single-file component puts its `<style>` blocks into that shadow root. Use Reka UI components inside it as in any other component:

```vue
<!-- SettingsWidget.ce.vue -->
<script setup lang="ts">
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger, SwitchRoot, SwitchThumb } from 'reka-ui'
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger class="trigger">
      Settings
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent class="content" :side-offset="4">
        <label for="notifications">Notifications</label>
        <SwitchRoot id="notifications" class="switch">
          <SwitchThumb class="thumb" />
        </SwitchRoot>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style>
.content {
  padding: 12px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
}
.switch {
  width: 42px;
  height: 24px;
  border-radius: 9999px;
  background: #ccc;
}
.switch[data-state='checked'] {
  background: #111;
}
</style>
```

```ts
// main.ts
import { defineCustomElement } from 'vue'
import SettingsWidget from './SettingsWidget.ce.vue'

customElements.define('settings-widget', defineCustomElement(SettingsWidget))
```

```html
<settings-widget></settings-widget>
```

The popover content is teleported into the element's shadow root, next to the `<style>` the component brought, so it is styled, and the trigger's `aria-controls` resolves to it.

To use Reka UI parts as custom elements themselves (`<reka-dialog-root>`, …), from plain HTML or another framework, see [Custom elements](./custom-elements).

## Portals

Portalled content (`DialogPortal`, `PopoverPortal`, `SelectPortal`, `TooltipPortal`, …) is teleported into the shadow root the portal is rendered in, rather than into `document.body`. It stays in the same tree as its trigger, so:

- the styles you add to the shadow root (a `<style>` element or `adoptedStyleSheets`) apply to the content too;
- `aria-labelledby`, `aria-describedby`, `aria-controls` and `aria-activedescendant` point at elements in the same tree, which is the only place assistive technology resolves them;
- a modal layer hides its siblings from assistive technology both inside the shadow root and in the page around it. When modals are open in two shadow roots, the most recently opened one stays exposed, as in the light DOM.

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

### Force-mounted portals

With the default target, a portal with `forceMount` that renders during the app's first client render mounts its content right after the portal itself mounts, because the shadow root it belongs in is only known then. A parent's template ref to that content is still `undefined` in the parent's `onMounted`; read it after `await nextTick()` or in a `watch` on the ref. Portals with `disabled` or an element `to` render during the first render as before.

A custom element built with `defineCustomElement` runs a Vue app per element, so every force-mounted portal inside one renders during that app's first render and takes this short delay.

### Targets outside the shadow root

An explicit `to="body"` still teleports to the document body. Content moved out of the shadow root this way keeps working, but the styles of the shadow root no longer apply to it, and assistive technology cannot follow `aria-*` id references between the two trees.

## Labels

A `<label for>` names the control with that `id` in its own tree only, so keep the label in the same shadow root as the control. [Checkbox](../components/checkbox), [Switch](../components/switch) and [Radio Group](../components/radio-group) items also copy the text of their `<label for>` into `aria-label`; they look the label up in the control's own root, the shadow root or the document.

## Styling

Document stylesheets do not apply inside a shadow root. Add your component styles to the shadow root itself, for example with a `<style>` element appended to it, with `shadowRoot.adoptedStyleSheets`, or with the `<style>` of a `.ce.vue` component.

Reka UI does not ship component styles. It adds two kinds of styles of its own:

- `ScrollAreaViewport`, `SelectViewport` and `ComboboxViewport` render a small `<style>` element next to the viewport that hides the native scrollbar. It is rendered in the same tree as the viewport, so it applies inside a shadow root too. It takes the `nonce` prop of the viewport, or of `ConfigProvider`.
- While a [Splitter](../components/splitter) handle is dragged, a global cursor style goes into the document (as an adopted stylesheet where supported). It reaches shadow content through the inherited `cursor` property.

## Limitations

- **Closed shadow roots.** Events from a closed shadow root are retargeted to its host and its `activeElement` is not exposed, so components cannot tell where focus or a press landed inside it. Use `mode: 'open'`.
- **Shadow roots and slots inside a focus trap.** A modal layer's focus trap looks for tabbable elements in the layer's own tree. Tabbable elements inside the shadow root of another element placed within the layer (for example a third-party custom element), and light-DOM elements slotted into the layer, are not considered when the trap picks the first and last element to wrap focus between. They can still receive focus by pointer or script without the trap pulling it back.
- **Content teleported out of the shadow root.** See [Portals](#portals): assistive technology does not resolve `aria-*` id references across the shadow boundary.
