<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DialogTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectDialogRootContext } from './DialogRoot.vue'
import { getDialogTriggerSurface } from './useDialog'

withDefaults(defineProps<DialogTriggerProps>(), {
  as: 'button',
})
const rootContext = injectDialogRootContext()
const { forwardRef, currentElement } = useForwardExpose()

// aria-haspopup/aria-expanded/aria-controls/data-state + the click handler come
// from the shared surface builder (single source with `useDialog()`); the
// tag-dependent `type` stays in the SFC. Consumer listeners fall through as
// `$attrs` AFTER the surface's handler, so they chain instead of clobbering it.
const trigger = getDialogTriggerSurface(rootContext)

onMounted(() => {
  rootContext.triggerElement.value = currentElement.value
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="trigger.attrs.value"
  >
    <slot />
  </Primitive>
</template>
