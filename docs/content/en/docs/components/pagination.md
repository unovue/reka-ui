---
title: Pagination
description: Displays data in paged format and provides navigation between pages.
name: pagination
---

# Pagination

<Description>
Displays data in paged format and provides navigation between pages.
</Description>

<ComponentPreview name="Pagination" />

## Features

<Highlights
  :features="[
    'Enable quick access to first, or last page',
    'Enable to show edges constantly, or not',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

### Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { PaginationEllipsis, PaginationFirst, PaginationLast, PaginationList, PaginationListItem, PaginationNext, PaginationPrev, PaginationRoot } from 'reka-ui'
</script>

<template>
  <PaginationRoot>
    <PaginationList v-slot="{ items }">
      <PaginationFirst />
      <PaginationPrev />
      <template v-for="(page, index) in items">
        <PaginationListItem
          v-if="page.type === 'page'"
          :key="index"
        />
        <PaginationEllipsis
          v-else
          :key="page.type"
          :index="index"
        >
          &#8230;
        </PaginationEllipsis>
      </template>
      <PaginationNext />
      <PaginationLast />
    </PaginationList>
  </PaginationRoot>
</template>
```

## API Reference

### Root

Contains all of the paginations parts.

<!-- @include: @/meta/PaginationRoot.md -->

### List

Used to show the list of pages. It also makes pagination accessible to assistive technologies.

<!-- @include: @/meta/PaginationList.md -->

### Item

Used to render the button that changes the current page.

<!-- @include: @/meta/PaginationItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-selected]',
      values: ['true' , ''],
    },
    {
      attribute: '[data-type]',
      values: ['page'],
    }
  ]"
/>

### Ellipsis

Placeholder element when the list is long, and only a small amount of `siblingCount` was set and `showEdges` was set to `true`.

<!-- @include: @/meta/PaginationEllipsis.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-type]',
      values: ['ellipsis'],
    }
  ]"
/>

### First

Triggers that set the page value to 1

<!-- @include: @/meta/PaginationFirst.md -->

### Prev

Triggers that set the page value to the previous page

<!-- @include: @/meta/PaginationPrev.md -->

### Next

Triggers that set the page value to the next page

<!-- @include: @/meta/PaginationNext.md -->

### Last

Triggers that set the page value to the last page

<!-- @include: @/meta/PaginationLast.md -->

## Examples

### With ellipsis

You can add `PaginationEllipsis` as a visual cue for more previous and after items.

```vue line=10,14
<script setup lang="ts">
import { PaginationEllipsis, PaginationList, PaginationListItem, PaginationRoot } from 'reka-ui'
</script>

<template>
  <PaginationRoot>
    <PaginationList v-slot="{ items }">
      <template v-for="(page, index) in items">
        <PaginationListItem
          v-if="page.type === 'page'"
          :key="index"
        />
        <PaginationEllipsis
          v-else
          :key="page.type"
          :index="index"
        >
          &#8230;
        </PaginationEllipsis>
      </template>
    </PaginationList>
  </PaginationRoot>
</template>
```

### With first/last button

You can add `PaginationFirst` to allow user to navigate to first page, or `PaginationLast` to navigate to last page.

```vue line=8,10
<script setup lang="ts">
import { PaginationFirst, PaginationLast, PaginationList, PaginationListItem, PaginationRoot } from 'reka-ui'
</script>

<template>
  <PaginationRoot>
    <PaginationList>
      <PaginationFirst />
      ...
      <PaginationLast />
    </PaginationList>
  </PaginationRoot>
</template>
```

### Control page programmatically

You can control the current page by passing it a reactive value.

```vue line=6,10,11
<script setup lang="ts">
import { PaginationRoot } from 'reka-ui'
import { Select } from './custom-select'
import { ref } from 'vue'

const currentPage = ref(1)
</script>

<template>
  <Select v-model="currentPage" />
  <PaginationRoot v-model:page="currentPage">
    ...
  </PaginationRoot>
</template>
```

## Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: 'Moves focus to the next focusable element.',
    },
    {
      keys: ['Space'],
      description: `
        <span>
          When focus is on a any trigger, trigger selected page or arrow navigation
        </span>`
    },
    {
      keys: ['Enter'],
      description:  `
        <span>
          When focus is on a any trigger, trigger selected page or arrow navigation
        </span>`
    },
  ]"
/>
