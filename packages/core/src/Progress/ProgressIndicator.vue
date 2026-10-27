<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface ProgressIndicatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
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
  <Primitive
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    v-bind="indicator.attrs.value"
  >
    <slot />
  </Primitive>
</template>
