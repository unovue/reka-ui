<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface SliderAreaThumbProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useCollection } from '@/Collection'
import SliderAreaThumbImpl from './SliderAreaThumbImpl.vue'

const props = withDefaults(defineProps<SliderAreaThumbProps>(), {
  as: 'span',
})
const { getItems } = useCollection()

const { forwardRef, currentElement: thumbElement } = useForwardExpose()

const index = computed(() => thumbElement.value ? getItems(true).findIndex(i => i.ref === thumbElement.value) : -1)
</script>

<template>
  <SliderAreaThumbImpl
    :ref="forwardRef"
    v-bind="props"
    :index="index"
  >
    <slot />
  </SliderAreaThumbImpl>
</template>
