---
title: Custom elements
description: Use Reka UI primitives outside Vue, as standard custom elements, from plain HTML, React, Svelte or any other framework.
---

# Custom elements

<Description>
Use Reka UI primitives outside Vue, as standard custom elements, from plain HTML, React, Svelte or any other framework.
</Description>

<Callout type="warning" title="Experimental">

`reka-ui/elements` is experimental. It covers a first set of families, and its API may change before it is marked stable.

</Callout>

## Overview

`reka-ui/elements` turns Reka UI parts into custom elements. Each part gets a tag named `<reka-<family>-<part>>`, so `DialogContent` becomes `<reka-dialog-content>`. The elements run the same Vue components you would use in a Vue app, so keyboard handling, focus management, ARIA and `data-*` state behave the same way.

Vue is still a dependency: it is bundled into your page, but your app does not need to use it.

## Quick start

Register the families you need once, then write the tags in your HTML. Importing `reka-ui/elements` registers nothing by itself.

```ts
// main.ts
import { defineRekaElements, dialogElements, switchElements } from 'reka-ui/elements'

defineRekaElements([dialogElements, switchElements])
```

```html
<label for="airplane">Airplane mode</label>
<reka-switch-root id="airplane" name="airplane" class="switch">
  <reka-switch-thumb class="thumb"></reka-switch-thumb>
</reka-switch-root>

<reka-dialog-root>
  <reka-dialog-trigger class="button">Edit profile</reka-dialog-trigger>
  <reka-dialog-portal>
    <reka-dialog-overlay class="overlay"></reka-dialog-overlay>
    <reka-dialog-content class="content">
      <reka-dialog-title>Edit profile</reka-dialog-title>
      <reka-dialog-description>Make changes to your profile.</reka-dialog-description>
      <reka-dialog-close class="button">Save</reka-dialog-close>
    </reka-dialog-content>
  </reka-dialog-portal>
</reka-dialog-root>

<script type="module" src="./main.ts"></script>
```

```css
.switch {
  display: inline-block;
  width: 42px;
  height: 24px;
  border-radius: 9999px;
  background: #ccc;
}
.switch[data-state='checked'] {
  background: #111;
}
.thumb {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  background: white;
  transform: translateX(2px);
  transition: transform 100ms;
}
.thumb[data-state='checked'] {
  transform: translateX(20px);
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.4);
}
.content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 24px;
  background: white;
}
```

<Callout type="info" title="A bundler is required">

The `reka-ui` package is published as ES modules that reference `process.env.NODE_ENV`, like most Vue libraries. Load it through a bundler (Vite, Rollup, webpack, esbuild, …). A CDN or `<script>`-only build is not available yet.

</Callout>

## Supported families

| Family | Register with | Tags |
| --- | --- | --- |
| Accordion | `accordionElements` | `reka-accordion-root`, `-item`, `-header`, `-trigger`, `-content` |
| Checkbox | `checkboxElements` | `reka-checkbox-root`, `-indicator`, `reka-checkbox-group-root` |
| Collapsible | `collapsibleElements` | `reka-collapsible-root`, `-trigger`, `-content` |
| Dialog | `dialogElements` | `reka-dialog-root`, `-trigger`, `-portal`, `-overlay`, `-content`, `-title`, `-description`, `-close` |
| Popover | `popoverElements` | `reka-popover-root`, `-trigger`, `-anchor`, `-portal`, `-content`, `-close` |
| Switch | `switchElements` | `reka-switch-root`, `-thumb` |
| Tabs | `tabsElements` | `reka-tabs-root`, `-list`, `-trigger`, `-content`, `-indicator` |
| Toggle | `toggleElements` | `reka-toggle` |

Props, events and data attributes are the ones documented on each component page, mapped as described below.

## Registration

```ts
import {
  defineDialogElements,
  defineRekaElements,
  rekaElementFamilies,
  tabsElements,
} from 'reka-ui/elements'

// Several families at once. Returns the tags.
defineRekaElements([tabsElements])

// One family.
defineDialogElements()

// A custom prefix: <acme-dialog-root>, <acme-dialog-content>, …
defineDialogElements({ prefix: 'acme' })

// Every supported family. This bundles all of them.
defineRekaElements(rekaElementFamilies)
```

