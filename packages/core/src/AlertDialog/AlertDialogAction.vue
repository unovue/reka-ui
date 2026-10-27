<script lang="ts">
import type { DialogCloseProps } from '@/Dialog'
import { useForwardElement } from '@/shared'

export interface AlertDialogActionProps extends DialogCloseProps {}
</script>

<script setup lang="ts">
import { DialogClose } from '@/Dialog'

const props = withDefaults(defineProps<AlertDialogActionProps>(), { as: 'button' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <DialogClose
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </DialogClose>
</template>
