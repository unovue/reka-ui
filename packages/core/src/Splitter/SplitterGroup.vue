<script lang="ts">
import type { CSSProperties, Ref } from 'vue'
import type { PanelConstraints, PanelData } from './SplitterPanel.vue'
import type { SplitterLayoutChangeReason } from './useSplitter'
import type { Direction, DragState, ResizeEvent, ResizeHandler } from './utils/types'
import type { PrimitiveProps } from '@/Primitive'
import type { ChangeEventDetails } from '@/shared'
import { createContext, useDirection, useForwardElement, useId } from '@/shared'

export interface SplitterGroupProps extends PrimitiveProps {
  /** Group id; falls back to `useId` when not provided. */
  id?: string | null
  /** Unique id used to auto-save group arrangement via `localStorage`. Ignored while `layout` is controlled. */
  autoSaveId?: string | null
  /** The group orientation of splitter. */
  direction: Direction
  /** Step size when arrow key was pressed. */
  keyboardResizeBy?: number | null
  /** Custom storage API; defaults to localStorage */
  storage?: PanelGroupStorage
  /**
   * The controlled layout: one size per panel, in each panel's `sizeUnit` (the
   * values `@layout` reports). Can be bound as `v-model:layout`. A layout the
   * constraints reject is applied as corrected and the correction emitted; an
   * array whose length differs from the panel count is ignored.
   */
  layout?: number[]
}

export type SplitterGroupEmits = {
  /** Event handler called when group layout changes */
  'layout': [val: number[]]
  /** Event handler called before a `drag`, `keyboard` or `imperative-action` layout change; `details.cancel()` vetoes it. Structural changes (`panel-change`, `group-resize`) skip it. */
  'beforeUpdate:layout': [value: number[], details: ChangeEventDetails<SplitterLayoutChangeReason>]
  /** Event handler called when the layout changes. */
  'update:layout': [value: number[], details: ChangeEventDetails<SplitterLayoutChangeReason>]
}

export type PanelGroupStorage = {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
}

export type PanelGroupContext = {
  direction: Ref<Direction>
  dragState: DragState | null
  groupId: string
  reevaluatePanelConstraints: (panelData: PanelData, prevConstraints: PanelConstraints) => void
  registerPanel: (panelData: PanelData) => void
  registerResizeHandle: (dragHandleId: string) => ResizeHandler
  resizePanel: (panelData: PanelData, size: number) => void
  startDragging: (dragHandleId: string, event: ResizeEvent) => void
  stopDragging: () => void
  unregisterPanel: (panelData: PanelData) => void
  panelGroupElement: Ref<ParentNode | null>

  // Exposed function for child component
  collapsePanel: (panelData: PanelData) => void
  expandPanel: (panelData: PanelData) => void
  isPanelCollapsed: (panelData: PanelData) => boolean
  isPanelExpanded: (panelData: PanelData) => boolean
  getPanelSize: (panelData: PanelData) => number
  getPanelStyle: (panelData: PanelData, defaultSize: number | undefined) => CSSProperties
}

export const [injectPanelGroupContext, providePanelGroupContext] = createContext<PanelGroupContext>('PanelGroup')
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { defaultStorage, useSplitter } from './useSplitter'

const props = withDefaults(defineProps<SplitterGroupProps>(), {
  autoSaveId: null,
  keyboardResizeBy: 10,
  storage: () => defaultStorage,
  layout: undefined,
})
const emits = defineEmits<SplitterGroupEmits>()

defineSlots<{
  default?: (props: {
    /** Current size of layout */
    layout: typeof layout.value
  }) => any
}>()

const dir = useDirection()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

const { layout, root, context } = useSplitter({
  id: useId(props.id, 'reka-splitter-group'),
  direction: () => props.direction,
  autoSaveId: () => props.autoSaveId,
  keyboardResizeBy: () => props.keyboardResizeBy,
  storage: () => props.storage,
  dir,
  element: currentElement,
  layout: () => props.layout,
  emit: emits,
  onLayout: value => emits('layout', value),
})

providePanelGroupContext(context)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="root.attrs.value"
  >
    <slot :layout="layout" />
  </Primitive>
</template>
