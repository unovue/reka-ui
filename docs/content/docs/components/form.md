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
    'Native `reset` clears every Field\'s touched/dirty/error state.',
    'Does not serialize your form for you — read `event.target` with native `FormData` in your own submit handler, same as a plain form element.',
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
  <FormRoot :errors="serverErrors" @submit="onSubmit">
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

Extends the native `form` element. Provides context that every descendant `FieldRoot` optionally reads for server errors, submit-time validation, and reset handling.

<!-- @include: @/meta/FormRoot.md -->

## Examples

### Server-side errors

Pass an `errors` map keyed by field `name`. The matching `FieldRoot`'s `FieldError` displays it until the user edits that field, or a new value for that key is provided.

```vue line=13
<script setup>
import { FieldControl, FieldError, FieldLabel, FieldRoot, FormRoot } from 'reka-ui'
import { ref } from 'vue'

const serverErrors = ref({})

async function onSubmit(event) {
  const formData = new FormData(event.target)
  const result = await api.createAccount(formData)
  if (result.error)
    serverErrors.value = { email: result.error }
}
</script>

<template>
  <FormRoot :errors="serverErrors" @submit="onSubmit">
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

On submit, `FormRoot` always intercepts the native event, runs every field's validation (awaiting async `validate` functions), and only emits its own `submit` event — the one your `@submit` handler receives — once every field is valid. Otherwise it focuses the first invalid field's control and your handler is not called.

```vue line=1
<template>
  <FormRoot @submit="onSubmit">
    <FieldRoot name="email" required>
      <FieldLabel>Email</FieldLabel>
      <FieldControl type="email" required />
      <FieldError match="valueMissing">
        Email is required
      </FieldError>
    </FieldRoot>
  </FormRoot>
</template>
```

## Accessibility

Renders a native `form` element. Focus moves to the first invalid field's control when a submit is blocked, so keyboard and screen-reader users land directly on the field that needs attention.
