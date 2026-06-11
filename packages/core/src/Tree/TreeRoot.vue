<script lang="ts">
import type {
  FileTreeCompositionOptions,
  FileTreeDensity,
  FileTreeInitialExpansion,
  FileTreeOptions,
  FileTreePreparedInput,
  FileTreeRowDecorationRenderer,
  FileTreeSortComparator,
  GitStatusEntry,
  FileTree as PierreFileTree,
} from '@pierre/trees'
import type { PrimitiveProps } from '@/Primitive'

export interface TreeRootProps<T = Record<string, any>> extends PrimitiveProps {
  /** The controlled selected paths of the tree. Can be bound with `v-model`. */
  modelValue?: string[]
  /** The selected paths when initially rendered. Use when you do not need to control the selection state. */
  defaultValue?: string[]
  /** List of canonical paths rendered by the tree. */
  paths?: readonly string[]
  /** Object tree input converted to canonical paths before it is passed to Pierre. Prefer `paths` for new code. */
  items?: T[]
  /** This function receives each object item and should return a stable path segment for that item. */
  getKey?: (val: T) => string
  /** This function receives each object item and should return its children. */
  getChildren?: (val: T) => T[] | undefined
  /** Prepared path input from `prepareFileTreeInput` or `preparePresortedFileTreeInput`. */
  preparedInput?: FileTreePreparedInput
  /** Controls the initial expansion behavior. */
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
  /** Pierre composition hooks for header and context menu rendering. */
  composition?: FileTreeCompositionOptions
  /** Custom row decoration renderer. */
  renderRowDecoration?: FileTreeRowDecorationRenderer
}

export type TreeRootEmits = {
  'update:modelValue': [value: string[]]
}
</script>

<script setup lang="ts" generic="T extends Record<string, any>">
import { FileTree } from '@pierre/trees'
import { useVModel } from '@vueuse/core'
import { computed, markRaw, onBeforeUnmount, onMounted, shallowRef, toRefs, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'

const props = withDefaults(defineProps<TreeRootProps<T>>(), {
  as: 'div',
  getKey: (val: T) => String(val?.value ?? val?.id ?? val?.title ?? val),
  getChildren: (val: T) => val.children,
})
const emits = defineEmits<TreeRootEmits>()

const { modelValue } = toRefs(props)
const selectedPaths = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue ?? [],
  passive: (modelValue.value === undefined) as false,
  deep: true,
})

const fileTree = shallowRef<PierreFileTree>()
defineExpose({
  fileTree,
})

const { currentElement, forwardRef } = useForwardExpose()
const initialExpandedPaths = computed(() => props.expanded ?? props.defaultExpanded)
const resolvedPaths = computed(() => props.paths ?? itemPathsFromTree(props.items ?? []))

function itemPathsFromTree(items: T[], parentPath = ''): string[] {
  return items.flatMap((item) => {
    const segment = props.getKey(item)
    const children = props.getChildren(item) ?? []
    const itemPath = parentPath ? `${parentPath}/${segment}` : segment
    const path = children.length > 0 ? `${itemPath}/` : itemPath

    return [path, ...itemPathsFromTree(children, itemPath)]
  })
}

function createOptions(): FileTreeOptions {
  return {
    paths: resolvedPaths.value,
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
    composition: props.composition,
    renderRowDecoration: props.renderRowDecoration,
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
    resolvedPaths.value,
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
    props.composition,
    props.renderRowDecoration,
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
    :as-child="asChild"
  />
</template>
