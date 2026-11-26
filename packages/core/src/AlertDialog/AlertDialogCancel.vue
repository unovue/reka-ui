<script lang="ts">
import type { DialogCloseProps } from '@/Dialog'
import { useForwardElement } from '@/shared'

export interface AlertDialogCancelProps extends DialogCloseProps {}
</script>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { DialogClose } from '@/Dialog'
import { injectAlertDialogContentContext } from './AlertDialogContent.vue'

const props = withDefaults(defineProps<AlertDialogCancelProps>(), { as: 'button' })
const contentContext = injectAlertDialogContentContext()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

onMounted(() => {
  contentContext.onCancelElementChange(currentElement.value)
})
// `AlertDialogContent` stays mounted while closed, so it must not keep this element.
onUnmounted(() => {
  contentContext.onCancelElementChange(undefined)
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
