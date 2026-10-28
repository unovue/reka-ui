<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DialogCloseProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectDialogRootContext } from './DialogRoot.vue'
import { getDialogCloseSurface } from './useDialog'

withDefaults(defineProps<DialogCloseProps>(), {
  as: 'button',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectDialogRootContext()
// `onClick` → `onOpenChange(false, 'close-press')` from the shared surface builder.
const close = getDialogCloseSurface(rootContext)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="close.attrs.value"
  >
    <slot />
  </component>
</template>
