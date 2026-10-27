<script lang="ts">
import type { DialogOverlayProps } from '@/Dialog'
import { useForwardElement } from '@/shared'

export interface AlertDialogOverlayProps extends DialogOverlayProps {}
</script>

<script setup lang="ts">
import { DialogOverlay } from '@/Dialog'

const props = defineProps<AlertDialogOverlayProps>()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <DialogOverlay
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </DialogOverlay>
</template>
