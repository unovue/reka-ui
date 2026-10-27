<script lang="ts">
import type { PointerHitAreaMargins } from './utils/registry'
import type { PrimitiveProps } from '@/Primitive'
import { toRefs } from 'vue'
import { useNonce } from '@/shared/useNonce'

export interface SplitterResizeHandleProps extends PrimitiveProps {
  /** Resize handle id (unique within group); falls back to `useId` when not provided */
  id?: string
  /** Allow this much margin when determining resizable handle hit detection */
  hitAreaMargins?: PointerHitAreaMargins
  /** Tabindex for the handle */
  tabindex?: number
  /** Disable drag handle */
  disabled?: boolean
  /**
   * Will add `nonce` attribute to the style tag which can be used by Content Security Policy. <br> If omitted, inherits globally from `ConfigProvider`.
   */
  nonce?: string
}

export type PanelResizeHandleOnDragging = (isDragging: boolean) => void
export type { ResizeHandlerState } from './useSplitterResizeHandle'

export type SplitterResizeHandleEmits = {
  /** Event handler called when dragging the handler. */
  dragging: [isDragging: boolean]
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement, useId } from '@/shared'
import { injectPanelGroupContext } from './SplitterGroup.vue'
import { useSplitterResizeHandle } from './useSplitterResizeHandle'

const props = withDefaults(defineProps<SplitterResizeHandleProps>(), {
  tabindex: 0,
})
const emits = defineEmits<SplitterResizeHandleEmits>()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

const panelGroupContext = injectPanelGroupContext()
if (panelGroupContext === null) {
  throw new Error(
    'PanelResizeHandle components must be rendered within a PanelGroup container',
  )
}

const { nonce: propNonce } = toRefs(props)

const { root } = useSplitterResizeHandle(panelGroupContext, {
  id: useId(props.id, 'reka-splitter-resize-handle'),
  element: currentElement,
  disabled: () => props.disabled,
  hitAreaMargins: () => props.hitAreaMargins,
  tabindex: () => props.tabindex,
  nonce: useNonce(propNonce),
  onDragging: isDragging => emits('dragging', isDragging),
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="root.attrs.value"
  >
    <slot />
  </Primitive>
</template>
