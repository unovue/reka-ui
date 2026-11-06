---

title: Carousel
description: A set of slides shown one or a few at a time, scrolled with touch, mouse, wheel, keyboard or controls.
name: carousel
aria: https://www.w3.org/WAI/ARIA/apg/patterns/carousel
---

# Carousel

<Badge>Alpha</Badge>

<Description>
A set of slides shown one or a few at a time, scrolled with touch, mouse, wheel, keyboard or controls.
</Description>

<ComponentPreview name="Carousel" />

## Features

<Highlights
  :features="[
    'Can be controlled or uncontrolled.',
    'Built on native scroll snapping: renders and scrolls before hydration.',
    'Touch, mouse, pen, wheel, trackpad and keyboard navigation.',
    'Supports horizontal/vertical orientation and RTL.',
    'Loop, alignment, groups of slides, free dragging and fade.',
    'Autoplay and continuous auto scroll with a rotation control.',
    'Follows the WAI-ARIA carousel pattern and respects reduced motion.',
    'No dependencies.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import {
  CarouselAutoplayToggle,
  CarouselContent,
  CarouselIndicator,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselRoot,
  CarouselViewport,
} from 'reka-ui'
</script>

<template>
  <CarouselRoot v-slot="{ snapCount }">
    <CarouselAutoplayToggle />
    <CarouselViewport>
      <CarouselContent>
        <CarouselItem />
      </CarouselContent>
    </CarouselViewport>
    <CarouselPrevious />
    <CarouselNext />
    <CarouselIndicator
      v-for="(_, index) in snapCount"
      :key="index"
      :index="index"
    />
  </CarouselRoot>
</template>
```

## How it works

`CarouselViewport` is a real scroll container with CSS scroll snapping, and `CarouselContent` is the track inside it. Before hydration the browser already scrolls it with touch, a trackpad or the keyboard, and snaps to the slides. Once mounted, the carousel measures the track, adds mouse and pen dragging, the controls and the options below, and keeps `v-model` in sync with the scroll position.

The parts set the layout styles they need inline: the overflow and snapping on the viewport, `display: flex` on the content and `flex-shrink: 0` on the items. Give the items their size yourself, for example `flex-basis: 100%` for one slide per view or `33.333%` for three. Use padding on the items, and a negative margin on the content, to space them.

`v-model` is the index of the current **snap**, not of a slide. With one slide per snap they are the same. With `slidesToScroll`, or when `containScroll` merges the snaps at the end of the track, there are fewer snaps than slides: render the indicators from the `snapCount` slot prop.

### Server rendering

The server renders a working scroller: before hydration, visitors can already swipe, scroll with a trackpad or the keyboard, and land on a snap. The current slide has `data-active`, and with `fade` the other slides are hidden. Where the browser supports `scroll-initial-target`, the track opens on `defaultValue`; elsewhere it scrolls there on hydration. If a visitor scrolls before hydration, the carousel keeps that place and `v-model` follows it.

The slides register once they mount, so on the server `snapCount` is `0`, Previous/Next are disabled and the slides have no "2 of 5" label. Pass `itemCount` with the number of slides to render the indicators, the controls and the labels on the server too. Until the track is measured, every group of `slidesToScroll` slides counts as one snap.

## API Reference

### Root

Contains all the parts of a carousel. Renders a `region` with `aria-roledescription="carousel"`: give it a name with `aria-label` or `aria-labelledby`.

<!-- @include: @/meta/CarouselRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
    {
      attribute: '[data-playing]',
      values: 'Present while autoplay or auto scroll is on',
    },
  ]"
/>

### Viewport

The scroll container. It is focusable and handles the arrow keys, `Home` and `End`.

<!-- @include: @/meta/CarouselViewport.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
    {
      attribute: '[data-dragging]',
      values: 'Present while the track is dragged with a mouse or pen',
    },
  ]"
/>

<CssVariablesTable
  :data="[
    {
      cssVariable: '--reka-carousel-height',
      description: 'The height of the current slides, with <Code>autoHeight</Code>',
    },
  ]"
/>

### Content

The track that holds the slides. It is a polite live region, turned off while the carousel rotates on its own.

<!-- @include: @/meta/CarouselContent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Item

A slide. Renders a `group` with `aria-roledescription="slide"`, labelled with its position ("2 of 5") unless you pass `aria-label` or `aria-labelledby`. Once measured, slides out of view are `inert` and hidden from assistive technologies.

<!-- @include: @/meta/CarouselItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-index]',
      values: 'The slide index',
    },
    {
      attribute: '[data-active]',
      values: 'Present when the current snap brings the slide into place',
    },
    {
      attribute: '[data-in-view]',
      values: 'Present when the slide is visible in the viewport',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Previous

Goes to the previous snap. Disabled on the first one, unless `loop` is set.

<!-- @include: @/meta/CarouselPrevious.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when there is no previous snap',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Next

Goes to the next snap. Disabled on the last one, unless `loop` is set.

<!-- @include: @/meta/CarouselNext.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when there is no next snap',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Indicator

Goes to the snap at `index`. The current one has `aria-disabled="true"`.

<!-- @include: @/meta/CarouselIndicator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-active]',
      values: 'Present when its snap is the current one',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### AutoplayToggle

Starts and stops `autoplay` or `autoScroll`. Its label names the action it takes next ("Stop slide rotation", "Start slide rotation"). Place it first in the carousel, so it is the first thing keyboard users reach.

<!-- @include: @/meta/CarouselAutoplayToggle.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['playing', 'paused'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when neither autoplay nor autoScroll is set',
    },
  ]"
/>

## Examples

### Several slides per view

Size the items to fit several in the viewport. `align` places the current snap, and `slidesToScroll` moves several slides per step, or as many as fit with `'auto'`.

```vue line=4,5
<template>
  <CarouselRoot
    aria-label="Products"
    align="start"
    slides-to-scroll="auto"
  >
    <CarouselViewport>
      <CarouselContent class="-ml-4">
        <CarouselItem
          v-for="product in products"
          :key="product.id"
          class="basis-1/3 pl-4"
        >
          ...
        </CarouselItem>
      </CarouselContent>
    </CarouselViewport>
  </CarouselRoot>
