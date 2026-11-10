---

title: Combobox
description: Choose from a list of suggested values with full keyboard support.
name: combobox
aria: https://www.w3.org/WAI/ARIA/apg/patterns/listbox
---

# Combobox

<Description>
Choose from a list of suggested values with full keyboard support.
</Description>

<ComponentPreview name="Combobox" />

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
  ComboboxAnchor,
  ComboboxArrow,
  ComboboxCancel,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui'
</script>

<template>
  <ComboboxRoot>
    <ComboboxAnchor>
      <ComboboxInput />
      <ComboboxTrigger />
      <ComboboxCancel />
    </ComboboxAnchor>

    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxViewport>
          <ComboboxEmpty />

          <ComboboxItem>
            <ComboboxItemIndicator />
          </ComboboxItem>

          <ComboboxSeparator />

          <ComboboxGroup>
            <ComboboxLabel />
            <ComboboxItem>
              <ComboboxItemIndicator />
            </ComboboxItem>
          </ComboboxGroup>
        </ComboboxViewport>

        <ComboboxArrow />
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a Combobox

<!-- @include: @/meta/ComboboxRoot.md -->

### Anchor

Used as an anchor if you set `ComboboxContent`'s position to `popper`.

<!-- @include: @/meta/ComboboxAnchor.md -->

### Input

The input component to search through the combobox items.

<!-- @include: @/meta/ComboboxInput.md -->

### Trigger

The button that toggles the Combobox Content.

<!-- @include: @/meta/ComboboxTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-popup-open]',
      values: 'Present when the combobox is open',
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Cancel

The button that clears the selected value and the search term. Set `:reset-model-value-on-clear="false"` on `ComboboxRoot` to clear only the search term and keep the selection. It does nothing while the combobox is disabled.

<!-- @include: @/meta/ComboboxCancel.md -->

### Empty

Shown when none of the items match the query.

<!-- @include: @/meta/ComboboxEmpty.md -->

### Portal

When used, portals the content part into the `body`.

You need to set `position="popper"` for `ComboboxContent` to make sure the position was automatically computed similar to `Popover` or `DropdownMenu`.

<!-- @include: @/meta/ComboboxPortal.md -->

### Content

The component that pops out when the combobox is open.

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

The component that contains the combobox items.

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

### ItemIndicator

Renders when the item is selected. You can style this element directly, or you can use it as a wrapper to put an icon into, or both.

<!-- @include: @/meta/ComboboxItemIndicator.md -->

### Group

Used to group multiple items. use in conjunction with `ComboboxLabel` to ensure good accessibility via automatic labelling.

<!-- @include: @/meta/ComboboxGroup.md -->

### Label

Used to render the label of a group. It won't be focusable using arrow keys.

<!-- @include: @/meta/ComboboxLabel.md -->

### Separator

Used to visually separate items in the Combobox

<!-- @include: @/meta/ComboboxSeparator.md -->

### Arrow

An optional arrow element to render alongside the content. This can be used to help visually link the trigger with the `ComboboxContent`. Must be rendered inside `ComboboxContent`. Only available when `position` is set to `popper`.

<!-- @include: @/meta/ComboboxArrow.md -->

### Virtualizer

Virtual container to achieve list virtualization.

<Callout type="warning">

