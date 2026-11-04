---

title: Switch
description: A control that allows the user to toggle between checked and not checked.
name: switch
aria: https://www.w3.org/WAI/ARIA/apg/patterns/switch
---

# Switch

<Description>
A control that allows the user to toggle between checked and not checked.
</Description>

<ComponentPreview name="Switch" />

## Features

<Highlights
  :features="[
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
import { SwitchRoot, SwitchThumb } from 'reka-ui'
</script>

<template>
  <SwitchRoot>
    <SwitchThumb />
  </SwitchRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a switch. An `input` will also render when used within a `form` to ensure events propagate correctly.

<!-- @include: @/meta/SwitchRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Thumb

The thumb that is used to visually indicate whether the switch is on or off.

<!-- @include: @/meta/SwitchThumb.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

## Examples

### Custom Values

Use the `trueValue` and `falseValue` props to specify custom values for the on and off states instead of the default `true`/`false`.

```vue line=4-5,9-10
<script setup>
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { ref } from 'vue'

// With string values
const status = ref('inactive')

// With number values
const enabled = ref(0)
</script>

<template>
  <!-- String values -->
  <SwitchRoot v-model="status" true-value="active" false-value="inactive">
    <SwitchThumb />
  </SwitchRoot>
  <span>Status: {{ status }}</span> <!-- "active" or "inactive" -->

  <!-- Number values -->
  <SwitchRoot v-model="enabled" :true-value="1" :false-value="0">
    <SwitchThumb />
  </SwitchRoot>
  <span>Enabled: {{ enabled }}</span> <!-- 1 or 0 -->
</template>
```

### Waiting for the server

`beforeUpdate:modelValue` fires before the switch changes, with the requested value and a `details` object. Calling `details.cancel()` keeps the switch where it is, so you can save first and apply the value the server returns. Mark the switch `aria-busy` while the request runs.

<ComponentPreview name="SwitchServerConfirmed" />

The `reason` of the details tells a click (`'trigger-press'`) from the Enter key (`'trigger-keydown'`); a change you make in code is `'imperative-action'`.

### In a form

With a `name`, a switch inside a `form` renders a hidden native checkbox, so the browser submits its `value` (`'on'` by default) while it's on and nothing while it's off, like a native checkbox. A switch doesn't register with a [`FieldRoot`](field) yet: label it with a `label` whose `for` matches its `id`, as above. See [Forms and validation](/docs/guides/forms#other-controls).

```vue
<template>
  <form @submit.prevent="(event) => save(new FormData(event.currentTarget))">
    <label for="marketing">Marketing emails</label>
    <SwitchRoot id="marketing" name="marketing" value="yes">
      <SwitchThumb />
    </SwitchRoot>
    <button type="submit">
      Save
    </button>
  </form>
</template>
```

## Accessibility

Adheres to the [`switch` role requirements](https://www.w3.org/WAI/ARIA/apg/patterns/switch).

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: 'Toggles the component\'s state.',
    },
    {
      keys: ['Enter'],
      description: 'Toggles the component\'s state.',
    },
  ]"
/>

## Headless composable

`useSwitch` returns `checked`, `toggle()`, `setChecked()`, `lastChangeDetails` and the `root` and `thumb` [part surfaces](/docs/guides/composables#part-surfaces). Bind them to your own elements, for example a `button` and a `span`. It takes the same options as `SwitchRoot` (`modelValue`, `defaultValue`, `trueValue`, `falseValue`, `disabled`, `required`, `value`), with `onBeforeUpdate` and `onUpdate` in place of the emits. It doesn't render the hidden input used for native form submission.

```vue
<script setup lang="ts">
import { useSwitch } from 'reka-ui'
import { ref } from 'vue'

const darkMode = ref(false)
const control = useSwitch({ modelValue: darkMode })
</script>

<template>
  <button
    type="button"
    aria-label="Dark mode"
    v-bind="control.root.attrs.value"
  >
    <span v-bind="control.thumb.attrs.value" />
  </button>
</template>
```

See [Headless composables](/docs/guides/composables) for a live example and how state ownership works. The composable is experimental.
