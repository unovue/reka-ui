<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface ToastTitleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectToastRootContext } from './ToastRootImpl.vue'

const props = defineProps<ToastTitleProps>()
useForwardExpose()
const rootContext = injectToastRootContext(null)
</script>

<template>
  <!-- A managed toast without a title renders nothing, unless slot content is given. -->
  <Primitive
    v-if="$slots.default || !rootContext?.toast.value || rootContext.toast.value.title"
    v-bind="props"
  >
    <slot>{{ rootContext?.toast.value?.title }}</slot>
  </Primitive>
</template>