The root's `filter` runs over `options` before they are virtualized, matching `textContent(option)` (or the option's string form). Pass `text-content` when the options are objects, or set `:filter="null"` on `ComboboxRoot` when you filter `options` yourself. See [example below](#virtualized-combobox-with-filtering).

</Callout>

See the [virtualization guide](../guides/virtualization.md) for more general info on virtualization.

<!-- @include: @/meta/ComboboxVirtualizer.md -->

## Examples

### Binding objects as values

Unlike native HTML form controls which only allow you to provide strings as values, `reka-ui` supports binding complex objects as well.

Make sure to set the `displayValue` prop to set the input value on item selection. Set it on `ComboboxRoot` or on `ComboboxInput` (the input's own prop wins). When you have the options as data, `items` with `by` does the same without a function (see [Listing the items as data](#listing-the-items-as-data)).

```vue line=12,17,23
<script setup lang="ts">
import { ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot } from 'reka-ui'
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
  <ComboboxRoot v-model="selectedPeople">
    <ComboboxInput :display-value="(v) => v.name" />
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxItem
          v-for="person in people"
          :key="person.id"
          :value="person"
          :disabled="person.unavailable"
        >
          {{ person.name }}
        </ComboboxItem>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

### Listing the items as data

Without `displayValue`, the input shows the selected value itself: `us`, not `United States`. Pass the options to `items` on `ComboboxRoot` as well as rendering them, and the input shows the label of the selected value instead. The label comes from the data, so it is there before the popup has ever opened, in the server-rendered HTML, and for a value whose item is filtered out or not rendered (a virtualized list, options loaded on open).

`items` has the same shapes as on a [Select](select.md#listing-the-items-as-data): a record of value to label, an array of `{ value, label, disabled? }`, or an array of groups `{ label?, items }`. Object values are matched with `by`. The types are exported as `ComboboxItems`, `ComboboxItemData` and `ComboboxItemGroupData`.

The items are still rendered by your template, and the rendered items make up the list:

- The filter matches the text of the rendered `ComboboxItem` (its `textValue`, else its content), not the label in `items`. Keep the two the same, or typing the text the input shows may not find the item.
- `items` adds no option to the list, and a `disabled` in `items` is not read: set `disabled` on the `ComboboxItem`.
- A value `items` does not list shows as it does without `items`: its string form, or nothing for an object.
- `displayValue`, on the root or on the input, wins over `items`.
- `null` is the empty value: the input stays empty for it, also when `items` has a `null` entry.

When `items` changes (labels that arrive after the value, a language switch), the input follows while it rests. Text being typed is left alone, and is reset to the new label when the popup closes.

```vue line=6-10,16
<script setup lang="ts">
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxViewport } from 'reka-ui'
import { ref } from 'vue'

const country = ref('us')
const countries = [
  { value: 'us', label: 'United States' },
  { value: 'de', label: 'Germany' },
  { value: 'jp', label: 'Japan' },
]
</script>

<template>
  <ComboboxRoot
    v-model="country"
    :items="countries"
  >
    <ComboboxAnchor>
      <ComboboxInput placeholder="Select a country" />
    </ComboboxAnchor>
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxViewport>
          <ComboboxItem
            v-for="item in countries"
            :key="item.value"
            :value="item.value"
            :text-value="item.label"
          >
            {{ item.label }}
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

With `multiple` the input shows no selection, so the labels are given to you instead: `selectedLabels` of the root's default slot holds the text of each selected value, in the order of the value. Each text is resolved like the input's: the root's `displayValue`, then the label in `items`, then the string form of the value.

```vue line=3,6,9-14
<template>
  <ComboboxRoot
    v-slot="{ selectedLabels }"
    v-model="selectedCountries"
    multiple
    :items="countries"
  >
    <ComboboxAnchor>
      <span
        v-for="(label, index) in selectedLabels"
        :key="selectedCountries[index]"
      >
        {{ label }}
      </span>
      <ComboboxInput placeholder="Add a country" />
    </ComboboxAnchor>
    <!-- ... -->
  </ComboboxRoot>
</template>
```

### Selecting multiple values

The `Combobox` component allows you to select multiple values. You can enable this by providing an array of values instead of a single value.

Selecting an item while filtering clears the typed text and the filter, and the popup stays open for the next pick. Set `:reset-search-term-on-select="false"` to keep the text, or cancel the `'input-clear'` change in the input's `beforeUpdate:modelValue`.

```vue line=12,17-18
<script setup lang="ts">
import { ComboboxRoot } from 'reka-ui'
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
  <ComboboxRoot
    v-model="selectedPeople"
    multiple
  >
    …
  </ComboboxRoot>
</template>
```

### Clearing the value

`null` is the empty value. Set `v-model` to `null` to clear the selection and empty the input.

An item can have `value=""`. Unlike in a [Select](select.md), an empty string is a value like any other: selecting it marks that item as selected, the input shows its text through `displayValue`, and inside a `Field` the field counts as filled. Inside a `multiple` array, `''` is a selected value too.

To let users clear a single selection from the list, add an item with a `null` value, or leave out `value`: it defaults to `null`. Pressing it sets the value to `null` and empties the input, and that item is the selected one while the combobox is empty. With `multiple`, `null` is an ordinary entry: pressing the item adds or removes `null` in the array instead of clearing it.

The `ComboboxRoot` `displayValue` is not called for `null`. A `displayValue` on `ComboboxInput` is called with every value, `null` included, so it must handle `null` (return `''` to keep the input empty).

`ComboboxCancel` clears the value too: it sets it to `null` (`[]` with `multiple`) and empties the input (reason `'clear-press'`). With `:reset-model-value-on-clear="false"` it only empties the input.

The keyboard clears the value as well:

- Emptying the input of a single combobox sets the value to `null` (reason `'input-clear'`). A `multiple` selection is kept, and so is the value when the input is inside the popup.
- Escape on a closed combobox sets the value to `null` (`[]` with `multiple`) and empties the input (reason `'escape-key'`). When there was a value to clear, the Escape stops there, so it does not also close a surrounding dialog. While the popup is open, Escape only closes it.

Each value change goes through `beforeUpdate:modelValue` on `ComboboxRoot`; `details.cancel()` keeps the value (and, for Escape and `ComboboxCancel`, the text). With `:reset-model-value-on-clear="false"`, `ComboboxCancel` changes no value, so the root event does not fire; cancel the `'clear-press'` change in `beforeUpdate:modelValue` on `ComboboxInput` to keep the text and the filter.

```vue line=5,7,16
<script setup lang="ts">
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxViewport } from 'reka-ui'
import { ref } from 'vue'

const fruit = ref<string | null>(null)
const fruits = [
  { value: null, label: 'None' },
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
]
</script>

<template>
  <ComboboxRoot
    v-model="fruit"
    :display-value="value => fruits.find(item => item.value === value)?.label ?? ''"
  >
    <ComboboxAnchor>
      <ComboboxInput placeholder="Select a fruit" />
    </ComboboxAnchor>
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxViewport>
          <ComboboxItem
            v-for="item in fruits"
            :key="String(item.value)"
            :value="item.value"
            :text-value="item.label"
          >
            {{ item.label }}
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

In a form, `null` and `''` both submit an empty string. With `required`, both are missing a value: the hidden input carries the submitted string, which is empty for both. With `multiple`, any selection satisfies `required`, `['']` included; `null` and `''` are ordinary values that toggle in the array, and `[]` is empty. Inside a `Field`, `null` and `''` are different values for `dirty` (an unset value counts as `null`).

### Custom filtering

`ComboboxRoot` filters the items by the text typed in `ComboboxInput`. Each item is matched on its `textValue`, or on its rendered text, with `useFilter`'s `contains` (case and accent insensitive). A non-matching item stays mounted but renders nothing, so keyboard navigation skips it, and a `ComboboxGroup` whose items all fail to match is hidden.

Pass a `filter` function to change how items match. It is called as `filter(text, search, value)` and returns whether the item matches. `startsWith`, `endsWith` and `contains` from `useFilter` already have that signature.

```vue line=5,9
<script setup lang="ts">
import { ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, useFilter } from 'reka-ui'

const { startsWith } = useFilter({ sensitivity: 'base' })
</script>

<template>
  <ComboboxRoot :filter="startsWith">
    <ComboboxInput />
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxItem
          v-for="fruit in ['Apple', 'Banana', 'Blueberry']"
          :key="fruit"
          :value="fruit"
        >
          {{ fruit }}
        </ComboboxItem>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

To filter the items yourself (or on a server), set `:filter="null"` and render the filtered list. `ignore-filter` still works as an alias for `:filter="null"`, but it is deprecated.

```vue line=15,16,22,28
<script setup lang="ts">
import { ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, useFilter } from 'reka-ui'
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
  <ComboboxRoot
    v-model="selectedPeople"
    :filter="null"
  >
    <ComboboxInput v-model="searchTerm" />
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxItem
          v-for="person in filteredPeople"
          :key="person.id"
          :value="person"
        >
          {{ person.name }}
        </ComboboxItem>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

### Custom label

By default the `Combobox` will use the input contents as the label for screenreaders. If you'd like more control over what is announced to assistive technologies, use the [Label](/docs/components/label) component.

```vue line=8,10
<script setup lang="ts">
import { ComboboxInput, ComboboxRoot, Label } from 'reka-ui'
import { ref } from 'vue'
</script>

<template>
  <ComboboxRoot v-model="selectedPeople">
    <Label for="person">Person: </Label>
    <ComboboxInput
      id="person"
      placeholder="Select a person"
    />
    …
  </ComboboxRoot>
</template>
```

### With disabled items

 You can add special styles to disabled items via the `data-disabled` attribute.

```vue line=19
<script setup lang="ts">
import {
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxRoot,
} from 'reka-ui'
import { ref } from 'vue'
</script>

<template>
  <ComboboxRoot>
    <ComboboxInput />
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxItem
          class="ComboboxItem"
          disabled
        >
          …
        </ComboboxItem>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

```css line=2
/* styles.css */
.ComboboxItem[data-disabled] {
  color: "gainsboro";
}
```

### With separators

Use the `Separator` part to add a separator between items.

```vue line=21
<script setup lang="ts">
import {
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxSeparator
} from 'reka-ui'
import { ref } from 'vue'
</script>

<template>
  <ComboboxRoot>
    <ComboboxInput />
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxItem>…</ComboboxItem>
        <ComboboxItem>…</ComboboxItem>
        <ComboboxItem>…</ComboboxItem>
        <ComboboxSeparator />
        <ComboboxItem>…</ComboboxItem>
        <ComboboxItem>…</ComboboxItem>
        <ComboboxItem>…</ComboboxItem>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

### With grouped items

Use the `Group` and `Label` parts to group items in a section.

```vue line=19,20,24
<script setup lang="ts">
import {
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxPortal,
  ComboboxRoot
} from 'reka-ui'
import { ref } from 'vue'
</script>

<template>
  <ComboboxRoot>
    <ComboboxInput />
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxGroup>
          <ComboboxLabel>Label</ComboboxLabel>
          <ComboboxItem>…</ComboboxItem>
          <ComboboxItem>…</ComboboxItem>
          <ComboboxItem>…</ComboboxItem>
        </ComboboxGroup>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

### With complex items

You can use custom content in your items.

```vue line=21
<script setup lang="ts">
import {
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxPortal,
  ComboboxRoot
} from 'reka-ui'
import { ref } from 'vue'
</script>

<template>
  <ComboboxRoot>
    <ComboboxInput />
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxItem>
          <img src="…">
          Adolfo Hess
          <ComboboxItemIndicator />
        </ComboboxItem>
        …
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

### Reacting to changes

`update:modelValue` and `update:open` receive a second argument with the `reason` for the change and the native `event`. `beforeUpdate:modelValue` and `beforeUpdate:open` fire first, and `details.cancel()` keeps the current state. Cancelling the value of an item press keeps the popup open; cancelling only the close keeps it open with the new value. The reasons are exported as `ComboboxChangeReason` (`'item-press' | 'clear-press'`, plus `'item-keydown' | 'select-all' | 'range-select'` in a `multiple` combobox) and `ComboboxOpenChangeReason` (`'trigger-press' | 'input-change' | 'input-press' | 'input-focus' | 'list-navigation' | 'item-press' | 'escape-key' | 'outside-press' | 'focus-outside'`), plus `'imperative-action'` for programmatic changes.

```vue
<template>
  <ComboboxRoot
    v-model="selected"
    @before-update:model-value="(value, details) => {
      // a required field: keep the selection when the cancel button clears it
      if (details.reason === 'clear-press')
        details.cancel()
    }"
  >
    <!-- ... -->
  </ComboboxRoot>
