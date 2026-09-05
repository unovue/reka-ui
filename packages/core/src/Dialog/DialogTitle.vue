<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface DialogTitleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectDialogRootContext } from './DialogRoot.vue'
import { getDialogTitleSurface } from './useDialog'

withDefaults(defineProps<DialogTitleProps>(), { as: 'h2' })
const rootContext = injectDialogRootContext()
useForwardExpose()
// The `id` the content's `aria-labelledby` points at, from the shared surface builder.
const title = getDialogTitleSurface(rootContext)
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="title.attrs.value"
  >
    <slot />
  </Primitive>
</template>