</template>
```

### Controlling the current slide

Bind `v-model` to read or set the current snap. `update:modelValue` carries the reason of the change as `details.reason`, and `beforeUpdate:modelValue` can cancel it.

```vue line=4,9
<script setup lang="ts">
import { ref } from 'vue'

const current = ref(0)
</script>

<template>
  <CarouselRoot
    v-model="current"
    aria-label="Gallery"
  >
    ...
  </CarouselRoot>
  <p>Slide {{ current + 1 }}</p>
</template>
```

### Thumbnails

Two carousels can share the same `v-model`: the thumbnails follow the main one, and selecting a thumbnail moves it. `containScroll: 'keepSnaps'` keeps one snap per thumbnail, so both carousels count the same snaps.

```vue
<template>
  <CarouselRoot
    v-model="current"
    aria-label="Photos"
  >
    ...
  </CarouselRoot>
  <CarouselRoot
    v-model="current"
    aria-label="Thumbnails"
    align="center"
    contain-scroll="keepSnaps"
  >
    <CarouselViewport>
      <CarouselContent>
        <CarouselItem
          v-for="(photo, index) in photos"
          :key="photo.id"
          class="basis-1/4"
        >
          <button
            :aria-current="index === current"
            @click="current = index"
          >
            <img :src="photo.thumbnail" :alt="photo.alt">
          </button>
        </CarouselItem>
      </CarouselContent>
    </CarouselViewport>
  </CarouselRoot>
</template>
```

### Autoplay

`autoplay` moves to the next snap on an interval, and `autoScroll` scrolls the track continuously. Both pause while a mouse hovers the carousel, stop when keyboard focus enters it, and stop on mount when the user prefers reduced motion. With `stopOnInteraction`, the default, they also stop on the first drag, press or key. Bind `v-model:playing` to control them.

```vue line=3,5
<template>
  <CarouselRoot
    :autoplay="{ delay: 5000 }"
    aria-label="Announcements"
    loop
  >
    <CarouselAutoplayToggle v-slot="{ playing }">
      {{ playing ? 'Pause' : 'Play' }}
    </CarouselAutoplayToggle>
    ...
  </CarouselRoot>
