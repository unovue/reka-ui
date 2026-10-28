<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import type { DataOrientation, Direction } from '@/shared/types'
import { createContext, useDirection, useForwardElement } from '@/shared'

export interface ToolbarRootProps extends PrimitiveProps {
  /** The orientation of the toolbar */
  orientation?: DataOrientation
  /** The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** When `true`, keyboard navigation will loop from last tab to first, and vice versa. */
  loop?: boolean
}

export interface ToolbarRootContext {
  orientation: Ref<DataOrientation>
  dir: Ref<Direction>
}

export const [injectToolbarRootContext, provideToolbarRootContext]
  = createContext<ToolbarRootContext>('ToolbarRoot')
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { RovingFocusGroup } from '@/RovingFocus'
import { useToolbar } from './useToolbar'

const props = withDefaults(defineProps<ToolbarRootProps>(), {
  orientation: 'horizontal',
})
// `dir` resolution (ConfigProvider-aware) stays in the shell, and so does the
// `RovingFocusGroup` wrapper (arrow-key navigation).
const dir = useDirection(() => props.dir)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const { root, context } = useToolbar({ orientation: () => props.orientation, dir })
provideToolbarRootContext(context)
</script>

<template>
  <RovingFocusGroup
    as-child
    :orientation="orientation"
    :dir="dir"
    :loop="loop"
  >
    <Primitive
      :ref="forwardRef"
      :as-child="asChild"
      :as="as"
      v-bind="root.attrs.value"
    >
      <slot />
    </Primitive>
  </RovingFocusGroup>
</template>
