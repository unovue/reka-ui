---

title: Select
description: Displays a list of options for the user to pick from—triggered by a button.
name: select
aria: https://www.w3.org/WAI/ARIA/apg/patterns/listbox
---

# Select

<Description>
Displays a list of options for the user to pick from—triggered by a button.
</Description>

<ComponentPreview name="Select" />

## Features

<Highlights
  :features="[
    'Can be controlled or uncontrolled.',
    'Offers 2 positioning modes.',
    'Supports items, labels, groups of items.',
    'Focus is fully managed.',
    'Full keyboard navigation.',
    'Supports custom placeholder.',
    'Typeahead support.',
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
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SelectViewport,
  SelectVirtualizer,
} from 'reka-ui'
</script>

<template>
  <SelectRoot>
    <SelectTrigger>
      <SelectValue />
      <SelectIcon />
    </SelectTrigger>

    <SelectPortal>
      <SelectContent>
        <SelectScrollUpButton />
        <SelectViewport>
          <SelectItem>
            <SelectItemText />
            <SelectItemIndicator />
          </SelectItem>
          <SelectGroup>
            <SelectLabel />
            <SelectItem>
              <SelectItemText />
              <SelectItemIndicator />
            </SelectItem>
          </SelectGroup>
          <SelectSeparator />

          <!-- or with virtual -->
          <SelectVirtualizer>
            <SelectItem />
          </SelectVirtualizer>
        </SelectViewport>
        <SelectScrollDownButton />
        <SelectArrow />
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a Select

<!-- @include: @/meta/SelectRoot.md -->

### Trigger

The button that toggles the Select The `SelectContent` will position itself by aligning over the trigger.

<!-- @include: @/meta/SelectTrigger.md -->

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
    {
      attribute: '[data-placeholder]',
      values: 'Present when has placeholder',
    },
  ]"
/>

### Value

The part that reflects the selected value. By default the selected item's text will be rendered. if you require more control, you can instead control the select and pass your own `children`. It should not be styled to ensure correct positioning. An optional `placeholder` prop is also available for when the select has no value.

<!-- @include: @/meta/SelectValue.md -->

### Icon

A small icon often displayed next to the value as a visual affordance for the fact it can be open. By default renders ▼ but you can use your own icon via `asChild` or use `children`.

<!-- @include: @/meta/SelectItem.md -->

### Portal

When used, portals the content part into the `body`.

<!-- @include: @/meta/SelectPortal.md -->

### Content

The component that pops out when the select is open.

<PresenceCallout />

<!-- @include: @/meta/SelectContent.md -->

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
      cssVariable: '--reka-select-content-transform-origin',
      description: 'The <Code>transform-origin</Code> computed from the content and arrow positions/offsets. Only present when <Code>position=&quot;popper&quot;</Code>.',
    },
    {
      cssVariable: '--reka-select-content-available-width',
      description: 'The remaining width between the trigger and the boundary edge. Only present when <Code>position=&quot;popper&quot;</Code>.',
    },
    {
      cssVariable: '--reka-select-content-available-height',
      description: 'The remaining height between the trigger and the boundary edge. Only present when <Code>position=&quot;popper&quot;</Code>.',
    },
    {
      cssVariable: '--reka-select-trigger-width',
      description: 'The width of the trigger. Only present when <Code>position=&quot;popper&quot;</Code>.',
    },
    {
      cssVariable: '--reka-select-trigger-height',
      description: 'The height of the trigger. Only present when <Code>position=&quot;popper&quot;</Code>.',
    },
  ]"
/>

### Viewport

The scrolling viewport that contains all of the items.

<!-- @include: @/meta/SelectViewport.md -->

### Virtualizer

Virtual container to achieve list virtualization. Only supported with `position="popper"` on the content.

<!-- @include: @/meta/SelectVirtualizer.md -->

### Item

The component that contains the select items.

<!-- @include: @/meta/SelectItem.md -->

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

### ItemText

The textual part of the item. It should only contain the text you want to see in the trigger when that item is selected. It should not be styled to ensure correct positioning.

<!-- @include: @/meta/SelectItemText.md -->

### ItemIndicator

Renders when the item is selected. You can style this element directly, or you can use it as a wrapper to put an icon into, or both.

<!-- @include: @/meta/SelectItemIndicator.md -->

### ScrollUpButton

An optional button used as an affordance to show the viewport overflow as well as functionally enable scrolling upwards.

<!-- @include: @/meta/SelectScrollUpButton.md -->

