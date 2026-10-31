<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface ToolbarLinkProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useRovingFocusItem } from '@/RovingFocus/useRovingFocusItem'
import { getToolbarLinkSurface } from './useToolbar'

defineOptions({
  // `$attrs` are merged under the roving and part bindings: the precedence
  // the former `RovingFocusItem` wrapper gave them.
  inheritAttrs: false,
})

withDefaults(defineProps<ToolbarLinkProps>(), { as: 'a' })
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const surface = getToolbarLinkSurface()
// Arrow-key navigation (as a composable; the toolbar handles the keys).
const roving = useRovingFocusItem({ element: currentElement })!
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="mergeProps($attrs, roving.attrs(), surface.attrs.value)"
  >
    <slot />
  </component>
</template>
