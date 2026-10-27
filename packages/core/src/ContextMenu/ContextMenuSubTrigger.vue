<script lang="ts">
import type { MenuSubTriggerProps } from '@/Menu'

export interface ContextMenuSubTriggerProps extends MenuSubTriggerProps {}
</script>

<script setup lang="ts">
import { MenuSubTrigger } from '@/Menu'
import { useForwardElement } from '@/shared'

const props = defineProps<ContextMenuSubTriggerProps>()
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
