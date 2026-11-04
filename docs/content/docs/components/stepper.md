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
      values: ['completed', 'current', 'upcoming'],
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
      values: ['completed', 'current', 'upcoming'],
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

## Real-world examples

- [Stepper Form Wizard](/examples/stepper-form-wizard): Gate each step of a multi-step form on its own validation, so Next and the step triggers stay in sync.

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

In a right-to-left layout (`dir="rtl"` on `StepperRoot`, or on a [`ConfigProvider`](/docs/utilities/config-provider)), a horizontal stepper's `ArrowLeft` moves to the next step trigger and `ArrowRight` to the previous one. A vertical stepper uses `ArrowUp` and `ArrowDown` in either direction. See [Internationalization](/docs/guides/i18n#what-changes-in-rtl).

## Headless composable

`useStepper` holds the current step (`modelValue`, `goToStep()`, `nextStep()`, `prevStep()`, `isNextDisabled`, `isPrevDisabled`) with `linear` gating, and the `root` [part surface](/docs/guides/composables#part-surfaces) with `getItem(step)` for each step's state (`completed`, `current` or `upcoming`). It registers watchers, so call it inside `setup()`. The composable is experimental; see [Headless composables](/docs/guides/composables).
