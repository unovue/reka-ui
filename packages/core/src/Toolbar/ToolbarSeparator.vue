<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ToolbarSeparatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useSeparator } from '@/Separator/useSeparator'
import { useForwardElement } from '@/shared'
import { injectToolbarRootContext } from './ToolbarRoot.vue'

defineProps<ToolbarSeparatorProps>()

const rootContext = injectToolbarRootContext()
const { root } = useSeparator({
  orientation: () => rootContext.orientation.value === 'horizontal' ? 'vertical' : 'horizontal',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="root.attrs.value"
  >
    <slot />
  </component>
</template>
