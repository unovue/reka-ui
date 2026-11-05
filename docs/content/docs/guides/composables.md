---
title: Headless composables
description: Build on the same useX() composables the Reka UI components are made of, and render your own elements.
---

# Headless composables

<Description>
Build on the same <code>useX()</code> composables the Reka UI components are made of, and render your own elements.
</Description>

In v3 every stateful component family is split in two: a `useX()` composable that owns the state, the ids and the ARIA wiring, and a thin `.vue` shell that renders it. The composables are public. Reach for them when the components' markup is in the way: a design system that renders through its own primitives, a custom element, a canvas, or a component that needs the state of a Switch but not its DOM.

For most apps the components remain the simplest choice. They add what a composable cannot: rendering through `as` / `asChild`, portals, presence (mount and exit animations), focus trapping, dismissal, roving focus and the hidden inputs used for native form submission.

<Callout type="warning">

The composables are marked `@experimental`: their signatures may change in a 3.x minor release. The components built on them follow semver as usual.

</Callout>

<ComponentPreview name="ComposablesSettings" />

## The shape of a composable

Every root composable takes an options object and returns:

- **the model**: a read-only `ComputedRef` (`checked`, `open`, `modelValue`, …) and the setters to change it (`toggle()`, `setChecked()`, `setOpen()`, `onOpenChange()`, `selectTab()`, …).
- **`lastChangeDetails`**: a read-only ref holding the [change details](./controlled-state#change-details) of the last change attempt, a cancelled one included. Before the first change its `reason` is `'none'`.
- **`isControlled`**: whether the model is owned outside the composable.
- **one part surface per rendered part** (`root`, `trigger`, `content`, `thumb`, …), described below.
- **`context`**: the object the `.vue` root provides to its parts. You only need it to call the part composables of the same family (`useSelectItem(context, …)`, `useSplitterPanel(context, …)`, `useAvatarImage(context, …)`).

```ts
import { useSwitch } from 'reka-ui'

const { checked, toggle, setChecked, lastChangeDetails, root, thumb } = useSwitch({ defaultValue: true })
```

## Part surfaces

A part surface is what the composable wants rendered on one element. It has three refs:

| Key | Holds |
|---|---|
| `props` | `role`, `aria-*`, `id`, `value`, `disabled` and the event handlers (`onClick`, `onKeydown`, …). No `data-*`. |
| `state` | The semantic state of the part, such as `{ state: 'checked', disabled: false }`. |
| `attrs` | Both merged: the `props` plus the `data-*` attributes derived from `state`. |

Bind `attrs` and style with the same [data attributes](./styling#data-attributes) the components render:

```vue
<script setup lang="ts">
import { useSwitch } from 'reka-ui'

const airplaneMode = useSwitch()
</script>

<template>
  <button
    type="button"
    aria-label="Airplane mode"
    class="switch"
    v-bind="airplaneMode.root.attrs.value"
  >
    <span
      class="thumb"
      v-bind="airplaneMode.thumb.attrs.value"
    />
  </button>
</template>

<style>
.switch[data-state='checked'] { background: black; }
.thumb[data-state='checked'] { transform: translateX(100%); }
</style>
```

The handlers live in `props` so that `v-bind` (or Vue's `mergeProps`) chains them with your own listeners instead of replacing them. A listener you add with `@click` next to `v-bind` runs as well.

Read `state` when you need the state in script, for example to pick an icon. Bind `props` instead of `attrs` when you want to choose your own attribute names for the state.

## Owning the state

The model of a composable can be owned in three ways. The same rules apply to every family, because they all use [`useControllableState`](#usecontrollablestate).

### Uncontrolled

Pass a `defaultValue` (`defaultOpen` for disclosures) or nothing. The composable keeps the value.

```ts
const panel = useCollapsible({ defaultOpen: true })
panel.setOpen(false)
```

### Ref-owned

Pass a writable `ref` and no `onUpdate`. The composable reads the ref and writes every change back to it, so the ref is the single source of truth. This is the composable counterpart of `v-model`.

```ts
const enabled = ref(false)
const control = useSwitch({ modelValue: enabled })

control.toggle() // enabled.value === true
enabled.value = false // control.checked.value === false
```

### Controlled

Pass a getter (or a ref) together with `onUpdate`. The composable never writes: it reports the requested value and you decide whether to apply it.

```ts
const store = useSettingsStore()

const control = useSwitch({
  modelValue: () => store.notifications,
  onUpdate: value => store.setNotifications(value),
})
```

Controlled mode latches: once the value has been defined, the composable stays controlled even if the getter later returns `undefined`.

### Cancelling a change

`onBeforeUpdate(value, details)` runs before every change, in all three modes. Call `details.cancel()` to keep the current value: nothing is written, `onUpdate` doesn't run, and `lastChangeDetails` records the cancelled attempt with `isCanceled: true`. The demo above cancels changes to “Marketing emails” while the preferences are locked.

```ts
const dialog = useDialog({
  onBeforeUpdate: (open, details) => {
    if (!open && form.isDirty)
      details.cancel()
  },
})
```

Each setter also takes a `reason` and the native `event`, which end up in the details. Programmatic calls default to `'imperative-action'`.

## What a composable does not do

A composable is reactive state plus attributes. Anything that needs a mounted element, the document or a separate component stays in the `.vue` parts. In particular:

- **Overlays** (`useDialog`, `usePopover`, `useTooltip`, `useHoverCard`, `useDropdownMenu`, …) give you the open model, ids and `role` / `aria-*` / `data-state` (`data-popup-open` on triggers). Mounting and exit animations ([Presence](../utilities/presence)), focus trapping ([FocusScope](../utilities/focus-scope)), dismissal on Escape and outside clicks, scroll locking, portals and positioning are left to you.
- **Lists** (`useTabs`, `useToolbar`, `useRadioGroup`, …) give you selection and ARIA. Arrow-key navigation comes from [RovingFocusGroup](../utilities/roving-focus).
- **Form controls** don't render the hidden native input that the components add for form submission. Render your own `<input type="hidden">`, or use the component.

The family pages say which pieces their composable leaves out, for example the [Select](../components/select#headless-composables) and [Navigation Menu](../components/navigation-menu#headless-composables) pages.

## Calling a composable

Most root composables are pure: they create computed state only, use no lifecycle hook and never touch `document` when called. They can run outside `setup()`, in a store or a test. Composables that register watchers, mount hooks, timers or listeners must be called inside `setup()` (or an effect scope). Their JSDoc says which kind they are.

| Pure, callable anywhere | Call inside `setup()` |
|---|---|
| `useAccordion`, `useAlertDialog`, `useCheckbox`, `useCheckboxGroup`, `useCollapsible`, `useDialog`, `useDrawer`, `useHoverCard`, `useNumberField`, `usePagination`, `usePopover`, `useRadioGroup`, `useRating`, `useSelectRoot`, `useSlider`, `useSwitch`, `useTabs`, `useTagGroup`, `useTagsInput`, `useTogglePressed`, `useToggleGroup`, `useToolbar`, `useTree`, `useAvatar`, `useToastSwipe`, the Color composables except `useColorField` | `useCalendar`, `useRangeCalendar`, `useDateField`, `useDateRangeField`, `useTimeField`, `useTimeRangeField`, `useDatePicker`, `useDateRangePicker`, `useColorField`, `useComboboxRoot`, `useDropdownMenu`, `useListboxRoot`, `useEditable`, `usePinInput`, `useStepper`, `useSplitter` and its parts, `useAvatarImage`, `useAvatarFallback`, `useSelectContent`, `useSelectItemText`, `useToastProvider`, `useToastRoot`, `useToastTimer`, `useToastViewport` |

### Ids and server rendering

Composables that generate ids (`useDialog`, `useTabs`, `useCollapsible`, `usePopover`, …) default to a per-call counter that is not stable between the server and the client. When you render on the server, pass a stable `baseId` (or `id`), for example from Vue's `useId()`:

```ts
import { useId } from 'vue'

const dialog = useDialog({ baseId: useId() })
```

## `useControllableState`

The model behind every composable is exported too. Use it to give your own components the same `defaultValue` / `v-model` / `beforeUpdate:*` contract as the Reka UI components:

```vue
<script setup lang="ts">
import type { ChangeEventDetails } from 'reka-ui'
import { useControllableState } from 'reka-ui'

type Reason = 'increment' | 'decrement'

const props = defineProps<{ modelValue?: number, defaultValue?: number }>()
const emit = defineEmits<{
  'beforeUpdate:modelValue': [value: number, details: ChangeEventDetails<Reason>]
  'update:modelValue': [value: number, details: ChangeEventDetails<Reason>]
}>()

const { state: count, setState } = useControllableState<number, Reason>({
  prop: () => props.modelValue,
  defaultValue: () => props.defaultValue ?? 0,
  name: 'modelValue',
  emit,
})
</script>

<template>
  <button @click="setState(count - 1, 'decrement', $event)">
    -
  </button>
  <output>{{ count }}</output>
  <button @click="setState(count + 1, 'increment', $event)">
    +
  </button>
</template>
```

With `emit` and `name`, it emits `beforeUpdate:<name>` then `update:<name>`. `setState` returns `false` when the value didn't change or the change was cancelled. Pass `isEqual` to compare objects structurally.

## From a component to a composable

The props of a root component map one to one onto the options of its composable, with the emits replaced by callbacks:

| Component | Composable |
|---|---|
| `v-model` / `:model-value` + `@update:model-value` | `modelValue: ref` (ref-owned) or `modelValue: () => …` + `onUpdate` |
| `default-value` | `defaultValue` |
| `@before-update:model-value` | `onBeforeUpdate` |
| `v-model:open` / `default-open` | `open` / `defaultOpen` |
| `@update:open-complete` | `onOpenComplete` (overlays and disclosures) |
| slot props (`checked`, `open`, …) | the returned refs |
| `id` on a part | `baseId` |