### ScrollDownButton

An optional button used as an affordance to show the viewport overflow as well as functionally enable scrolling downwards.

<!-- @include: @/meta/SelectScrollDownButton.md -->

### Group

Used to group multiple items. use in conjunction with `SelectLabel` to ensure good accessibility via automatic labelling.

<!-- @include: @/meta/SelectGroup.md -->

### Label

Used to render the label of a group. It won't be focusable using arrow keys.

<!-- @include: @/meta/SelectLabel.md -->

### Separator

Used to visually separate items in the Select

<!-- @include: @/meta/SelectSeparator.md -->
### Arrow

An optional arrow element to render alongside the content. This can be used to help visually link the trigger with the `SelectContent`. Must be rendered inside `SelectContent`. Only available when `position` is set to `popper`.

<!-- @include: @/meta/SelectArrow.md -->

## Examples

### Change the positioning mode

By default, `Select` will behave similarly to a native MacOS menu by positioning `SelectContent` relative to the active item. If you would prefer an alternative positioning approach similar to `Popover` or `DropdownMenu` then you can set `position` to `popper` and make use of additional alignment options such as `side`, `sideOffset` and more.

```vue line=20-23
// index.vue
<script setup lang="ts">
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
} from 'reka-ui'
</script>

<template>
  <SelectRoot>
    <SelectTrigger>…</SelectTrigger>
    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="5"
      >
        …
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

### Constrain the content size

When using `position="popper"` on `SelectContent`, you may want to constrain the width of the content so that it matches the trigger width. You may also want to constrain its height to not exceed the viewport.

We expose several CSS custom properties such as `--reka-select-trigger-width` and `--reka-select-content-available-height` to support this. Use them to constrain the content dimensions.

```vue line=21
// index.vue
<script setup lang="ts">
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
} from 'reka-ui'
</script>

<template>
  <SelectRoot>
    <SelectTrigger>…</SelectTrigger>
    <SelectPortal>
      <SelectContent
        class="SelectContent"
        position="popper"
        :side-offset="5"
      >
        …
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

```css line=3,4
/* styles.css */
.SelectContent {
  width: var(--reka-select-trigger-width);
  max-height: var(--reka-select-content-available-height);
}
```

### With disabled items

You can add special styles to disabled items via the `data-disabled` attribute.

```vue line=23-24
// index.vue
<script setup lang="ts">
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
} from 'reka-ui'
</script>

<template>
  <SelectRoot>
    <SelectTrigger>…</SelectTrigger>
    <SelectPortal>
      <SelectContent>
        <SelectViewport>
          <SelectItem
            class="SelectItem"
            disabled
          >
            …
          </SelectItem>
          <SelectItem>…</SelectItem>
          <SelectItem>…</SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

```css line=2
/* styles.css */
.SelectItem[data-disabled] {
  color: "gainsboro";
}
```

### With a placeholder

You can use the `placeholder` prop on `Value` for when the select has no value. There's also a `data-placeholder` attribute on `Trigger` to help with styling.

```vue line=19,20
// index.vue
<script setup lang="ts">
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
} from 'reka-ui'
import './styles.css'
</script>

<template>
  <SelectRoot>
    <SelectTrigger class="SelectTrigger">
      <SelectValue placeholder="Pick an option" />
      <SelectIcon />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent>…</SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

```css line=2
/* styles.css */
.SelectTrigger[data-placeholder] {
  color: "gainsboro";
}
```

### With separators

Use the `Separator` part to add a separator between items.

```vue line=10
<template>
  <SelectRoot>
    <SelectTrigger>…</SelectTrigger>
    <SelectPortal>
      <SelectContent>
        <SelectViewport>
          <SelectItem>…</SelectItem>
          <SelectItem>…</SelectItem>
          <SelectItem>…</SelectItem>
          <SelectSeparator />
          <SelectItem>…</SelectItem>
          <SelectItem>…</SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

### With grouped items

Use the `Group` and `Label` parts to group items in a section.

```vue line=7,8,12
<template>
  <SelectRoot>
    <SelectTrigger>…</SelectTrigger>
    <SelectPortal>
      <SelectContent>
        <SelectViewport>
          <SelectGroup>
            <SelectLabel>Label</SelectLabel>
            <SelectItem>…</SelectItem>
            <SelectItem>…</SelectItem>
            <SelectItem>…</SelectItem>
          </SelectGroup>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

### With complex items

