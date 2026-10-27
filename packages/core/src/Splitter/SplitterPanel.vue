<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { mergeExpose, useForwardElement, useId } from '@/shared'

export interface SplitterPanelProps extends PrimitiveProps {
  /** The size of panel when it is collapsed; interpreted using `sizeUnit`. */
  collapsedSize?: number
  /** Should panel collapse when resized beyond its `minSize`. When `true`, it will be collapsed to `collapsedSize`. */
  collapsible?: boolean
  /** Initial size of panel, interpreted using `sizeUnit` (percent by default). */
  defaultSize?: number
  /** Panel id (unique within group); falls back to `useId` when not provided */
  id?: string
  /** The maximum allowable size of panel, interpreted using `sizeUnit`; defaults to `100` (percent). */
  maxSize?: number
  /** The minimum allowable size of panel, interpreted using `sizeUnit`; defaults to `10` (percent). */
  minSize?: number
  /** The order of panel within group; required for groups with conditionally rendered panels */
  order?: number
  /** Unit used for sizing values; `%` by default, or `px` for fixed sizing. */
  sizeUnit?: '%' | 'px'
}

export type SplitterPanelEmits = {
  /** Event handler called when panel is collapsed. */
  collapse: []
  /** Event handler called when panel is expanded. */
  expand: []
  /** Event handler called when panel is resized; size parameter is a numeric value between 1-100.  */
  resize: [size: number, prevSize: number | undefined]
}

export type PanelOnCollapse = () => void
export type PanelOnExpand = () => void
export type PanelOnResize = (
  size: number,
  prevSize: number | undefined,
) => void

export type PanelCallbacks = {
  onCollapse?: PanelOnCollapse
  onExpand?: PanelOnExpand
  onResize?: PanelOnResize
}

export type PanelConstraints = {
  collapsedSize?: number | undefined
  collapsible?: boolean | undefined
  defaultSize?: number | undefined
  /** Panel id (unique within group); falls back to useId when not provided */
  maxSize?: number | undefined
  minSize?: number | undefined
  sizeUnit?: '%' | 'px' | undefined
}

export type PanelData = {
  callbacks: PanelCallbacks
  constraints: PanelConstraints
  id: string
  idIsFromProps: boolean
  order: number | undefined
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectPanelGroupContext } from './SplitterGroup.vue'
import { useSplitterPanel } from './useSplitterPanel'

const props = defineProps<SplitterPanelProps>()
const emits = defineEmits<SplitterPanelEmits>()

defineSlots<{
  default?: (props: {
    /** Is the panel collapsed */
    isCollapsed: typeof isCollapsed.value
    /** Is the panel expanded */
    isExpanded: typeof isExpanded.value
    /** If panel is `collapsible`, collapse it fully. */
    collapse: typeof collapse
    /** If panel is currently collapsed, expand it to its most recent size. */
    expand: typeof expand
    /** Resize panel to the specified percentage (1 - 100). */
    resize: typeof resize
  }) => any
}>()

const panelGroupContext = injectPanelGroupContext()
if (panelGroupContext === null) {
  throw new Error(
    'SplitterPanel components must be rendered within a SplitterGroup container',
  )
}

const { isCollapsed, isExpanded, collapse, expand, resize, getSize, root } = useSplitterPanel(panelGroupContext, {
  id: useId(props.id, 'reka-splitter-panel'),
  idIsFromProps: props.id !== undefined,
  collapsedSize: () => props.collapsedSize,
  collapsible: () => props.collapsible,
  defaultSize: () => props.defaultSize,
  maxSize: () => props.maxSize,
  minSize: () => props.minSize,
  order: () => props.order,
  sizeUnit: () => props.sizeUnit,
  onCollapse: () => emits('collapse'),
  onExpand: () => emits('expand'),
  onResize: (size, prevSize) => emits('resize', size, prevSize),
})

const { forwardRef, expose } = useForwardElement()
defineExpose(mergeExpose(expose, {
  /** If panel is `collapsible`, collapse it fully. */
  collapse,
  /** If panel is currently collapsed, expand it to its most recent size. */
  expand,
  /** Gets the current size of the panel (in the panel's sizeUnit: percentage for '%', pixels for 'px'). */
  getSize,
  /** Resize panel to the specified size (in the panel's sizeUnit: percentage for '%', pixels for 'px'). */
  resize,
  /** Returns `true` if the panel is currently collapsed */
  isCollapsed,
  /** Returns `true` if the panel is currently not collapsed */
  isExpanded,
}))
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="root.attrs.value"
  >
    <slot
      :is-collapsed="isCollapsed"
      :is-expanded="isExpanded"
      :expand="expand"
      :collapse="collapse"
      :resize="resize"
    />
  </Primitive>
</template>
