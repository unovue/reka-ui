<script lang="ts">
import type { FileContents } from '@pierre/diffs'
import type { FileDiffProps } from './FileDiff.vue'

export interface MultiFileDiffProps<LAnnotation = undefined> extends Omit<FileDiffProps<LAnnotation>, 'fileDiff'> {
  /** Previous file contents used to compute the diff. */
  oldFile: FileContents
  /** Next file contents used to compute the diff. */
  newFile: FileContents
}
</script>

<script setup lang="ts" generic="LAnnotation = undefined">
import { DIFFS_TAG_NAME, parseDiffFromFile } from '@pierre/diffs'
import { computed, toRaw } from 'vue'
import FileDiff from './FileDiff.vue'

const props = withDefaults(defineProps<MultiFileDiffProps<LAnnotation>>(), {
  as: DIFFS_TAG_NAME,
})

const fileDiff = computed(() => parseDiffFromFile(
  toRaw(props.oldFile),
  toRaw(props.newFile),
  props.options?.parseDiffOptions,
))
</script>

<template>
  <FileDiff
    :as="as"
    :as-child="asChild"
    :file-diff="fileDiff"
    :options="options"
    :line-annotations="lineAnnotations"
    :selected-lines="selectedLines"
    :prerendered-h-t-m-l="prerenderedHTML"
  >
    <slot />
  </FileDiff>
</template>
