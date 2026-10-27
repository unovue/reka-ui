<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface ToastCloseProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import ToastAnnounceExclude from './ToastAnnounceExclude.vue'
import { injectToastRootContext } from './ToastRootImpl.vue'
import { getToastCloseSurface } from './useToast'

const props = withDefaults(defineProps<ToastCloseProps>(), {
  as: 'button',
})

const rootContext = injectToastRootContext()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const close = getToastCloseSurface(rootContext.onClose)
</script>

<template>
  <ToastAnnounceExclude as-child>
    <Primitive
      v-bind="{ ...props, ...close.attrs.value }"
      :ref="forwardRef"
      :type="as === 'button' ? 'button' : undefined "
    >
      <slot />
    </Primitive>
  </ToastAnnounceExclude>
</template>
