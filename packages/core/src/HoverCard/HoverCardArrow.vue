<script lang="ts">
import type { PopperArrowProps } from '@/Popper'
import { useForwardElement } from '@/shared'

export interface HoverCardArrowProps extends PopperArrowProps {}
</script>

<script setup lang="ts">
import { PopperArrow } from '@/Popper'

const props = withDefaults(defineProps<HoverCardArrowProps>(), {
  width: 10,
  height: 5,
  as: 'svg',
})
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <PopperArrow
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </PopperArrow>
</template>
