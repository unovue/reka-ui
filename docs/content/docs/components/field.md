---

title: Field
description: Accessible wiring between a label, control, description, and error message, with built-in validation.
name: field
---

# Field

<Description>
Accessible wiring between a label, control, description, and error message, with built-in validation.
</Description>

<ComponentPreview name="Field" />

## Features

<Highlights
  :features="[
    'Generates and wires up ids/aria-describedby/aria-invalid automatically.',
    'Works with a plain native input, or with existing reka controls (Checkbox, Select, DateField, ...) placed inside it.',
    'Sync or async custom validation, with `onSubmit`/`onBlur`/`onChange` timing and optional debounce.',
    'Reads native constraint-validation state (`required`, `pattern`, `type=email`, ...) automatically.',
    'Exposes `data-valid`/`data-invalid`/`data-dirty`/`data-touched`/`data-filled`/`data-focused` for styling.',
    'Fully additive — every reka control behaves exactly as before when used outside a Field.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { FieldControl, FieldDescription, FieldError, FieldLabel, FieldRoot } from 'reka-ui'
</script>

<template>
  <FieldRoot name="email" validation-mode="onBlur">
    <FieldLabel>Email</FieldLabel>
    <FieldControl type="email" required />
    <FieldDescription>We never share it.</FieldDescription>
    <FieldError match="valueMissing">
      Email is required
    </FieldError>
    <FieldError v-slot="{ errors }">
      {{ errors[0] }}
    </FieldError>
  </FieldRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a field, provides shared ids, and runs validation. Renders a `div` by default.

<!-- @include: @/meta/FieldRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-valid]',
      values: 'Present once validation has run and the field is valid',
    },
    {
      attribute: '[data-invalid]',
      values: 'Present once validation has run and the field is invalid',
    },
    {
      attribute: '[data-dirty]',
      values: 'Present once the control\'s value has changed',
    },
    {
      attribute: '[data-touched]',
      values: 'Present once the control has been blurred',
    },
    {
      attribute: '[data-filled]',
      values: 'Present when the control has a non-empty value',
    },
    {
      attribute: '[data-focused]',
      values: 'Present while the control is focused',
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Label

Renders a [Label](/docs/components/label), automatically wired to the control via `for`/`id`.

<!-- @include: @/meta/FieldLabel.md -->

### Control

A native form control (`input` by default — pass `as="textarea"` or `as="select"` for others). Binds `id`/`name`/`disabled`/`required`/`aria-describedby`/`aria-invalid` from the Field, and reports focus/blur/input interactions back to it.

Existing reka controls (`CheckboxRoot`, `SelectRoot`/`SelectTrigger`, `DateFieldRoot`, ...) can be used directly inside a `FieldRoot` instead of `FieldControl` — they pick up the same wiring automatically by optionally reading the Field's context, and behave exactly as before when used outside a Field.

<!-- @include: @/meta/FieldControl.md -->

### Description

A description for the field, automatically added to the control's `aria-describedby`. Renders a `p` by default.

<!-- @include: @/meta/FieldDescription.md -->

### Error

An error message for the field. Renders when a `match`ed native `ValidityState` key is `true`, or — without `match` — when a custom `validate` or server error exists. Renders a `p` by default.

<!-- @include: @/meta/FieldError.md -->

## Examples

### Custom validation

Pass a sync or async `validate` function. Return a message (or array of messages) when invalid, or `null`/`undefined` when valid.

```vue line=8-12
<script setup>
import { FieldControl, FieldError, FieldLabel, FieldRoot } from 'reka-ui'

async function checkUsername(value) {
  const isTaken = await api.isUsernameTaken(value)
  return isTaken ? 'That username is already taken.' : null
}
</script>

<template>
  <FieldRoot name="username" :validate="checkUsername" validation-mode="onBlur">
    <FieldLabel>Username</FieldLabel>
    <FieldControl />
    <FieldError v-slot="{ errors }">
      {{ errors[0] }}
    </FieldError>
  </FieldRoot>
</template>
```

### Validation timing

Use `validation-mode` to control when validation (native constraint checks and the custom `validate` function) runs. Defaults to `onSubmit` — nothing runs until the owning `FormRoot` submits, or `validateNow` is called manually.

```vue line=4
<template>
  <FieldRoot
    name="email"
    validation-mode="onBlur"
    :validation-debounce-ms="300"
  >
    <!-- ... -->
  </FieldRoot>
</template>
```

### Using an existing reka control

Place any reka form control inside a `FieldRoot` instead of `FieldControl` — it participates automatically.

```vue line=5-8
<script setup>
import { FieldDescription, FieldLabel, FieldRoot, SelectContent, SelectItem, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from 'reka-ui'
</script>

<template>
  <FieldRoot name="fruit" required>
    <FieldLabel>Fruit</FieldLabel>
    <SelectRoot>
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent>
          <SelectViewport>
            <SelectItem value="apple">
              Apple
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
    <FieldDescription>Pick your favorite.</FieldDescription>
  </FieldRoot>
</template>
```

## Accessibility

`FieldLabel` associates with the control via matching `for`/`id`. `FieldDescription` and any rendered `FieldError` are added to the control's `aria-describedby`, and `aria-invalid` is set once the field is known to be invalid.
