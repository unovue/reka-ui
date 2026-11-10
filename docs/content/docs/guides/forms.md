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

Every Reka UI form control detects a surrounding `FieldRoot` and acts as its control, in place of `FieldControl`. It takes the field's `name`, `id`, `disabled` and `required`, gets labelled and described by `FieldLabel` and `FieldDescription`, reports focus, touched, dirty and filled state, and renders the field's `data-valid` / `data-invalid` / `data-dirty` / `data-touched` / `data-filled` / `data-focused` attributes. Its value reaches your `validate` function and `FormRoot`'s `formSubmit`, and when a submission is blocked, focus moves to the first invalid control.

| Control | Empty when (`valueMissing` with `required`) | Value passed to `validate` and `formSubmit` |
|---|---|---|
| [Checkbox](../components/checkbox) | not checked | `true`, `false` or `'indeterminate'` |
| [Checkbox Group](../components/checkbox#group-root) | nothing checked | the array of checked values |
| [Switch](../components/switch) | off | `true` or `false` |
| [Toggle](../components/toggle) | not pressed | `true` or `false` |
| [Toggle Group](../components/toggle-group) | nothing pressed | the model value (an array with `type="multiple"`) |
| [Radio Group](../components/radio-group) | nothing selected | the model value |
| [Select](../components/select) | nothing selected | the model value (an array with `multiple`) |
| [Combobox](../components/combobox) | nothing selected | the selected value(s), not the typed text |
| [Autocomplete](../components/autocomplete) | no text | the input text |
| [Listbox](../components/listbox) | nothing selected | the model value (an array with `multiple`) |
| [Tag Group](../components/tag-group) | nothing selected | the selection |
| [Tags Input](../components/tags-input) | no tags | the array of tags |
| [Number Field](../components/number-field) | no number | the number, or `null` |
| [Pin Input](../components/pin-input) | any input empty | the model array, without trailing empty entries (a cleared pin is `[]`) |
| [Editable](../components/editable) | no submitted text | the submitted text, not the draft |
| [Date Field](../components/date-field) and [Date Picker](../components/date-picker) | no complete date | the Temporal value |
| [Date Range Field](../components/date-range-field) and [Date Range Picker](../components/date-range-picker) | either end missing | `{ start, end }` |
| [Time Field](../components/time-field) | no complete time | the Temporal value |
| [Time Range Field](../components/time-range-field) | either end missing | `{ start, end }` |
| [Slider](../components/slider) | the model is `null` | the array of thumb values |
| [Color Field](../components/color-field) and [Color Slider](../components/color-slider) | never | the `Color` |
| [Color Area](../components/color-area) | never | the `Color`; a native submit sends its hex string under the field name, and `xName`/`yName` add each channel's value under those names |

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

A few controls are made of several parts:

- **Groups** (Radio Group, Checkbox Group, Toggle Group): the group is the field's control. `FieldLabel` labels the group, not an item, and an invalid submission focuses the checked item, or the first enabled one. The field is touched once focus leaves the group, not when it moves between items.
- **Controls with a popup** (Select, Combobox, Autocomplete, Date Picker, Date Range Picker): moving focus into the popup doesn't count as leaving the field.
- **Segmented fields** (Date, Time and their range variants, Pin Input): the label points at the control's hidden input, which forwards focus to the first segment.
- **Composed controls**, such as a Tags Input used as a Combobox's input: the outermost control owns the field.

For a button control such as `SelectTrigger`, `SwitchRoot` or `Toggle`, a native `label` forwards clicks to it. To render the label as another element, set `:native-label="false"` on `FieldLabel`: clicking it then focuses the control.

```vue
<template>
  <FormRoot @form-submit="save">
    <FieldRoot name="newsletter">
      <FieldLabel>Newsletter</FieldLabel>
      <SwitchRoot>
        <SwitchThumb />
      </SwitchRoot>
    </FieldRoot>

    <FieldRoot name="frequency" required>
      <FieldLabel :native-label="false">
        Frequency
      </FieldLabel>
      <RadioGroupRoot>
        <RadioGroupItem value="daily" aria-label="Daily" />
        <RadioGroupItem value="weekly" aria-label="Weekly" />
      </RadioGroupRoot>
      <FieldError match="valueMissing">
        Choose how often we should write.
      </FieldError>
    </FieldRoot>
  </FormRoot>
</template>
```

After choosing Weekly, `save` receives `{ newsletter: false, frequency: 'weekly' }`; submitting with no frequency chosen shows the error and focuses the first radio.

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

A native reset, from a `type="reset"` button or `form.reset()`, puts every Reka UI control of the form back to its `defaultValue`, the way a native input goes back to its default. A control without a `defaultValue` goes back to its empty value. Every `FieldRoot` in the form clears its touched, dirty and validation state, and `filled` follows the value the reset left. This works in a plain `<form>` too, with or without a `FieldRoot`.

```vue
<template>
  <form>
    <SwitchRoot name="newsletter" default-value>
      <SwitchThumb />
    </SwitchRoot>
    <SliderRoot name="volume" :default-value="[50]">
      <SliderTrack><SliderRange /></SliderTrack>
      <SliderThumb />
    </SliderRoot>
    <button type="reset">
      Reset
    </button>
  </form>
</template>
```

The reset is a change like any other. It emits `update:modelValue` with `details.reason === 'none'` and the native `reset` event as `details.event`, only when the value differs from the default, and `beforeUpdate:modelValue` can cancel it:

```vue
<script setup lang="ts">
import type { ChangeEventDetails } from 'reka-ui'

function keepOnReset(value: boolean, details: ChangeEventDetails) {
  if (details.event?.type === 'reset')
    details.cancel()
}
</script>

<template>
  <SwitchRoot default-value @before-update:model-value="keepOnReset" />
</template>
```

A control bound with `v-model` receives the default through `update:modelValue`, so the bound state is what changes. Pass `default-value` next to `v-model` to choose the value a reset restores; without it the control asks for its empty value, the one an uncontrolled control starts with.

```vue
<template>
  <!-- A reset sets `plan` to 'free' -->
  <RadioGroupRoot v-model="plan" default-value="free" />
</template>
```

The rules follow the native ones:

- Every Reka UI form control inside the form is reset, named or not, and disabled or not. A control inside another control, such as the checkboxes of a `CheckboxGroupRoot`, is reset by the outer one.
- A control whose root is a `<button>` (Checkbox, Switch, Toggle) follows that button's `form` attribute: outside the form and naming it, it is reset with it; inside the form and naming another one, it is not.
- Calling `preventDefault()` on the `reset` event keeps every value and every field's state.
- Text typed into a control but not committed is dropped: a `ComboboxInput` shows the selected value again, and a date or time field loses the segments typed without completing a value.

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
