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
      values: ['checked', 'unchecked'],
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
      cssVariable: '--reka-tabs-indicator-thickness',
      description: 'The thickness of the indicator.',
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
      values: ['checked', 'unchecked'],
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

### Manual activation

By default a tab activates as soon as its trigger gets focus, so arrow keys switch panels immediately. When a panel is expensive to render or fetches data, set `activation-mode="manual"`: the arrow keys only move focus, and Enter, Space or a click activates the focused tab.

```vue
<template>
  <TabsRoot default-value="overview" activation-mode="manual">
    <!-- ... -->
  </TabsRoot>
</template>
```

### Syncing the tab with the URL

Control the value with `v-model` and read and write it from the route, so a reload or a shared link opens the same tab.

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const tab = computed({
  get: () => {
    const tab = route.query.tab
    return (Array.isArray(tab) ? tab[0] : tab) ?? 'overview'
  },
  set: value => router.replace({ query: { ...route.query, tab: value } }),
})
</script>

<template>
  <TabsRoot v-model="tab">
    <!-- ... -->
  </TabsRoot>
</template>
```

### Default selection

An uncontrolled `TabsRoot` (no `v-model`, or one that has been `undefined` since mount) starts on its `defaultValue`, without emitting it, so a bound `v-model` stays `undefined`. Without a `defaultValue`, it selects the first enabled tab in document order, as Base UI does, and emits it. A `v-model` that has held a value stays controlled when it is cleared to `undefined`, and nothing is selected for it. It also moves to the first enabled tab when the selected one is removed or becomes disabled. These automatic selections emit `update:modelValue` with the reason `'initial'` (the first selection when there is no `defaultValue`), `'missing'` or `'disabled'`. A `defaultValue` that points at a disabled tab is kept until that tab is enabled while selected. A controlled `v-model` keeps the value its parent gives, and `null` selects no tab:

```vue
<template>
  <!-- the first enabled tab is selected -->
  <TabsRoot>
    …
  </TabsRoot>

  <!-- no tab is selected -->
  <TabsRoot :default-value="null">
    …
  </TabsRoot>
</template>
```

### Preventing a tab change

`beforeUpdate:modelValue` fires before every change, with a `details` object whose `reason` is `'trigger-press'`, `'trigger-focus'` (automatic activation), `'trigger-keydown'`, `'imperative-action'`, or one of the automatic reasons above. Call `details.cancel()` to keep the current tab, for example while a form in it has unsaved changes.

<ComponentPreview name="TabsUnsavedGuard" />

### Keeping inactive panels mounted

The panel elements of inactive tabs stay in the DOM with `hidden`, but their content unmounts. Set `:unmount-on-hide="false"` on `TabsRoot` to keep the content mounted too, so its state (form input, a playing video, a loaded iframe) survives switching tabs.

### Animated indicator

`TabsIndicator` renders inside `TabsList` and exposes the size and position of the active trigger as the `--reka-tabs-indicator-size` and `--reka-tabs-indicator-position` CSS variables. Transition them to slide an underline between tabs, as in the demo at the top of this page.

```vue
<template>
  <TabsList class="relative">
    <TabsIndicator class="absolute bottom-0 left-0 h-0.5 w-[--reka-tabs-indicator-size] translate-x-[--reka-tabs-indicator-position] bg-black transition-[width,transform]" />
    <!-- triggers -->
  </TabsList>
</template>
```

## Real-world examples

- [Command Menu with Tabs](/examples/dialog-command-tabs): A command palette whose results are scoped by Tabs, with Tab cycling scopes without leaving the search field.

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

In a right-to-left layout (`dir="rtl"` on `TabsRoot`, or on a [`ConfigProvider`](/docs/utilities/config-provider)), `ArrowLeft` moves to the next trigger and `ArrowRight` to the previous one, in a horizontal list. See [Internationalization](/docs/guides/i18n#what-changes-in-rtl).

## Headless composable

`useTabs` holds the selected value (`modelValue`, `selectTab()`), the ids and the ARIA wiring: the `root` and `list` [part surfaces](/docs/guides/composables#part-surfaces), and `getTriggerSurface(value, disabled?)` and `getContentSurface(value)` for each tab. It doesn't move focus between the triggers with the arrow keys, or mount and unmount the panels: wrap the triggers in a [`RovingFocusGroup`](/docs/utilities/roving-focus) and render the panels with `v-if` or [`Presence`](/docs/utilities/presence), or use the components. Call the surface getters in `setup()`, once per tab, not in the template. Pass a stable `baseId` when rendering on the server. The composable is experimental; see [Headless composables](/docs/guides/composables).