</template>
```

`useComboboxRoot()` is the headless composable behind `ComboboxRoot`. It returns the same models, the search term and filter state, and the `role` / `aria-*` / `data-*` attributes for the input, trigger, content and items.

### Focus management

Where focus goes depends on where `ComboboxInput` is:

- **Input outside the content** (the usual layout): a mouse or pen press on `ComboboxTrigger` moves focus to the input, and the trigger never takes it. A touch press, a keyboard press on the trigger and a programmatic open do not move focus to the input, so no on-screen keyboard opens (a touch press can still focus the trigger itself, as browsers do for a button). Closing does not restore focus; if focus was inside content that unmounts, it is lost with it.
- **Input inside the content**: opening focuses the input, or the content itself when it was opened by touch. Closing returns focus to the trigger when focus was inside the content (or lost with it); focus that moved to another control outside stays there.

`initialFocus` and `finalFocus` on `ComboboxContent` change what the content does: `false` leaves focus where it is, `true` uses the first tabbable element in the content on open and the trigger (input inside) or the input (input outside) on close, and an element focuses that element. A function receives how the content was opened or closed (`'mouse'`, `'touch'`, `'pen'`, `'keyboard'`, or `''` when unknown) and returns one of these; use it for an element inside the content, whose template ref is still empty when the content mounts. They do not change the trigger: with the input outside the content, a mouse press on the trigger still focuses the input. `autoFocus` on `ComboboxInput` only focuses the input when it mounts, like the native attribute, and `:initial-focus="false"` does not undo it.

```vue
<template>
  <ComboboxRoot>
    <ComboboxTrigger>Pick a fruit</ComboboxTrigger>
    <ComboboxPortal>
      <!-- keep focus on the trigger when the content opens -->
      <ComboboxContent :initial-focus="false">
        <ComboboxInput placeholder="Search…" />
        <ComboboxViewport>
          …
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

