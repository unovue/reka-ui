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
/* Until the script has defined them, the elements are plain unknown elements:
   hide them, so closed content does not flash on load. */
reka-dialog-portal:not(:defined),
reka-switch-thumb:not(:defined) {
  display: none;
}

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
  defineAllRekaElements,
  defineDialogElements,
  defineRekaElements,
  tabsElements,
} from 'reka-ui/elements'

// Several families at once. Returns the tags.
defineRekaElements([tabsElements])

// One family.
defineDialogElements()

// A custom prefix: <acme-dialog-root>, <acme-dialog-content>, …
defineDialogElements({ prefix: 'acme' })

// Every supported family. This bundles all of them.
defineAllRekaElements()
```

- Registration is explicit. Importing the module has no side effects, and a bundler drops the families you never import.
- Registering is idempotent. A tag that is already defined is skipped, so calling it from several entry points (or from two copies of `reka-ui` on one page) is safe.
- Order does not matter. Elements find each other when they are connected, whichever was defined first. An element whose ancestors are not defined yet works on its own, and moves under them when they are defined. A part that cannot work alone (a trigger without its root) waits for one, with a warning in development.
- Properties set on an element before its tag was defined are kept.

| Option | Default | |
| --- | --- | --- |
| `prefix` | `'reka'` | Tag prefix. |
| `events` | `{ bubbles: false, composed: false }` | How events are dispatched. See [events](#events). |
| `shadowRoot` | `false` | `true` or `{ mode }`. See [Shadow DOM](#shadow-dom). |
| `styles` | `[]` | Stylesheets adopted by every shadow root. |

## Props: attributes and properties

Every prop is available as a **property** in camelCase (`el.modelValue`, `el.defaultOpen`). Simple props are also available as **attributes** in kebab-case:

| Prop type | Attribute | Example |
| --- | --- | --- |
| `boolean` | Like an HTML boolean attribute: present means `true`, whatever its value, and absent means the default. | `<reka-dialog-root default-open>` |
| `boolean` that defaults to `true` | Also `"false"`, the only way to turn it off with an attribute. | `<reka-dialog-root modal="false">`, `<reka-tabs-list loop="false">` |
| `number` | Parsed with `Number()` | `<reka-popover-content side-offset="8">` |
| `string` | As is | `<reka-tabs-root default-value="account">` |
| `boolean \| 'indeterminate'` (Checkbox and Switch values) | A value, not a flag: `""` or `"true"`, `"false"`, `"indeterminate"` | `<reka-checkbox-root default-value="indeterminate">` |
| Arrays, objects, elements, functions | None, property only | `accordion.modelValue = ['a', 'b']` |

`disabled="false"` is disabled, as on any HTML element. `open`, `required` and every other native attribute name work the same way. To control a boolean as `false`, set the property:

```js
const accordion = document.querySelector('reka-accordion-root')
accordion.type = 'multiple'
accordion.modelValue = ['a', 'b']

