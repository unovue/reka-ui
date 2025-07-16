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
