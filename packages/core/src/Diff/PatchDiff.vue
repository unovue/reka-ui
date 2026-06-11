<script lang="ts">
import type { FileDiffProps } from './FileDiff.vue'

export interface PatchDiffProps<LAnnotation = undefined> extends Omit<FileDiffProps<LAnnotation>, 'fileDiff'> {
  patch: string
}
</script>

<script setup lang="ts" generic="LAnnotation = undefined">
import { getSingularPatch } from '@pierre/diffs'
import { computed } from 'vue'
import FileDiff from './FileDiff.vue'

const props = defineProps<PatchDiffProps<LAnnotation>>()

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