You can use custom content in your items.

```vue line=23
<script setup lang="ts">
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
} from 'reka-ui'
</script>

<template>
  <SelectRoot>
    <SelectTrigger>…</SelectTrigger>
    <SelectPortal>
      <SelectContent>
        <SelectViewport>
          <SelectItem>
            <SelectItemText>
              <img src="…">
              Adolfo Hess
            </SelectItemText>
            <SelectItemIndicator>…</SelectItemIndicator>
          </SelectItem>
          <SelectItem>…</SelectItem> <SelectItem>…</SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

### Controlling the value displayed in the trigger

By default the trigger display the selected item's text (no longer automatically render `ItemText`'s content like in v1).

If you need to render other than plain text, you can control the component using `v-model` props (or accessing `SelectValue`'s slotProps) and passing `slot` to `SelectValue`. Remember to make sure what you put in there is accessible.

```vue line=2,4,10-12
<script setup>
const countries = { 'france': '🇫🇷', 'united-kingdom': '🇬🇧', 'spain': '🇪🇸' }

const value = ref('france')
</script>

<template>
  <SelectRoot v-model="value">
    <SelectTrigger>
      <SelectValue :aria-label="value">
        {{ countries[value] }}
      </SelectValue>
      <SelectIcon />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent>
        <SelectViewport>
          <SelectItem value="france">
            <SelectItemText>France</SelectItemText>
            <SelectItemIndicator>…</SelectItemIndicator>
          </SelectItem>
          <SelectItem value="united-kingdom">
            <SelectItemText>United Kingdom</SelectItemText>
            <SelectItemIndicator>…</SelectItemIndicator>
          </SelectItem>
          <SelectItem value="spain">
            <SelectItemText>Spain</SelectItemText>
            <SelectItemIndicator>…</SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

### Showing the value before the content renders

`SelectValue` shows the text of the selected item's `SelectItemText`. The texts are remembered once an item has rendered, also after it unmounts. To show the value of a select whose items have never rendered (object values, items loaded on open), pass `display-value` to the root. With it set, the closed content is not rendered just to collect the item texts. The cost: until the content has been opened once, the hidden native `<select>` only holds the selected values, so browser autofill cannot pick another one, and typing on the closed trigger has no items to match.

```vue
<template>
  <SelectRoot
    v-model="user"
    by="id"
    :display-value="(user) => user.name"
  >
    <SelectTrigger>
      <SelectValue placeholder="Pick a user" />
    </SelectTrigger>
    <!-- ... -->
  </SelectRoot>
</template>
```

### Selecting multiple values

With `multiple`, an item press toggles its value and the content stays open. `v-model` and `update:modelValue` are typed `T[]`. `SelectValue` joins the selected texts with `, `, and its slot receives them as `selectedLabels`. With a `name`, every selected value is submitted with the form.

```vue
<template>
  <SelectRoot
    v-model="fruits"
    multiple
    name="fruits"
  >
    <SelectTrigger>
      <SelectValue placeholder="Pick fruits" />
    </SelectTrigger>
    <!-- ... -->
  </SelectRoot>
</template>
```

### Reacting to changes

`update:modelValue` and `update:open` receive a second argument with the `reason` for the change and the native `event`. `beforeUpdate:modelValue` and `beforeUpdate:open` fire first, and `details.cancel()` keeps the current state. Cancelling the value of an item press keeps the content open. The reasons are exported as `SelectChangeReason` (`'item-press' | 'item-keydown' | 'typeahead' | 'autofill'`) and `SelectOpenChangeReason` (`'trigger-press' | 'list-navigation' | 'item-press' | 'item-keydown' | 'escape-key' | 'outside-press'`), plus `'imperative-action'` for programmatic changes. Pressing the selected item of a single select emits nothing and closes the content, also when `by` matches a different object. In `popper` position the trigger stays clickable above the backdrop, and pressing it closes the content (`'trigger-press'`).

```vue
<template>
  <SelectRoot
    v-model="plan"
    @before-update:model-value="(value, details) => {
      // ignore browser autofill
      if (details.reason === 'autofill')
        details.cancel()
    }"
  >
    <!-- ... -->
  </SelectRoot>
</template>
```

### Virtualized

