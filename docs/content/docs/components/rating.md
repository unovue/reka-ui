---

title: Rating
description: A star-rating input where the user selects a score, with support for fractional values.
name: rating
aria: https://www.w3.org/WAI/ARIA/apg/patterns/radio
---

# Rating

<Description>
A star-rating input where the user selects a score, with support for fractional values.
</Description>

<ComponentPreview name="Rating" />

## Features

<Highlights
  :features="[
    'Can be controlled or uncontrolled.',
    'Supports fractional ratings (half, quarter, etc.) via the step prop.',
    'Previews the value under the pointer on hover.',
    'Can be cleared by clicking the active value again.',
    'Built on top of Radio Group — full keyboard navigation and form support.',
    'Supports Right to Left direction.',
    'Exposes CSS variables for rendering partial steps.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together. `RatingRoot` exposes the list of `items`, and each `RatingItem` exposes the `steps` it is made of, so you render an indicator per step.

```vue
<script setup>
import { RatingItem, RatingItemIndicator, RatingRoot } from 'reka-ui'
</script>

<template>
  <RatingRoot v-slot="{ items }">
    <RatingItem
      v-for="item in items"
      :key="item"
      v-slot="{ steps }"
      :item="item"
    >
      <RatingItemIndicator
        v-for="step in steps"
        :key="step"
        :step="step"
      />
    </RatingItem>
  </RatingRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a rating and provides the rating state. Renders a [Radio Group](/docs/components/radio-group) under the hood, so it supports form submission and keyboard navigation.

<!-- @include: @/meta/RatingRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Item

Wraps a single rating value (e.g. a single star). It computes the list of `steps` that compose this item based on the root's `step` prop, exposed via the default slot. Renders a `label` by default.

<!-- @include: @/meta/RatingItem.md -->

### ItemIndicator

The interactive indicator rendered for each step of an item. It reflects whether the step is active based on the current (or hovered) value.

<!-- @include: @/meta/RatingItemIndicator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['active'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

To render partial steps (for `step` values below `1`), `RatingItemIndicator` exposes the following CSS variables:

| CSS Variable                       | Description                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| `--reka-rating-item-step-width`    | The width this step should occupy within the item, e.g. `50%` for a half step.       |
| `--reka-rating-item-step-opacity`  | `1` when the step should be visible, `0` otherwise (used to stack overlapping steps). |
| `--reka-rating-item-step-z-index`  | The stacking order of the step so smaller steps render above larger ones.            |

A typical fractional indicator clips its width and stacks steps using these variables:

```vue
<RatingItemIndicator
  :step="step"
  class="absolute overflow-hidden w-[var(--reka-rating-item-step-width)] opacity-[var(--reka-rating-item-step-opacity)] z-[var(--reka-rating-item-step-z-index)]"
/>
```

## Examples

### Fractional rating

Use the `step` prop to allow values smaller than `1`. Each `RatingItem` is then split into multiple `steps`, and each step renders its own indicator clipped with the exposed CSS variables.

```vue line=10
<script setup>
import { RatingItem, RatingItemIndicator, RatingRoot } from 'reka-ui'
import { ref } from 'vue'

const rating = ref(2.5)
</script>

<template>
  <RatingRoot
    v-slot="{ items }"
    v-model="rating"
    :step="0.5"
  >
    <RatingItem
      v-for="item in items"
      :key="item"
      v-slot="{ steps }"
      :item="item"
      class="relative"
    >
      <RatingItemIndicator
        v-for="step in steps"
        :key="step"
        :step="step"
        class="absolute overflow-hidden w-[var(--reka-rating-item-step-width)] opacity-[var(--reka-rating-item-step-opacity)] z-[var(--reka-rating-item-step-z-index)]"
      />
    </RatingItem>
  </RatingRoot>
</template>
```

### Clearable

Use the `clearable` prop to let users reset the rating to `0` by clicking the currently selected value again.

```vue line=4
<template>
  <RatingRoot
    v-model="rating"
    clearable
  >
    <!-- ... -->
  </RatingRoot>
</template>
```

### Hover preview

Use the `hoverable` prop to preview the value under the pointer before committing to it. The `RatingItemIndicator` exposes `data-state="active"` for every step at or below the hovered value.

```vue line=4
<template>
  <RatingRoot
    v-model="rating"
    hoverable
  >
    <!-- ... -->
  </RatingRoot>
</template>
```

### Custom length

Use the `length` prop to change how many items are rendered. It defaults to `5`.

```vue line=4
<template>
  <RatingRoot
    v-model="rating"
    :length="10"
  >
    <!-- ... -->
  </RatingRoot>
</template>
```

### Read-only / disabled

Use the `disabled` prop to prevent interaction, for example when displaying an average rating.

```vue line=4
<template>
  <RatingRoot
    :default-value="4"
    disabled
  >
    <!-- ... -->
  </RatingRoot>
</template>
```

## Accessibility

Built on top of the [Radio Group](/docs/components/radio-group) primitive and adheres to the [Radio Group WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio). Provide an accessible label for each step via `aria-label` so screen reader users understand the value each indicator represents.

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: 'Moves focus to either the checked item or the first item in the rating.',
    },
    {
      keys: ['Space'],
      description: 'When focus is on an unchecked item, selects that value.',
    },
    {
      keys: ['ArrowDown'],
      description: 'Moves focus and selection to the next item.',
    },
    {
      keys: ['ArrowRight'],
      description: 'Moves focus and selection to the next item.',
    },
    {
      keys: ['ArrowUp'],
      description: 'Moves focus and selection to the previous item.',
    },
    {
      keys: ['ArrowLeft'],
      description: 'Moves focus and selection to the previous item.',
    },
  ]"
/>
