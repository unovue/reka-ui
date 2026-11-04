---
title: Forms and validation
description: Build accessible, validated forms with Field, Form and the Reka UI form controls.
---

# Forms and validation

<Description>
Build accessible, validated forms with Field, Form and the Reka UI form controls.
</Description>

Two components carry the form story in v3:

- [Field](../components/field) wires one control to its label, description and errors (`id`, `for`, `aria-labelledby`, `aria-describedby`, `aria-invalid`) and validates it.
- [Form](../components/form) runs every field's validation on submit, blocks an invalid submission, moves focus to the first invalid field, collects the values and shows server errors.

<ComponentPreview name="FormSignup" />

## A field

A `FieldRoot` holds one control. With a native `input`, `textarea` or `select`, render it with `FieldControl`: the browser's constraint validation (`required`, `type="email"`, `pattern`, `min`, …) feeds the field.

```vue
<script setup>
import { FieldControl, FieldDescription, FieldError, FieldLabel, FieldRoot } from 'reka-ui'
</script>

<template>
  <FieldRoot name="email" required>
    <FieldLabel>Email</FieldLabel>
    <FieldControl type="email" />
    <FieldDescription>We'll send the receipt here.</FieldDescription>
    <FieldError match="valueMissing">
      Enter your email.
    </FieldError>
    <FieldError match="typeMismatch">
      That doesn't look like an email address.
    </FieldError>
  </FieldRoot>
</template>
```

A `FieldError` without `match` shows whatever message is current: a server error, the message of your `validate` function, or the browser's own validation message.

## Reka UI controls inside a field

These controls detect a surrounding `FieldRoot` and act as its control, in place of `FieldControl`. They take the field's `name`, `id`, `disabled` and `required`, get labelled by `FieldLabel`, report focus, dirty and filled state, and render the field's `data-valid` / `data-invalid` / `data-dirty` / `data-touched` / `data-filled` / `data-focused` attributes:

| Control | Empty when (`valueMissing` with `required`) | Value passed to `validate` and `formSubmit` |
|---|---|---|
| [Checkbox](../components/checkbox) (outside a `CheckboxGroupRoot`) | not checked | `true`, `false` or `'indeterminate'` |
| [Select](../components/select) | nothing selected | the model value (an array with `multiple`) |
| [Date Field](../components/date-field), and the field inside a [Date Picker](../components/date-picker) | no complete date | the Temporal value |
| [Tag Group](../components/tag-group) | nothing selected | the selection |

```vue
<template>
  <FieldRoot name="terms" required>
    <CheckboxRoot>
      <CheckboxIndicator>✓</CheckboxIndicator>
    </CheckboxRoot>
    <FieldLabel>I accept the terms</FieldLabel>
    <FieldError match="valueMissing">
      You must accept the terms.
    </FieldError>
  </FieldRoot>
</template>
```

For a button control such as `SelectTrigger`, a native `label` forwards clicks to it. To render the label as another element, set `:native-label="false"` on `FieldLabel`: clicking it then focuses the control.

### Other controls

Switch, Radio Group, Combobox, Number Field, Slider, Pin Input, Tags Input and the other form controls don't register with a `FieldRoot` yet. In a form, give them a `name`: inside a `form` element they render a hidden native input, so the browser submits their value. Label them with [Label](../components/label) (or `aria-labelledby`) and read their value from your own `v-model`:

```vue
<script setup>
import { FormRoot, Label, RadioGroupItem, RadioGroupRoot, SwitchRoot, SwitchThumb } from 'reka-ui'
import { ref } from 'vue'

const newsletter = ref(false)
const frequency = ref('weekly')

function onSubmit(event) {
  event.preventDefault()
  const data = new FormData(event.currentTarget)
  // data.get('newsletter') === 'on' when checked, data.get('frequency') === 'weekly'
}
</script>

<template>
  <FormRoot @submit="onSubmit">
    <Label for="newsletter">Newsletter</Label>
    <SwitchRoot id="newsletter" v-model="newsletter" name="newsletter">
      <SwitchThumb />
    </SwitchRoot>

    <Label id="frequency-label">Frequency</Label>
    <RadioGroupRoot v-model="frequency" name="frequency" aria-labelledby="frequency-label">
      <RadioGroupItem value="daily" aria-label="Daily" />
      <RadioGroupItem value="weekly" aria-label="Weekly" />
    </RadioGroupRoot>
  </FormRoot>
</template>
```

