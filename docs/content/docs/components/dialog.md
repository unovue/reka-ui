---

title: Dialog
description: A window overlaid on either the primary window or another dialog window, rendering the content underneath inert.
name: dialog
aria: https://www.w3.org/WAI/ARIA/apg/patterns/dialogmodal
---

# Dialog

<Description>
A window overlaid on either the primary window or another dialog window, rendering the content underneath inert.
</Description>

<ComponentPreview name="Dialog" />

## Features

<Highlights
  :features="[
    'Supports modal and non-modal modes.',
    'Focus is automatically trapped when modal.',
    'Can be controlled or uncontrolled.',
    '<span> Manages screen reader announcements with <Code>Title</Code> and<Code>Description</Code> components.</span>',
    'Esc closes the component automatically.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
</script>

<template>
  <DialogRoot>
    <DialogTrigger />
    <DialogPortal>
      <DialogOverlay />
      <DialogContent>
        <DialogTitle />
        <DialogDescription />
        <DialogClose />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a dialog

<!-- @include: @/meta/DialogRoot.md -->

### Trigger

The button that opens the dialog

<!-- @include: @/meta/DialogTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
  ]"
/>

### Portal

When used, portals your overlay and content parts into the `body`.

<!-- @include: @/meta/DialogPortal.md -->

### Overlay

A layer that covers the inert portion of the view when the dialog is open.

<PresenceCallout />

<!-- @include: @/meta/DialogOverlay.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
  ]"
/>

### Content

Contains content to be rendered in the open dialog

<PresenceCallout />

<!-- @include: @/meta/DialogContent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
  ]"
/>

### Close

The button that closes the dialog

<!-- @include: @/meta/DialogClose.md -->

### Title

An accessible title to be announced when the dialog is opened.

If you want to hide the title, wrap it inside our Visually Hidden utility like this `<VisuallyHidden asChild>`.

<!-- @include: @/meta/DialogTitle.md -->

### Description

An optional accessible description to be announced when the dialog is opened.

If you want to hide the description, wrap it inside our Visually Hidden utility like this `<VisuallyHidden asChild>`. If you want to remove the description entirely, remove this part and pass `:aria-describedby="undefined"` to `DialogContent`.

<!-- @include: @/meta/DialogDescription.md -->

## Examples

### Nested dialog

You can nest multiple layers of dialogs.

<ComponentPreview name="DialogNested" />

### Close after asynchronous form submission

Use the controlled props to programmatically close the Dialog after an async operation has completed.

```vue line=4,5,15-19,22-24
<script setup>
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTrigger } from 'reka-ui'

const wait = () => new Promise(resolve => setTimeout(resolve, 1000))
const open = ref(false)
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger>Open</DialogTrigger>
    <DialogPortal>
      <DialogOverlay />
      <DialogContent>
        <form
          @submit.prevent="
            (event) => {
              wait().then(() => (open = false));
            }
          "
        >
          <!-- some inputs -->
          <button type="submit">
            Submit
          </button>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

### Scrollable overlay

Move the content inside the overlay to render a dialog with overflow.

```vue
// index.vue
<script setup>
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTrigger } from 'reka-ui'
import './styles.css'
</script>

<template>
  <DialogRoot>
    <DialogTrigger />
    <DialogPortal>
      <DialogOverlay class="DialogOverlay">
        <DialogContent class="DialogContent">
          ...
        </DialogContent>
      </DialogOverlay>
    </DialogPortal>
  </DialogRoot>
</template>
```

```css
/* styles.css */
.DialogOverlay {
  background: rgba(0 0 0 / 0.5);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  place-items: center;
  overflow-y: auto;
}

.DialogContent {
  min-width: 300px;
  background: white;
  padding: 30px;
  border-radius: 4px;
}
```

However, there's a caveat to this approach, where user might click on the scrollbar and close the dialog unintentionally. There's no universal solution that would fix this issue for now, however you can add the following snippet to `DialogContent` to prevent closing of modal when clicking on scrollbar.

```vue
<DialogContent
  @pointer-down-outside="(event) => {
    const originalEvent = event.detail.originalEvent;
    const target = originalEvent.target as HTMLElement;
    if (originalEvent.offsetX > target.clientWidth || originalEvent.offsetY > target.clientHeight) {
      event.preventDefault();
    }
  }"
>
```

### Custom portal container

Customise the element that your dialog portals into.

```vue line=4,11,17
<script setup>
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTrigger } from 'reka-ui'

const container = ref(null)
</script>

<template>
  <div>
    <DialogRoot>
      <DialogTrigger />
      <DialogPortal to="container">
        <DialogOverlay />
        <DialogContent>...</DialogContent>
      </DialogPortal>
    </DialogRoot>

    <div ref="container" />
  </div>
