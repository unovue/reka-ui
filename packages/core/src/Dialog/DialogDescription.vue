<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface DialogDescriptionProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectDialogRootContext } from './DialogRoot.vue'
import { getDialogDescriptionSurface } from './useDialog'

withDefaults(defineProps<DialogDescriptionProps>(), { as: 'p' })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectDialogRootContext()
// The `id` the content's `aria-describedby` points at, from the shared surface builder.
const description = getDialogDescriptionSurface(rootContext)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="description.attrs.value"
  >
    <slot />
  </Primitive>
</template>
