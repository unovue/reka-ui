<script lang="ts">
import type { PopperArrowProps } from '@/Popper'

export interface MenuArrowProps extends PopperArrowProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { PopperArrow } from '@/Popper'

const props = defineProps<MenuArrowProps>()
</script>

<template>
  <PopperArrow v-bind="props">
    <slot />
  </PopperArrow>
</template>
