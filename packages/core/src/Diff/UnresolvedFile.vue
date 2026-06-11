<script lang="ts">
import type {
  FileContents,
  FileDiffMetadata,
  MergeConflictActionPayload,
  MergeConflictMarkerRow,
  SelectedLineRange,
  UnresolvedFileOptions,
  UnresolvedFileRenderProps,
} from '@pierre/diffs'
import type { PrimitiveProps } from '@/Primitive'

export interface UnresolvedFileProps<LAnnotation = undefined> extends PrimitiveProps {
  /** File contents that still contain merge conflict markers. */
  file?: FileContents
  /** Precomputed Pierre metadata for an unresolved merge-conflict diff. */
  fileDiff?: FileDiffMetadata
  /** Pierre unresolved-file options, including merge conflict action rendering and resolution callbacks. */
  options?: UnresolvedFileOptions<LAnnotation>
  /** Annotations keyed by side and rendered line number. */
  lineAnnotations?: UnresolvedFileRenderProps<LAnnotation>['lineAnnotations']
  /** Controlled merge conflict actions, typically returned by Pierre after resolving a conflict. */
  actions?: UnresolvedFileRenderProps<LAnnotation>['actions']
  /** Controlled merge conflict marker rows, typically returned by Pierre after resolving a conflict. */
  markerRows?: MergeConflictMarkerRow[]
  /** Line range to highlight as selected. */
  selectedLines?: SelectedLineRange | null
  /** Server-rendered Pierre markup to hydrate before client updates take over. */
  prerenderedHTML?: string
}

export type UnresolvedFileEmits = {
  /** Event handler called with the resolved file when a merge conflict action is applied. */
  mergeConflictResolve: [file: FileContents, payload: MergeConflictActionPayload]
  /** Event handler called when a merge conflict action is requested. */
  mergeConflictAction: [payload: MergeConflictActionPayload]
}
</script>

<script setup lang="ts" generic="LAnnotation = undefined">
import { DIFFS_TAG_NAME, UnresolvedFile as PierreUnresolvedFile } from '@pierre/diffs'
import { markRaw, nextTick, onBeforeUnmount, onMounted, shallowRef, toRaw, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'

const props = withDefaults(defineProps<UnresolvedFileProps<LAnnotation>>(), {
  as: DIFFS_TAG_NAME,
})
const emits = defineEmits<UnresolvedFileEmits>()

const { currentElement, forwardRef } = useForwardExpose()
const instance = shallowRef<PierreUnresolvedFile<LAnnotation>>()
const hasHydrated = shallowRef(false)

function getOptions(): UnresolvedFileOptions<LAnnotation> | undefined {
  const options = toRaw(props.options)

  if (options?.onMergeConflictAction) {
    return {
      ...options,
      onMergeConflictAction(payload, unresolvedFile) {
        emits('mergeConflictAction', payload)
        options.onMergeConflictAction?.(payload, unresolvedFile)
      },
    }
  }

  return {
    ...options,
    onMergeConflictResolve(file, payload) {
      emits('mergeConflictResolve', file, payload)
      options?.onMergeConflictResolve?.(file, payload)
    },
  }
}

function cleanUpFile() {
  instance.value?.cleanUp()
  instance.value = undefined
  hasHydrated.value = false
}

function getInstance() {
  if (!instance.value)
    instance.value = markRaw(new PierreUnresolvedFile(getOptions(), undefined, true))

  return instance.value
}

async function renderFile() {
  await nextTick()

  const fileContainer = currentElement.value
  if (!(fileContainer instanceof HTMLElement))
    return

  const unresolvedFile = getInstance()
  unresolvedFile.setOptions(getOptions())

  if (props.prerenderedHTML && !hasHydrated.value) {
    fileContainer.innerHTML = props.prerenderedHTML
    unresolvedFile.hydrate({
      actions: toRaw(props.actions),
      file: toRaw(props.file),
      fileContainer,
      fileDiff: toRaw(props.fileDiff),
      lineAnnotations: toRaw(props.lineAnnotations),
      markerRows: toRaw(props.markerRows),
      prerenderedHTML: props.prerenderedHTML,
    })
    hasHydrated.value = true
  }
  else {
    unresolvedFile.render({
      actions: toRaw(props.actions),
      file: toRaw(props.file),
      fileContainer,
      fileDiff: toRaw(props.fileDiff),
      forceRender: true,
      lineAnnotations: toRaw(props.lineAnnotations),
      markerRows: toRaw(props.markerRows),
    })
  }

  if (props.selectedLines !== undefined)
    unresolvedFile.setSelectedLines(toRaw(props.selectedLines))
}

watch(currentElement, renderFile, { flush: 'post' })
watch(() => [
  props.file,
  props.fileDiff,
  props.options,
  props.lineAnnotations,
  props.actions,
  props.markerRows,
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
    :as-child="asChild"
  >
    <slot />
  </Primitive>
</template>