### Prevent select behavior

By default, selecting `ComboboxItem` would close the content, and update the `modelValue` with the provided value.
You can prevent this behavior by preventing default `@select.prevent`.

```vue line=11
<script setup lang="ts">
import { ComboboxContent, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxLabel, ComboboxPortal, ComboboxRoot } from 'reka-ui'
import { ref } from 'vue'
</script>

<template>
  <ComboboxRoot>
    <ComboboxInput />
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxItem @select.prevent>
          Item A
        </ComboboxItem>
        …
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

### Virtualized combobox with filtering

The root's `filter` runs over the virtualizer's `options`, matching `textContent(option)`, so a filtered-out option takes no row and is skipped by keyboard navigation. Pass the full list and a `text-content` function. To filter `options` yourself, set `:filter="null"` on `ComboboxRoot` and pass the filtered list.

See the [virtualization guide](../guides/virtualization.md) for more general info on virtualization.

```vue line=17,19-24
<script setup lang="ts">
import { ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxViewport, ComboboxVirtualizer } from 'reka-ui'
import { ref } from 'vue'

const people = Array.from({ length: 100000 }).map((_, id) => ({ id, name: `Person #${id}` }))
const selectedPeople = ref(people[0])
</script>

<template>
  <ComboboxRoot v-model="selectedPeople">
    <ComboboxInput :display-value="(person) => person?.name ?? ''" />
    <ComboboxPortal>
      <ComboboxContent class="max-h-[40vh] overflow-hidden">
        <ComboboxViewport>
          <ComboboxVirtualizer
            v-slot="{ option }"
            :options="people"
            :text-content="(x) => x.name"
            :estimate-size="24"
          >
            <ComboboxItem :value="option">
              {{ option.name }}
            </ComboboxItem>
          </ComboboxVirtualizer>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

