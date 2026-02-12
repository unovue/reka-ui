<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface SliderAreaTrackProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectSliderAreaRootContext } from './SliderAreaRoot.vue'

withDefaults(defineProps<SliderAreaTrackProps>(), { as: 'span' })

const rootContext = injectSliderAreaRootContext()

useForwardExpose()
</script>

<template>
  <Primitive
    :as-child="asChild"
    :as="as"
    :data-disabled="rootContext.disabled.value ? '' : undefined"
  >
    <slot />
  </Primitive>
</template>
