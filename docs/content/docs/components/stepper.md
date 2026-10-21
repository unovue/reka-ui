---
title: Stepper
description: A set of steps that are used to indicate progress through a multi-step process.
name: stepper
---

# Stepper

<Description>
A set of steps that are used to indicate progress through a multi-step process.
</Description>

<ComponentPreview name="Stepper" />

## Features

<Highlights
  :features="[
    'Can be controlled or uncontrolled.',
    'Supports horizontal/vertical orientation.',
    'Supports linear/non-linear activation.',
    'Full keyboard navigation.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { StepperDescription, StepperIndicator, StepperItem, StepperRoot, StepperTitle, StepperTrigger } from 'reka-ui'
</script>

<template>
  <StepperRoot>
    <StepperItem>
      <StepperTrigger />
      <StepperIndicator />

      <StepperTitle />
      <StepperDescription />

      <StepperSeparator />
    </StepperItem>
  </StepperRoot>
</template>
```

## API Reference

### Root

Contains all the stepper component parts.

<!-- @include: @/meta/StepperRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
    {
      attribute: '[data-linear]',
      values: 'Present when linear'
    },
  ]"
/>

### Item

The step item component.

<!-- @include: @/meta/StepperItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['active', 'inactive', 'completed'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Trigger

The trigger that toggles the step.

<!-- @include: @/meta/StepperTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['active', 'inactive', 'completed'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Indicator

The indicator for the step.

<!-- @include: @/meta/StepperIndicator.md -->

### Title

An accessible title to be announced when the stepper trigger is focused.

If you want to hide the title, wrap it inside our Visually Hidden utility like this `<VisuallyHidden asChild>`.

<!-- @include: @/meta/StepperTitle.md -->

### Description

An optional accessible description to be announced when the stepper trigger is focused.

If you want to hide the description, wrap it inside our Visually Hidden utility like this `<VisuallyHidden asChild>`. If you want to remove the description entirely, remove this part and pass `aria-describedby="undefined"` to `StepperTrigger`.

<!-- @include: @/meta/StepperItem.md -->

## Examples

### Vertical

You can create vertical steps by using the `orientation` prop.

```vue line=8
<script setup>
import { StepperDescription, StepperIndicator, StepperItem, StepperRoot, StepperTitle } from 'reka-ui'
</script>

<template>
  <StepperRoot
    :default-value="1"
    orientation="vertical"
  >
    <StepperItem>
      <StepperIndicator />
      <StepperTitle />
      <StepperDescription />
    </StepperItem>
    <StepperItem>
      <StepperIndicator />
      <StepperTitle />
      <StepperDescription />
    </StepperItem>
  </StepperRoot>
</template>
```

### With controls

You can add additional controls for the stepper using buttons and access the typed component instance using `useTemplateRef`.

```vue line=8
<script setup lang="ts">
const stepper = useTemplateRef('stepper')
</script>

<template>
  <StepperRoot
    ref="stepper"
    :default-value="1"
  >
    <StepperItem>
      <StepperIndicator />
      <StepperTitle />
      <StepperDescription />
    </StepperItem>
    <StepperItem>
      <StepperIndicator />
      <StepperTitle />
      <StepperDescription />
    </StepperItem>
  </StepperRoot>

  <div class="flex gap-2 justify-between mt-4">
    <button
      :disabled="!stepper?.hasPrev()"
      @click="stepper?.prevStep()"
    >
      Prev
    </button>

    <button
      :disabled="!stepper?.hasNext()"
      @click="stepper?.nextStep()"
    >
      Next
    </button>
  </div>
</template>
```

## Accessibility

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: '<span> When focus moves onto the steps, focuses the first step .</span>',
    },
    {
      keys: ['ArrowDown'],
      description: '<span> Moves focus to the next step depending on <Code>orientation</Code>.</span>',
    },
    {
      keys: ['ArrowRight'],
      description: '<span> Moves focus to the next step depending on <Code>orientation</Code> .</span>',
    },
    {
      keys: ['ArrowUp'],
      description: '<span> Moves focus to the previous step depending on <Code>orientation</Code> .</span>',
    },
    {
      keys: ['ArrowLeft'],
      description: '<span> Moves focus to the previous step depending on <Code>orientation</Code> .</span>',
    },
    {
    keys: ['Enter', 'Space'],
    description: '<span>Selects the focused step.</span>',
    },
  ]"
/>
