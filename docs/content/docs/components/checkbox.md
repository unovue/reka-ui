---

title: Checkbox
description: A control that allows the user to toggle between checked and not checked.
name: checkbox
aria: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox
---

# Checkbox

<Description>
A control that allows the user to toggle between checked and not checked.
</Description>

<ComponentPreview name="Checkbox" />

## Features

<Highlights
  :features="[
    'Supports indeterminate state.',
    'Full keyboard navigation.',
    'Can be controlled or uncontrolled.',
    'Supports custom true/false values.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from 'reka-ui'
</script>

<template>
  <CheckboxRoot>
    <CheckboxIndicator />
  </CheckboxRoot>

  <!-- or with array support -->
  <CheckboxGroupRoot>
    <CheckboxRoot>
      <CheckboxIndicator />
    </CheckboxRoot>
  </CheckboxGroupRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a checkbox. An `input` will also render when used within a `form` to ensure events propagate correctly.

<!-- @include: @/meta/CheckboxRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked', 'indeterminate'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Indicator

Renders when the checkbox is in a checked or indeterminate state. You can style this element directly, or you can use it as a wrapper to put an icon into, or both.

<PresenceCallout />

<!-- @include: @/meta/CheckboxIndicator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked', 'indeterminate'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Group Root

Wrapper around `CheckboxRoot` to support array of `modelValue`

<!-- @include: @/meta/CheckboxGroupRoot.md -->

## Examples

### Custom Values

Use the `trueValue` and `falseValue` props to specify custom values for the checked and unchecked states instead of the default `true`/`false`.

```vue line=5-6,11-12
<script setup>
import { Icon } from '@iconify/vue'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { ref } from 'vue'

// With string values
const acceptTerms = ref('no')

// With number values
const permission = ref(0)
</script>

<template>
  <!-- String values -->
  <CheckboxRoot v-model="acceptTerms" true-value="yes" false-value="no">
    <CheckboxIndicator>
      <Icon icon="radix-icons:check" />
    </CheckboxIndicator>
  </CheckboxRoot>
  <span>Value: {{ acceptTerms }}</span> <!-- "yes" or "no" -->

  <!-- Number values -->
  <CheckboxRoot v-model="permission" :true-value="1" :false-value="0">
    <CheckboxIndicator>
      <Icon icon="radix-icons:check" />
    </CheckboxIndicator>
  </CheckboxRoot>
  <span>Value: {{ permission }}</span> <!-- 1 or 0 -->
</template>
```

### Indeterminate

You can set the checkbox to `indeterminate` by taking control of its state.

```vue line=6,10-15,17-19
<script setup>
import { Icon } from '@iconify/vue'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { ref } from 'vue'

const checked = ref('indeterminate')
</script>

<template>
  <CheckboxRoot v-model="checked">
    <CheckboxIndicator>
      <Icon
        v-if="checked === 'indeterminate'"
        icon="radix-icons:divider-horizontal"
      />
      <Icon
        v-if="checked"
        icon="radix-icons:check"
      />
    </CheckboxIndicator>
  </CheckboxRoot>

  <button
    type="button"
    @click="() => (checked === 'indeterminate' ? (checked = false) : (checked = 'indeterminate'))"
  >
    Toggle indeterminate
  </button>
</template>
```

### Select all

A parent checkbox that selects every option of a `CheckboxGroupRoot` derives its state from the group: unchecked when nothing is selected, checked when everything is, and `indeterminate` in between. Bind it to a writable `computed`. Pressing an indeterminate checkbox checks it.

<ComponentPreview name="CheckboxSelectAll" />

### Limiting the selection

`max` on `CheckboxGroupRoot` caps how many values can be selected. Once it is reached, the unchecked checkboxes get `aria-disabled` and ignore presses, while the checked ones can still be unchecked.

```vue
<template>
  <CheckboxGroupRoot v-model="toppings" :max="2">
    <CheckboxRoot value="cheese" />
    <CheckboxRoot value="olives" />
    <CheckboxRoot value="peppers" />
  </CheckboxGroupRoot>
</template>
```

### In a form

Inside a [`FieldRoot`](field) with `required`, an unchecked checkbox is missing (`valueMissing`), so a [`FormRoot`](form) won't submit until it's checked. The field's `name`, `required` and `disabled` apply to the checkbox, and `FieldLabel` labels it. A checkbox inside a `CheckboxGroupRoot` doesn't register with a field. See [Forms and validation](/docs/guides/forms).

```vue
<template>
  <FieldRoot name="terms" required>
    <CheckboxRoot>
      <CheckboxIndicator>
        <Icon icon="radix-icons:check" />
      </CheckboxIndicator>
    </CheckboxRoot>
    <FieldLabel>I accept the terms and conditions</FieldLabel>
    <FieldError match="valueMissing">
      Accept the terms to continue.
    </FieldError>
  </FieldRoot>
</template>
```

Outside a Field, a checkbox with a `name` inside a `form` renders a hidden native checkbox, so the browser submits its `value` (`'on'` by default) when it's checked.

## Real-world examples

- [Checkbox Group](/examples/checkbox-group): Rendering multiple Checkbox elements to form a group of checkboxes. The behavior is similar to having `v-model` for multiple native `input[type="checkbox"]`.
- [Tree Multi Select](/examples/tree-multi-select): Tri-state folder selection driven by Tree's `propagate-select` and `bubble-select`, with both toggleable so you can see what each one does.
- [Data Table](/examples/data-table): Compose Checkbox, DropdownMenu, ContextMenu, ScrollArea and Pagination into a sortable, selectable table.

## Accessibility

Adheres to the [tri-state Checkbox WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox).

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: 'Checks/unchecks the checkbox',
    },
  ]"
/>

## Headless composable

`useCheckbox` returns the checked state (`checked`, and `checkedState` with `'indeterminate'`), `toggle()` / `setChecked()`, and the `root` and `indicator` [part surfaces](/docs/guides/composables#part-surfaces). It takes the same options as `CheckboxRoot` (`modelValue`, `defaultValue`, `trueValue`, `falseValue`, `disabled`, `required`, `onBeforeUpdate`, `onUpdate`). `useCheckboxGroup` holds the array model of a group, with `max`; pass its `context` as the `group` option of each `useCheckbox`.

```vue
<script setup lang="ts">
import { useCheckbox } from 'reka-ui'

const newsletter = useCheckbox({ defaultValue: true })
</script>

<template>
  <button
    type="button"
    aria-label="Subscribe to the newsletter"
    v-bind="newsletter.root.attrs.value"
  >
    <span
      v-if="newsletter.checked.value"
      v-bind="newsletter.indicator.attrs.value"
    >✓</span>
  </button>
</template>
```

The composables don't render the hidden input used for native form submission, and don't register with a `FieldRoot`. They are experimental; see [Headless composables](/docs/guides/composables).
