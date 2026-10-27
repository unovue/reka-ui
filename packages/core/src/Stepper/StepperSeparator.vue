<script lang="ts">
import type { SeparatorProps } from '@/Separator'
import { Separator } from '@/Separator'
import { useForwardElement } from '@/shared'
import { injectStepperItemContext } from './StepperItem.vue'
import { injectStepperRootContext } from './StepperRoot.vue'
</script>

<script setup lang="ts">
export interface StepperSeparatorProps extends SeparatorProps { }

const props = withDefaults(defineProps<StepperSeparatorProps>(), {})

const rootContext = injectStepperRootContext()
const itemContext = injectStepperItemContext()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Separator
    :ref="forwardRef"
    v-bind="props"
    decorative
    :orientation="rootContext.orientation.value"
    :data-state="itemContext.state.value"
  >
    <slot />
  </Separator>
</template>
