---

title: Autocomplete
description: An input with suggestions that allows free-form text entry. Unlike Combobox, the value is the input text itself rather than a selected item.
name: autocomplete
aria: https://www.w3.org/WAI/ARIA/apg/patterns/combobox
---

# Autocomplete

<Badge>Alpha</Badge>

<Description>
An input with suggestions that allows free-form text entry. Unlike Combobox, the value is the input text itself rather than a selected item.
</Description>

<ComponentPreview name="Autocomplete" />

## Features

<Highlights
  :features="[
    'Can be controlled or uncontrolled.',
    'Offers 2 positioning modes.',
    'Supports items, labels, groups of items.',
    'Focus is fully managed.',
    'Full keyboard navigation.',
    'Supports custom placeholder.',
    'Supports Right to Left direction.',
    'Free-form text input — value is the typed text, not a selection.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup lang="ts">
import {
  AutocompleteAnchor,
  AutocompleteArrow,
  AutocompleteCancel,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteLabel,
  AutocompletePortal,
  AutocompleteRoot,
  AutocompleteSeparator,
  AutocompleteTrigger,
  AutocompleteViewport,
} from 'reka-ui'
</script>

<template>
  <AutocompleteRoot>
    <AutocompleteAnchor>
      <AutocompleteInput />
      <AutocompleteTrigger />
      <AutocompleteCancel />
    </AutocompleteAnchor>

    <AutocompletePortal>
      <AutocompleteContent>
        <AutocompleteViewport>
          <AutocompleteEmpty />

          <AutocompleteItem />

          <AutocompleteSeparator />

          <AutocompleteGroup>
            <AutocompleteLabel />
            <AutocompleteItem />
          </AutocompleteGroup>
        </AutocompleteViewport>

        <AutocompleteArrow />
      </AutocompleteContent>
    </AutocompletePortal>
  </AutocompleteRoot>
</template>
```

## Autocomplete vs. Combobox

The Autocomplete component is similar to the [Combobox](/docs/components/combobox) but with a key difference:

| | Autocomplete | Combobox |
| --- | --- | --- |
| **`modelValue`** | The input text (`string`) | The selected item (`AcceptableValue`) |
| **Free-form text** | Yes — any text is valid | No — must select from the list |
| **`multiple`** | Not supported | Supported |
| **Input on blur** | Retains typed text by default | Resets to selected value by default |
| **Item selection** | Fills the input with the item's text value | Sets `modelValue` to the item's value |

Use **Autocomplete** when the user should be able to type anything with optional suggestions. Use **Combobox** when the user must pick from a predefined set of options.

## API Reference

### Root

Contains all the parts of an Autocomplete.

<!-- @include: @/meta/AutocompleteRoot.md -->

### Anchor

Used as an anchor if you set `AutocompleteContent`'s position to `popper`.

<!-- @include: @/meta/ComboboxAnchor.md -->

### Input

The input component to search through the autocomplete items. Typing updates the `modelValue` directly.

<!-- @include: @/meta/AutocompleteInput.md -->

### Trigger

The button that toggles the Autocomplete Content.

<!-- @include: @/meta/ComboboxTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Cancel

The button that clears the input text and resets the value.

<!-- @include: @/meta/ComboboxCancel.md -->

### Empty

Shown when none of the items match the query.

<!-- @include: @/meta/ComboboxEmpty.md -->

### Portal

When used, portals the content part into the `body`.

You need to set `position="popper"` for `AutocompleteContent` to make sure the position was automatically computed similar to `Popover` or `DropdownMenu`.

<!-- @include: @/meta/ComboboxPortal.md -->

### Content

The component that pops out when the autocomplete is open.

<PresenceCallout />

<!-- @include: @/meta/ComboboxContent.md -->

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
    {
      attribute: '[data-empty]',
      values: 'Present when there are no items matching the filter',
    },
  ]"
/>

<CssVariablesTable
  :data="[
    {
      cssVariable: '--reka-combobox-content-transform-origin',
      description: 'The <Code>transform-origin</Code> computed from the content and arrow positions/offsets. Only present when <Code>position=&quot;popper&quot;</Code>.',
    },
    {
      cssVariable: '--reka-combobox-content-available-width',
      description: 'The remaining width between the trigger and the boundary edge. Only present when <Code>position=&quot;popper&quot;</Code>.',
    },
    {
      cssVariable: '--reka-combobox-content-available-height',
      description: 'The remaining height between the trigger and the boundary edge. Only present when <Code>position=&quot;popper&quot;</Code>.',
    },
    {
      cssVariable: '--reka-combobox-trigger-width',
      description: 'The width of the trigger. Only present when <Code>position=&quot;popper&quot;</Code>.',
    },
    {
      cssVariable: '--reka-combobox-trigger-height',
      description: 'The height of the trigger. Only present when <Code>position=&quot;popper&quot;</Code>.',
    },
  ]"
/>

### Viewport

The scrolling viewport that contains all of the items.

<!-- @include: @/meta/ComboboxViewport.md -->

### Item

The component that contains the autocomplete items. When selected, the item's string value fills the input.

<!-- @include: @/meta/ComboboxItem.md -->

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

### Group

Used to group multiple items. Use in conjunction with `AutocompleteLabel` to ensure good accessibility via automatic labelling.

<!-- @include: @/meta/ComboboxGroup.md -->

### Label

Used to render the label of a group. It won't be focusable using arrow keys.

<!-- @include: @/meta/ComboboxLabel.md -->

### Separator

Used to visually separate items in the Autocomplete.

<!-- @include: @/meta/ComboboxSeparator.md -->

### Arrow

An optional arrow element to render alongside the content. This can be used to help visually link the trigger with the `AutocompleteContent`. Must be rendered inside `AutocompleteContent`. Only available when `position` is set to `popper`.

<!-- @include: @/meta/ComboboxArrow.md -->

### Virtualizer

Virtual container to achieve list virtualization.

See the [virtualization guide](../guides/virtualization.md) for more general info on virtualization.

<!-- @include: @/meta/ComboboxVirtualizer.md -->

## Examples

### Basic usage

The `modelValue` is a string that reflects whatever the user types. Selecting an item fills the input with that item's text.

```vue
<script setup lang="ts">
import { AutocompleteContent, AutocompleteInput, AutocompleteItem, AutocompletePortal, AutocompleteRoot } from 'reka-ui'
import { ref } from 'vue'

