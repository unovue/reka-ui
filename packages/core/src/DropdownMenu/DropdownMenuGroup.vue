<script lang="ts">
import type { MenuGroupProps } from '@/Menu'
import { useForwardElement } from '@/shared'

export interface DropdownMenuGroupProps extends MenuGroupProps {}
</script>

<script setup lang="ts">
import { MenuGroup } from '@/Menu'

const props = defineProps<DropdownMenuGroupProps>()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <MenuGroup
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </MenuGroup>
</template>
