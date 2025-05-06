<script lang="ts">
import type { DialogCloseProps } from '@/Dialog'
import { useForwardExpose } from '@/shared'

export interface AlertDialogCancelProps extends DialogCloseProps {}
</script>

<script setup lang="ts">
import { DialogClose } from '@/Dialog'
import { onMounted } from 'vue'
import { injectAlertDialogContentContext } from './AlertDialogContent.vue'

const props = withDefaults(defineProps<AlertDialogCancelProps>(), { as: 'button' })
const contentContext = injectAlertDialogContentContext()
const { forwardRef, currentElement } = useForwardExpose()

onMounted(() => {
  contentContext.onCancelElementChange(currentElement.value)
})
</script>

<template>
  <DialogClose
    v-bind="props"
    :ref="forwardRef"
  >
    <slot />
  </DialogClose>
</template>
