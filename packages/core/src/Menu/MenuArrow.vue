<script lang="ts">
import type { PopperArrowProps } from '@/Popper'

export interface MenuArrowProps extends PopperArrowProps {}
</script>

<script setup lang="ts">
import { PopperArrow } from '@/Popper'
import { useForwardElement } from '@/shared'

const props = defineProps<MenuArrowProps>()

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
