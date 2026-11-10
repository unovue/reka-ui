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
    'Works with a plain native input, or with any Reka UI form control placed inside it.',
    'Sync or async custom validation, with `onSubmit`/`onBlur`/`onChange` timing and optional debounce.',
    'Validates `required` on non-native controls (Checkbox, Select, Radio Group, Combobox, …) too.',
    'Reads native constraint-validation state (`required`, `pattern`, `type=email`, ...) automatically.',
    'Exposes `data-valid`/`data-invalid`/`data-dirty`/`data-touched`/`data-filled`/`data-focused` on every part for styling.',
    'Shows the browser\'s validation message by default, or your own per failing constraint.',
    'Fully additive — outside a Field, a Reka UI control renders no field wiring.',
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

Every Reka UI form control (`CheckboxRoot`, `SwitchRoot`, `RadioGroupRoot`, `SelectRoot`, `ComboboxRoot`, `NumberFieldRoot`, `SliderRoot`, `DateFieldRoot`, …) can be used directly inside a `FieldRoot` instead of `FieldControl` — it picks up the same wiring automatically by optionally reading the Field's context, and renders none of it outside a Field. (Two v3 fixes do apply everywhere: disabled Listbox, Combobox and Slider parts get `aria-disabled`, and a disabled Checkbox Group or Toggle Group no longer submits its values.) See [Forms and validation](/docs/guides/forms#reka-ui-controls-inside-a-field) for what each one collects.

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

Place any Reka UI form control inside a `FieldRoot` instead of `FieldControl` — it participates automatically. See [Forms and validation](/docs/guides/forms#reka-ui-controls-inside-a-field) for the value each control collects and when it counts as empty.

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

Participating controls report focus/dirty/filled state, pass their actual value to `validate`, and enforce `required`: an empty `Select`, an unchecked `Checkbox`, a radio group with nothing selected or an empty `DateField` makes the field invalid (`match="valueMissing"`).

## Composables

Both are called inside `setup()` and are experimental, like the other [composables](/docs/guides/composables). [Forms and validation](/docs/guides/forms#your-own-control) has complete examples.

### useFieldControl

Makes your own control the control of the enclosing `FieldRoot`, as the Reka UI form controls are. Outside a `FieldRoot` it returns the control's own values and no field wiring.

```ts
import { useFieldControl } from 'reka-ui'

const { control, id, name, disabled, required, input } = useFieldControl({
  value: model,
  element,
  name: () => props.name,
  disabled: () => props.disabled,
  required: () => props.required,
})
```

Every option except `isFilled` takes a value, a ref or a getter.

| Option | Type | Description |
|---|---|---|
| `value`* | `T` | The control's current value, given to `validate` and collected by `FormRoot`. A change without an `input()` call only updates `filled`. |
| `element`* | `HTMLElement \| null \| undefined` | The element focused when the label is clicked, or when the field is the first invalid one on submit. |
| `id` | `string` | The control's own id. Defaults to the id generated by the field. |
| `name` | `string` | The control's own name, used when the field has none. |
| `disabled` | `boolean` | Disables the control. A disabled field disables it too. |
| `required` | `boolean` | Makes the control required. A required field makes it required too. |
| `validityElement` | `HTMLInputElement \| HTMLTextAreaElement \| HTMLSelectElement` | A native control whose constraint validation decides the field's validity, and which receives the field's custom errors. Without one, the only built-in constraint is `required`. |
| `isFilled` | `(value: T) => boolean` | Whether a value counts as filled. Defaults to anything but `null`, `undefined`, `''` and an empty array. |

| Returns | Type | Description |
|---|---|---|
| `control` | `PartSurface<FieldControlState>` | The [part surface](/docs/guides/composables#part-surfaces) of the control's element: `id`, `aria-labelledby`, `aria-describedby`, `aria-invalid`, `onFocus`, `onBlur`, and the state `disabled`, `valid`, `invalid`, `dirty`, `touched`, `filled` and `focused` as `data-*` attributes. |
| `id` | `ComputedRef<string \| undefined>` | The control's own id, or the field's. |
| `name` | `ComputedRef<string \| undefined>` | The field's name, or the control's own when the field has none. |
| `disabled` | `ComputedRef<boolean>` | Whether the control or the field is disabled. |
| `required` | `ComputedRef<boolean>` | Whether the control or the field is required. |
| `input` | `(value?: T) => void` | Reports a change made by the user: the field becomes dirty, validates when its mode asks for it, and drops a server error. Pass the new value when `value` doesn't hold it yet. |

### useField

Reads and drives the enclosing `FieldRoot` from script. Throws outside one.

```ts
import { useField } from 'reka-ui'

const { invalid, errors, validate } = useField()
```

| Returns | Type | Description |
|---|---|---|
| `name` | `ComputedRef<string \| undefined>` | The field's `name`. |
| `disabled`, `required` | `ComputedRef<boolean>` | The field's props. |
| `invalid` | `ComputedRef<boolean>` | Whether the field is known to be invalid: a failed validation, a server error or the `invalid` prop. |
| `touched` | `ComputedRef<boolean>` | Whether the control has lost focus at least once. |
| `dirty` | `ComputedRef<boolean>` | Whether the user changed the value to something other than its initial value. |
| `filled` | `ComputedRef<boolean>` | Whether the control holds a value. |
| `focused` | `ComputedRef<boolean>` | Whether focus is in the control. |
| `errors` | `ComputedRef<string[]>` | All current error messages: validation errors, then server errors. |
| `validity` | `ComputedRef<FieldValidityState>` | The field's validity. Its `valid` is `null` until the field has been validated. |
| `validate` | `() => boolean` | Validates the field now, whatever its `validationMode`. Returns whether it is valid. |
| `reset` | `() => void` | Clears the touched, dirty and validation state. The control keeps its value. |
| `focus` | `() => void` | Moves focus to the field's control. |

## Accessibility

`FieldLabel` associates with the control via matching `for`/`id` and `aria-labelledby`. `FieldDescription` and any shown `FieldError` are added to the control's `aria-describedby`, and `aria-invalid` is set once the field is known to be invalid. Custom errors are also set on native controls with `setCustomValidity`, so the browser's own validity state agrees with the field.
