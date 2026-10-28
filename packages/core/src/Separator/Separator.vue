<script lang="ts">
import type { BaseSeparatorProps } from '@/shared/component/BaseSeparator.vue'

export interface SeparatorProps extends BaseSeparatorProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { useSeparator } from './useSeparator'

const props = withDefaults(defineProps<SeparatorProps>(), {
  orientation: 'horizontal',
})

const { root } = useSeparator({
  orientation: () => props.orientation,
  decorative: () => props.decorative,
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
