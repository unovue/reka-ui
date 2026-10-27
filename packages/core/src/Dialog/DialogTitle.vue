<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface DialogTitleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectDialogRootContext } from './DialogRoot.vue'
import { getDialogTitleSurface } from './useDialog'

withDefaults(defineProps<DialogTitleProps>(), { as: 'h2' })
const rootContext = injectDialogRootContext()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
// The `id` the content's `aria-labelledby` points at, from the shared surface builder.
const title = getDialogTitleSurface(rootContext)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="title.attrs.value"
  >
    <slot />
  </Primitive>
</template>