collapsible.open = false // controlled and closed
```

Elements do not reflect props back to attributes, with one exception: `disabled` reflects both ways, like a native control's. `el.disabled = true` sets the attribute, and `el.disabled` is `true` whenever the attribute is present. It is your setting only. Whether the part is actually disabled (by its own prop, a disabled root, or a `<fieldset disabled>`) shows in `data-disabled` and `aria-disabled`. Read other state from the `data-*` and ARIA attributes the part renders, or from events.

`id`, `dir` and `hidden` are native `HTMLElement` properties, so they stay attribute-driven.

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

- `event.detail` is `{ value, details }`. `value` is the emit's first argument, and `details` is the second one when the emit has one (the change details of `update-*` and `before-update-*` events, for example).
- Only events whose default can be prevented are `cancelable`. `preventDefault()` on a `before-update-*` event cancels the change (`details.cancel()`), and on an event that carries a DOM event (`escape-key-down`, `pointer-down-outside`, …) it prevents that event's default. `update-*` events report a change that already happened, and are not cancelable.
- Events do not bubble by default, since every part fires its own and `update-model-value` would be ambiguous on an ancestor. Listen on the element itself, or register with `events: { bubbles: true, composed: true }` to listen higher up (`composed` also crosses shadow roots).

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

**Uncontrolled state is kept when you move the element.** Removed from the page and added back, or moved elsewhere, an element comes back with the value it had, not its default. There are two exceptions, both matching Vue:

- An element unmounted with its parent part (a switch in a collapsible's content that closes) starts over when that part renders again.
- An open overlay (a dialog or popover root) does not reopen after a move.

A form reset brings an element back to its default.

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
- Your own attributes, classes and styles are kept. Classes and styles merge with the part's. An attribute the part renders (`data-state`, `aria-expanded`, …) belongs to the part while it is rendered: if you change it meanwhile, the part's value stays, and yours is what remains when the part unmounts. The `role`, `tabindex` and `aria-level` added for native semantics (above) give way to yours.
- Ids are yours. Parts that other parts point to (a collapsible or tab content, a dialog title, a trigger) and form controls render the `id` you set, and `aria-controls` / `aria-labelledby` follow it. Without one, the part generates an id while it is rendered.
- A copy made with `cloneNode()` starts from your attributes, not from the rendered state of the element it was copied from. While mounted, an element carries a `data-reka-owned` attribute that makes this work. It is internal: don't style or script against it.

Portals move the element. `<reka-dialog-portal>` and what it contains are moved to `<body>` while mounted, and moved back when they unmount. Inside a shadow root they move to that shadow root instead, so your shadow styles still apply. Set `to` to choose another target: a selector is looked up in the element's shadow root first, then in the document. Move the root into or out of a shadow root and the portal follows it there.

Each element runs its own small Vue app, mounted when the element is connected. The portal's target is resolved from where the element sits before that first render, so a `force-mount` portal is already in place once the element is connected, with no extra render or scheduler turn. A `to` selector that matches nothing yet is resolved once the portal mounts, as in Vue.

### Parts that are not rendered

A part that is not rendered (closed content, an inactive tab panel) gets `data-reka-unmounted`, `inert` and `hidden`, and Reka hides it with `display: none`. A `hidden` or `inert` you set yourself is yours: Reka doesn't add or remove it, even if you set it while the part is closed.

This is the one place elements differ from the Vue components. In Vue, closed content is not in the DOM at all. As an element, its children are yours, so they stay where you put them, hidden and inert. Fields inside are left out of their form's data, as they would be in Vue. Reka elements inside unmount, and mount again when the part renders.

`force-mount` content stays rendered, so you can animate it with `data-state`.

## Forms

Parts with a `name` (Switch, Checkbox, Checkbox group, Toggle) are [form-associated](https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements):

- they submit their value with their form, wherever you move them;
- `<label for>` labels them, `<fieldset disabled>` disables them, and resetting the form resets them;
- they are validated with it: a `required` checkbox left unchecked makes the form invalid, and matches `:invalid`;
- they submit the same names as the Vue components (a checkbox group named `toppings` submits `toppings[0]`, `toppings[1]`, …);
- nothing is added next to them: the hidden inputs the Vue components render are not in the document.

Form participation needs `ElementInternals` (Safari 16.4 and later). Without it, the elements work but do not submit.

## Children instead of slots

Child elements and text work like the default slot. Scoped slots (slot props) are not available. Read state from `data-*` attributes and events instead.

## Context across elements

Context passes through the DOM the way it passes through components in Vue. An element mounts once the nearest Reka element above it has rendered its part, and it injects the contexts provided there. That is how `<reka-dialog-trigger>` finds its `<reka-dialog-root>`.

- Elements find their parent with the [Context Community Protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md): a `context-request` event, answered by the nearest Reka element above. Elements defined later announce themselves with `context-provider`, and the elements below them move over.
- Nesting must follow the component structure. A part has to be a DOM descendant of the parts it depends on, though other elements may sit in between.
- Moved under another root, an element remounts there.
- Context crosses shadow roots: an element inside a shadow root finds the Reka element hosting it.
- Context is shared within one copy of `reka-ui`. Elements from two copies on one page nest freely (a switch from one inside a collapsible from the other), but a part can't use another copy's family context (a trigger from one copy inside a dialog root from the other). It stays unrendered, with a warning in development.

## Shadow DOM

Elements render in the light DOM by default. You can give every element a shadow root, for encapsulated `:host` styles:

```ts
const sheet = new CSSStyleSheet()
sheet.replaceSync(`:host([data-state='checked']) { background: black; }`)

