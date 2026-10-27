<script lang="ts">
import type { MenuGroupProps } from '@/Menu'

export interface MenubarGroupProps extends MenuGroupProps {}
</script>

<script setup lang="ts">
import { MenuGroup } from '@/Menu'
import { useForwardElement } from '@/shared'

const props = defineProps<MenubarGroupProps>()
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
