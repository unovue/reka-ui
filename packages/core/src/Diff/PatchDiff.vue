<script lang="ts">
import type { FileDiffProps } from './FileDiff.vue'

export interface PatchDiffProps<LAnnotation = undefined> extends Omit<FileDiffProps<LAnnotation>, 'fileDiff'> {
  /** A raw unified or Git patch string containing a single file diff. */
  patch: string
}
</script>

<script setup lang="ts" generic="LAnnotation = undefined">
import { DIFFS_TAG_NAME, getSingularPatch } from '@pierre/diffs'
import { computed } from 'vue'
import FileDiff from './FileDiff.vue'

const props = withDefaults(defineProps<PatchDiffProps<LAnnotation>>(), {
  as: DIFFS_TAG_NAME,
})

const fileDiff = computed(() => getSingularPatch(props.patch))
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
