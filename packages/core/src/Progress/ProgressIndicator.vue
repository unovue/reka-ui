<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface ProgressIndicatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { injectProgressRootContext } from './ProgressRoot.vue'
import { getProgressIndicatorSurface } from './useProgress'

const props = defineProps<ProgressIndicatorProps>()

const rootContext = injectProgressRootContext()
// Same derivation as `useProgress().indicator`.
const indicator = getProgressIndicatorSurface(rootContext)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(props.as, props.asChild)"
    :ref="forwardRef"
    v-bind="indicator.attrs.value"
  >
    <slot />
  </component>
</template>
