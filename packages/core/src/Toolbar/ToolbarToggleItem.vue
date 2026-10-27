<script lang="ts">
import type { ToggleGroupItemProps } from '@/ToggleGroup'
import { useForwardElement } from '@/shared'

export interface ToolbarToggleItemProps extends ToggleGroupItemProps {}
</script>

<script setup lang="ts">
import { ToggleGroupItem } from '@/ToggleGroup'
import ToolbarButton from './ToolbarButton.vue'

const props = defineProps<ToolbarToggleItemProps>()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <ToolbarButton
    as-child
    :disabled="props.disabled"
  >
    <ToggleGroupItem
      v-bind="props"
      :ref="forwardRef"
    >
      <slot />
    </ToggleGroupItem>
  </ToolbarButton>
</template>
