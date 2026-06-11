<script lang="ts">
import type {
  FileContents,
  FileOptions,
  LineAnnotation,
  SelectedLineRange,
} from '@pierre/diffs'
import type { PrimitiveProps } from '@/Primitive'

export interface DiffFileProps<LAnnotation = undefined> extends PrimitiveProps {
  file: FileContents
  options?: FileOptions<LAnnotation>
  lineAnnotations?: LineAnnotation<LAnnotation>[]
  selectedLines?: SelectedLineRange | null
  prerenderedHTML?: string
}
</script>

<script setup lang="ts" generic="LAnnotation = undefined">
import { DIFFS_TAG_NAME, File as PierreFile } from '@pierre/diffs'
import { markRaw, nextTick, onBeforeUnmount, onMounted, shallowRef, toRaw, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'

const props = withDefaults(defineProps<DiffFileProps<LAnnotation>>(), {
  as: DIFFS_TAG_NAME,
})

const { currentElement, forwardRef } = useForwardExpose()
const instance = shallowRef<PierreFile<LAnnotation>>()
const hasHydrated = shallowRef(false)

function cleanUpFile() {
  instance.value?.cleanUp()
  instance.value = undefined
  hasHydrated.value = false
}

function getInstance() {
  if (!instance.value)
    instance.value = markRaw(new PierreFile(toRaw(props.options), undefined, true))

  return instance.value
}

async function renderFile() {
  await nextTick()

  const fileContainer = currentElement.value
  if (!(fileContainer instanceof HTMLElement))
    return

  const file = getInstance()
  file.setOptions(toRaw(props.options))

  if (props.prerenderedHTML && !hasHydrated.value) {
    fileContainer.innerHTML = props.prerenderedHTML
    file.hydrate({
      fileContainer,
      file: toRaw(props.file),
      lineAnnotations: toRaw(props.lineAnnotations),
      prerenderedHTML: props.prerenderedHTML,
    })
    hasHydrated.value = true
  }
  else {
    file.render({
      file: toRaw(props.file),
      fileContainer,
      forceRender: true,
      lineAnnotations: toRaw(props.lineAnnotations),
    })
  }

  if (props.selectedLines !== undefined)
    file.setSelectedLines(toRaw(props.selectedLines))
}

watch(currentElement, renderFile, { flush: 'post' })
watch(() => [
  props.file,
  props.options,
  props.lineAnnotations,
  props.selectedLines,
  props.prerenderedHTML,
], renderFile, { deep: true })

onMounted(renderFile)
onBeforeUnmount(cleanUpFile)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
  />
</template>
