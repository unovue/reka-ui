---

title: Form
description: Extends the native form element with server error display and submit-time validation gating.
name: form
---

# Form

<Description>
Extends the native form element with server error display and submit-time validation gating.
</Description>

<ComponentPreview name="Form" />

## Features

<Highlights
  :features="[
    'Runs every Field\'s validation on submit and focuses the first invalid control instead of submitting.',
    'Displays server-side errors by field name, cleared automatically once the user edits that field.',
    'Hands you the value of every named field through `formSubmit`, or leaves a valid form to submit natively.',
    'Sets a default `validationMode` for every Field inside it.',
    'Native `reset` clears every Field\'s touched/dirty/error state.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together. See the [Field](/docs/components/field) docs for `FieldRoot` and its parts.

```vue
<script setup>
import { FieldControl, FieldError, FieldLabel, FieldRoot, FormRoot } from 'reka-ui'
</script>

<template>
  <FormRoot :errors="serverErrors" @form-submit="onFormSubmit">
    <FieldRoot name="email" required>
      <FieldLabel>Email</FieldLabel>
      <FieldControl type="email" />
      <FieldError match="valueMissing">
        Email is required
      </FieldError>
      <FieldError v-slot="{ errors }">
        {{ errors[0] }}
      </FieldError>
    </FieldRoot>
  </FormRoot>
</template>
```

## API Reference

### Root

Extends the native `form` element. Provides context that every descendant `FieldRoot` optionally reads for server errors, submit-time validation, and reset handling. Renders with `novalidate`, so the browser's own validation popups don't pre-empt Field errors.

Exposes a `validate(name?)` method through a template ref, which validates every field (or only the named one) and returns whether they're valid.

<!-- @include: @/meta/FormRoot.md -->

## Examples

### Server-side errors

Pass an `errors` map keyed by field `name`. The matching `FieldRoot`'s `FieldError` displays it until the user edits that field, or a new value for that key is provided. When errors arrive in response to a submit, focus moves to the first field they invalidate.

```vue line=12
<script setup>
import { FieldControl, FieldError, FieldLabel, FieldRoot, FormRoot } from 'reka-ui'
import { ref } from 'vue'

const serverErrors = ref({})

async function onFormSubmit(values) {
  const result = await api.createAccount(values)
  if (result.error)
    serverErrors.value = { email: result.error }
}
</script>

<template>
  <FormRoot :errors="serverErrors" @form-submit="onFormSubmit">
    <FieldRoot name="email">
      <FieldLabel>Email</FieldLabel>
      <FieldControl type="email" />
      <FieldError v-slot="{ errors }">
        {{ errors[0] }}
      </FieldError>
    </FieldRoot>
  </FormRoot>
</template>
```

### Submit gating

On submit, `FormRoot` runs every field's validation. If any field is invalid, it prevents the native submission and focuses the first invalid field's control, in document order. Otherwise it emits `submit` with the native event, then:

- With a `formSubmit` listener, it prevents the native submission and emits `formSubmit` with the value of every named field.
- Without one, the form submits natively (for example to its `action`), unless you call `event.preventDefault()` in your `submit` handler.

Only synchronous results gate the submission. An async `validate` runs, and shows its errors once it resolves, but doesn't hold the submission back in `onSubmit` mode.

```vue line=2
<template>
  <FormRoot @form-submit="onFormSubmit">
    <FieldRoot name="email" required>
      <FieldLabel>Email</FieldLabel>
      <FieldControl type="email" />
      <FieldError match="valueMissing">
        Email is required
      </FieldError>
    </FieldRoot>
  </FormRoot>
</template>
```

### Validation timing

Set `validation-mode` on `FormRoot` to change when every field inside it validates. A `FieldRoot`'s own `validation-mode` takes precedence.

```vue line=2
<template>
  <FormRoot validation-mode="onBlur">
    <!-- ... -->
  </FormRoot>
</template>
```

## Accessibility

Renders a native `form` element. Focus moves to the first invalid field's control when a submit is blocked, so keyboard and screen-reader users land directly on the field that needs attention.
