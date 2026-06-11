<script setup lang="ts">
import type { FileContents, FileDiffOptions } from '@pierre/diffs'
import { MultiFileDiff } from 'reka-ui'
import { computed, ref } from 'vue'
import './styles.css'

const diffStyle = ref<'unified' | 'split'>('unified')
const diffStyles = ['unified', 'split'] as const

const rekaDiffStyles = `
:host {
  --diffs-font-family: var(--font-geist-mono);
  --diffs-header-font-family: var(--font-geist-sans);
  --diffs-font-size: 13px;
  --diffs-line-height: 20px;
  --diffs-light: hsl(var(--foreground));
  --diffs-dark: hsl(var(--foreground));
  --diffs-light-bg: hsl(var(--background));
  --diffs-dark-bg: hsl(var(--background));
  --diffs-addition-color: hsl(var(--primary));
  --diffs-deletion-color: hsl(var(--destructive));
  --diffs-modified-color: hsl(var(--primary));
  --diffs-bg-context-override: hsl(var(--muted) / 0.4);
  --diffs-bg-context-gutter-override: hsl(var(--muted) / 0.55);
  --diffs-bg-separator-override: hsl(var(--muted) / 0.6);
  --diffs-bg-addition-override: hsl(var(--primary) / 0.14);
  --diffs-bg-addition-number-override: hsl(var(--primary) / 0.22);
  --diffs-bg-addition-emphasis-override: hsl(var(--primary) / 0.24);
  --diffs-bg-deletion-override: hsl(var(--destructive) / 0.16);
  --diffs-bg-deletion-number-override: hsl(var(--destructive) / 0.22);
  --diffs-bg-deletion-emphasis-override: hsl(var(--destructive) / 0.26);
  --diffs-fg-number-override: hsl(var(--muted-foreground));
  --diffs-gap-style: 1px solid hsl(var(--border));
  --diffs-gap-block: 6px;
}

[data-diffs-header=default] {
  min-height: 42px;
  border-bottom: 1px solid hsl(var(--border));
  padding-inline: 12px;
}

[data-change-icon] {
  width: 14px;
  height: 14px;
}

[data-code] {
  padding-block: 8px;
}

[data-diff-span] {
  border-radius: 2px;
}
`

const oldFile: FileContents = {
  name: 'review.ts',
  contents: `export function summarizeReview(files: string[]) {
  const changed = files.length

  return {
    title: 'Ready for review',
    changed,
  }
}
`,
}

const newFile: FileContents = {
  name: 'review.ts',
  contents: `export function summarizeReview(files: string[]) {
  const changed = files.length
  const hasTests = files.some(file => file.includes('.test.'))

  return {
    title: hasTests ? 'Ready for review' : 'Needs tests',
    changed,
    hasTests,
  }
}
`,
}

const options = computed<FileDiffOptions<undefined>>(() => ({
  diffStyle: diffStyle.value,
  diffIndicators: 'classic',
  hunkSeparators: 'line-info-basic',
  lineDiffType: 'word',
  overflow: 'wrap',
  theme: 'github-dark',
  themeType: 'dark',
  unsafeCSS: rekaDiffStyles,
}))
</script>

<template>
  <div class="DiffDemo">
    <div class="DiffDemoControls">
      <button
        v-for="style in diffStyles"
        :key="style"
        type="button"
        class="DiffDemoButton"
        :class="{ 'is-active': diffStyle === style }"
        @click="diffStyle = style"
      >
        {{ style }}
      </button>
    </div>

    <MultiFileDiff
      class="DiffDemoDiff"
      :old-file="oldFile"
      :new-file="newFile"
      :options="options"
    />
  </div>
</template>