For a long list (thousands of options), render the items through a `SelectVirtualizer` inside the `SelectViewport`: only the visible window of options is mounted. Each option is the `value` of the `SelectItem` it renders, and `text-content` gives its text for typeahead (needed for object options; a string option is its own text). The virtualizer also renders the selected options while the content is closed, so their `SelectItemText` shows in `SelectValue` even when the selected item was never scrolled into view, and the keyboard (arrows, Home/End, typeahead) reaches options outside the rendered window. For object options, set a key `by` (`by="id"`): a function `by` compares values one by one, which gets slow with thousands of options.

`SelectVirtualizer` needs `position="popper"` and a height on the viewport. With the default `item-aligned` position it renders every option without virtualization and warns in development, because item-aligned positioning measures the selected item. Options can also be grouped: set `grouped`, pass `{ label, options, disabled? }` groups and render each header through the `group` slot. See the [virtualization guide](../guides/virtualization.md).

```vue
<script setup lang="ts">
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport, SelectVirtualizer } from 'reka-ui'
import { ref } from 'vue'

const countries = ref<string[]>([/* thousands of names */])
const country = ref<string>()
</script>

<template>
  <SelectRoot v-model="country">
    <SelectTrigger aria-label="Country">
      <SelectValue placeholder="Pick a country" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent position="popper">
        <!-- The viewport needs a height -->
        <SelectViewport class="max-h-72">
          <SelectVirtualizer
            v-slot="{ option }"
            :options="countries"
            :estimate-size="25"
          >
            <SelectItem :value="option">
              <SelectItemText>{{ option }}</SelectItemText>
            </SelectItem>
          </SelectVirtualizer>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

### Custom keyboard navigation

`get-navigation-intent` maps a keydown in the content to a move (`'first'`, `'last'`, `'prev'`, `'next'`) or to `'select'`. Return `undefined` to keep the default for the key, or `null` to ignore it. Returning `null` for Enter or Space stops them from selecting.

```vue
<template>
  <SelectRoot
    :get-navigation-intent="(event) => {
      if (event.ctrlKey && event.key === 'n') return 'next'
      if (event.ctrlKey && event.key === 'p') return 'prev'
    }"
  >
    <!-- ... -->
  </SelectRoot>
</template>
```

### Headless composables

The parts are built on composables you can use on your own elements:

- `useSelectRoot()`: the value and open models, the label registry and the context.
- `useSelectTrigger()`, `useSelectValue()`, `useSelectContent()`, `useSelectItem()`, `useSelectItemText()` and `useSelectItemIndicator()`: one per part.

Each part composable returns a surface whose `attrs` hold the `role`, `aria-*` and `data-*` attributes and the event handlers to bind. Positioning, presence, focus trapping and dismissal are not part of the composables. Compose `PopperContent`, `Presence` and `DismissableLayer` as the components do, or bring your own. These composables are experimental.

### With custom scrollbar

The native scrollbar is hidden by default as we recommend using the `ScrollUpButton` and `ScrollDownButton` parts for the best UX. If you do not want to use these parts, compose your select with our [Scroll Area](scroll-area) primitive.

```vue line=25,27,32-34
// index.vue
<script setup lang="ts">
import {
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
} from 'reka-ui'
</script>

<template>
  <SelectRoot>
    <SelectTrigger>…</SelectTrigger>
    <SelectPortal>
      <SelectContent>
        <ScrollAreaRoot
          class="ScrollAreaRoot"
          type="auto"
        >
          <SelectViewport as-child>
            <ScrollAreaViewport class="ScrollAreaViewport">
              <StyledItem>…</StyledItem> <StyledItem>…</StyledItem>
              <StyledItem>…</StyledItem>
            </ScrollAreaViewport>
          </SelectViewport>
          <ScrollAreaScrollbar
            class="ScrollAreaScrollbar"
            orientation="vertical"
          >
            <ScrollAreaThumb class="ScrollAreaThumb" />
          </ScrollAreaScrollbar>
        </ScrollAreaRoot>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

```css
/* styles.css */
.ScrollAreaRoot {
  width: 100%;
  height: 100%;
}

.ScrollAreaViewport {
  width: 100%;
  height: 100%;
}

.ScrollAreaScrollbar {
  width: 4px;
  padding: 5px 2px;
}

.ScrollAreaThumb {
  background: rgba(0, 0, 0, 0.3);
  borderradius: 3px;
}
```

### Large lists

When the data your `v-for` reads changes, Vue re-renders every item of that `v-for`, because each item's slot may read the new data. With hundreds of items, add `v-memo` to the `v-for` so an item re-renders only when its own values change:

