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
import { mergeProps } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useRovingFocusGroup } from '@/RovingFocus/useRovingFocusGroup'
import { useToolbar } from './useToolbar'

defineOptions({
  // `$attrs` are merged under the roving and root bindings: the precedence
  // the former `<RovingFocusGroup as-child>` wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ToolbarRootProps>(), {
  orientation: 'horizontal',
})
// `dir` resolution (ConfigProvider-aware) stays in the shell.
const dir = useDirection(() => props.dir)
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

const { root, context } = useToolbar({ orientation: () => props.orientation, dir })
provideToolbarRootContext(context)

// Arrow-key navigation between the toolbar's items.
const roving = useRovingFocusGroup({
  consumerAttrs: true,
  element: currentElement,
  orientation: () => props.orientation,
  dir: () => dir.value,
  loop: () => props.loop,
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="mergeProps(roving.consumerAttrs($attrs), roving.attrs(), root.attrs.value)"
  >
    <slot />
  </component>
</template>
