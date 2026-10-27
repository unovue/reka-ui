<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface ToolbarLinkProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { RovingFocusItem } from '@/RovingFocus'
import { getToolbarLinkSurface } from './useToolbar'

withDefaults(defineProps<ToolbarLinkProps>(), { as: 'a' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const surface = getToolbarLinkSurface()
</script>

<template>
  <RovingFocusItem
    as-child
    focusable
  >
    <Primitive
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      v-bind="surface.attrs.value"
    >
      <slot />
    </Primitive>
  </RovingFocusItem>
</template>
