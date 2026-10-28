<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface ToastTitleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { injectToastRootContext } from './ToastRootImpl.vue'

defineProps<ToastTitleProps>()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectToastRootContext(null)
// A managed toast without a title renders nothing, unless slot content is given.
// Keep this note out of the template: a root comment turns the root into a
// fragment, which drops `class` and other fallthrough attrs in production.
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-if="$slots.default || !rootContext?.toast.value || rootContext.toast.value.title"
    :ref="forwardRef"
  >
    <slot>{{ rootContext?.toast.value?.title }}</slot>
  </component>
</template>
