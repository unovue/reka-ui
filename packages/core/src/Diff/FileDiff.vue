<script lang="ts">
import type {
  DiffLineAnnotation,
  FileDiffMetadata,
  FileDiffOptions,
  SelectedLineRange,
} from '@pierre/diffs'
import type { PrimitiveProps } from '@/Primitive'

export interface FileDiffProps<LAnnotation = undefined> extends PrimitiveProps {
  fileDiff: FileDiffMetadata
  options?: FileDiffOptions<LAnnotation>
  lineAnnotations?: DiffLineAnnotation<LAnnotation>[]
  selectedLines?: SelectedLineRange | null
  prerenderedHTML?: string
}
</script>

<script setup lang="ts" generic="LAnnotation = undefined">
import { DIFFS_TAG_NAME, FileDiff as PierreFileDiff } from '@pierre/diffs'
import { markRaw, nextTick, onBeforeUnmount, onMounted, shallowRef, toRaw, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'

const props = withDefaults(defineProps<FileDiffProps<LAnnotation>>(), {
  as: DIFFS_TAG_NAME,
})

const { currentElement, forwardRef } = useForwardExpose()
const instance = shallowRef<PierreFileDiff<LAnnotation>>()
const hasHydrated = shallowRef(false)

function cleanUpDiff() {
  instance.value?.cleanUp()
  instance.value = undefined
  hasHydrated.value = false
}

function getInstance() {
  if (!instance.value)
    instance.value = markRaw(new PierreFileDiff(toRaw(props.options), undefined, true))

  return instance.value
}

async function renderDiff() {
  await nextTick()

  const fileContainer = currentElement.value
  if (!(fileContainer instanceof HTMLElement))
    return

  const diff = getInstance()
  diff.setOptions(toRaw(props.options))

  if (props.prerenderedHTML && !hasHydrated.value) {
    fileContainer.innerHTML = props.prerenderedHTML
    diff.hydrate({
      fileContainer,
      fileDiff: toRaw(props.fileDiff),
      lineAnnotations: toRaw(props.lineAnnotations),
      prerenderedHTML: props.prerenderedHTML,
    })
    hasHydrated.value = true
  }
  else {
    diff.render({
      fileContainer,
      fileDiff: toRaw(props.fileDiff),
      forceRender: true,
      lineAnnotations: toRaw(props.lineAnnotations),
    })
  }

  if (props.selectedLines !== undefined)
    diff.setSelectedLines(toRaw(props.selectedLines))
}

watch(currentElement, renderDiff, { flush: 'post' })
watch(() => [
  props.fileDiff,
  props.options,
  props.lineAnnotations,
  props.selectedLines,
  props.prerenderedHTML,
], renderDiff, { deep: true })

onMounted(renderDiff)
onBeforeUnmount(cleanUpDiff)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
  />
</template>
