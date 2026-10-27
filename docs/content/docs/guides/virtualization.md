---
title: Virtualization
description: Learn how to efficiently render large datasets with Reka UI, powered by `@tanstack/virtual`.
---

# Virtualization

<Description>

Learn how to efficiently render large datasets with Reka UI, powered by `@tanstack/vue-virtual`.

</Description>

<Callout type="info" title="What is Virtualization?">

Virtualization is a technique used to efficiently render large lists or tree structures by only rendering the items currently visible in the viewport. This approach significantly improves performance and reduces memory usage, especially when dealing with thousands of items.

</Callout>

## Benefits of Using Virtualization

<Highlights
  :features="[
    'Improved Performance: Render thousands of items without lag',
    'Reduced Memory Usage: Only mount DOM nodes for visible items',
    'Better User Experience: Fast initial load times and responsive interactions',
  ]"
/>

## Customization Options

All virtualizer ([Combobox](/docs/components/combobox#virtualizer), [Listbox](/docs/components/listbox#virtualizer), [Select](/docs/components/select#virtualizer) and [Tree](/docs/components/tree#virtualizer)) components offer the following props and customization:

- Custom item rendering: Flexibility to render complex item structures
- `estimateSize`: Set estimate item heights for static or dynamic item
- `overscan`: Control the number of items rendered outside the visible area
- `textContent`: Text content for each item to achieve type-ahead feature. The Combobox, Listbox and Select virtualizers also register it as the option's label, so a selected value whose item never rendered still shows its text
- Grouped options (Combobox, Listbox and Select): see [Grouped options](#grouped-options)

## Usage

Here's a few important note to make sure virtualization works!

1. A fixed height/max-height wrapping `<Virtualizer />`.
2. Consistent item height, and set the `estimateSize` props appropriately.
3. Set `textContent` props to make sure type-ahead accessibility.

## Example

```vue
<script setup>
import { ComboboxContent, ComboboxItem, ComboboxRoot, ComboboxViewport, ComboboxVirtualizer } from 'reka-ui'

const items = [
  // … large array of items
]
</script>

<template>
  <ComboboxRoot>
    …
    <ComboboxContent>
      <!-- Make sure to set a height for Virtualizer's parent element -->
      <ComboboxViewport class="max-h-80 overflow-y-auto">
        <ComboboxVirtualizer
          v-slot="{ option }"
          :options="items"
          :estimate-size="25"
          :text-content="(opt) => opt.label"
        >
          <ComboboxItem :value="option">
            {{ option.label }}
          </ComboboxItem>
        </ComboboxVirtualizer>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxRoot>
</template>
```

## Grouped options

`ComboboxVirtualizer`, `ListboxVirtualizer` and `SelectVirtualizer` accept groups instead of a flat list: an array of `{ label, options, disabled? }` objects (the `VirtualGroup` type). The groups are flattened into one list of rows, a header row per group followed by its options, so headers scroll with the list and are virtualized like any other row. Render a header through the `group` slot (without one, the label renders in a plain `div`).

- Header rows are not options: arrow keys, Home/End, typeahead, select-all and range selection skip them, and `aria-setsize` / `aria-posinset` count options only.
- Each option is described by its group's header (`aria-describedby`), and a group with `disabled: true` disables its options.
- With a filter, a group with no matching option is dropped.
- A function `estimateSize` receives the row index, header rows included.

```vue
<script setup>
import { ListboxContent, ListboxItem, ListboxRoot, ListboxVirtualizer } from 'reka-ui'

const groups = [
  { label: 'Fruits', options: ['Apple', 'Banana',] },
  { label: 'Vegetables', options: ['Carrot', 'Leek',] },
]
</script>

<template>
  <ListboxRoot>
    <ListboxContent class="h-72 overflow-auto">
      <ListboxVirtualizer :options="groups">
        <template #group="{ group }">
          <div class="text-xs font-semibold">
            {{ group.label }}
          </div>
        </template>
        <template #default="{ option }">
          <ListboxItem :value="option">
            {{ option }}
          </ListboxItem>
        </template>
      </ListboxVirtualizer>
    </ListboxContent>
  </ListboxRoot>
</template>
```

## Common issue

### Virtualization is not working

Do ensure that `<Virtualizer>`'s parent element has a defined height!

```vue line=6
<template>
  <ComboboxRoot>
    …
    <ComboboxContent>
      <!-- Height must be defined -->
      <ComboboxViewport class="max-h-80 overflow-y-auto">
        <ComboboxVirtualizer>
          …
        </ComboboxVirtualizer>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxRoot>
</template>
```
