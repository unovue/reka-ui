<script lang="ts">
import type {
  FileTreeDensity,
  FileTreeInitialExpansion,
  FileTreeOptions,
  FileTreePreparedInput,
  FileTreeSortComparator,
  GitStatusEntry,
  FileTree as PierreFileTree,
} from '@pierre/trees'
import type { PrimitiveProps } from '@/Primitive'

export interface TreePathRootProps extends PrimitiveProps {
  /** The controlled selected paths of the tree. Can be binded with `v-model`. */
  modelValue?: string[]
  /** The selected paths when initially rendered. Use when you do not need to control the selection state. */
  defaultValue?: string[]
  /** List of canonical paths rendered by the tree. */
  paths?: readonly string[]
  /** Prepared path input from `prepareFileTreeInput` or `preparePresortedFileTreeInput`. */
  preparedInput?: FileTreePreparedInput
  /** Controls the initial expansion behavior for path mode. */
  initialExpansion?: FileTreeInitialExpansion
  /** Expanded paths used when the Pierre tree is initially created. */
  expanded?: string[]
  /** Expanded paths used when the Pierre tree is initially created. */
  defaultExpanded?: string[]
  /** Whether empty directories should be collapsed into their visible descendants. */
  flattenEmptyDirectories?: boolean
  /** Whether the provided paths are already sorted. */
  presorted?: boolean
  /** Custom path sorting strategy. */
  sort?: 'default' | FileTreeSortComparator
  /** Enables built-in search UI. */
  search?: boolean
  /** Built-in density preset or density factor. */
  density?: FileTreeDensity
  /** Git status entries shown alongside file paths. */
  gitStatus?: readonly GitStatusEntry[]
  /** Estimated item height in pixels. */
  itemHeight?: number
  /** Number of rows rendered outside the visible area. */
  overscan?: number
  /** Whether parent folders remain visible while scrolling descendants. */
  stickyFolders?: boolean
  /** Raw CSS injected into the Pierre tree shadow root. */
  unsafeCSS?: string
}

export type TreePathRootEmits = {
  'update:modelValue': [value: string[]]
}
</script>

<script setup lang="ts">
import { FileTree } from '@pierre/trees'
import { useVModel } from '@vueuse/core'
import { computed, markRaw, onBeforeUnmount, onMounted, shallowRef, toRefs, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'

const props = withDefaults(defineProps<TreePathRootProps>(), {
  as: 'div',
})
const emits = defineEmits<TreePathRootEmits>()

const { currentElement, forwardRef } = useForwardExpose()
const { modelValue } = toRefs(props)
const selectedPaths = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue ?? [],
  passive: (modelValue.value === undefined) as false,
  deep: true,
})

const fileTree = shallowRef<PierreFileTree>()
const initialExpandedPaths = computed(() => props.expanded ?? props.defaultExpanded)

function createOptions(): FileTreeOptions {
  return {
    paths: props.paths ?? [],
    preparedInput: props.preparedInput,
    initialSelectedPaths: selectedPaths.value ?? [],
    initialExpandedPaths: initialExpandedPaths.value,
    initialExpansion: props.initialExpansion,
    flattenEmptyDirectories: props.flattenEmptyDirectories,
    presorted: props.presorted,
    sort: props.sort,
    search: props.search,
    density: props.density,
    gitStatus: props.gitStatus,
    itemHeight: props.itemHeight,
    overscan: props.overscan,
    stickyFolders: props.stickyFolders,
    unsafeCSS: props.unsafeCSS,
    onSelectionChange(paths) {
      selectedPaths.value = [...paths]
    },
  }
}

function cleanUpTree() {
  fileTree.value?.cleanUp()
  fileTree.value = undefined
}

function renderTree() {
  const container = currentElement.value
  if (!(container instanceof HTMLElement))
    return

  cleanUpTree()
  container.textContent = ''

  const tree = new FileTree(createOptions())
  fileTree.value = markRaw(tree)
  tree.render({ containerWrapper: container })
}

function syncSelectedPaths() {
  const tree = fileTree.value
  if (!tree)
    return

  const nextSelection = new Set(selectedPaths.value ?? [])
  const currentSelection = tree.getSelectedPaths()
  for (const path of currentSelection) {
    if (!nextSelection.has(path))
      tree.getItem(path)?.deselect()
  }

  const refreshedSelection = new Set(tree.getSelectedPaths())
  for (const path of nextSelection) {
    if (!refreshedSelection.has(path))
      tree.getItem(path)?.select()
  }
}

watch(currentElement, renderTree, { flush: 'post' })
onMounted(renderTree)

watch(
  () => [
    props.paths,
    props.preparedInput,
    props.initialExpansion,
    props.expanded,
    props.defaultExpanded,
    props.flattenEmptyDirectories,
    props.presorted,
    props.sort,
    props.search,
    props.density,
    props.itemHeight,
    props.overscan,
    props.stickyFolders,
    props.unsafeCSS,
  ],
  renderTree,
  { deep: true },
)

watch(() => props.gitStatus, (gitStatus) => {
  fileTree.value?.setGitStatus(gitStatus)
}, { deep: true })

watch(selectedPaths, syncSelectedPaths, { deep: true })

onBeforeUnmount(cleanUpTree)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
  />
</template>
