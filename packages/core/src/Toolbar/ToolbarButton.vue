<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface ToolbarButtonProps extends PrimitiveProps {
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { Primitive } from '@/Primitive'
import { useRovingFocusItem } from '@/RovingFocus/useRovingFocusItem'
import { getToolbarButtonSurface } from './useToolbar'

defineOptions({
  // `$attrs` are merged under the roving and part bindings: the precedence
  // the former `RovingFocusItem` wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ToolbarButtonProps>(), { as: 'button' })
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const surface = getToolbarButtonSurface(() => props.disabled)
// Arrow-key navigation (as a composable; the toolbar handles the keys).
const roving = useRovingFocusItem({ element: currentElement, focusable: () => !props.disabled })!

function renderAttrs(attrs: Record<string, unknown>) {
  return mergeProps(attrs, roving.attrs(), { type: props.as === 'button' ? 'button' : undefined, ...surface.attrs.value })
}
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="renderAttrs($attrs)"
  >
    <slot />
  </Primitive>
</template>
