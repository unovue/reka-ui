import {
  prepareFileTreeInput as pierrePrepareFileTreeInput,
  preparePresortedFileTreeInput as pierrePreparePresortedFileTreeInput,
  themeToTreeStyles as pierreThemeToTreeStyles,
} from '@pierre/trees'

export {
  default as TreeRoot,
  type TreeRootEmits,
  type TreeRootProps,
} from './TreeRoot.vue'
export {
  type FileTreeCompositionOptions,
  type FileTreeDensity,
  type FileTreeInitialExpansion,
  type FileTreePreparedInput,
  type FileTreeRowDecorationRenderer,
  type FileTreeSortComparator,
  type GitStatusEntry,
  type TreeThemeInput,
  type TreeThemeStyles,
} from '@pierre/trees'

export const prepareFileTreeInput = pierrePrepareFileTreeInput
export const preparePresortedFileTreeInput = pierrePreparePresortedFileTreeInput
export const themeToTreeStyles = pierreThemeToTreeStyles