### Large lists

When the data your `v-for` reads changes, Vue re-renders every item of that `v-for`, because each item's slot may read the new data. With hundreds of items, add `v-memo` to the `v-for` so an item re-renders only when its own values change:

```vue
<ComboboxItem v-for="item in items" :key="item.value" v-memo="[item.value, item.label]" :value="item.value">
  {{ item.label }}
</ComboboxItem>
```

`v-memo` must list every value the item's props and slot read, such as `:disabled`. A value it leaves out goes stale when only that value changes. The selected and highlighted states don't need listing: the item tracks those itself. For very long lists, see the virtualization example above.

## Real-world examples

- [Combobox Async](/examples/combobox-async): Search a remote endpoint from a Combobox, with debounced requests, a loading state, and out-of-order responses discarded.
- [Combobox Virtualized](/examples/combobox-virtualized): Render a Combobox over 10,000 options by mounting only the rows in view with `ComboboxVirtualizer`.
- [Combobox TagsInput](/examples/combobox-tags-input): Rendering [Combobox](/docs/components/combobox) with [Tags Input](/docs/components/tags-input).
- [Inline Combobox on Textarea](/examples/combobox-textarea): Rendering [Combobox](/docs/components/combobox) as a textarea element to create an accessible multiline textbox. Inserting specific characters triggers a popup with dynamic suggestions.
- [Dialog Command Menu](/examples/dialog-command-menu): Combining [Dialog](/docs/components/dialog) and [Combobox](/docs/components/combobox) to enable users to search a command list in a modal.
- [Command Menu with Tabs](/examples/dialog-command-tabs): A command palette whose results are scoped by Tabs, with Tab cycling scopes without leaving the search field.

