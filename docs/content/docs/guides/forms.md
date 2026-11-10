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

## Your own control

`useFieldControl()` makes a component of yours the field's control, the way the Reka UI controls are. Use it for a control that `FieldControl` doesn't fit: a native input whose value you transform, a `contenteditable` editor, or a wrapper around a third-party widget.

Give it the control's current `value` and the `element` that takes focus, and pass on the control's own `id`, `name`, `disabled` and `required`. It returns:

- `control`, a [part surface](./composables#part-surfaces) to bind on the element: the `id` the label points at, `aria-labelledby`, `aria-describedby`, `aria-invalid`, the focus and blur handlers, and the field's `data-*` state attributes.
- `name`, `disabled` and `required`, resolved against the field: the field's `name` wins, and `disabled` and `required` apply when set on either.
- `input(value)`, which you call when the user changes the value. The field then becomes dirty, validates when its mode asks for it, and drops a server error.

A change of `value` that comes without an `input()` call, such as the parent setting the model, only updates the field's `filled` state.

```vue
<!-- SlugInput.vue -->
<script setup lang="ts">
import { useFieldControl } from 'reka-ui'
import { useTemplateRef } from 'vue'

const props = defineProps<{ id?: string, name?: string, disabled?: boolean, required?: boolean }>()
const model = defineModel<string>({ default: '' })

const element = useTemplateRef('element')
const { control, name, disabled, required, input } = useFieldControl({
  value: model,
  element,
  validityElement: element,
  id: () => props.id,
  name: () => props.name,
  disabled: () => props.disabled,
  required: () => props.required,
})

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  target.value = target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  model.value = target.value
  input(target.value)
}
</script>

<template>
  <input
    ref="element"
    v-bind="control.attrs.value"
    :name="name"
    :disabled="disabled"
    :required="required"
    :value="model"
    @input="onInput"
  >
</template>
```

```vue
<template>
  <FieldRoot name="slug" required>
    <FieldLabel>Slug</FieldLabel>
    <SlugInput v-model="slug" />
    <FieldError match="valueMissing">
      Enter a slug.
    </FieldError>
  </FieldRoot>
</template>
```

`validityElement` names a native `input`, `textarea` or `select` whose constraint validation (`required`, `pattern`, `min`, …) decides the field's validity. A control without one has a single built-in constraint, `required`, which fails while the value is not filled. Pass `isFilled` when an empty value is something other than `null`, `undefined`, `''` or an empty array. Such a control also renders its own disabled and required semantics, and a hidden input when it should take part in a native submission:

```vue
<!-- NoteEditor.vue -->
<script setup lang="ts">
import { useFieldControl } from 'reka-ui'
import { onMounted, useTemplateRef, watch } from 'vue'

const props = defineProps<{ name?: string, disabled?: boolean, required?: boolean }>()
const model = defineModel<string>({ default: '' })

const element = useTemplateRef('element')
const { control, name, disabled, required, input } = useFieldControl({
  value: model,
  element,
  name: () => props.name,
  disabled: () => props.disabled,
  required: () => props.required,
  isFilled: value => value.trim() !== '',
})

// The element owns its text while the user types; write only what came from outside.
function render() {
  if (element.value && element.value.textContent !== model.value)
    element.value.textContent = model.value
}
onMounted(render)
watch(model, render)

function onInput() {
  model.value = element.value?.textContent ?? ''
  input(model.value)
}
</script>

<template>
  <div
    ref="element"
    role="textbox"
    aria-multiline="true"
    :contenteditable="!disabled"
    :tabindex="disabled ? undefined : 0"
    :aria-disabled="disabled || undefined"
    :aria-required="required || undefined"
    v-bind="control.attrs.value"
    @input="onInput"
  />
  <input
    v-if="name"
    type="hidden"
    :name="name"
    :value="model"
    :disabled="disabled"
  >
</template>
```

Outside a `FieldRoot` the composable returns the control's own `id`, `name`, `disabled` and `required` and no field wiring, so the same component works on its own. A Reka UI control rendered inside your control leaves the field to it. Call `useFieldControl()` inside `setup()`. Like the other [composables](./composables), it is experimental.

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

## Reading a field or a form from script

A component rendered inside a `FieldRoot` reads and drives that field with `useField()`. It returns the field's state as read-only refs (`invalid`, `touched`, `dirty`, `filled`, `focused`, `errors`, `validity`, and the `name`, `disabled` and `required` props) and three actions: `validate()`, `reset()`, which clears the touched, dirty and validation state and leaves the value alone, and `focus()`, which focuses the control.

```vue
<!-- FieldStatus.vue -->
<script setup lang="ts">
import { useField } from 'reka-ui'

const field = useField()
</script>

<template>
  <span v-if="field.invalid.value">
    {{ field.errors.value[0] }}
    <button type="button" @click="field.validate()">
      Check again
    </button>
  </span>
  <span v-else-if="field.dirty.value && field.validity.value.valid">Looks good</span>
</template>
```

Inside a `FormRoot`, `useForm()` returns `getValues()` (the object `formSubmit` receives, read when you call it), `validate(name?)`, `submitCount` and `reset()`, which does what a `type="reset"` button does.

```vue
<!-- FormActions.vue -->
<script setup lang="ts">
import { useForm } from 'reka-ui'

const form = useForm()

function saveDraft() {
  localStorage.setItem('draft', JSON.stringify(form.getValues()))
}
</script>

<template>
  <button type="button" @click="saveDraft">
    Save draft
  </button>
  <button type="submit">
    {{ form.submitCount.value > 0 ? 'Try again' : 'Create' }}
  </button>
</template>
```

Both throw when there is no enclosing root, and both are called inside `setup()`. The component that renders the root itself uses the template ref instead.

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
