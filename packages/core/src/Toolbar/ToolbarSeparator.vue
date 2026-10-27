<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ToolbarSeparatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'
import BaseSeparator from '../shared/component/BaseSeparator.vue'
import { injectToolbarRootContext } from './ToolbarRoot.vue'

const props = defineProps<ToolbarSeparatorProps>()

const rootContext = injectToolbarRootContext()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <BaseSeparator
    :ref="forwardRef"
    :orientation="rootContext.orientation.value === 'horizontal' ? 'vertical' : 'horizontal'"
    :as-child="props.asChild"
    :as="as"
  >
    <slot />
  </BaseSeparator>
</template>
