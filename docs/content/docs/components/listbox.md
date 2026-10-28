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

Input element to perform filtering. Its value is the search term the root's `filter` runs against; without a `filter` on the root it only moves the highlight, and you filter the items yourself (see [Filtering](#filtering)).

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
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot } from 'reka-ui'
import { ref } from 'vue'

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
import { ListboxRoot } from 'reka-ui'
import { ref } from 'vue'

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

### Filtering

Pass a `filter` function to `ListboxRoot` to filter the items by the `ListboxFilter` value. It is called as `filter(text, search, value)` with the item's `textValue` (or its text content) and returns whether the item matches. `useFilter` provides locale-aware `contains`, `startsWith` and `endsWith` matchers that fit this signature.

Items that do not match are not rendered, so keyboard navigation, typeahead and select-all skip them, and a `ListboxGroup` whose items all fail to match is hidden. Filtering is opt-in: without `filter` (or with `null`) the listbox renders every item.

```vue line=5,10
<script setup lang="ts">
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot, useFilter } from 'reka-ui'

const fruits = ['Apple', 'Banana', 'Blueberry', 'Cherry', 'Grape', 'Mango']
const { contains } = useFilter({ sensitivity: 'base' })
</script>

<template>
  <ListboxRoot
    :filter="contains"
  >
    <ListboxFilter />
    <ListboxContent>
      <ListboxItem
        v-for="fruit in fruits"
        :key="fruit"
        :value="fruit"
      >
        {{ fruit }}
      </ListboxItem>
    </ListboxContent>
  </ListboxRoot>
</template>
```

Set `textValue` on an item whose content is not plain text, so the filter matches the text you want. The root exposes the result as `filtered` (`{ search, active, count }`, read it through a template ref), which you can use to render an empty state.

Each item stays a mounted component while it is filtered out, and clearing or widening the search renders every item that matches again. For a large list (thousands of items) use a `ListboxVirtualizer`, which only renders the visible window of the matching options.

With a `ListboxVirtualizer`, the filter runs over its `options` before they are virtualized: it matches `textContent(option)` (or the option's string form, so pass `textContent` for object options), and a filtered-out option takes no virtual index and does not count in `aria-setsize`.

```vue line=10,14
<script setup lang="ts">
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot, ListboxVirtualizer, useFilter } from 'reka-ui'

const people = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Person ${i}` }))
const { contains } = useFilter({ sensitivity: 'base' })
</script>

<template>
  <ListboxRoot
    :filter="contains"
  >
    <ListboxFilter />
    <ListboxContent class="h-72 overflow-auto">
      <ListboxVirtualizer
        v-slot="{ option }"
        :options="people"
        :text-content="(person) => person.name"
      >
        <ListboxItem :value="option">
          {{ option.name }}
        </ListboxItem>
      </ListboxVirtualizer>
    </ListboxContent>
  </ListboxRoot>
</template>
```

### Custom filtering

To filter on a server, or to control the list yourself, leave `filter` unset, bind the `ListboxFilter` value and render only the items you want.

```vue line=13,15-16,21,24
<script setup lang="ts">
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot, useFilter } from 'reka-ui'
import { computed, ref } from 'vue'

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
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot, ListboxVirtualizer } from 'reka-ui'
import { ref } from 'vue'

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

### Large lists

When the data your `v-for` reads changes, Vue re-renders every item of that `v-for`, because each item's slot may read the new data. With hundreds of items, add `v-memo` to the `v-for` so an item re-renders only when its own values change:

```vue
<ListboxItem v-for="item in items" :key="item.value" v-memo="[item.value, item.label]" :value="item.value">
  {{ item.label }}
</ListboxItem>
```

`v-memo` must list every value the item's slot reads. A value it leaves out shows stale content when only that value changes. For very long lists, see the virtualization example above.

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
