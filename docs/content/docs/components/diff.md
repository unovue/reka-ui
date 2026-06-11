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

<ComponentPreview name="Diff" />

## Choose a primitive

The Diff primitives are alternative entry points into the same Pierre renderer. Choose the component by the source data you already have.

| Primitive | Use when | Primary input |
| --- | --- | --- |
| `MultiFileDiff` | You have previous and next file contents and want Reka to compute the diff. | `oldFile`, `newFile` |
| `PatchDiff` | You already have a single-file unified or Git patch string. | `patch` |
| `FileDiff` | You have parsed Pierre `FileDiffMetadata`, or you want to render each file from a multi-file patch yourself. | `fileDiff` |
| `DiffFile` | You want Pierre file rendering without comparing two file versions. | `file` |
| `UnresolvedFile` | You have file contents with merge conflict markers and want conflict actions. | `file` or `fileDiff` |

## Features

<Highlights
  :features="[
    'Renders file diffs from parsed metadata, full file contents, or patches.',
    'Supports unified and split layouts through Pierre diff options.',
    'Supports file rendering, line selection, and line annotations.',
    'Supports unresolved merge-conflict rendering.',
    'Can hydrate server-rendered Pierre markup.',
    'Composes with custom host elements through asChild.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import the primitive that matches your source data.

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

## Pierre options

Reka's Diff primitives wrap [Pierre Diffs](https://diffs.com/docs). Pass Pierre renderer configuration through the `options` prop, and pass annotations or selected lines through the dedicated Reka props.

Common options include:

- `diffStyle`: render `unified` or `split` diffs.
- `lineDiffType`: highlight changed text by `word-alt`, `word`, `char`, or disable with `none`.
- `overflow`: choose `scroll` or `wrap` behavior for long lines.
- `theme` and `themeType`: control Shiki themes and light/dark behavior.
- `unsafeCSS`: style Pierre's shadow DOM when a product or docs page needs local design-system tokens.
- `hunkSeparators`, `expandUnchanged`, and `collapsedContextThreshold`: tune hunk context rendering.
- `renderHeaderPrefix`, `renderHeaderMetadata`, and `renderCustomHeader`: customize file headers.
- `renderAnnotation` and `renderGutterUtility`: inject review UI around rendered lines.

Keep file and patch data in stable variables when possible. Pierre uses object identity to avoid unnecessary rerenders, then updates syntax highlighting asynchronously as renderer work completes.

## API Reference

`FileDiff`, `MultiFileDiff`, and `PatchDiff` share the same Pierre-backed configuration surface for layout, theming, line selection, annotations, headers, and interaction hooks. `DiffFile` uses the file-rendering subset, and `UnresolvedFile` adds merge conflict state and events.

### DiffFile

Renders a single file without computing a diff.

<!-- @include: @/meta/DiffFile.md -->

### FileDiff

Renders parsed Pierre file diff metadata.

<!-- @include: @/meta/FileDiff.md -->

### MultiFileDiff

Computes and renders a diff from previous and next file contents.

<!-- @include: @/meta/MultiFileDiff.md -->

### PatchDiff

Parses and renders a single-file patch string.

<!-- @include: @/meta/PatchDiff.md -->

### UnresolvedFile

Renders a file that still contains merge conflict markers.

<!-- @include: @/meta/UnresolvedFile.md -->

## Examples

These examples mirror Pierre's main workflows while using the Reka Vue wrappers.

### MultiFileDiff

Use `MultiFileDiff` when you have both versions of a file and want Reka to compute the diff. Pass Pierre options through the `options` prop.

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
    :options="{
      diffStyle: 'unified',
      hunkSeparators: 'line-info-basic',
      lineDiffType: 'word',
    }"
  />
</template>
```

### Split layout with MultiFileDiff

Set `diffStyle` to `split` to render old and new lines side by side.

```vue
<template>
  <MultiFileDiff
    :old-file="oldFile"
    :new-file="newFile"
    :options="{ diffStyle: 'split' }"
  />
</template>
```

### PatchDiff

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

### FileDiff

Use `FileDiff` when you want to parse patches yourself or render several files from one patch.

```vue
<script setup lang="ts">
import { parsePatchFiles } from '@pierre/diffs'
import { FileDiff } from 'reka-ui'

const patch = `diff --git a/app.ts b/app.ts
index 0000000..1111111 100644
--- a/app.ts
+++ b/app.ts
@@ -1 +1 @@
-const message = "old"
+const message = "new"
`

const fileDiffs = parsePatchFiles(patch).flatMap(parsed => parsed.files)
</script>

<template>
  <FileDiff
    v-for="fileDiff in fileDiffs"
    :key="fileDiff.name"
    :file-diff="fileDiff"
  />
</template>
```

### DiffFile

Use `DiffFile` when you need Pierre file rendering, line numbers, theming, annotations, and selection without diffing two file versions.

```vue
<script setup lang="ts">
import { DiffFile } from 'reka-ui'

const file = {
  name: 'app.ts',
  contents: 'const message = "hello"\n',
}
</script>

<template>
  <DiffFile :file="file" />
</template>
```

### Annotating and selecting lines

Line annotations are passed as data, while `options.renderAnnotation` controls the rendered annotation UI.

```vue
<script setup lang="ts">
import type { DiffLineAnnotation, FileDiffOptions } from '@pierre/diffs'
import { MultiFileDiff } from 'reka-ui'

interface ReviewNote {
  body: string
}

const lineAnnotations: DiffLineAnnotation<ReviewNote>[] = [
  {
    side: 'additions',
    lineNumber: 2,
    metadata: { body: 'This line is covered by the new test.' },
  },
]

const options: FileDiffOptions<ReviewNote> = {
  diffStyle: 'unified',
  renderAnnotation(annotation) {
    const element = document.createElement('div')
    element.textContent = annotation.metadata.body
    element.style.padding = '8px 12px'
    return element
  },
}
</script>

<template>
  <MultiFileDiff
    :old-file="oldFile"
    :new-file="newFile"
    :line-annotations="lineAnnotations"
    :selected-lines="{ start: 2, end: 2, side: 'additions' }"
    :options="options"
  />
</template>
```

### UnresolvedFile

Use `UnresolvedFile` when a file still contains merge conflict markers. Pierre can render default conflict actions and emit the resolved file.

```vue
<script setup lang="ts">
import type { FileContents, MergeConflictActionPayload } from '@pierre/diffs'
import { UnresolvedFile } from 'reka-ui'
import { ref } from 'vue'

const resolved = ref('')

const file: FileContents = {
  name: 'app.ts',
  contents: [
    '<<<<<<< HEAD',
    'const message = "current"',
    '=======',
    'const message = "incoming"',
    '>>>>>>> feature',
    '',
  ].join('\n'),
}

function handleResolve(file: FileContents, payload: MergeConflictActionPayload) {
  resolved.value = `${payload.resolution}: ${file.contents}`
}
</script>

<template>
  <UnresolvedFile
    :file="file"
    :options="{ mergeConflictActionsType: 'default' }"
    @merge-conflict-resolve="handleResolve"
  />
</template>
```

### Composing the host element

Use `asChild` when the Pierre host needs to be your own element.

```vue
<template>
  <MultiFileDiff
    as-child
    :old-file="oldFile"
    :new-file="newFile"
  >
    <section class="rounded-lg border" />
  </MultiFileDiff>
</template>
```