- Registration is explicit. Importing the module has no side effects, and a bundler drops the families you never import.
- Registering is idempotent. A tag that is already defined is skipped, so calling it from several entry points is safe.
- Order does not matter. An element waits for its Reka ancestors to be defined and rendered before it mounts. Properties set on an element before its tag was defined are kept.

## Props: attributes and properties

Every prop is available as a **property** in camelCase (`el.modelValue`, `el.defaultOpen`). Simple props are also available as **attributes** in kebab-case:

| Prop type | Attribute | Example |
| --- | --- | --- |
| `boolean` | Present means `true`. Absent means the default. `"false"` means `false`. | `<reka-dialog-root default-open>` |
| `number` | Parsed with `Number()` | `<reka-popover-content side-offset="8">` |
| `string` | As is | `<reka-tabs-root default-value="account">` |
| `boolean \| 'indeterminate'` (Checkbox, Switch) | Present means `true`, plus `"false"` and `"indeterminate"` | `<reka-checkbox-root default-value="indeterminate">` |
| Arrays, objects, elements, functions | None, property only | `accordion.modelValue = ['a', 'b']` |

```js
const accordion = document.querySelector('reka-accordion-root')
accordion.type = 'multiple'
accordion.modelValue = ['a', 'b']
```

Elements do not reflect props back to attributes. Read the current state from the `data-*` attributes and ARIA attributes the part renders, or from events.

`id` and `dir` are native `HTMLElement` properties, so they stay attribute-driven. A part that needs an id for ARIA (a dialog title, a tab panel) uses its own while it is mounted, and restores yours when it unmounts.

## Events

Each Vue emit becomes a `CustomEvent`. The name is the emit name in kebab-case, with `:` replaced by `-`:

| Vue emit | Event |
| --- | --- |
| `update:modelValue` | `update-model-value` |
| `update:open` | `update-open` |
| `beforeUpdate:open` | `before-update-open` |
| `escapeKeyDown` | `escape-key-down` |

```js
const root = document.querySelector('reka-collapsible-root')

root.addEventListener('update-open', (event) => {
  console.log(event.detail.value) // true or false
})
```

- `event.detail` is `{ value, details }`. `value` is the emit's first argument, and `details` is the second one when the emit has one (the `beforeUpdate:*` events, for example).
- Events are cancelable. `event.preventDefault()` cancels the change: it calls `details.cancel()` on `before-update-*` events, and `preventDefault()` on emits whose value is a DOM event (`escape-key-down`, `pointer-down-outside`, …).
- Events do not bubble, since every part fires its own and `update-model-value` would be ambiguous on an ancestor. Listen on the element itself.

```js
// Keep the dialog open until the form is valid.
dialogRoot.addEventListener('before-update-open', (event) => {
  if (!event.detail.value && !form.checkValidity())
    event.preventDefault()
})
```

**Controlled state** works the same way as in Vue. Set `modelValue` or `open`, then update it from the event:

```js
switchRoot.modelValue = false
switchRoot.addEventListener('update-model-value', (event) => {
  switchRoot.modelValue = event.detail.value
})
```

## The element is the part

Each element renders its part onto itself instead of rendering a child element. `<reka-dialog-trigger>` gets `role="button"`, `aria-haspopup`, `aria-expanded`, `data-state`, `tabindex` and the click and keyboard handlers. You style the element directly:

```css
reka-dialog-trigger[data-state='open'] { … }
reka-tabs-trigger[data-disabled] { … }
reka-accordion-content[data-state='closed'] { … }
```

- `as` and `asChild` are not available. The element replaces them.
- Parts whose default element carries meaning get that meaning added. Button parts get `role="button"`, `tabindex="0"`, and activate on Enter and Space. Headings get `role="heading"` and `aria-level`. Lists get `role="list"` and `role="listitem"`.
- Custom elements are `display: inline` by default. Set `display` for parts that need a box (a switch, a dialog content).
- Your own attributes, classes and styles are kept. Classes and styles merge with the part's, and attributes the part writes are restored when it unmounts.
- A part that is not rendered (closed content, an inactive tab panel) gets `data-reka-unmounted`, and Reka hides it with `display: none`. Its children stay in the DOM but are inert. Content parts with `force-mount` stay visible, so you can animate them with `data-state`.
- When a part renders extra elements next to itself, they go into a `<div data-reka-fragment style="display: contents">` before the element. Examples are the hidden `<input>` a switch or checkbox renders inside a form.