```vue
<SelectItem v-for="item in items" :key="item.value" v-memo="[item.value, item.label]" :value="item.value">
  <SelectItemText>{{ item.label }}</SelectItemText>
</SelectItem>
```

`v-memo` must list every value the item's slot reads. A value it leaves out shows stale content when only that value changes. For very long lists, see the virtualization example above.

## Accessibility

Adheres to the [ListBox WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox).

See the W3C [Select-Only Combobox](https://www.w3.org/TR/wai-aria-practices/examples/combobox/combobox-select-only.html) example for more information.

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: '<span> When focus is on <Code>SelectTrigger</Code>, opens the select and focuses the selected item. <br /> When focus is on an item, selects the focused item. </span>',
    },
    {
      keys: ['Enter'],
      description: '<span> When focus is on <Code>SelectTrigger</Code>, opens the select and focuses the first item. <br /> When focus is on an item, selects the focused item. </span>',
    },
    {
      keys: ['ArrowDown'],
      description: '<span> When focus is on <Code>SelectTrigger</Code>, opens the Select <br /> When focus is on an item, moves focus to the next item. </span>',
    },
    {
      keys: ['ArrowUp'],
      description: '<span> When focus is on <Code>SelectTrigger</Code>, opens the Select <br /> When focus is on an item, moves focus to the previous item. </span>',
    },
    {
      keys: ['Esc'],
      description: '<span> Closes the select and moves focus to <Code>SelectTrigger</Code>. </span>',
    },
    {
      keys: ['A-Z', 'a-z'],
      description: '<span> When focus is on a closed <Code>SelectTrigger</Code> of a single select, selects the next item whose text starts with the typed characters. <br /> When focus is on an item, moves focus to the next matching item. </span>',
    },
  ]"
/>

### Labelling

Use our [Label](label) component in order to offer a visual and accessible label for the Select

```vue line=19,22,26,28
<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  Label,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
} from 'reka-ui'
import { ref } from 'vue'
</script>

<template>
  <Label>
    Country
    <SelectRoot>…</SelectRoot>
  </Label>

  <!-- or -->

  <Label for="country">Country</Label>
  <SelectRoot>
    <SelectTrigger id="country">
      …
    </SelectTrigger>
    <SelectPortal>
      <SelectContent>…</SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

## Custom APIs

Create your own API by abstracting the primitive parts into your own component.

### Abstract down to `Select` and `SelectItem`

This example abstracts most of the parts.

#### Usage

```vue
<script setup lang="ts">
import { Select, SelectItem } from './your-select'
</script>

<template>
  <Select default-value="2">
    <SelectItem value="1">
      Item 1
    </SelectItem>
    <SelectItem value="2">
      Item 2
    </SelectItem>
    <SelectItem value="3">
      Item 3
    </SelectItem>
  </Select>
</template>
```

#### Implementation

```ts
// your-select.ts
export { default as Select } from 'Select.vue'
export { default as SelectItem } from 'SelectItem.vue'
```

```vue
<!-- Select.vue -->
<script setup lang="ts">
import type { SelectRootEmits, SelectRootProps } from 'reka-ui'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, } from '@radix-icons/vue'
import { SelectContent, SelectIcon, SelectPortal, SelectRoot, SelectScrollDownButton, SelectScrollUpButton, SelectTrigger, SelectValue, SelectViewport, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<SelectRootProps>()
const emits = defineEmits<SelectRootEmits>()

const forward = useForwardPropsEmits(props, emits)
</script>

<template>
  <SelectRoot v-bind="forward">
    <SelectTrigger>
      <SelectValue />
      <SelectIcon>
        <ChevronDownIcon />
      </SelectIcon>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent>
        <SelectScrollUpButton>
          <ChevronUpIcon />
        </SelectScrollUpButton>
        <SelectViewport>
          <slot />
        </SelectViewport>
        <SelectScrollDownButton>
          <ChevronDownIcon />
        </SelectScrollDownButton>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

```vue
<!-- SelectItem.vue -->
<script setup lang="ts">
import type { SelectItemProps } from 'reka-ui'
import { CheckIcon } from '@radix-icons/vue'
import { SelectItem, SelectItemIndicator, SelectItemText } from 'reka-ui'

const props = defineProps<SelectItemProps>()
</script>

<template>
  <SelectItem v-bind="props">
    <SelectItemText>
      <slot />
    </SelectItemText>
    <SelectItemIndicator>
      <CheckIcon />
    </SelectItemIndicator>
  </SelectItem>
</template>
```
