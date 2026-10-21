<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface ToastDescriptionProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectToastRootContext } from './ToastRootImpl.vue'

const props = defineProps<ToastDescriptionProps>()
useForwardExpose()
const rootContext = injectToastRootContext(null)
// A managed toast without a description renders nothing, unless slot content is given.
// Keep this note out of the template: a root comment turns the root into a
// fragment, which drops `class` and other fallthrough attrs in production.
</script>

<template>
  <Primitive
    v-if="$slots.default || !rootContext?.toast.value || rootContext.toast.value.description"
    v-bind="props"
  >
    <slot>{{ rootContext?.toast.value?.description }}</slot>
  </Primitive>
</template>