defineSwitchElements({ prefix: 'my', shadowRoot: true, styles: [sheet] })
```

The shadow root holds a single default `<slot>`, and children stay in the light DOM, so ARIA id references, `<label for>`, form participation and focus behave the same as without it. Nothing is rendered inside it, so it gives you `:host(...)` styling only: there are no `::part()`s to style. Only `mode` is supported (`delegatesFocus` would take focus away from the element, which is the focusable part).

You can also place Reka elements inside your own components' shadow roots. Parent lookup, active-element tracking, outside-click detection, focus trapping and portals all work across shadow boundaries ([Shadow DOM support](https://github.com/unovue/reka-ui/issues/2725)). Portaled content stays in the shadow root it was rendered in.

## TypeScript

Element types for the default-prefixed tags are opt-in, through a types-only entry:

```ts
// reka-elements.d.ts
/// <reference types="reka-ui/elements/global" />
```

`document.querySelector('reka-switch-root')` is then typed with the switch's props as properties, and `addEventListener('update-model-value', …)` with the event's `detail`.

`reka-ui/elements/global` has no JavaScript: reference it from a `.d.ts` file or with `import type {} from 'reka-ui/elements/global'`, not with a runtime `import`. With a custom prefix, declare your tags from `RekaElementTagNameMap` yourself.

## React

React 19 sets props as properties on custom elements when one exists, and listens to custom events with `on<event-type>`, in the event's own casing:

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

`onUpdateModelValue` does not work: React would listen to an event named `UpdateModelValue`. The JSX typings reject it and name the prop to use:

```ts
// reka-elements.d.ts
/// <reference types="reka-ui/elements/react" />
```

For another JSX framework, or a custom prefix, build the declarations from `RekaIntrinsicElements<YourAttributes>`.

React 18 passes everything as string attributes and does not listen to custom events. Use a ref:

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

In React 18, `disabled={false}` becomes `disabled="false"`, which is disabled. Leave the prop out instead: `disabled={isDisabled || undefined}`.

Server-rendered elements hydrate without mismatches: nothing is added next to them. Portals are the exception: a defined `<reka-dialog-portal>` or `<reka-popover-portal>` moves to `<body>` as soon as it connects, before React has hydrated the spot it was rendered in. When the server-rendered tree contains portals, define those families after hydration, for example in an effect:

```tsx
useEffect(() => {
  defineDialogElements()
}, [])
```

## Svelte

Svelte 5 sets props as properties when they exist on the element, and `on<event-type>` adds event listeners:

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

Bind props in camelCase (`:modelValue="checked"`, or `:modelValue.prop` to force a property). Vue sets a camelCase binding as the element's property, but a kebab-case one as an attribute, which turns the value into a string. `.prop` does not camelize: `:model-value.prop` sets a property named `model-value`, so add `.camel` (`:model-value.camel.prop`).

## Limitations

- **Families.** Only the families listed above are available. The rest will follow, and `PopoverArrow` (which renders an SVG) is not included yet.
- **SSR.** Server rendering and declarative shadow DOM are not supported. Elements render on the client after they are defined.
- **Bundler required.** See the [quick start](#quick-start).
- **Custom Elements Manifest.** Not generated yet.
- **Vue version.** Tested on Vue 3.5. With older versions generated ids are not unique between elements, and a warning says so in development.