</template>
```

### Fade

With `fade`, the slides are stacked and the current one has `opacity: 1`, the others `opacity: 0`. Add the transition to the items.

```vue line=3,9
<template>
  <CarouselRoot
    fade
    aria-label="Testimonials"
  >
    <CarouselViewport>
      <CarouselContent>
        <CarouselItem class="transition-opacity duration-500">
          ...
        </CarouselItem>
      </CarouselContent>
    </CarouselViewport>
  </CarouselRoot>
</template>
```

### Auto height

With `autoHeight`, the viewport takes the height of the current slides. Animate it with a `height` transition on the viewport.

```vue line=3,6
<template>
  <CarouselRoot
    auto-height
    aria-label="Reviews"
  >
    <CarouselViewport class="transition-[height] duration-300">
      ...
    </CarouselViewport>
  </CarouselRoot>
</template>
```

### Styling slides by state

`data-active` marks the slides of the current snap and `data-in-view` the visible ones, for example to dim the slides around a centered one.

```vue line=5
<template>
  <CarouselItem
    v-for="slide in slides"
    :key="slide.id"
    class="opacity-40 transition-opacity data-[active]:opacity-100"
  >
    {{ slide.title }}
  </CarouselItem>
</template>
```

## Accessibility

Adheres to the [Carousel WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel).

The root is a `region` with `aria-roledescription="carousel"`, each item a `group` with `aria-roledescription="slide"`, and the content a live region that announces slide changes, except while the carousel rotates on its own. The controls point at the content with `aria-controls`. Slides out of view are `inert`, so keyboard and screen reader users only meet the visible ones.

Rotation follows the pattern: it pauses on hover, stops for good when keyboard focus enters the carousel, and only restarts from `CarouselAutoplayToggle`. When the user prefers reduced motion, rotation stops on mount and programmatic scrolls jump instead of animating.

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: '<span>Moves focus through the controls, the viewport and the visible slides.</span>',
    },
    {
      keys: ['ArrowRight'],
      description: '<span>When the viewport is focused, goes to the next snap in a horizontal carousel.</span>',
    },
    {
      keys: ['ArrowLeft'],
      description: '<span>When the viewport is focused, goes to the previous snap in a horizontal carousel.</span>',
    },
    {
      keys: ['ArrowDown'],
      description: '<span>When the viewport is focused, goes to the next snap in a vertical carousel.</span>',
    },
    {
      keys: ['ArrowUp'],
      description: '<span>When the viewport is focused, goes to the previous snap in a vertical carousel.</span>',
    },
    {
      keys: ['Home'],
      description: '<span>When the viewport is focused, goes to the first snap.</span>',
    },
    {
      keys: ['End'],
      description: '<span>When the viewport is focused, goes to the last snap.</span>',
    },
    {
      keys: ['Space', 'Enter'],
      description: '<span>Activates the focused control.</span>',
    },
  ]"
/>

In a right-to-left layout (`dir="rtl"` on `CarouselRoot`, or on a [`ConfigProvider`](/docs/utilities/config-provider)), `ArrowLeft` goes to the next snap and `ArrowRight` to the previous one. See [Internationalization](/docs/guides/i18n#what-changes-in-rtl).

## Headless composable

`useCarousel` holds the current snap (`modelValue`, `scrollTo()`, `scrollPrev()`, `scrollNext()`), the rotation state (`playing`, `play()`, `stop()`) and the ARIA wiring: the `root`, `content`, `previous`, `next` and `autoplayToggle` [part surfaces](/docs/guides/composables#part-surfaces), and `getItemSurface(element)` and `getIndicatorSurface(index)`. It doesn't measure or scroll the track: that needs the viewport element and runs in `CarouselViewport`, so use the components for anything that scrolls. Pass a stable `baseId` when rendering on the server. The composable is experimental; see [Headless composables](/docs/guides/composables).
