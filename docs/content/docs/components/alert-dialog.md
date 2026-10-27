---
title: Alert Dialog
description: A modal dialog that interrupts the user with important content and expects a response.
name: alert-dialog
aria: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog
---

# Alert Dialog

<Description>
A modal dialog that interrupts the user with important content and expects a
response.
</Description>

<ComponentPreview name="AlertDialog" />

## Features

<Highlights
  :features="[
    'Focus is automatically trapped.',
    'Can be controlled or uncontrolled.',
    'Manages screen reader announcements with <code>Title</code> and <code>Description</code> components.',
    'Esc closes the component automatically.'
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup lang="ts">
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'reka-ui'
</script>

<template>
  <AlertDialogRoot>
    <AlertDialogTrigger />
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogContent>
        <AlertDialogTitle />
        <AlertDialogDescription />
        <AlertDialogCancel />
        <AlertDialogAction />
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
```

## API Reference

### Root

Contains all the parts of an alert dialog.

<!-- @include: @/meta/AlertDialogRoot.md -->

### Trigger

A button that opens the dialog.

<!-- @include: @/meta/AlertDialogTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    }
  ]"
/>

### Portal

When used, portals your overlay and content parts into the <code>body</code>.

<!-- @include: @/meta/AlertDialogPortal.md -->

### Overlay

A layer that covers the inert portion of the view when the dialog is open.

<!-- @include: @/meta/AlertDialogOverlay.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
      }
    ]"
/>

### Content

Contains content to be rendered when the dialog is open.

<!-- @include: @/meta/AlertDialogContent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    }
  ]"
/>

### Cancel

A button that closes the dialog. This button should be distinguished visually from `AlertDialogAction` buttons.

<!-- @include: @/meta/AlertDialogCancel.md -->

### Action

A button that closes the dialog. These buttons should be distinguished visually from the `AlertDialogCancel` button.

<!-- @include: @/meta/AlertDialogAction.md -->

### Title

An accessible name to be announced when the dialog is opened. Alternatively, you can provide `aria-label` or `aria-labelledby` to `AlertDialogContent` and exclude this component.

<!-- @include: @/meta/AlertDialogTitle.md -->

### Description

An accessible description to be announced when the dialog is opened. Alternatively, you can provide `aria-describedby` to `AlertDialogContent` and exclude this component.

<!-- @include: @/meta/AlertDialogDescription.md -->

## Examples

### Close after asynchronous form submission

Use the controlled props to programmatically close the Alert Dialog after an async operation has completed.

```vue line=14,15,19,25-29
<script setup>
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'reka-ui'

const wait = () => new Promise(resolve => setTimeout(resolve, 1000))
const open = ref(false)
</script>

<template>
  <AlertDialogRoot v-model:open="open">
    <AlertDialogTrigger>Open</AlertDialogTrigger>
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogContent>
        <form
          @submit.prevent="
            (event) => {
              wait().then(() => open = false);
            }
          "
        >
          <!-- some inputs -->
          <button type="submit">
            Submit
          </button>
        </form>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
```

<br />

### Custom portal container

Customise the element that your alert dialog portals into.

```vue line=4,17
<script setup>
import { ref } from 'vue'

const container = ref(null)
</script>

<template>
  <div>
    <AlertDialogRoot>
      <AlertDialogTrigger />
      <AlertDialogPortal :to="container">
        <AlertDialogOverlay />
        <AlertDialogContent>...</AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>

    <div ref="container" />
  </div>
</template>
```

### Detached triggers

An `AlertDialogTrigger` does not have to be inside its `AlertDialogRoot`. Create a handle with `createAlertDialogHandle()` and pass it to the `handle` prop of the root and of any number of triggers. The triggers can live anywhere in the app, including other components and portals. Here every file opens the same confirmation with its own data.

The alert dialog returns focus to the trigger that opened it on close. Only that trigger gets `aria-expanded="true"` and `aria-controls`. Its `payload` reaches the root's default slot as `payload`, next to `activeTriggerId`.

Deleting a file also removes the trigger that focus would return to, so the example moves focus to the list in `@close-auto-focus` instead of letting it fall to `<body>`.

`createAlertDialogHandle()` returns an `AlertDialogHandle`. It has the same API as a `DialogHandle` but is a separate type, so a handle from `createDialogHandle()` cannot be passed to the AlertDialog parts by mistake.

```vue
<script setup lang="ts">
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogOverlay, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle, AlertDialogTrigger, createAlertDialogHandle } from 'reka-ui'
import { ref, useTemplateRef } from 'vue'

interface Attachment { id: number, name: string }

const files = ref<Attachment[]>([
  { id: 1, name: 'report.pdf' },
  { id: 2, name: 'notes.txt' },
])

const deleteDialog = createAlertDialogHandle<Attachment>()
const list = useTemplateRef('list')
let deleted = false

function remove(file?: Attachment) {
  files.value = files.value.filter(f => f.id !== file?.id)
  deleted = true
}

// The trigger that opened the dialog is gone after a delete: focus the list instead.
function onCloseAutoFocus(event: Event) {
  if (!deleted)
    return
  deleted = false
  event.preventDefault()
  list.value?.focus()
}
</script>

<template>
  <ul
    ref="list"
    tabindex="-1"
    aria-label="Attachments"
  >
    <li
      v-for="file in files"
      :key="file.id"
    >
      {{ file.name }}
      <AlertDialogTrigger
        :handle="deleteDialog"
        :payload="file"
      >
        Delete
      </AlertDialogTrigger>
    </li>
  </ul>

  <AlertDialogRoot
    v-slot="{ payload }"
    :handle="deleteDialog"
  >
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogContent @close-auto-focus="onCloseAutoFocus">
        <AlertDialogTitle>Delete {{ payload?.name }}?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction @click="remove(payload)">
          Delete
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
```

`handle.open(triggerId?)` opens the alert dialog for the trigger with that `id`, or without a trigger. `handle.openWithPayload(payload)` opens it without a trigger and with that payload. `handle.close()` closes it. `handle.isOpen` is reactive. These calls report the reason `'imperative-action'` through `beforeUpdate:open` and `update:open`, so `details.cancel()` can veto them. They do nothing while no root with the handle is mounted. When a trigger owns a change, `details.trigger` is its element.

The handle itself holds no state. The mounted root owns it, and the root and the triggers only connect to the handle after they mount. A handle created at module scope is therefore safe under SSR: nothing from one request can reach another, and every trigger renders closed on the server. Prefer creating the handle in the `<script setup>` of the component that renders the root and passing it down. Use a module-scope handle when the triggers live in unrelated parts of the app. Use one mounted root per handle: a second root that mounts with the same handle takes it over and closes the first, with a dev warning. A root or trigger kept alive by `<KeepAlive>` disconnects from the handle while it is inactive.

## Accessibility

Adheres to the [Alert and Message Dialogs WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog).

### Keyboard Interactions

<KeyboardTable :data="[{
keys: ['Space'],
description: 'Opens/closes the dialog.',
},{
keys: ['Enter'],
description: 'Opens/closes the dialog.',
},{
keys: ['Tab'],
description: 'Moves focus to the next focusable element.',
},{
keys: ['Shift + Tab'],
description: 'Moves focus to the previous focusable element.',
},{
keys: ['Esc'],
description: 'Closes the dialog and moves focus to <Code>AlertDialogTrigger</code>.',
}]" />