const searchText = ref('')
const fruits = ['Apple', 'Banana', 'Orange', 'Grapes', 'Pineapple']
</script>

<template>
  <AutocompleteRoot v-model="searchText">
    <AutocompleteInput placeholder="Type a fruit..." />
    <AutocompletePortal>
      <AutocompleteContent>
        <AutocompleteItem
          v-for="fruit in fruits"
          :key="fruit"
          :value="fruit"
        >
          {{ fruit }}
        </AutocompleteItem>
      </AutocompleteContent>
    </AutocompletePortal>
  </AutocompleteRoot>
</template>
```

### Hide menu when empty

Use the `hideWhenEmpty` prop on `AutocompleteContent` to hide the menu when no items match the filter.

```vue
<template>
  <AutocompleteRoot v-model="searchText">
    <AutocompleteInput placeholder="Type a fruit..." />
    <AutocompletePortal>
      <AutocompleteContent hide-when-empty>
        <AutocompleteItem
          v-for="fruit in fruits"
          :key="fruit"
          :value="fruit"
        >
          {{ fruit }}
        </AutocompleteItem>
      </AutocompleteContent>
    </AutocompletePortal>
  </AutocompleteRoot>
</template>
```

### With form submission

The Autocomplete value is submitted as a regular text field in forms.

```vue
<script setup lang="ts">
import { AutocompleteContent, AutocompleteInput, AutocompleteItem, AutocompletePortal, AutocompleteRoot } from 'reka-ui'
import { ref } from 'vue'

const query = ref('')
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']
</script>

<template>
  <form>
    <AutocompleteRoot v-model="query" name="city">
      <AutocompleteInput placeholder="Enter a city..." />
      <AutocompletePortal>
        <AutocompleteContent>
          <AutocompleteItem
            v-for="city in cities"
            :key="city"
            :value="city"
          >
            {{ city }}
          </AutocompleteItem>
        </AutocompleteContent>
      </AutocompletePortal>
    </AutocompleteRoot>
  </form>
</template>
```

## Accessibility

Adheres to the [Combobox WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox).

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Enter'],
      description: '<span>When focus is on <Code>AutocompleteItem</Code>, selects the focused item and fills the input with its value.</span>',
    },
    {
      keys: ['ArrowDown'],
      description: '<span>When focus is on <Code>AutocompleteInput</Code>, opens the autocomplete content. <br /> When focus is on an item, moves focus to the next item.</span>',
    },
    {
      keys: ['ArrowUp'],
      description: '<span>When focus is on <Code>AutocompleteInput</Code>, opens the autocomplete content. <br /> When focus is on an item, moves focus to the previous item.</span>',
    },
    {
      keys: ['Esc'],
      description: '<span>Closes the autocomplete content and returns focus to <Code>AutocompleteInput</Code>.</span>',
    },
  ]"
/>
