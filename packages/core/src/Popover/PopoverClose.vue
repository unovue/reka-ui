<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface PopoverCloseProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { injectPopoverRootContext } from './PopoverRoot.vue'
import { getPopoverCloseSurface } from './usePopover'

const props = withDefaults(defineProps<PopoverCloseProps>(), {
  as: 'button',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectPopoverRootContext()

// The closing `onClick` (reason `close-press`) comes from the shared surface
// builder (single source with `usePopover()`); the tag-dependent `type` stays
// in the SFC and is bound after the surface so a non-button `as` drops it.
const close = getPopoverCloseSurface(rootContext)
</script>

<template>
  <component
    :is="renderAs(as, props.asChild)"
    :ref="forwardRef"
    v-bind="close.attrs.value"
    :type="as === 'button' ? 'button' : undefined"
  >
    <slot />
  </component>
</template>
