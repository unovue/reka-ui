---

title: Tabs
description: A set of layered sections of content—known as tab panels—that are displayed one at a time.
name: tabs
aria: https://www.w3.org/WAI/ARIA/apg/patterns/tabpanel
---

# Tabs

<Description>
A set of layered sections of content—known as tab panels—that are displayed one at a time.
</Description>

<ComponentPreview name="Tabs" />

## Features

<Highlights
  :features="[
    'Can be controlled or uncontrolled.',
    'Supports horizontal/vertical orientation.',
    'Supports automatic/manual activation.',
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
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
</script>

<template>
  <TabsRoot>
    <TabsList>
      <TabsIndicator />
      <TabsTrigger />
    </TabsList>
    <TabsContent />
  </TabsRoot>
</template>
```

## API Reference

### Root

Contains all the tabs component parts.

<!-- @include: @/meta/TabsRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### List

Contains the triggers that are aligned along the edge of the active content.

<!-- @include: @/meta/TabsList.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Trigger

The button that activates its associated content.

<!-- @include: @/meta/TabsTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['active', 'inactive'],
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

The indicator that highlights the current active tab.

<!-- @include: @/meta/TabsIndicator.md -->

<CssVariablesTable
  :data="[
    {
      cssVariable: '--reka-tabs-indicator-size',
      description: 'The size of the indicator.',
    },
    {
      cssVariable: '--reka-tabs-indicator-position',
      description: 'The position of the indicator',
    },
  ]"
/>

### Content

Contains the content associated with each trigger.

<PresenceCallout />

<!-- @include: @/meta/TabsContent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['active', 'inactive'],
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

## Examples

### Vertical

You can create vertical tabs by using the `orientation` prop.

```vue line=8
<script setup>
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
</script>

<template>
  <TabsRoot
    default-value="tab1"
    orientation="vertical"
  >
    <TabsList aria-label="tabs example">
      <TabsTrigger value="tab1">
        One
      </TabsTrigger>
      <TabsTrigger value="tab2">
        Two
      </TabsTrigger>
      <TabsTrigger value="tab3">
        Three
      </TabsTrigger>
    </TabsList>
    <TabsContent value="tab1">
      Tab one content
    </TabsContent>
    <TabsContent value="tab2">
      Tab two content
    </TabsContent>
    <TabsContent value="tab3">
      Tab three content
    </TabsContent>
  </TabsRoot>
</template>
```

## Accessibility

Adheres to the [Tabs WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabpanel).

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: '<span> When focus moves onto the tabs, focuses the active trigger. When a trigger is focused, moves focus to the active content.</span>',
    },
    {
      keys: ['ArrowDown'],
      description: '<span> Moves focus to the next trigger depending on <Code>orientation</Code> and activates its associated content.</span>',
    },
    {
      keys: ['ArrowRight'],
      description: '<span> Moves focus to the next trigger depending on <Code>orientation</Code> and activates its associated content.</span>',
    },
    {
      keys: ['ArrowUp'],
      description: '<span> Moves focus to the previous trigger depending on <Code>orientation</Code> and activates its associated content.</span>',
    },
    {
      keys: ['ArrowLeft'],
      description: '<span> Moves focus to the previous trigger depending on <Code>orientation</Code> and activates its associated content.</span>',
    },
    {
      keys: ['Home'],
      description: '<span> Moves focus to the first trigger and activates its associated content.</span>',
    },
    {
      keys: ['End'],
      description: '<span> Moves focus to the last trigger and activates its associated content.</span>',
    },
  ]"
/>
