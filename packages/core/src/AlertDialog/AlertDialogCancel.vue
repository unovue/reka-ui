<script lang="ts">
import type { DialogCloseProps } from '@/Dialog'
import { useForwardElement } from '@/shared'

export interface AlertDialogCancelProps extends DialogCloseProps {}
</script>

<script setup lang="ts">
import { onMounted } from 'vue'
import { DialogClose } from '@/Dialog'
import { injectAlertDialogContentContext } from './AlertDialogContent.vue'

const props = withDefaults(defineProps<AlertDialogCancelProps>(), { as: 'button' })
const contentContext = injectAlertDialogContentContext()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

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
