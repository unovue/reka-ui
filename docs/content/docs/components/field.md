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
    'Validates `required` on non-native controls (Checkbox, Select, DateField) too.',
    'Reads native constraint-validation state (`required`, `pattern`, `type=email`, ...) automatically.',
    'Exposes `data-valid`/`data-invalid`/`data-dirty`/`data-touched`/`data-filled`/`data-focused` on every part for styling.',
    'Shows the browser\'s validation message by default, or your own per failing constraint.',
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
import { FieldControl, FieldDescription, FieldError, FieldLabel, FieldRoot, FieldValidity } from 'reka-ui'
</script>

<template>
  <FieldRoot>
    <FieldLabel />
    <FieldControl />
    <FieldDescription />
    <FieldError />
    <FieldValidity />
  </FieldRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a field, provides shared ids, and runs validation. Renders a `div` by default.

Exposes a `validate()` method through a template ref, which validates the field regardless of `validationMode` and returns whether it's valid. A disabled field skips validation.

<!-- @include: @/meta/FieldRoot.md -->

Every part (and a participating reka control) renders the same data attributes, so any of them can be styled by the field's state.
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
      values: 'Present while the control\'s value differs from its initial value',
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

Renders a [Label](/docs/components/label), automatically wired to the control via `for`/`id` and the control's `aria-labelledby`.

For a button control like `SelectTrigger`, a native `label` forwards clicks and `:hover` to the button. Render another element with `:native-label="false"` instead: it drops `for` and focuses the control on click.

```vue
<FieldLabel as="div" :native-label="false">
  Fruit
</FieldLabel>
```

<!-- @include: @/meta/FieldLabel.md -->

### Control

A native form control (`input` by default — pass `as="textarea"` or `as="select"` for others). Binds `id`/`name`/`disabled`/`required`/`aria-labelledby`/`aria-describedby`/`aria-invalid` from the Field, and reports focus/blur/input interactions back to it. The Field's `name` takes precedence over the control's; `disabled` and `required` apply when set on either.

Bind its value with `v-model`, or set a starting value with `default-value`. A controlled value is validated when it changes, so a value you reject or rewrite never reaches the field.

Existing reka controls (`CheckboxRoot`, `SelectRoot`/`SelectTrigger`, `DateFieldRoot`, ...) can be used directly inside a `FieldRoot` instead of `FieldControl` — they pick up the same wiring automatically by optionally reading the Field's context, and behave exactly as before when used outside a Field.

<!-- @include: @/meta/FieldControl.md -->

### Description

A description for the field, automatically added to the control's `aria-describedby`. Renders a `p` by default.

<!-- @include: @/meta/FieldDescription.md -->

### Error

An error message for the field, added to the control's `aria-describedby` while shown. Renders a `div` by default.

- Without `match`, it shows whenever the field is invalid. Its default content is the current message: a server error, a custom `validate` message, or the browser's validation message. Several messages render as a list.
- With a `ValidityState` key like `match="valueMissing"`, it shows only for that constraint, typically with your own message.
- With `match` set to `true`, it always shows, letting an external library control it.

It never shows while the field is disabled. Its `data-state` is `open` or `closed`, and it waits for a closing animation before unmounting, keeping its last message meanwhile.

<!-- @include: @/meta/FieldError.md -->

### Validity

Renders no element. Passes the field's `validity`, `errors`, `error`, `value` and `initialValue` to its slot, for displaying something custom based on the field's validity.

```vue
<FieldValidity v-slot="{ validity, error }">
  <p v-if="validity.valid === false">
    {{ error }}
  </p>
</FieldValidity>
```

<!-- @include: @/meta/FieldValidity.md -->

## Examples

### Custom validation

Pass a sync or async `validate` function. It receives the control's value and, inside a `FormRoot`, the values of every named field. Return a message (or array of messages) when invalid, or `null`/`undefined` when valid. An async `validate` doesn't prevent form submission in `onSubmit` mode.

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

Use `validation-mode` to control when validation (native constraint checks and the custom `validate` function) runs. Whatever the mode, an empty `required` field isn't reported until the user has changed its value, or the form is submitted:

- `onSubmit` (default): when the owning `FormRoot` submits, then on every change after that.
- `onBlur`: when the control loses focus.
- `onChange`: on every change to the control's value. Use `validation-debounce-time` to wait between `validate` calls.

A `FieldRoot` without its own `validation-mode` uses the `FormRoot`'s.

```vue line=4-5
<template>
  <FieldRoot
    name="email"
    validation-mode="onChange"
    :validation-debounce-time="300"
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

Participating controls report focus/dirty/filled state, pass their actual value to `validate`, and enforce `required`: an empty `Select`, an unchecked `Checkbox` or an empty `DateField` makes the field invalid (`match="valueMissing"`).

## Accessibility

`FieldLabel` associates with the control via matching `for`/`id` and `aria-labelledby`. `FieldDescription` and any shown `FieldError` are added to the control's `aria-describedby`, and `aria-invalid` is set once the field is known to be invalid. Custom errors are also set on native controls with `setCustomValidity`, so the browser's own validity state agrees with the field.
