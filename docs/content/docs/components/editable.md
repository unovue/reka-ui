---
title: Editable
description: Displays an input field used for editing a single line of text, rendering as static text on load.
name: editable
---

# Editable

<Description>
Displays an input field used for editing a single line of text, rendering as static text on load. It transforms into a text input field when the edit interaction is triggered.
</Description>

<ComponentPreview name="Editable" />

## Features

<Highlights
  :features="[
    'Full keyboard navigation',
    'Can be controlled or uncontrolled',
    'Focus is fully managed'
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
  EditableArea,
  EditableCancelTrigger,
  EditableEditTrigger,
  EditableInput,
  EditablePreview,
  EditableRoot,
  EditableSubmitTrigger
} from 'reka-ui'
</script>

<template>
  <EditableRoot>
    <EditableArea>
      <EditablePreview />
      <EditableInput />
    </EditableArea>
    <EditableEditTrigger />
    <EditableSubmitTrigger />
    <EditableCancelTrigger />
  </EditableRoot>
</template>
```

## API Reference

### Root

Contains all the parts of an editable component.

<!-- @include: @/meta/EditableRoot.md -->

### Area

Contains the text parts of an editable component.

<!-- @include: @/meta/EditableArea.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-readonly]',
      values: 'Present when readonly',
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
    {
      attribute: '[data-placeholder-shown]',
      values: 'Present when preview is shown',
    },
    {
      attribute: '[data-empty]',
      values: 'Present when the input is empty',
    },
    {
      attribute: '[data-focus]',
      values: 'Present when the editable field is focused. To be deprecated in favor of [data-focused]',
    },
    {
      attribute: '[data-focused]',
      values: 'Present when the editable field is focused',
    }
  ]"
/>

### Input

Contains the input of an editable component.

<!-- @include: @/meta/EditableInput.md -->

<DataAttributesTable
:data="[
  {
    attribute: '[data-readonly]',
    values: 'Present when readonly',
  },
  {
    attribute: '[data-disabled]',
    values: 'Present when disabled',
  }
]"
/>

### Preview

Contains the preview of the editable component.

<!-- @include: @/meta/EditablePreview.md -->

### Edit Trigger

Contains the edit trigger of the editable component.

<!-- @include: @/meta/EditableEditTrigger.md -->

### Submit Trigger

Contains the submit trigger of the editable component.

<!-- @include: @/meta/EditableSubmitTrigger.md -->

### Cancel Trigger

Contains the cancel trigger of the editable component.

<!-- @include: @/meta/EditableCancelTrigger.md -->

## Examples

### Change only on submit

By default the component will submit when `blur` event triggers. We can modify the `submit-mode` prop to alter this behavior.
In this case, we want to submit only when user click on `EditableSubmitTrigger`, so we change the submit mode to `none`.

```vue line=2,8
<template>
  <EditableRoot submit-mode="none">
    <EditableArea>
      <EditablePreview />
      <EditableInput />
    </EditableArea>
    <EditableEditTrigger />
    <EditableSubmitTrigger />
    <EditableCancelTrigger />
  </EditableRoot>
</template>
```

## Accessibility

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: `<span>When focus moves onto the editable field, switches into the editable mode if the <Code>activation-mode</Code> is set to focus.</span>`
    },
    {
      keys: ['Enter'],
      description:`
      <span>
          If the <Code>submit-mode</Code> is set to <Code>enter</Code> or <Code>both</Code>, it submits the changes.
      </span>
    ` ,
    },
    {
      keys: ['Escape'],
      description:
      `
        When the focus is on the editable field, it cancels the changes.
      `
    }
  ]"
/>
