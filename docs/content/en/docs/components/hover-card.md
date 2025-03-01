---

title: Hover Card
description: For sighted users to preview content available behind a link.
name: hover-card
---

# HoverCard

<Description>
For sighted users to preview content available behind a link.
</Description>

<ComponentPreview name="HoverCard" />

## Features

<Highlights
  :features="[
    'Can be controlled or uncontrolled.',
    'Customize side, alignment, offsets, collision handling.',
    'Optionally render a pointing arrow.',
    'Supports custom open and close delays.',
    'Ignored by screen readers.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'
</script>

<template>
  <HoverCardRoot>
    <HoverCardTrigger />
    <HoverCardPortal>
      <HoverCardContent>
        <HoverCardArrow />
      </HoverCardContent>
    </HoverCardPortal>
  </HoverCardRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a hover card.

<!-- @include: @/meta/HoverCardRoot.md -->

### Trigger

The link that opens the hover card when hovered.

<!-- @include: @/meta/HoverCardTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
  ]"
/>

### Portal

When used, portals the content part into the `body`.

<!-- @include: @/meta/HoverCardPortal.md -->

### Content

The component that pops out when the hover card is open.

<PresenceCallout />

<!-- @include: @/meta/HoverCardContent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-side]',
      values: ['left', 'right', 'bottom', 'top'],
    },
    {
      attribute: '[data-align]',
      values: ['start', 'end', 'center'],
    },
  ]"
/>

<CssVariablesTable
  :data="[
    {
      cssVariable: '--reka-hover-card-content-transform-origin',
      description: 'The <Code>transform-origin</Code> computed from the content and arrow positions/offsets',
    },
    {
      cssVariable: '--reka-hover-card-content-available-width',
      description: 'The remaining width between the trigger and the boundary edge',
    },
    {
      cssVariable: '--reka-hover-card-content-available-height',
      description: 'The remaining height between the trigger and the boundary edge',
    },
    {
      cssVariable: '--reka-hover-card-trigger-width',
      description: 'The width of the trigger',
    },
    {
      cssVariable: '--reka-hover-card-trigger-height',
      description: 'The height of the trigger',
    },
  ]"
/>

### Arrow

An optional arrow element to render alongside the hover card. This can be used to help visually link the trigger with the `HoverCardContent`. Must be rendered inside `HoverCardContent`.

<!-- @include: @/meta/HoverCardArrow.md -->

## Examples

### Show instantly

Use the `openDelay` prop to control the time it takes for the hover card to open.

```vue line=12
<script setup>
import {
  HoverCardArrow,
  HoverCardContent,
  HoverCardPortal,
  HoverCardRoot,
  HoverCardTrigger,
} from 'reka-ui'
</script>

<template>
  <HoverCardRoot :open-delay="0">
    <HoverCardTrigger>…</HoverCardTrigger>
    <HoverCardContent>…</HoverCardContent>
  </HoverCardRoot>
</template>
````

### Constrain the content size

You may want to constrain the width of the content so that it matches the trigger width. You may also want to constrain its height to not exceed the viewport.

We expose several CSS custom properties such as `--reka-hover-card-trigger-width` and `--reka-hover-card-content-available-height` to support this. Use them to constrain the content dimensions.

```vue line=11
// index.vue
<script setup>
import { HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'
</script>

<template>
  <HoverCardRoot>
    <HoverCardTrigger>…</HoverCardTrigger>
    <HoverCardPortal>
      <HoverCardContent
        class="HoverCardContent"
        :side-offset="5"
      >
        …
      </HoverCardContent>
    </HoverCardPortal>
  </HoverCardRoot>
</template>
```

```css line=3-4
/* styles.css */
.HoverCardContent {
  width: var(--reka-hover-card-trigger-width);
  max-height: var(--reka-hover-card-content-available-height);
}
```

### Origin-aware animations

We expose a CSS custom property `--reka-hover-card-content-transform-origin`. Use it to animate the content from its computed origin based on `side`, `sideOffset`, `align`, `alignOffset` and any collisions.

```vue line=8
<script setup>
import { HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'
</script>

<template>
  <HoverCardRoot>
    <HoverCardTrigger>…</HoverCardTrigger>
    <HoverCardContent class="HoverCardContent">
      …
    </HoverCardContent>
  </HoverCardRoot>
</template>
```

```css line=3
/* styles.css */
.HoverCardContent {
  transform-origin: var(--reka-hover-card-content-transform-origin);
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Collision-aware animations

We expose `data-side` and `data-align` attributes. Their values will change at runtime to reflect collisions. Use them to create collision and direction-aware animations.

```vue line=8
<script setup>
import { HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'
</script>

<template>
  <HoverCardRoot>
    <HoverCardTrigger>…</HoverCardTrigger>
    <HoverCardContent class="HoverCardContent">
      …
    </HoverCardContent>
  </HoverCardRoot>
</template>
```

```css line=6-11
/* styles.css */
.HoverCardContent {
  animation-duration: 0.6s;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
.HoverCardContent[data-side="top"] {
  animation-name: slideUp;
}
.HoverCardContent[data-side="bottom"] {
  animation-name: slideDown;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Accessibility

The hover card is intended for sighted users only, the content will be inaccessible to keyboard users.

### Keyboard Interactions

<KeyboardTable :data="[
    {
      keys: ['Tab'],
      description: 'Opens/closes the hover card.',
    },
    {
      keys: ['Enter'],
      description: 'Opens the hover card link',
    }]" />
