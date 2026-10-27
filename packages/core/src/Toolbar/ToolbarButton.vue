<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface ToolbarButtonProps extends PrimitiveProps {
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { RovingFocusItem } from '@/RovingFocus'
import { getToolbarButtonSurface } from './useToolbar'

const props = withDefaults(defineProps<ToolbarButtonProps>(), { as: 'button' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const surface = getToolbarButtonSurface(() => props.disabled)
</script>

<template>
  <RovingFocusItem
    as-child
    :focusable="!disabled"
  >
    <Primitive
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :type="as === 'button' ? 'button' : undefined"
      v-bind="surface.attrs.value"
    >
      <slot />
    </Primitive>
  </RovingFocusItem>
</template>
