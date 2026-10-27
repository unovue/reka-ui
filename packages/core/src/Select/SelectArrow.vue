<script lang="ts">
import type { PopperArrowProps } from '@/Popper'

export interface SelectArrowProps extends PopperArrowProps {}
</script>

<script setup lang="ts">
import { PopperArrow } from '@/Popper'
import { useForwardElement } from '@/shared'
import { injectSelectContentContext, SelectContentDefaultContextValue } from './SelectContentImpl.vue'

const props = withDefaults(defineProps<SelectArrowProps>(), {
  width: 10,
  height: 5,
  as: 'svg',
})
const contentContext = injectSelectContentContext(SelectContentDefaultContextValue)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <PopperArrow
    v-if="contentContext.position === 'popper'"
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </PopperArrow>
</template>