</template>
```

### Disable close on Interaction outside

For example, if you have some global Toaster component that should not close the Dialog when clicking on it.

<ComponentPreview name="DialogToaster" />

### Detached triggers

A `DialogTrigger` does not have to be inside its `DialogRoot`. Create a handle with `createDialogHandle()` and pass it to the `handle` prop of the root and of any number of triggers. The triggers can live anywhere in the app, including other components and portals. Here every row of a table opens the same edit dialog with its own data, and a button opens it without a trigger through `openWithPayload()`.

The dialog returns focus to the trigger that opened it on close. Only that trigger gets `aria-expanded="true"` and `aria-controls`. Its `payload` reaches the root's default slot as `payload`, next to `activeTriggerId`. While a non-modal dialog is open, pressing another of its triggers moves it to that trigger without closing it. A modal dialog covers the other triggers, so the same press closes it instead.

```vue
<script setup lang="ts">
import { createDialogHandle, DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from 'reka-ui'

interface Project { id: number, name: string }

const projects: Project[] = [
  { id: 1, name: 'Website' },
  { id: 2, name: 'Mobile app' },
]

const editDialog = createDialogHandle<Project>()
</script>

<template>
  <table>
    <tbody>
      <tr
        v-for="project in projects"
        :key="project.id"
      >
        <td>{{ project.name }}</td>
        <td>
          <DialogTrigger
            :handle="editDialog"
            :payload="project"
          >
            Edit
          </DialogTrigger>
        </td>
      </tr>
    </tbody>
  </table>

  <button @click="editDialog.openWithPayload({ id: 0, name: 'Untitled' })">
    New project
  </button>

  <DialogRoot
    v-slot="{ payload }"
    :handle="editDialog"
  >
    <DialogPortal>
      <DialogOverlay />
      <DialogContent>
        <DialogTitle>Edit {{ payload?.name }}</DialogTitle>
        <DialogDescription>Rename the project or change its settings.</DialogDescription>
        <DialogClose>Save</DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

`handle.open(triggerId?)` opens the dialog for the trigger with that `id`, or without a trigger. `handle.openWithPayload(payload)` opens it without a trigger and with that payload. `handle.close()` closes it. `handle.isOpen` is reactive. These calls report the reason `'imperative-action'` through `beforeUpdate:open` and `update:open`, so `details.cancel()` can veto them. They do nothing while no root with the handle is mounted. When a trigger owns a change, `details.trigger` is its element.

The handle itself holds no state. The mounted root owns it, and the root and the triggers only connect to the handle after they mount. A handle created at module scope is therefore safe under SSR: nothing from one request can reach another, and every trigger renders closed on the server. Prefer creating the handle in the `<script setup>` of the component that renders the root and passing it down. Use a module-scope handle when the triggers live in unrelated parts of the app. Use one mounted root per handle: a second root that mounts with the same handle takes it over and closes the first, with a dev warning. A root or trigger kept alive by `<KeepAlive>` disconnects from the handle while it is inactive.

## Accessibility

Adheres to the [Dialog WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### Close icon button

When providing an icon (or font icon), remember to label it correctly for screen reader users.

```vue line=9-11
<template>
  <DialogRoot>
    <DialogTrigger />
    <DialogPortal>
      <DialogOverlay />
      <DialogContent>
        <DialogTitle />
        <DialogDescription />
        <DialogClose aria-label="Close">
          <span aria-hidden="true">×</span>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

### Close using slot props

Alternatively, you can use the `close` method provided by the `DialogRoot` slot props to programmatically close the dialog.

```vue line=4,8,16-20
<script setup>
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTrigger } from 'reka-ui'
</script>

<template>
  <DialogRoot v-slot="{ close }">
    <DialogTrigger>Open</DialogTrigger>
    <DialogPortal>
      <DialogOverlay />
      <DialogContent>
        <form>
          <!-- some inputs -->
          <button type="submit" @click="close">
            Submit
          </button>
        </form>
      </DialogContent>
      <DialogFooter>
        <button type="submit" @click="close">
          Submit
        </button>
      </DialogFooter>
    </DialogPortal>
  </DialogRoot>
</template>
```

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: 'Opens/closes the dialog',
    },
    {
      keys: ['Enter'],
      description: 'Opens/closes the dialog',
    },
    {
      keys: ['Tab'],
      description: 'Moves focus to the next focusable element.',
    },
    {
      keys: ['Shift + Tab'],
      description: 'Moves focus to the previous focusable element.',
    },
    {
      keys: ['Esc'],
      description: '<span>Closes the dialog and moves focus to <Code>DialogTrigger</Code>.</span>',
    },
  ]"
/>

## Custom APIs

Create your own API by abstracting the primitive parts into your own component.

### Abstract the overlay and the close button

This example abstracts the `DialogOverlay` and `DialogClose` parts.

#### Usage

```vue
<script setup>
import { Dialog, DialogContent, DialogTrigger } from './your-dialog'
</script>

<template>
  <Dialog>
    <DialogTrigger>Dialog trigger</DialogTrigger>
    <DialogContent>Dialog Content</DialogContent>
  </Dialog>
</template>
```

#### Implementation

```ts
// your-dialog.ts
export { default as DialogContent } from 'DialogContent.vue'
export { DialogRoot as Dialog, DialogTrigger } from 'reka-ui'
```

```vue
<!-- DialogContent.vue -->
<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
import { Cross2Icon } from '@radix-icons/vue'
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<DialogContentProps>()
const emits = defineEmits<DialogContentEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent v-bind="forwarded">
      <slot />

      <DialogClose>
        <Cross2Icon />
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
```
