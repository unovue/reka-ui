---

title: Tree
description: A Pierre-backed file tree widget for rendering selectable, virtualized path hierarchies.
name: tree
aria: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
---

# Tree

<Badge>Alpha</Badge>

<Description>
A Pierre-backed file tree widget for rendering selectable, virtualized path hierarchies.
</Description>

<ComponentPreview name="Tree" />

## Features

<Highlights
  :features="[
    'Renders through @pierre/trees.',
    'Uses canonical file paths as public state.',
    'Can be controlled or uncontrolled.',
    'Supports prepared input for large trees.',
    'Supports built-in search.',
    'Supports git status and row decoration lanes.',
    'Virtualizes rows by default.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import the root and pass paths.

```vue
<script setup>
import { TreeRoot } from 'reka-ui'
</script>

<template>
  <TreeRoot :paths="paths" />
</template>
```

## API Reference

### Root

Contains the Pierre file tree.

<!-- @include: @/meta/TreeRoot.md -->

## Examples

### File paths

Pass canonical paths to render a file tree. `v-model` receives selected path strings.

```vue
<script setup lang="ts">
import { TreeRoot } from 'reka-ui'
import { ref } from 'vue'

const selectedPaths = ref<string[]>([])

const paths = [
  'README.md',
  'src/App.vue',
  'src/components/Button.vue',
  'src/composables/useAuth.ts',
]
</script>

<template>
  <TreeRoot
    v-model="selectedPaths"
    :paths="paths"
    initial-expansion="open"
    search
    style="height: 320px"
  />
</template>
```

### Prepared input

Prepare large path lists once, then pass the prepared value to `TreeRoot`.

```vue
<script setup lang="ts">
import { prepareFileTreeInput, TreeRoot } from 'reka-ui'

const paths = [
  'README.md',
  'packages/core/src/index.ts',
  'packages/core/src/Tree/TreeRoot.vue',
]

const preparedInput = prepareFileTreeInput(paths)
</script>

<template>
  <TreeRoot
    :prepared-input="preparedInput"
    initial-expansion="open"
    style="height: 320px"
  />
</template>
```

### Git status

Pass Pierre git status entries to render file status affordances beside rows.

```vue
<script setup lang="ts">
import type { GitStatusEntry } from 'reka-ui'
import { TreeRoot } from 'reka-ui'

const paths = [
  'README.md',
  'src/App.vue',
  'src/components/Button.vue',
]

const gitStatus: GitStatusEntry[] = [
  { path: 'src/App.vue', status: 'modified' },
  { path: 'src/components/Button.vue', status: 'added' },
]
</script>

<template>
  <TreeRoot
    :paths="paths"
    :git-status="gitStatus"
    initial-expansion="open"
    style="height: 320px"
  />
</template>
```

### Item adapter

For migration, `items`, `getKey`, and `getChildren` are converted to canonical paths before being passed to Pierre. Prefer `paths` for new code.

```vue
<script setup lang="ts">
import { TreeRoot } from 'reka-ui'

const items = [
  {
    title: 'src',
    children: [
      { title: 'App.vue' },
      { title: 'components/Button.vue' },
    ],
  },
]
</script>

<template>
  <TreeRoot
    :items="items"
    :get-key="(item) => item.title"
    initial-expansion="open"
    style="height: 320px"
  />
</template>
```

## Accessibility

Adheres to the [Tree WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Enter', 'Space'],
      description: 'Selects the focused row.',
    },
    {
      keys: ['ArrowDown'],
      description: 'Moves focus to the next row.',
    },
    {
      keys: ['ArrowUp'],
      description: 'Moves focus to the previous row.',
    },
    {
      keys: ['ArrowRight'],
      description: 'Opens a closed directory row. When already open, moves focus to the first child row.',
    },
    {
      keys: ['ArrowLeft'],
      description: 'Closes an open directory row. When focused on a child row, moves focus to its parent row.',
    },
    {
      keys: ['Home', 'PageUp'],
      description: 'Moves focus to the first row.',
    },
    {
      keys: ['End', 'PageDown'],
      description: 'Moves focus to the last row.',
    },
  ]"
/>