To show a validation error for such a control, wrap it in a `FieldRoot`, compute the error yourself and pass `:invalid` (here `submitted` is a flag you set in your submit handler). The `FieldError` then shows your message, and an invalid field also blocks the `FormRoot` submission. Focus doesn't move to such a control when the submission is blocked, because it doesn't register a control element with the field, and `submit` doesn't fire for a blocked submission:

```vue
<template>
  <FieldRoot :invalid="submitted && !frequency">
    <!-- the RadioGroupRoot -->
    <FieldError>Choose how often we should write.</FieldError>
  </FieldRoot>
</template>
```

## Custom validation

Pass `validate` to a `FieldRoot`. It receives the control's value and, inside a `FormRoot`, the values of every named field, so one field can depend on another. Return a message, several messages, or `null` when the value is valid. It may be async: an async result shows once it resolves but doesn't hold back a submission in `onSubmit` mode.

```vue
<script setup>
function confirmPassword(value, formValues) {
  return value === formValues.password ? null : 'The passwords don\'t match.'
}
</script>

<template>
  <FormRoot @form-submit="createAccount">
    <FieldRoot name="password" required>
      <FieldLabel>Password</FieldLabel>
      <FieldControl type="password" minlength="8" />
      <FieldError />
    </FieldRoot>
    <FieldRoot name="confirm" required :validate="confirmPassword">
      <FieldLabel>Confirm password</FieldLabel>
      <FieldControl type="password" />
      <FieldError />
    </FieldRoot>
  </FormRoot>
</template>
```

## When validation runs

`validation-mode` sets the timing, on a `FieldRoot` or for every field on the `FormRoot`. A field's own mode wins.

| Mode | Validates |
|---|---|
| `onSubmit` (default) | when the form is submitted, then on every change |
| `onBlur` | when the control loses focus |
| `onChange` | on every change; add `validation-debounce-time` for an expensive `validate` |

Whatever the mode, an empty `required` field is reported only after the user changed it, or on submit. A user tabbing through a form doesn't get a wall of errors.

## Submitting

`FormRoot` renders a `form` with `novalidate`, so the browser's validation bubbles never pre-empt your errors. On submit it validates every field. If one is invalid, it cancels the submission and focuses the first invalid control in document order. Otherwise:

- With a `@form-submit` listener, it prevents the native submission and calls it with an object of every named field's value, and the native event.
- Without one, it emits `submit` and lets the browser submit the form (to its `action`), unless you call `event.preventDefault()`.

```vue
<script setup>
import { ref } from 'vue'

const serverErrors = ref({})

async function createAccount(values) {
  const response = await fetch('/api/accounts', { method: 'POST', body: JSON.stringify(values) })
  if (!response.ok)
    serverErrors.value = await response.json() // { email: 'Already registered' }
}
</script>

<template>
  <FormRoot :errors="serverErrors" @form-submit="createAccount">
    <!-- fields -->
  </FormRoot>
</template>
```

### Server errors

Pass the errors the server returned as `errors`, keyed by field `name`. Each one shows in its field's `FieldError` (one without `match`) until the user edits that field. When errors arrive in answer to a submission, focus moves to the first field they invalidate.

### Resetting

A native `type="reset"` button resets every field inside a `FormRoot` to its initial value and clears its validation state.

## Validating from code

Both roots expose `validate()` through a template ref. `formRef.value.validate()` validates every field, `formRef.value.validate('email')` one of them, and `fieldRef.value.validate()` its own field, regardless of the validation mode. Each returns whether the fields are valid. Use it, for example, to check the fields of one step of a multi-step form before moving to the next.

## With a schema library

`validate` can call any library. With [Zod](https://zod.dev), return the issue messages:

```ts
import { z } from 'zod'

const username = z.string().min(3, 'At least 3 characters').regex(/^\w+$/, 'Letters, digits and _ only')

function validateUsername(value: unknown) {
  const result = username.safeParse(value)
  return result.success ? null : result.error.issues.map(issue => issue.message)
}
```

When another library (VeeValidate, FormKit, …) owns the state, drive the field from it: pass `invalid`, `dirty` and `touched` to the `FieldRoot`, and render the library's message in a `FieldError` with `:match="true"` (always shown) or inside a `v-if`.

## Styling by state

The field's state is available as data attributes on every part and on the participating control, so one rule can style the label, the control and the description together:

```css
.FieldRoot[data-invalid] .FieldLabel { color: var(--red-11); }
.FieldControl[data-invalid] { border-color: var(--red-9); }
.FieldControl[data-focused] { outline: 2px solid var(--blue-8); }
```

`FieldError` has `data-state="open"` or `"closed"` and waits for a closing [animation](./animation) before it unmounts.
