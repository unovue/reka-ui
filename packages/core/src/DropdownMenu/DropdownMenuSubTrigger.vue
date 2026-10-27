<script lang="ts">
import type { MenuSubTriggerProps } from '@/Menu'
import { useForwardElement } from '@/shared'

export interface DropdownMenuSubTriggerProps extends MenuSubTriggerProps {}
</script>

<script setup lang="ts">
import { MenuSubTrigger } from '@/Menu'

const props = defineProps<DropdownMenuSubTriggerProps>()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <MenuSubTrigger
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </MenuSubTrigger>
</template>
