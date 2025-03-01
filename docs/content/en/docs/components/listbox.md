---

title: Listbox
description: A control that allows the user to toggle between checked and not checked.
name: listbox
aria: https://www.w3.org/WAI/ARIA/apg/patterns/listbox
---

# Listbox

<Description>
A control that allows the user to toggle between checked and not checked.
</Description>

<ComponentPreview name="Listbox" />

## Features

<Highlights
  :features="[
    'Can be controlled or uncontrolled.',
    'Supports items, labels, groups of items.',
    'Focus is fully managed.',
    'Full keyboard navigation.',
    'Supports Right to Left direction.',
    'Different selection behavior.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { ListboxContent, ListboxFilter, ListboxGroup, ListboxGroupLabel, ListboxItem, ListboxItemIndicator, ListboxRoot, ListboxVirtualizer } from 'reka-ui'
</script>

<template>
  <ListboxRoot>
    <ListboxFilter />

    <ListboxContent>
      <ListboxItem>
        <ListboxItemIndicator />
      </ListboxItem>

      <!-- or with group -->
      <ListboxGroup>
        <ListboxGroupLabel />
        <ListboxItem>
          <ListboxItemIndicator />
        </ListboxItem>
      </ListboxGroup>

      <!-- or with virtual -->
      <ListboxVirtualizer>
        <ListboxItem>
          <ListboxItemIndicator />
        </ListboxItem>
      </ListboxVirtualizer>
    </ListboxContent>
  </ListboxRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a listbox. An `input` will also render when used within a `form` to ensure events propagate correctly.

<!-- @include: @/meta/ListboxRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Filter

Input element to perform filtering.

<!-- @include: @/meta/ListboxFilter.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Content

Contains all the listbox group and items.

<!-- @include: @/meta/ListboxContent.md -->

### Item

The item component.

<!-- @include: @/meta/ListboxItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked'],
    },
    {
      attribute: '[data-highlighted]',
      values: 'Present when highlighted',
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### ItemIndicator

Renders when the item is selected. You can style this element directly, or you can use it as a wrapper to put an icon into, or both.

<!-- @include: @/meta/ListboxItemIndicator.md -->

### Group

Used to group multiple items. use in conjunction with `ListboxGroupLabel` to ensure good accessibility via automatic labelling.

<!-- @include: @/meta/ListboxGroup.md -->

### GroupLabel

Used to render the label of a group. It won't be focusable using arrow keys.

<!-- @include: @/meta/ListboxGroupLabel.md -->

### Virtualizer

Virtual container to achieve list virtualization.

<!-- @include: @/meta/ListboxVirtualizer.md -->

## Examples

### Binding objects as values

Unlike native HTML form controls which only allow you to provide strings as values, `reka-ui` supports binding complex objects as well.

```vue line=12,16,21
<script setup lang="ts">
import { ref } from 'vue'
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot } from 'reka-ui'

const people = [
  { id: 1, name: 'Durward Reynolds' },
  { id: 2, name: 'Kenton Towne' },
  { id: 3, name: 'Therese Wunsch' },
  { id: 4, name: 'Benedict Kessler' },
  { id: 5, name: 'Katelyn Rohan' },
]
const selectedPeople = ref(people[0])
</script>

<template>
  <ListboxRoot v-model="selectedPeople">
    <ListboxContent>
      <ListboxItem
        v-for="person in people"
        :key="person.id"
        :value="person"
        :disabled="person.unavailable"
      >
        {{ person.name }}
      </ListboxItem>
    </ListboxContent>
  </ListboxRoot>
</template>
```

### Selecting multiple values

The `Listbox` component allows you to select multiple values. You can enable this by providing an array of values instead of a single value.

```vue line=12,18
<script setup lang="ts">
import { ref } from 'vue'
import { ListboxRoot } from 'reka-ui'

const people = [
  { id: 1, name: 'Durward Reynolds' },
  { id: 2, name: 'Kenton Towne' },
  { id: 3, name: 'Therese Wunsch' },
  { id: 4, name: 'Benedict Kessler' },
  { id: 5, name: 'Katelyn Rohan' },
]
const selectedPeople = ref([people[0], people[1]])
</script>

<template>
  <ListboxRoot
    v-model="selectedPeople"
    multiple
  >
    ...
  </ListboxRoot>
</template>
```

### Custom filtering

```vue line=13,15-16,21,24
<script setup lang="ts">
import { ref } from 'vue'
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot, useFilter } from 'reka-ui'

const people = [
  { id: 1, name: 'Durward Reynolds' },
  { id: 2, name: 'Kenton Towne' },
  { id: 3, name: 'Therese Wunsch' },
  { id: 4, name: 'Benedict Kessler' },
  { id: 5, name: 'Katelyn Rohan' },
]
const selectedPeople = ref(people[0])
const searchTerm = ref('')

const { startsWith } = useFilter({ sensitivity: 'base' })
const filteredPeople = computed(() => people.filter(p => startsWith(p.name, searchTerm.value)))
</script>

<template>
  <ListboxRoot v-model="selectedPeople">
    <ListboxFilter v-model="searchTerm" />
    <ListboxContent>
      <ListboxItem
        v-for="person in filteredPeople"
        :key="person.id"
        :value="person"
      >
        {{ person.name }}
      </ListboxItem>
    </ListboxContent>
  </ListboxRoot>
</template>
```

### Virtual List

Rendering a long list of item can slow down the app, thus using virtualization would significantly improve the performance.

See the [virtualization guide](../guides/virtualization.md) for more general info on virtualization.

```vue line=18-23
<script setup lang="ts">
import { ref } from 'vue'
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot, ListboxVirtualizer } from 'reka-ui'

const people = [
  { id: 1, name: 'Durward Reynolds' },
  { id: 2, name: 'Kenton Towne' },
  { id: 3, name: 'Therese Wunsch' },
  { id: 4, name: 'Benedict Kessler' },
  { id: 5, name: 'Katelyn Rohan' },
  // and a lot more
]
</script>

<template>
  <ListboxRoot>
    <ListboxContent>
      <ListboxVirtualizer
        v-slot="{ option }"
        :options="people"
        :text-content="(opt) => opt.name"
      >
        <ListboxItem :value="option">
          {{ person.name }}
        </ListboxItem>
      </ListboxVirtualizer>
    </ListboxContent>
  </ListboxRoot>
</template>
```

## Accessibility

Adheres to the [Listbox WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Enter'],
      description: '<span>When highlight on <code>ListboxItem</code>, selects the focused item. </span>',
    },
    {
      keys: ['ArrowDown'],
      description: 'When focus is on <code>ListboxItem</code>, moves focus to the next item. </span>',
    },
    {
      keys: ['ArrowUp'],
      description: 'When focus is on <code>ListboxItem</code>, moves focus to the previous item. </span>',
    },
    {
      keys: ['Home'],
      description: '<span>Moves focus and highlight to the first item.</span>',
    },
    {
      keys: ['End'],
      description: '<span>Moves focus and highlight to the last item.</span>',
    },
    {
      keys: ['Ctrl/Cmd + A'],
      description: '<span>Select all the items.</span>',
    }
  ]"
/>