Portals move the element. `<reka-dialog-content>` inside `<reka-dialog-portal>` is moved to `<body>` while the dialog is open, and moved back when it closes.

## Children instead of slots

Child elements and text work like the default slot. Scoped slots (slot props) are not available. Read state from `data-*` attributes and events instead.

## Context across elements

Context passes through the DOM the way it passes through components in Vue. An element mounts once the nearest Reka element above it has rendered its part, and it injects the contexts provided there. That is how `<reka-dialog-trigger>` finds its `<reka-dialog-root>`.

- Nesting must follow the component structure. A part has to be a DOM descendant of the parts it depends on, though other elements may sit in between.
- Context also crosses shadow roots: an element inside a shadow root finds the Reka element hosting it.
- When a part unmounts (a closed dialog's content), the elements inside it unmount too, and they remount when it renders again.

## Shadow DOM

Elements render in the light DOM by default. You can give every element a shadow root to hold encapsulated styles:

```ts
const sheet = new CSSStyleSheet()
sheet.replaceSync(`:host([data-state='checked']) { background: black; }`)

defineSwitchElements({ prefix: 'my', shadowRoot: true, styles: [sheet] })
```

The shadow root contains a single default `<slot>`, and children stay in the light DOM. This means ARIA id references, `<label for>`, form participation and focus behave the same as without it.

Placing Reka elements inside your own components' shadow roots depends on Shadow DOM support in the core components ([#2725](https://github.com/unovue/reka-ui/issues/2725)): active-element tracking, outside-click detection and focus trapping across shadow boundaries. Until that lands, light DOM is the supported setup.

## React

React 19 sets props as properties on custom elements when one exists, and listens to custom events with `on<event-name>`:

```tsx
import { useState } from 'react'
import { defineSwitchElements } from 'reka-ui/elements'

defineSwitchElements()

export function AirplaneMode() {
  const [checked, setChecked] = useState(false)
  return (
    <reka-switch-root
      modelValue={checked}
      onupdate-model-value={(event: CustomEvent) => setChecked(event.detail.value)}
    >
      <reka-switch-thumb />
    </reka-switch-root>
  )
}
```

React 18 passes everything as attributes and does not listen to custom events. Use a ref:

```tsx
const ref = useRef<HTMLElement & { modelValue: boolean }>(null)

useEffect(() => {
  const el = ref.current!
  el.modelValue = checked
  const onUpdate = (event: Event) => setChecked((event as CustomEvent).detail.value)
  el.addEventListener('update-model-value', onUpdate)
  return () => el.removeEventListener('update-model-value', onUpdate)
}, [checked])
```

## Svelte

Svelte 5 sets props as properties when they exist on the element, and `on<event-name>` adds event listeners:

```svelte
<script>
  import { defineCollapsibleElements } from 'reka-ui/elements'

  defineCollapsibleElements()
  let open = $state(false)
</script>

<reka-collapsible-root open={open} onupdate-open={e => (open = e.detail.value)}>
  <reka-collapsible-trigger>Details</reka-collapsible-trigger>
  <reka-collapsible-content>…</reka-collapsible-content>
</reka-collapsible-root>
```

## Vue

In a Vue app, use the components directly. If you do render the elements from Vue templates, mark them as custom elements:

```ts
// vite.config.ts
vue({
  template: { compilerOptions: { isCustomElement: tag => tag.startsWith('reka-') } },
})
```

## Limitations

- **Families.** Only the families listed above are available. The rest will follow, and `PopoverArrow` (which renders an SVG) is not included yet.
- **SSR.** Server rendering and declarative shadow DOM are not supported. Elements render on the client after they are defined.
- **Bundler required.** See the [quick start](#quick-start).
- **Types.** There are no JSX or template typings for the tags yet, and no Custom Elements Manifest.
- **Ids.** Parts that need ids for ARIA use their own while mounted.
- **Vue 3.5+.** Each element's app uses `app.config.idPrefix`.
