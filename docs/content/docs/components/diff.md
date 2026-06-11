---
title: Diff
description: Code and file diff rendering primitives backed by Pierre Diffs.
name: diff
---

# Diff

<Badge>Alpha</Badge>

<Description>
Code and file diff rendering primitives backed by Pierre Diffs.
</Description>

## Features

<Highlights
  :features="[
    'Renders file diffs from parsed metadata, full file contents, or patches.',
    'Supports unified and split diff layouts through Pierre options.',
    'Supports file rendering, line selection, and line annotations.',
    'Supports unresolved merge-conflict rendering.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import the primitive that matches your input.

```vue
<script setup>
import { DiffFile, FileDiff, MultiFileDiff, PatchDiff, UnresolvedFile } from 'reka-ui'
</script>

<template>
  <DiffFile />
  <FileDiff />
  <MultiFileDiff />
  <PatchDiff />
  <UnresolvedFile />
</template>
```

## Examples

### Rendering from files

Use `MultiFileDiff` when you have the before and after file contents.

```vue
<script setup lang="ts">
import { MultiFileDiff } from 'reka-ui'

const oldFile = {
  name: 'app.ts',
  contents: 'const message = "old"\n',
}

const newFile = {
  name: 'app.ts',
  contents: 'const message = "new"\n',
}
</script>

<template>
  <MultiFileDiff
    :old-file="oldFile"
    :new-file="newFile"
    :options="{ diffStyle: 'unified' }"
  />
</template>
```

### Rendering from a patch

Use `PatchDiff` when you already have a patch string.

```vue
<script setup lang="ts">
import { PatchDiff } from 'reka-ui'

const patch = `diff --git a/app.ts b/app.ts
index 0000000..1111111 100644
--- a/app.ts
+++ b/app.ts
@@ -1 +1 @@
-const message = "old"
+const message = "new"
`
</script>

<template>
  <PatchDiff :patch="patch" />
</template>
```