## Accessibility

Adheres to the [Combobox WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

See the W3C [Combobox Autocomplete List](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/) example for more information.

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Enter'],
      description: '<span>When focus is on <Code>ComboboxItem</Code>, selects the focused item. </span>',
    },
    {
      keys: ['ArrowDown'],
      description: '<span> When focus is on <Code>ComboboxInput</Code>, opens the combobox content. <br /> When focus is on an item, moves focus to the next item. </span>',
    },
    {
      keys: ['ArrowUp'],
      description: '<span> When focus is on <Code>ComboboxInput</Code>, opens the combobox content. <br /> When focus is on an item, moves focus to the previous item. </span>',
    },
    {
      keys: ['Esc'],
      description: '<span> Closes combobox and restores the selected item in the <Code>ComboboxInput</Code> field. <br /> When the combobox is closed, clears the value (<Code>null</Code>, or <Code>[]</Code> with <Code>multiple</Code>) and the input text. </span>',
    },
  ]"
/>

## Custom APIs

Create your own API by abstracting the primitive parts into your own component.

### Command Menu

Combobox can be use to build your own Command Menu.

#### Usage

```vue
<script setup lang="ts">
import { Command, CommandItem } from './your-command'
</script>

<template>
  <Command>
    <CommandItem value="1">
      Item 1
    </CommandItem>
    <CommandItem value="2">
      Item 2
    </CommandItem>
    <CommandItem value="3">
      Item 3
    </CommandItem>
  </Command>
</template>
```

#### Implementation

```ts
// your-command.ts
export { default as Command } from 'Command.vue'
export { default as CommandItem } from 'CommandItem.vue'
```

```vue
<!-- Command.vue -->
<script setup lang="ts">
import type { ComboboxRootEmits, ComboboxRootProps } from 'reka-ui'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, } from '@radix-icons/vue'
import { ComboboxContent, ComboboxInput, ComboboxPortal, ComboboxRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<ComboboxRootProps>()
const emits = defineEmits<ComboboxRootEmits>()

const forward = useForwardPropsEmits(props, emits)
</script>

<template>
  <ComboboxRoot
    v-bind="forward"
    :open="true"
    model-value=""
  >
    <ComboboxInput placeholder="Type a command or search…" />

    <ComboboxPortal>
      <ComboboxContent
        @escape-key-down.prevent
        @focus-outside.prevent
        @interact-outside.prevent
        @pointer-down-outside.prevent
      >
        <ComboboxViewport>
          <slot />
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

```vue
<!-- ComboboxItem.vue -->
<script setup lang="ts">
import type { ComboboxItemProps } from 'reka-ui'
import { CheckIcon } from '@radix-icons/vue'
import { ComboboxItem } from 'reka-ui'

const props = defineProps<ComboboxItemProps>()
</script>

<template>
  <ComboboxItem
    v-bind="props"
    @select.prevent
  >
    <slot />
  </ComboboxItem>
</template>
```

## Headless composable

`useComboboxRoot` builds on the Listbox model: it adds the open state (`open`, `onOpenChange()`), the search term and its filtering (`filter`, `ignoreFilter`, `filterSearch`), the reset rules (`resetSearchTermOnBlur`, `resetSearchTermOnSelect`, `resetModelValueOnClear`), and the `root`, `listbox`, `trigger`, `cancel` and `content` [part surfaces](/docs/guides/composables#part-surfaces) with `createInputSurface()` for the input. Positioning, the portal and dismissal stay in the components. It registers watchers, so call it inside `setup()`. The composable is experimental; see [Headless composables](/docs/guides/composables).
