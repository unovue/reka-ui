<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SliderAreaAreaProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectSliderAreaRootContext } from './SliderAreaRoot.vue'

withDefaults(defineProps<SliderAreaAreaProps>(), { as: 'div' })

const rootContext = injectSliderAreaRootContext()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
    :data-disabled="rootContext.disabled.value ? '' : undefined"
  >
    <slot />
  </Primitive>
</template>
