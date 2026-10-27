<script lang="ts">
import type { PopperArrowProps } from '@/Popper'

export interface ComboboxArrowProps extends PopperArrowProps {}
</script>

<script setup lang="ts">
import { PopperArrow } from '@/Popper'
import { useForwardElement } from '@/shared'
import { injectComboboxContentContext } from './ComboboxContentImpl.vue'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

const props = withDefaults(defineProps<ComboboxArrowProps>(), {
  width: 10,
  height: 5,
  as: 'svg',
})
const rootContext = injectComboboxRootContext()
const contentContext = injectComboboxContentContext()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <PopperArrow
    v-if="rootContext.open.value && contentContext.position.value === 'popper'"
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </PopperArrow>
</template>
