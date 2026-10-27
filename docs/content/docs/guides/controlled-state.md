---
title: Controlled State
description: How to work with controlled vs. uncontrolled state in Reka UI.
---

# Controlled State

<Description>
How to work with controlled vs. uncontrolled state in Reka UI.
</Description>

Reka UI provides flexible state management for components, allowing developers to use either **controlled** or **uncontrolled** state. Understanding when to use each approach ensures better integration with Vue's reactivity system.

---

## Controlled vs. Uncontrolled State

### Controlled State
A **controlled** component receives its state as a prop and requires explicit updates via event listeners. The parent component manages and synchronizes the state.

#### Example: Controlled `SwitchRoot`

```vue
<script setup>
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { ref } from 'vue'

const isActive = ref(false)

function handleUpdate(value) {
  isActive.value = value
}
</script>

<template>
  <SwitchRoot :model-value="isActive" @update:model-value="handleUpdate">
    <SwitchThumb />
  </SwitchRoot>
</template>
```

**How it works:**
- The `SwitchRoot` component’s state is managed by the `isActive` ref.
- The `@update:modelValue` event ensures updates propagate correctly.

<Callout type="tip" title="Use controlled state when:">

- You need to sync state with Vuex, Pinia, or an API.
- Multiple components rely on the same state.
- You want fine-grained control over updates.

</Callout>

#### Using v-model with Controlled Components

Vue’s `v-model` syntax provides a convenient way to bind values to controlled components in Reka UI. It automatically handles passing the value and listening for updates.

Example: Using `v-model` with `SwitchRoot`

```vue
<script setup>
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { ref } from 'vue'

const isActive = ref(false)
</script>

<template>
  <SwitchRoot v-model="isActive">
    <SwitchThumb />
  </SwitchRoot>
</template>
```

### Uncontrolled State
An **uncontrolled** component manages its own state internally, without requiring a parent-controlled prop. Instead of `modelValue`, Reka UI components use `defaultValue` to initialize state.

#### Example: Uncontrolled `SwitchRoot`
```vue
<template>
  <SwitchRoot default-value="true">
    <SwitchThumb />
  </SwitchRoot>
</template>
```

**How it works:**
- The `SwitchRoot` initializes its state with `defaultValue`.
- State changes occur internally without external control.

<Callout type="tip" title="Use uncontrolled state when:">

- The component does not need to sync with external logic.
- You want a simpler setup without explicit state management.
- The state is local and does not impact other components.

</Callout>

## Change details

Every converted `update:*` event receives a second argument, a `ChangeEventDetails` object: `reason` (why the state changed, typed with the family's exported reason union, for example `SwitchChangeReason`, plus `'imperative-action'` for programmatic changes), `event` (the native event behind the change, if any), `isCanceled` and `cancel()`. A cancellable `beforeUpdate:*` event fires before it with the same object. Both fire only when the value actually changes, and in uncontrolled mode they fire synchronously, inside the interaction that caused them.

A few events are not converted and keep a single argument: `ListboxFilter` and `DropdownMenuFilter` `update:modelValue`, `RovingFocusGroup` `update:currentTabStopId`, derived notifications such as `update:openComplete`, and the `ProgressRoot` correction events. `AutocompleteInput` and `FieldControl` pass details with `update:modelValue` but have no `beforeUpdate:modelValue`. See [Change details coverage](./migration-v3#change-details-coverage) for the full list.

### With `v-model`

`v-model` keeps working unchanged: it only reads the first argument. To read the details, add an explicit listener next to it. It runs in the same emit, whichever of the two you write first:

```vue
<script setup lang="ts">
import type { ChangeEventDetails, SwitchChangeReason } from 'reka-ui'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { ref } from 'vue'

const isActive = ref(false)

function onUpdate(value: boolean, details: ChangeEventDetails<SwitchChangeReason>) {
  console.log(value, details.reason) // true, 'trigger-press'
}
</script>

<template>
  <SwitchRoot v-model="isActive" @update:model-value="onUpdate">
    <SwitchThumb />
  </SwitchRoot>
</template>
```

### Cancelling a change

Call `details.cancel()` inside `beforeUpdate:*` to keep the current state. The `update:*` event is then never emitted, so the `v-model` writer never runs and nothing re-renders. This works the same with `v-model`, with a `:model-value` / `@update:model-value` pair and without either. `cancel()` called later, inside `update:*`, has no effect (it warns in development).

```vue
<template>
  <DialogRoot
    v-model:open="open"
    @before-update:open="(value, details) => !value && form.dirty && details.cancel()"
  >
    …
  </DialogRoot>
</template>
```

### Wrapping a component with `defineModel`

`defineModel()` re-emits `update:*` with the value only, so a wrapper built with it hides the details from its own parent. A `beforeUpdate:*` listener placed on the inner component inside the wrapper still cancels. To pass the details through, declare the emits yourself and forward them, for example with [`useForwardPropsEmits`](../utilities/use-forward-props-emits), which forwards every argument:

```ts
type Emits = {
  'beforeUpdate:open': [value: boolean, details: ChangeEventDetails<DialogOpenChangeReason>]
  'update:open': [value: boolean, details: ChangeEventDetails<DialogOpenChangeReason>]
}
```

### Reading the last change without a listener

Each family's headless composable (`useSwitch()`, `useDialog()`, …) returns `lastChangeDetails`, a read-only ref holding the details of the last change, including a cancelled one. Before the first change its `reason` is `'none'`.

The components do not expose it as a slot prop, as in Base UI: listen to `update:<name>` (or `beforeUpdate:<name>`) on a component, and read `lastChangeDetails` only when you build on the composable.

## Common Mistakes & Fixes

### 1. Forgetting `@update:modelValue`

```vue
<!-- ❌ Incorrect: -->
<SwitchRoot :modelValue="isActive" />

<!-- ✅ Correct: -->
<SwitchRoot :modelValue="isActive" @update:modelValue="(val) => isActive = val" />
```

### 2. Using `modelValue` Instead of `defaultValue`

```vue
<!-- ❌ Incorrect: -->
<SwitchRoot :modelValue="true" />

<!-- ✅ Correct: -->
<SwitchRoot defaultValue="true" />
```

### 3. Not Providing a Setter for Computed Props

```ts
// ❌ Incorrect:
const isActive = computed(() => store.state.toggleState)

// ✅ Correct:
const isActive = computed({
  get: () => store.state.toggleState,
  set: val => store.commit('setToggleState', val)
})
```
